import data from '../public/library/catalog.json';
export type Book = {volume:number;label:string;title:string;sourceBase:string;readerUrl:string;pageCount:number;imageBase:string;toc:{title:string;page:number;level:number}[]};
export type Chapter = {id:string;volume:number;order:number;title:string;audioUrl:string;audioSourcePage:string;startPage:number;endPage:number;readerUrl:string;durationEstimate?:number;mobileAudioUrl?:string;subtitleStatus?:string};
export type Cue = {start:number;end:number;text:string;page:number;audioUnavailable?:boolean;audioNote?:string};
export type Subtitles = {chapterId:string;duration:number;cues:Cue[];status:string;textStatus?:string;alignmentCoverage?:number;verification?:string};
export const books:Book[]=data.books;
export const chapters:Chapter[]=data.chapters;
export const bookFor=(chapter:Chapter)=>books.find(b=>b.volume===chapter.volume)!;
export function validateSubtitles(value:unknown,id:string):Subtitles|null {
 if(!value||typeof value!=='object')return null;
 const s=value as Subtitles;
 if(s.chapterId!==id||!Number.isFinite(s.duration)||s.duration<=0||!Array.isArray(s.cues)||!s.cues.length)return null;
 // Unreviewed page extraction may contain running heads or reordered marginal text.
 // Only publish wording that passed a canonical text check, even in this preview.
 if(s.status!=='verified'&&s.textStatus!=='canonical-article-exact')return null;
 let end=-1;
 for(const c of s.cues){if(typeof c.text!=='string'||!c.text.trim()||!Number.isFinite(c.start)||!Number.isFinite(c.end)||c.start<end||c.end<c.start||c.end>s.duration+2||!Number.isInteger(c.page))return null;end=c.start;}
 return s;
}
