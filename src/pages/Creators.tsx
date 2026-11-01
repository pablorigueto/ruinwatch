import {useTranslation} from 'react-i18next';
import {ArrowDown,ArrowUpRight,Radio,Video,Clock,Check} from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import Seo from '@/components/Seo';
import CreatorsShowcase,{CREATOR_STUDIO,useCreators} from '@/components/CreatorsShowcase';
import hero from '@/assets/hero-watchtower.webp';
import type english from '@/i18n/creators/en.json';
import './creators.css';
export default function Creators(){
 const {t}=useTranslation(),c=t('creators',{returnObjects:true}) as typeof english;const {data}=useCreators();
 // Published defaults match the creator policy; the live public feed replaces them when available.
 const rates=data?.rates||{live:4,video:2,dailyMinutes:240};
 return <div className="creators-page"><Seo path="/creators" title={c.nav} description={c.intro}/><SiteHeader/><main>
  <section className="creators-hero" style={{backgroundImage:`linear-gradient(90deg,#0c0e0cf0,#0c0e0c80),linear-gradient(0deg,#0c0e0c,transparent),url(${hero})`}}><div className="container creators-hero-grid"><div><p className="creators-eyebrow">{c.eyebrow}</p><h1>{c.title}<br/><em>{c.accent}</em></h1><p className="creators-intro">{c.intro}</p><div className="creators-actions"><a href={CREATOR_STUDIO} className="creators-button">{c.join}<ArrowUpRight size={16}/></a><a href="#community-creators" className="creators-link">{c.browse}<ArrowDown size={16}/></a></div></div><aside className="creators-policy"><p className="creators-eyebrow">{c.rewardTitle}</p><div><Radio size={21}/><strong>{rates.live}<small>{c.liveRate}</small></strong></div><div><Video size={21}/><strong>{rates.video}<small>{c.videoRate}</small></strong></div><p><Clock size={15}/>{t('creators.daily',{minutes:rates.dailyMinutes})}</p><span>{c.reviewed}</span></aside></div></section>
  <CreatorsShowcase full/>
  <section className="container creators-how"><p className="creators-eyebrow">{c.howEyebrow}</p><h2>{c.howTitle}</h2><div className="creators-steps">{c.steps.map((step,i)=><article key={step.title}><span>0{i+1}</span><h3>{step.title}</h3><p>{step.body}</p></article>)}</div></section>
  <section className="container creators-guidelines"><div><p className="creators-eyebrow">{c.rulesEyebrow}</p><h2>{c.rulesTitle}</h2><p>{c.rulesIntro}</p></div><ul>{c.rules.map(rule=><li key={rule}><Check size={17}/><span>{rule}</span></li>)}</ul></section>
  <section className="container creators-end"><h2>{c.endTitle}</h2><a className="creators-button" href={CREATOR_STUDIO}>{c.join}<ArrowUpRight size={16}/></a><a className="creators-link" href={CREATOR_STUDIO+'privacy'}>{c.privacy}</a></section>
 </main><SiteFooter/></div>;
}
