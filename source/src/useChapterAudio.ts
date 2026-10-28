import {useEffect,useRef,useState} from 'react';
import type {Chapter} from './library';
import {bookFor} from './library';
import type {Listening} from './store';
import {restoreTime} from './progress';
export function useChapterAudio({chapter,saved,rate,onSave,onRate,onNext,autoNext,autoStart}:{chapter:Chapter;saved?:Listening;rate:number;onSave:(id:string,p:Listening)=>void;onRate:(rate:number)=>void;onNext:()=>void;autoNext:boolean;autoStart:boolean}){
 const audio=useRef<HTMLAudioElement>(null),restored=useRef(false),lastSave=useRef(0),initial=useRef(saved),marks=useRef(saved?.bookmarks||[]);
 const callbacks=useRef({onSave,onRate,onNext,autoNext,rate});callbacks.current={onSave,onRate,onNext,autoNext,rate};
 const [position,setPosition]=useState(saved?.position||0),[duration,setDuration]=useState(saved?.duration||chapter.durationEstimate||0),[ready,setReady]=useState(false),[playing,setPlaying]=useState(false),[waiting,setWaiting]=useState(false),[error,setError]=useState(''),[bookmarks,setBookmarks]=useState(marks.current),[savedTime,setSavedTime]=useState(saved?.position??null);
 const ended=ready&&duration>0&&position>=duration-.1;
 function persist(force=false){const a=audio.current;if(!a||!restored.current||!Number.isFinite(a.duration)||a.duration<=0||(!force&&Date.now()-lastSave.current<700))return;
  const record={position:a.currentTime,duration:a.duration,rate:a.playbackRate,bookmarks:marks.current,updatedAt:new Date().toISOString()};callbacks.current.onSave(chapter.id,record);lastSave.current=Date.now();setSavedTime(record.position);
 }
 const persistRef=useRef(persist);persistRef.current=persist;
 useEffect(()=>{const a=audio.current;const save=()=>persistRef.current(true),hide=()=>{if(document.visibilityState==='hidden')save();};window.addEventListener('pagehide',save);document.addEventListener('visibilitychange',hide);return()=>{save();a?.pause();window.removeEventListener('pagehide',save);document.removeEventListener('visibilitychange',hide);};},[]);
 function seek(t:number){const a=audio.current;if(!a||!ready)return;const n=restoreTime(t,a.duration);a.currentTime=n;setPosition(n);persist(true);}
 async function play(){const a=audio.current;if(!a||!ready)return;if(a.currentTime>=a.duration-.1)a.currentTime=0;try{setError('');await a.play();}catch{setWaiting(false);setError('请点播放继续；若仍无声音，请重试或打开官方音频。');}}
 async function toggle(){if(!audio.current?.paused)audio.current?.pause();else await play();}
 function playFrom(t:number){if(!ready){setError('音频还在载入，准备好后可点击字幕开始播放。');return;}seek(t);void play();}
 function changeRate(n:number){callbacks.current.onRate(n);if(audio.current)audio.current.playbackRate=n;persist(true);}
 function bookmark(){if(!ready)return;const n=audio.current!.currentTime;if(!marks.current.some(t=>Math.abs(t-n)<1))marks.current=[...marks.current,n].sort((a,b)=>a-b);setBookmarks(marks.current);persist(true);}
 function metadata(){const a=audio.current;if(!a||!Number.isFinite(a.duration)||a.duration<=0)return;setDuration(a.duration);setReady(true);setError('');a.playbackRate=callbacks.current.rate;
  if(!restored.current){a.currentTime=restoreTime(initial.current?.position||0,a.duration);setPosition(a.currentTime);restored.current=true;persist(true);if(autoStart)void a.play().catch(()=>setError('下一篇已准备好，点播放继续。'));}
 }
 function retry(){persist(true);initial.current={position:audio.current?.currentTime||position,duration:duration||1,rate:callbacks.current.rate,bookmarks:marks.current,updatedAt:new Date().toISOString()};restored.current=false;setReady(false);setWaiting(false);setError('');audio.current?.load();}
 useEffect(()=>{if(!('mediaSession'in navigator))return;navigator.mediaSession.metadata=new MediaMetadata({title:chapter.title,artist:'毛泽东 · 共产党员网朗读',album:'毛泽东选集 '+bookFor(chapter).label});
  const handlers:Partial<Record<MediaSessionAction,MediaSessionActionHandler>>={play:()=>{void play();},pause:()=>audio.current?.pause(),seekbackward:d=>seek((audio.current?.currentTime||0)-(d.seekOffset||15)),seekforward:d=>seek((audio.current?.currentTime||0)+(d.seekOffset||15)),seekto:d=>{if(d.seekTime!==undefined)seek(d.seekTime);},nexttrack:()=>callbacks.current.onNext()};
  for(const[k,v]of Object.entries(handlers))try{navigator.mediaSession.setActionHandler(k as MediaSessionAction,v!);}catch{}
  return()=>{for(const k of Object.keys(handlers))try{navigator.mediaSession.setActionHandler(k as MediaSessionAction,null);}catch{}};
 },[ready]);
 useEffect(()=>{if('mediaSession'in navigator){navigator.mediaSession.playbackState=playing?'playing':'paused';if(ready)try{navigator.mediaSession.setPositionState({duration,playbackRate:rate,position:Math.min(position,duration)});}catch{}}},[playing,position,rate,duration,ready]);
 const events={onLoadedMetadata:metadata,onTimeUpdate:()=>{if(!restored.current)return;setPosition(audio.current?.currentTime||0);persist();},onSeeked:()=>persist(true),onPlay:()=>{setPlaying(true);setWaiting(false);},onPlaying:()=>setWaiting(false),onWaiting:()=>setWaiting(true),onPause:()=>{setPlaying(false);setWaiting(false);persist(true);},onEnded:()=>{setPlaying(false);setWaiting(false);persist(true);if(callbacks.current.autoNext)callbacks.current.onNext();},onError:()=>{setPlaying(false);setWaiting(false);setError('官方音频暂时未能载入，请重试或打开来源页面。');}};
 return {audio,events,position,duration,ready,playing,waiting,error,ended,savedTime,bookmarks,seek,playFrom,toggle,changeRate,bookmark,retry,persist};
}
