"""Rebuild handoff media from authenticated-by-hash official sources, resumably."""
import concurrent.futures as cf
import hashlib
import json
import os
from pathlib import Path
import subprocess
import time
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
CACHE = Path('/workspace/elvin-media-cache')
OUT = ROOT / 'docs/audio/mobile'
CACHE.mkdir(exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)
LEDGER = json.loads((ROOT/'source/public/audio/mobile-audio-source.json').read_text())
CAT = {c['id']: c for c in json.loads((ROOT/'source/public/library/catalog.json').read_text())['chapters']}

def sha(p):
    with p.open('rb') as f:
        return hashlib.file_digest(f, 'sha256').hexdigest()

def run(args):
    return subprocess.run(args, check=True, capture_output=True)

def download(c):
    path = CACHE / (c['id']+'.original')
    if path.exists() and path.stat().st_size == c['sourceBytes'] and sha(path) == c['sourceSha256']:
        return path
    assert CAT[c['id']]['audioUrl'] == c['officialAudio']
    size = c['sourceBytes']
    chunks = [(n, min(n+2*1024*1024, size)-1) for n in range(0,size,2*1024*1024)]
    def part(bounds):
        start, end = bounds
        p = CACHE / f"{c['id']}.{start}.part"
        if p.exists() and p.stat().st_size == end-start+1:
            return p
        for attempt in range(3):
            try:
                run(['curl','-fsSL','--connect-timeout','30','--max-time','180','--range',f'{start}-{end}', '-o',str(p),c['officialAudio']])
                assert p.stat().st_size == end-start+1, 'range length mismatch'
                return p
            except Exception:
                if attempt == 2: raise
                time.sleep(2*(attempt+1))
    with cf.ThreadPoolExecutor(max_workers=4) as pool:
        parts=list(pool.map(part,chunks))
    with path.open('wb') as f:
        for p in parts: f.write(p.read_bytes())
    assert path.stat().st_size == size and sha(path) == c['sourceSha256'], 'source SHA mismatch: '+c['id']
    for p in parts: p.unlink()
    return path

def decode(path, dest):
    run(['ffmpeg','-v','error','-xerror','-y','-threads','1','-i',str(path),'-map','0:a:0','-f','s16le','-ar','16000','-ac','1',str(dest)])
    return dest.stat().st_size / 32000

def process(c):
    ident=c['id']; report=CACHE/(ident+'.json'); output=OUT/(ident+'-mobile-v1.m4a')
    if report.exists() and output.exists():
        r=json.loads(report.read_text())
        if r['mobileSha256']==sha(output) and r['sourceSha256']==c['sourceSha256']:
            return r
    original=download(c)
    print(ident+' source hash verified',flush=True)
    source_pcm=CACHE/(ident+'.source.pcm'); mobile_pcm=CACHE/(ident+'.mobile.pcm')
    duration=decode(original,source_pcm)
    assert abs(duration-c['sourceDuration']) < .16, 'handoff source duration mismatch'
    run(['ffmpeg','-v','error','-xerror','-y','-threads','1','-i',str(original),'-map','0:a:0','-vn','-ac','1','-ar','24000','-c:a','aac','-b:a','32k','-threads','1','-movflags','+faststart',str(output)])
    mobile_duration=decode(output,mobile_pcm)
    assert abs(duration-mobile_duration) < .16, 'decoded duration mismatch'
    a=np.memmap(source_pcm,dtype='<i2',mode='r'); b=np.memmap(mobile_pcm,dtype='<i2',mode='r')
    checks=[]
    for sec in [min(22,duration/8),duration*.25,duration*.6,duration-8]:
        start=round(sec*16000); count=3*16000
        x=np.asarray(a[start:start+count],dtype=np.float64); x-=x.mean()
        best=(-1,0)
        for lag in range(-160,161):
            y=np.asarray(b[start+lag:start+lag+count],dtype=np.float64); y-=y.mean()
            corr=float(np.sum(x*y)/np.sqrt(np.sum(x*x)*np.sum(y*y)))
            if corr>best[0]: best=(corr,lag)
        assert best[0] >= .88, f'{ident} low waveform correlation: {best}'
        checks.append({'seconds':sec,'correlation':round(best[0],6),'phaseSeconds':best[1]/16000})
    del a,b
    source_pcm.unlink(); mobile_pcm.unlink()
    r={**c,'sourceDuration':duration,'mobileDuration':mobile_duration,'mobileBytes':output.stat().st_size,'mobileSha256':sha(output),'checks':checks,'durationMethod':'complete decoded PCM sample count for original and AAC, 16000Hz mono s16le','validated':True,'encoder':run(['ffmpeg','-version']).stdout.decode().splitlines()[0],'verification':'Cloud rebuild: original bytes and SHA256 match handoff; original and AAC fully decoded; duration delta <0.16 seconds; four 3-second waveform windows correlate >=0.88 within 10ms phase. No edits or speed changes. Not full manual audition.'}
    report.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n')
    print(ident+' PASS '+str(r['mobileBytes']),flush=True)
    return r

if __name__ == '__main__':
    selected=LEDGER['chapters']
    if os.environ.get('CHAPTER'): selected=[c for c in selected if c['id']==os.environ['CHAPTER']]
    failures=[]
    with cf.ThreadPoolExecutor(max_workers=8) as pool:
        futures={pool.submit(process,c):c['id'] for c in selected}
        for f in cf.as_completed(futures):
            try: f.result()
            except Exception as e:
                failures.append(futures[f]); print('FAIL '+futures[f]+' '+str(e),flush=True)
    if failures: raise SystemExit('Failed: '+','.join(failures))
    print('All selected chapters verified',flush=True)
