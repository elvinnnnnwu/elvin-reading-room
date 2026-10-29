"""Validate the cloud release against the exact source-only handoff and media reports."""
import hashlib
import json
from pathlib import Path
import subprocess
import struct

ROOT=Path(__file__).resolve().parents[2]
HANDOFF='a2c2267714d3fb29a62c42b9a6f4bec6ee7801cc'
LEGACY='4a50397067085f666983881f69cb679f14c6564a'

def sha(p):
    with p.open('rb') as f: return hashlib.file_digest(f,'sha256').hexdigest()

def main():
    catalog=json.loads((ROOT/'source/public/library/catalog.json').read_text())
    original={c['id']:c for c in json.loads((ROOT/'cloud-handoff-audit.json').read_text())['chapters']}
    ledger=json.loads((ROOT/'source/public/audio/mobile-audio-source.json').read_text())
    media={c['id']:c for c in ledger['chapters']}
    original_media={c['id']:c for c in json.loads(subprocess.check_output(['git','show',f'{HANDOFF}:source/public/audio/mobile-audio-source.json'],cwd=ROOT))['chapters']}
    assert len(catalog['chapters'])==len(media)==len(original)==160
    results=[]
    for c in catalog['chapters']:
        ident=c['id']; rel=f'source/public/subtitles/v4/{ident}.json'; p=ROOT/rel
        # Preserve the audited canonical text and all original timing/annotations byte for byte.
        handoff=subprocess.check_output(['git','show',f'{HANDOFF}:{rel}'],cwd=ROOT)
        assert p.read_bytes()==handoff, f'{ident}: altered handoff subtitles'
        s=json.loads(handoff); a=original[ident]; m=media[ident]
        assert s['chapterId']==ident and s['status']=='verified'
        assert s['canonicalTextSha256']==a['textSha256']
        assert len(s['cues'])==a['cueCount']
        prev=-1
        for cue in s['cues']:
            assert cue['text'].strip() and prev<=cue['start']<=cue['end']<=s['duration']+2
            assert isinstance(cue['page'],int) and cue['page']>0
            prev=cue['start']
        audio=ROOT/'docs'/c['mobileAudioUrl'].removeprefix('./')
        assert audio.stat().st_size==m['mobileBytes'] and sha(audio)==m['mobileSha256']
        assert m['validated'] and m['officialAudio']==c['audioUrl']
        assert m['sourceSha256']==original_media[ident]['sourceSha256'] and m['sourceBytes']==original_media[ident]['sourceBytes']
        stream=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','a:0','-show_entries','stream=codec_name,sample_rate,channels','-of','json',str(audio)]))['streams'][0]
        assert stream=={'codec_name':'aac','sample_rate':'24000','channels':1}
        atoms=[]
        with audio.open('rb') as f:
            while f.tell()<audio.stat().st_size:
                size,kind=struct.unpack('>I4s',f.read(8));header=8
                if size==1: size=struct.unpack('>Q',f.read(8))[0];header=16
                if size==0: size=audio.stat().st_size-f.tell()+header
                assert size>=header
                atoms.append(kind);f.seek(size-header,1)
        assert atoms.index(b'moov')<atoms.index(b'mdat'), 'missing faststart'
        assert abs(m['mobileDuration']-m['sourceDuration'])<.16
        assert abs(s['duration']-m['sourceDuration'])<.16
        assert len(m['checks'])==4 and min(x['correlation'] for x in m['checks'])>=.88
        deployed=ROOT/'docs/subtitles/v4'/f'{ident}.json'
        assert deployed.read_bytes()==handoff
        results.append({'id':ident,'subtitleFileSha256':sha(p),'inheritedCanonicalTextSha256':s['canonicalTextSha256'],'mobileSha256':m['mobileSha256'],'mobileBytes':m['mobileBytes'],'sourceSha256':m['sourceSha256'],'decodedSourceDuration':m['sourceDuration'],'decodedMobileDuration':m['mobileDuration'],'waveformChecks':m['checks']})
    # Existing listeners may still hold old HTML and hashed JS in memory.
    legacy_paths=subprocess.check_output(['git','ls-tree','-r','--name-only',LEGACY,'docs/assets','docs/audio','docs/subtitles'],cwd=ROOT,text=True).splitlines()
    for rel in legacy_paths:
        if rel=='docs/audio/mobile-audio-source.json': continue
        assert (ROOT/rel).read_bytes()==subprocess.check_output(['git','show',f'{LEGACY}:{rel}'],cwd=ROOT), 'legacy resource changed: '+rel
    files=[p for p in (ROOT/'docs').rglob('*') if p.is_file()]
    total=sum(p.stat().st_size for p in files)
    assert total<1_000_000_000, f'Pages budget exceeded: {total}'
    assert max(p.stat().st_size for p in files)<100_000_000, 'GitHub large-file limit'
    report={'version':'0.4.0','handoffCommit':HANDOFF,'all160Passed':True,'siteBytes':total,'legacyResourcesPreserved':len(legacy_paths)-1,'textValidation':'Exact subtitle bytes preserved from audited source handoff; inherited canonical hashes match its audit. This is provenance validation, not a new independent proofreading claim.','chapters':results}
    (ROOT/'cloud-release-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k!='chapters'},ensure_ascii=False))

if __name__=='__main__':main()
