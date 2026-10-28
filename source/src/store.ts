import {books,chapters} from './library';
import {STORAGE_KEY as OLD_KEY, validateProgress} from './progress';
export const STORE_KEY='elvin-reading-library-v2';
export const rates=[.75,1,1.25,1.5,2];
export type Listening = {position:number;duration:number;rate:number;bookmarks:number[];updatedAt:string};
export type Preferences={rate:number;light:boolean;fontSize:number;autoNext:boolean;view:'listen'|'read'};
export type LibraryStore={schema:2;selectedId:string;listening:Record<string,Listening>;reading:Record<string,number>;readingByChapter:Record<string,number>;preferences:Preferences};
const ids=new Set(chapters.map(c=>c.id));
export function emptyStore():LibraryStore{return {schema:2,selectedId:chapters[0].id,listening:{},reading:{},readingByChapter:{},preferences:{rate:1,light:false,fontSize:26,autoNext:true,view:'listen'}};}
function object(v:unknown):v is Record<string,unknown>{return !!v&&typeof v==='object'&&!Array.isArray(v);}
export function validateStore(raw:unknown):LibraryStore|null{
 if(!object(raw)||raw.schema!==2||!object(raw.listening)||!object(raw.reading)||!object(raw.preferences))return null;
 const out=emptyStore();if(typeof raw.selectedId==='string'&&ids.has(raw.selectedId))out.selectedId=raw.selectedId;
 for(const[id,v]of Object.entries(raw.listening)){
  if(!ids.has(id)||!object(v))continue;
  const {position,duration,rate,bookmarks,updatedAt}=v;
  if(typeof position!=='number'||!Number.isFinite(position)||position<0||typeof duration!=='number'||!Number.isFinite(duration)||duration<=0||position>duration+1||typeof rate!=='number'||!rates.includes(rate))continue;
  out.listening[id]={position:Math.min(position,duration),duration,rate,updatedAt:typeof updatedAt==='string'?updatedAt:'',bookmarks:Array.isArray(bookmarks)?[...new Set(bookmarks.filter((n):n is number=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=duration))].sort((a,b)=>a-b):[]};
 }
 for(const b of books){const page=raw.reading[String(b.volume)];if(typeof page==='number'&&Number.isInteger(page)&&page>=1&&page<=b.pageCount)out.reading[b.volume]=page;}
 if(object(raw.readingByChapter))for(const c of chapters){const page=raw.readingByChapter[c.id],book=books.find(b=>b.volume===c.volume)!;if(typeof page==='number'&&Number.isInteger(page)&&page>=1&&page<=book.pageCount)out.readingByChapter[c.id]=page;}
 else{const c=chapters.find(c=>c.id===out.selectedId)!;if(out.reading[c.volume])out.readingByChapter[c.id]=out.reading[c.volume];}
 const p=raw.preferences;
 if(typeof p.rate==='number'&&rates.includes(p.rate))out.preferences.rate=p.rate;
 if(typeof p.light==='boolean')out.preferences.light=p.light;
 if(typeof p.autoNext==='boolean')out.preferences.autoNext=p.autoNext;
 if(p.view==='read')out.preferences.view='read';
 if(typeof p.fontSize==='number'&&[22,26,30].includes(p.fontSize))out.preferences.fontSize=p.fontSize;
 return out;
}
export function loadStore():LibraryStore{
 try{
  const current=localStorage.getItem(STORE_KEY);
  if(current)return validateStore(JSON.parse(current))||emptyStore();
  const old=validateProgress(JSON.parse(localStorage.getItem(OLD_KEY)||'null'));
  const migrated=emptyStore();
  if(old){migrated.listening['v1-001']={position:old.position+22.45,duration:1276.682438,rate:old.rate,bookmarks:old.bookmarks.map(n=>n+22.45),updatedAt:old.updatedAt};migrated.preferences.rate=old.rate;}
  return migrated;
 }catch{return emptyStore();}
}
