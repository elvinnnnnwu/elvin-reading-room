const fs=require('node:fs'),path=require('node:path');
const local=path.resolve(__dirname,'../public/audio/mobile');
const candidates=[process.env.READING_MEDIA_DIR,path.resolve(__dirname,'../../docs/audio/mobile'),path.resolve(__dirname,'../../01-网站部署包/audio/mobile')].filter(Boolean);
const target=candidates.find(p=>fs.existsSync(p));
if(!target)throw Error('完整交付音频目录缺失，请连同网站部署包打开源码。');
if(!fs.existsSync(local))fs.symlinkSync(path.relative(path.dirname(local),target),local,'dir');
