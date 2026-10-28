// The deployable bundle must not include unreviewed page-extraction candidates.
const fs=require('node:fs'),path=require('node:path');
const folder=path.resolve(__dirname,'../dist/subtitles');let kept=0,excluded=0;
if(fs.existsSync(folder))for(const name of fs.readdirSync(folder)){if(!name.endsWith('.json'))continue;const target=path.join(folder,name);const data=JSON.parse(fs.readFileSync(target,'utf8'));if(data.status==='verified'||data.textStatus==='canonical-article-exact')kept++;else{fs.unlinkSync(target);excluded++;}}
console.log(JSON.stringify({deployableSubtitles:kept,unreviewedCandidatesExcluded:excluded}));
