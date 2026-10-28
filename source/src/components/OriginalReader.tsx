import {useEffect,useRef,useState} from 'react';
import type {Book} from '../library';
import {Icon} from './Icons';
export function OriginalReader({book,page,onPage,spokenPage}:{book:Book;page:number;onPage:(page:number)=>void;spokenPage:number}){
 const [zoom,setZoom]=useState(1),[loading,setLoading]=useState(true),[failed,setFailed]=useState(false),[retry,setRetry]=useState(0);
 const scroller=useRef<HTMLDivElement>(null);
 useEffect(()=>{setLoading(true);setFailed(false);scroller.current?.scrollTo(0,0);},[page,book.volume,retry]);
 const go=(n:number)=>onPage(Math.max(1,Math.min(book.pageCount,Math.floor(n)||1)));
 return <section className="original-reader" aria-label="官方原版书页">
  <div className="page-toolbar"><button aria-label="上一页" disabled={page<=1} onClick={()=>go(page-1)}><Icon name="back" size={18}/></button><form onSubmit={e=>{e.preventDefault();const n=new FormData(e.currentTarget).get('page');go(Number(n));}}><label>第 <input key={page} aria-label="电子书页码" name="page" type="number" min={1} max={book.pageCount} defaultValue={page}/> / {book.pageCount} 页</label><button type="submit">跳转</button></form><button aria-label="下一页" disabled={page>=book.pageCount} onClick={()=>go(page+1)}><Icon name="next" size={18}/></button></div>
  <div className="page-image-scroll" ref={scroller} tabIndex={0} aria-label="原版书页，可上下及左右滚动">
   <img key={`${book.volume}-${page}-${retry}`} src={`${book.imageBase}${page}.jpg${retry?'?retry='+retry:''}`} alt={`毛泽东选集${book.label}，电子书第${page}页。原版页图。`} style={{width:`${zoom*100}%`}} onLoad={()=>{setLoading(false);setFailed(false);}} onError={()=>{setLoading(false);setFailed(true);}}/>
   {loading&&<p className="page-message" role="status">正在载入原版书页…</p>}
   {failed&&<div className="page-message" role="alert"><p>书页暂时未能载入</p><button className="small-btn" onClick={()=>setRetry(n=>n+1)}>重新载入</button><a href={`${book.readerUrl}#p=${page}`} target="_blank" rel="noreferrer">打开官方原书 ↗</a></div>}
  </div>
  <div className="page-bottom"><button onClick={()=>go(spokenPage)}>跟到朗读页</button><label>放大 <select aria-label="书页放大" value={zoom} onChange={e=>setZoom(+e.target.value)}><option value={1}>100%</option><option value={1.5}>150%</option><option value={2}>200%</option></select></label><a href={`${book.readerUrl}#p=${page}`} target="_blank" rel="noreferrer">原书 ↗</a></div>
 </section>;
}
