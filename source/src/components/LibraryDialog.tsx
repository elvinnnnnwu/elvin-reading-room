import {useEffect,useState} from 'react';
import {books,chapters,bookFor} from '../library';
import type {Chapter} from '../library';
import type {LibraryStore} from '../store';
import {formatTime} from '../progress';
import {Icon} from './Icons';
export function LibraryDialog({chapter,store,onSelect}:{chapter:Chapter;store:LibraryStore;onSelect:(chapter:Chapter)=>void}){
 const [volume,setVolume]=useState(chapter.volume),[query,setQuery]=useState('');
 useEffect(()=>{setVolume(chapter.volume);},[chapter.id]);
 const filtered=chapters.filter(c=>query.trim()?c.title.includes(query.trim()):c.volume===volume);
 return <><p className="fine-print">四卷 · 160条官方录音。各篇收听进度分别保存。</p><div className="volume-tabs" aria-label="卷册">{books.map(b=><button key={b.volume} aria-pressed={volume===b.volume&&!query} onClick={()=>{setVolume(b.volume);setQuery('');}}>{b.label}</button>)}</div><label className="sr-only" htmlFor="chapter-search">搜索全部篇目</label><input className="chapter-search" id="chapter-search" type="search" value={query} placeholder="搜索全部篇目，如：实践论" onChange={e=>setQuery(e.target.value)}/><div className="chapter-list">{filtered.map(c=>{const p=store.listening[c.id];return <button key={c.id} className={'chapter-item '+(c.id===chapter.id?'is-selected':'')} onClick={()=>onSelect(c)}><span className="chapter-index">{String(c.order).padStart(2,'0')}</span><span><strong>{c.title}</strong><small>{bookFor(c).label} · {p?`听至 ${formatTime(p.position)} / ${formatTime(p.duration)}`:c.durationEstimate?`约 ${Math.round(c.durationEstimate/60)} 分钟`:'官方朗读'}</small></span>{c.id===chapter.id&&<Icon name="check" size={18}/>}</button>;})}{!filtered.length&&<p>没有找到这个篇目，换个关键词试试。</p>}</div><p className="fine-print">本轮为《毛泽东选集》第一至四卷，不包括1977年第五卷、《毛泽东文集》或其他著作。</p></>;
}
