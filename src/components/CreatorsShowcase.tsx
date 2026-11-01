import {useState, useRef, useEffect} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';
import {Link} from 'react-router-dom';
import {ArrowUpRight, Play, Radio, Video, X} from 'lucide-react';
import type english from '@/i18n/creators/en.json';
import '@/pages/creators.css';

export const CREATOR_STUDIO='https://account.ruinwatch.com/creators/';
type Entry={id:string;external:string;provider:'twitch'|'youtube';kind:string;title:string;name:string;login:string;thumbnail:string;live:number;duration:number};
type Feed={items:Entry[];rates:{live:number;video:number;dailyMinutes:number};payoutsEnabled:boolean};
export function useCreators(){return useQuery<Feed>({queryKey:['creators-public'],queryFn:async()=>{const r=await fetch(CREATOR_STUDIO+'api/feed',{credentials:'omit',signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('Feed unavailable');const d=await r.json();if(!Array.isArray(d.items))throw Error('Invalid feed');return d;},staleTime:60000,refetchInterval:120000,retry:1});}
function thumbnail(url:string){try{const u=new URL(url);return u.protocol==='https:'&&['i.ytimg.com','i9.ytimg.com','static-cdn.jtvnw.net'].includes(u.hostname)?u.href:undefined;}catch{return undefined;}}
export function watchUrl(item:Entry){return item.provider==='youtube'&&/^[\w-]{11}$/.test(item.external)?'https://www.youtube.com/watch?v='+item.external:item.provider==='twitch'&&/^[\w]+$/.test(item.login)?'https://www.twitch.tv/'+item.login:'';}
export default function CreatorsShowcase({full=false}:{full?:boolean}){
 const {t}=useTranslation(),c=t('creators',{returnObjects:true}) as typeof english;
 const {data,isLoading,isError}=useCreators();const [filter,setFilter]=useState('all'),[watch,setWatch]=useState<Entry|null>(null),dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{if(watch)dialog.current?.showModal();else dialog.current?.close();},[watch]);
 const items=(data?.items||[]).filter(i=>watchUrl(i)&&(!full||filter==='all'||(filter==='live'?!!i.live:!i.live))).slice(0,full?60:3);
 const embed=watch?(watch.provider==='youtube'?`https://www.youtube-nocookie.com/embed/${encodeURIComponent(watch.external)}?autoplay=0`:`https://player.twitch.tv/?channel=${encodeURIComponent(watch.login)}&parent=${encodeURIComponent(location.hostname)}&autoplay=false&muted=true`):'';
 return <section className="creators-showcase" id="community-creators"><div className="container">
  <div className="creators-heading"><div><p className="creators-eyebrow">{c.showcaseEyebrow}</p><h2>{c.showcaseTitle}</h2><p>{c.showcaseIntro}</p></div>{!full&&<Link to="/creators" className="creators-link">{c.viewAll}<ArrowUpRight size={16}/></Link>}</div>
  {full&&<div className="creators-filters" aria-label={c.filtersLabel}>{(['all','live','videos'] as const).map(key=><button key={key} aria-pressed={filter===key} onClick={()=>setFilter(key)}>{c[key]}</button>)}</div>}
  {isLoading?<div className="creators-empty" role="status">{c.loading}</div>:isError?<div className="creators-empty"><Radio size={26}/><h3>{c.unavailable}</h3><p>{c.unavailableBody}</p></div>:!items.length?<div className="creators-empty"><Video size={30}/><h3>{c.empty}</h3><p>{c.emptyBody}</p><a href={CREATOR_STUDIO} className="creators-link">{c.join}<ArrowUpRight size={16}/></a></div>:<div className="creators-grid">{items.map(item=><article className="creator-card" key={item.id}>
   <button className="creator-thumbnail" onClick={()=>setWatch(item)} aria-label={`${c.watch}: ${item.title}`}><img src={thumbnail(item.thumbnail)} alt="" loading="lazy" referrerPolicy="no-referrer"/><span className="creator-play"><Play size={24}/></span><span className={`creator-badge ${item.live?'live':''}`}>{item.live?<><span/>{c.live}</>:<><Video size={12}/>{c.video}</>}</span></button>
   <div className="creator-card-copy"><span className="creator-platform">{item.provider==='twitch'?'Twitch':'YouTube'}</span><h3><button onClick={()=>setWatch(item)}>{item.title}</button></h3><p>{item.name}</p></div><a className="creator-watch" href={watchUrl(item)} target="_blank" rel="noopener noreferrer">{c.openPlatform}<ArrowUpRight size={15}/></a>
  </article>)}</div>}
  <dialog ref={dialog} className="creator-player" onCancel={()=>setWatch(null)} onClick={e=>{if(e.target===e.currentTarget)setWatch(null);}} onClose={()=>setWatch(null)}><div className="creator-player-head"><h2>{watch?.title}</h2><button onClick={()=>setWatch(null)} aria-label={c.close}><X size={22}/></button></div>{watch&&<><p className="creator-player-note">{c.embedNote}</p>{watch.provider==='twitch'&&window.innerWidth<440?<a className="creators-button" href={watchUrl(watch)} target="_blank" rel="noopener noreferrer">{c.openPlatform}<ArrowUpRight size={16}/></a>:<iframe src={embed} title={watch.title} allowFullScreen allow="fullscreen; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin"/>}<a href={watchUrl(watch)} target="_blank" rel="noopener noreferrer" className="creators-link">{c.openPlatform}<ArrowUpRight size={16}/></a></>}</dialog>
 </div></section>;
}
