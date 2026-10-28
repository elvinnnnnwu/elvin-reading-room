import {useCallback,useEffect,useRef,useState} from 'react';
import type {CSSProperties} from 'react';
import {createRoot} from 'react-dom/client';
import {chapters,bookFor,validateSubtitles} from './library';
import type {Chapter,Subtitles} from './library';
import {loadStore,rates,STORE_KEY,validateStore} from './store';
import type {LibraryStore,Listening,Preferences} from './store';
import {formatTime} from './progress';
import {useChapterAudio} from './useChapterAudio';
import {Icon,JumpIcon} from './components/Icons';
import {OriginalReader} from './components/OriginalReader';
import {Lyrics} from './components/Lyrics';
import {LibraryDialog} from './components/LibraryDialog';
import './style.css';

type PlayerProps={chapter:Chapter;store:LibraryStore;autoStart:boolean;storageError:boolean;save:(id:string,p:Listening)=>void;preferences:(p:Partial<Preferences>)=>void;select:(c:Chapter,play?:boolean)=>void;page:(id:string,volume:number,page:number)=>void;importStore:(s:LibraryStore)=>void};
function ChapterPlayer({chapter,store,autoStart,storageError,save,preferences,select,page,importStore}:PlayerProps){
 const book=bookFor(chapter),prefs=store.preferences;
 const [panel,setPanel]=useState<'source'|'library'|'settings'|null>(null),[notice,setNotice]=useState(''),[subtitles,setSubtitles]=useState<Subtitles|null>(null),[subtitleVersion,setSubtitleVersion]=useState(0);
 const dialog=useRef<HTMLDialogElement>(null),returnFocus=useRef<HTMLElement|null>(null),importInput=useRef<HTMLInputElement>(null);
 const index=chapters.findIndex(c=>c.id===chapter.id);
 const onNext=()=>{if(index<chapters.length-1)select(chapters[index+1],true);else setNotice('四卷已听完，可从目录重新选择。');};
 const player=useChapterAudio({chapter,saved:store.listening[chapter.id],rate:prefs.rate,onSave:save,onRate:n=>preferences({rate:n}),onNext,autoNext:prefs.autoNext,autoStart});
 const active=subtitles?.cues.findLastIndex(c=>player.position>=c.start)??-1;
 const spokenPage=active>=0?subtitles!.cues[active].page:chapter.startPage;
 function selectChapter(c:Chapter){player.persist(true);select(c);setPanel(null);}
 useEffect(()=>{let cancelled=false;const controller=new AbortController();async function load(){try{const r=await fetch(`./subtitles/${chapter.id}.json?v=${subtitleVersion}`,{signal:controller.signal});if(!r.ok)throw Error('pending');const s=validateSubtitles(await r.json(),chapter.id);if(!cancelled)setSubtitles(s);}catch{if(!cancelled)setSubtitles(null);}}void load();return()=>{cancelled=true;controller.abort();};},[chapter.id,subtitleVersion]);
 useEffect(()=>{if(subtitles)return;const timer=setInterval(()=>setSubtitleVersion(n=>n+1),20000);return()=>clearInterval(timer);},[subtitles]);
 useEffect(()=>{if(!panel){if(dialog.current?.open)dialog.current.close();returnFocus.current?.focus();return;}returnFocus.current=document.activeElement as HTMLElement;dialog.current?.showModal();},[panel]);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),3200);return()=>clearTimeout(timer);},[notice]);
 function backup(){player.persist(true);const blob=new Blob([JSON.stringify(store,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='听见文字-进度备份.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setNotice('进度备份已生成。');}
 async function restore(file?:File){if(!file)return;try{if(file.size>1024*1024)throw Error('large');const value=validateStore(JSON.parse(await file.text()));if(!value)throw Error('invalid');player.audio.current?.pause();player.persist(true);importStore(value);setPanel(null);}catch{setNotice('这份备份无法识别，请选择本书库导出的进度文件。');}finally{if(importInput.current)importInput.current.value='';}}
 return <div className={'reader-app '+(prefs.light?'is-light':'')} style={{'--lyric-size':prefs.fontSize+'px'} as CSSProperties}>
  <aside className="desktop-intro"><span className="brand-small">ELVIN / READING ROOM</span><h1>听见文字。</h1><p>读一段，也听一段。<br/>把时间留给理解。</p><div className="book-art" aria-label={'毛泽东选集'+book.label+'听读封面'}><span className="book-rule"/><span className="book-author">毛泽东</span><strong>毛泽东<br/>选集</strong><span className="book-volume">{book.label}</span><small>个人听读 · 第一至四卷</small></div><span className="desktop-caption">停下来读，出发时听。</span><div className="desktop-note">原版书页 · 官方音频 · 本机续听<br/>字幕逐篇核对中</div></aside>
  <main className="reader-shell">
   <header className="reader-header"><button className="icon-btn" aria-label="打开书架" onClick={()=>setPanel('library')}><Icon name="book"/></button><span>听见文字<span className="header-dot">·</span>听读空间</span><button className="icon-btn" aria-label={prefs.light?'切换深色':'切换浅色'} onClick={()=>preferences({light:!prefs.light})}><Icon name={prefs.light?'moon':'sun'}/></button></header>
   <section className="book-context" aria-label="当前篇目"><div className="mini-book" aria-hidden="true">毛选<span>{['一','二','三','四'][chapter.volume-1]}</span></div><div className="context-main"><p>毛泽东选集 · {book.label}</p><h1 title={chapter.title}>{chapter.title}</h1><span>第{chapter.order}篇 · 官方朗读 · {subtitles?'字幕试校':'字幕待整理'}</span></div><button className="icon-btn source-btn" aria-label="查看正文与音频来源" onClick={()=>setPanel('source')}><Icon name="info" size={20}/></button></section>
   <nav className="view-tabs" aria-label="阅读模式"><button aria-pressed={prefs.view==='listen'} onClick={()=>preferences({view:'listen'})}>同步听读</button><button aria-pressed={prefs.view==='read'} onClick={()=>preferences({view:'read'})}>原版阅读</button><button className="font-control" aria-label="字号与显示设置" onClick={()=>setPanel('settings')}>Aa</button></nav>
   <div className="words-area">{prefs.view==='listen'?<Lyrics chapter={chapter} subtitles={subtitles} position={player.position} seek={player.playFrom} onRead={()=>preferences({view:'read'})}/>:<OriginalReader book={book} page={store.readingByChapter[chapter.id]||chapter.startPage} onPage={p=>page(chapter.id,book.volume,p)} spokenPage={spokenPage}/>}</div>
   <footer className="transport">
    <div className="save-state" role="status"><span className={'save-dot '+(storageError?'warn':'')}/>{storageError?'当前无法保存，请导出进度备份':player.savedTime!==null&&player.savedTime>.1?`已保存至 ${formatTime(player.savedTime)} · 本机自动记录`:player.ready?'准备好了，点播放开始':'正在连接官方朗读…'}</div>
    <label className="sr-only" htmlFor="seek">收听进度</label><input id="seek" className="seek-slider" type="range" min={0} max={player.duration||1} step={.01} value={Math.min(player.position,player.duration||1)} disabled={!player.ready} onChange={e=>player.seek(+e.target.value)} style={{'--fill':`${player.duration?player.position/player.duration*100:0}%`} as CSSProperties}/>
    <div className="time-row"><span data-testid="current-time">{formatTime(player.position)}</span><span>{player.ended?'本篇已听完':player.playing?'正在朗读':'官方完整录音'}</span><span>{player.ready?formatTime(player.duration):'--:--'}</span></div>
    <div className="play-controls"><button className="jump-btn" aria-label="后退15秒" disabled={!player.ready} onClick={()=>player.seek(player.position-15)}><JumpIcon/></button><button className="play-btn" aria-label={player.playing?'暂停朗读':player.ended?'重新播放本篇':'播放朗读'} disabled={!player.ready} onClick={()=>void player.toggle()}>{player.waiting?<span className="spinner"/>:<Icon name={player.playing?'pause':'play'} size={32}/>}</button><button className="jump-btn" aria-label="前进15秒" disabled={!player.ready} onClick={()=>player.seek(player.position+15)}><JumpIcon forward/></button></div>
    <div className="secondary-controls"><label className="speed-select"><span className="sr-only">播放倍速</span><select aria-label="播放倍速" value={prefs.rate} onChange={e=>player.changeRate(+e.target.value)}>{rates.map(r=><option key={r} value={r}>{r===1?'1.0':r}×</option>)}</select><span>倍速</span></label><button disabled={!player.ready} onClick={()=>{player.bookmark();setNotice('已标记 '+formatTime(player.position));}}><Icon name="mark" size={19}/><span>标记</span></button><button onClick={()=>setPanel('library')}><Icon name="book" size={19}/><span>目录</span></button></div>
    {player.error&&<div className="error-state" role="alert">{player.error}<button onClick={player.retry}>重新载入</button><a href={chapter.audioSourcePage} target="_blank" rel="noreferrer">官方来源 ↗</a></div>}
   </footer>
  </main>
  <audio ref={player.audio} src={chapter.id==='v1-001'?'./audio/v1-001.mp3':chapter.audioUrl} preload="metadata" {...player.events}/>
  {notice&&<div className="toast" role="status">{notice}</div>}
  <dialog ref={dialog} className="reader-dialog" aria-labelledby="dialog-title" onCancel={()=>setPanel(null)} onClick={e=>{if(e.target===e.currentTarget)setPanel(null);}}><div className="dialog-inner"><div className="dialog-heading"><h2 id="dialog-title">{panel==='source'?'内容与来源':panel==='library'?'我的书架':'显示与进度'}</h2><button className="icon-btn" aria-label="关闭窗口" onClick={()=>setPanel(null)}><Icon name="close"/></button></div>
   {panel==='library'&&<><LibraryDialog chapter={chapter} store={store} onSelect={selectChapter}/>{player.bookmarks.length>0&&<><h3 className="planned-title">本篇标记</h3>{player.bookmarks.map(t=><button className="bookmark-row" key={t} onClick={()=>{player.seek(t);preferences({view:'listen'});setPanel(null);}}><span>{formatTime(t)}</span><span>{subtitles?.cues.findLast(c=>t>=c.start)?.text||chapter.title}</span></button>)}</>}</>}
   {panel==='source'&&<><span className="dialog-kicker">《毛泽东选集》第一至四卷</span><h3>{chapter.title}</h3><p>音频来源：共产党员网官方有声书。阅读模式显示理论中国电子书的原版页图，保留原书正文、注释与版式。</p><a className="source-link" href={chapter.audioSourcePage} target="_blank" rel="noreferrer">共产党员网 · 本卷有声书 <Icon name="arrow" size={17}/></a><a className="source-link" href={chapter.readerUrl} target="_blank" rel="noreferrer">理论中国 · 对应原版书页 <Icon name="arrow" size={17}/></a><div className="notice-box">{subtitles?'本篇字幕正文已与共产党员网同篇原文比对一致，去除注释标号。开篇22.45–44.85秒单独复核；其余时间由机器定位，尚未逐句人工复听，可能有时间偏移。注释请看原版书页。':'本篇同步字幕尚未完成。音频和原版阅读可先使用，不以估算时间代替真实字幕。'}</div><p className="fine-print">个人非商业听读，注明来源。四卷之外的第五卷与其他著作尚未纳入。原版页图及多数音频需联网加载，来源服务变化可能影响访问。</p><button className="text-link" onClick={()=>setSubtitleVersion(n=>n+1)}>重新检查本篇字幕</button></>}
   {panel==='settings'&&<><div className="setting-row"><label htmlFor="font">字幕字号</label><select id="font" value={prefs.fontSize} onChange={e=>preferences({fontSize:+e.target.value})}><option value={22}>标准</option><option value={26}>大字</option><option value={30}>更大</option></select></div><div className="setting-row"><span>当前主题</span><button className="small-btn" onClick={()=>preferences({light:!prefs.light})}>{prefs.light?'暖纸色':'深墨色'} · 切换</button></div><div className="setting-row"><label htmlFor="auto-next">听完自动下一篇</label><input id="auto-next" type="checkbox" checked={prefs.autoNext} onChange={e=>preferences({autoNext:e.target.checked})}/></div><div className="notice-box">每篇听到哪里、各卷读到哪页，都保存在这台设备的当前浏览器中。别人打开链接不会影响你的记录。换设备或清除网站数据后，需要用备份恢复。</div><button className="backup-btn" onClick={backup}><Icon name="download" size={19}/>导出全部进度备份</button><button className="backup-btn secondary-backup" onClick={()=>importInput.current?.click()}>导入进度备份</button><input ref={importInput} className="sr-only" type="file" accept="application/json,.json" aria-label="选择进度备份" onChange={e=>void restore(e.target.files?.[0])}/><p className="fine-print">导入后以备份中的进度为准。安卓锁屏、蓝牙、导航和来电打断后的恢复，仍需在你的手机上实测。</p></>}
  </div></dialog>
 </div>;
}
function ReaderApp(){
 const store=useRef<LibraryStore>(loadStore()),[selected,setSelected]=useState(store.current.selectedId),[revision,setRevision]=useState(0),[autoStart,setAutoStart]=useState(false),[storageError,setStorageError]=useState(false),[generation,setGeneration]=useState(0);
 const write=useCallback(()=>{try{localStorage.setItem(STORE_KEY,JSON.stringify(store.current));setStorageError(false);}catch{setStorageError(true);}},[]);
 const save=useCallback((id:string,p:Listening)=>{store.current.listening[id]=p;write();},[write]);
 const preferences=useCallback((p:Partial<Preferences>)=>{Object.assign(store.current.preferences,p);write();setRevision(n=>n+1);},[write]);
 const select=useCallback((c:Chapter,play=false)=>{store.current.selectedId=c.id;write();setAutoStart(play);setSelected(c.id);if(!store.current.readingByChapter[c.id])store.current.readingByChapter[c.id]=c.startPage;},[write]);
 const page=useCallback((id:string,volume:number,n:number)=>{store.current.reading[volume]=n;store.current.readingByChapter[id]=n;write();setRevision(r=>r+1);},[write]);
 const importStore=useCallback((s:LibraryStore)=>{store.current=s;write();setAutoStart(false);setSelected(s.selectedId);setGeneration(n=>n+1);},[write]);
 const chapter=chapters.find(c=>c.id===selected)||chapters[0];
 return <ChapterPlayer key={chapter.id+'-'+generation} chapter={chapter} store={store.current} storageError={storageError} save={save} preferences={preferences} select={select} page={page} importStore={importStore} autoStart={autoStart}/>;
}
createRoot(document.getElementById('root')!).render(<ReaderApp/>);
