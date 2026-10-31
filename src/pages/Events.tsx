import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUpRight, Skull, Swords, Flame, Gem, Footprints, Compass, Check } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import Seo from '@/components/Seo';
import hero from '@/assets/hero-watchtower.webp';
import type english from '@/i18n/events/en.json';
import './events.css';

const entries = [
  { id: 'boss', icon: Skull, color: 'ember' },
  { id: 'cow', icon: Swords, color: 'gold', image: '/items/icons/unique_polearm_101_x1_demonhunter_male.png' },
  { id: 'vault', icon: Gem, color: 'gold', image: '/items/icons/unique_ring_004_x1_demonhunter_male.png' },
  { id: 'visions', icon: Compass, color: 'violet' },
  { id: 'survival', icon: Flame, color: 'crimson' },
] as const;

export default function Events() {
  const { t } = useTranslation();
  const c = t('events', { returnObjects: true }) as typeof english;
  return <div className="events-page">
    <Seo path="/events" title={c.nav} description={c.intro} />
    <SiteHeader />
    <main>
      <section className="events-hero" style={{ backgroundImage: `linear-gradient(90deg,rgba(10,12,10,.92),rgba(10,12,10,.45)),linear-gradient(0deg,#0c0e0c,transparent 65%),url(${hero})` }}>
        <div className="container events-hero-grid">
          <div>
            <p className="events-eyebrow">{c.eyebrow}</p>
            <h1>{c.title}<br /><em>{c.accent}</em></h1>
            <p className="events-intro">{c.intro}</p>
            <div className="events-actions"><a href="#adventures" className="events-button primary">{c.browse}<ArrowDown size={16} /></a><Link to="/rates" className="events-text-link">{c.rates}<ArrowUpRight size={15} /></Link></div>
          </div>
          <a className="events-feature" href="#boss">
            <div className="events-feature-symbol"><Skull size={64} strokeWidth={1} aria-hidden="true" /></div>
            <p className="events-eyebrow">{c.boss.access}</p>
            <h2>{c.boss.name}</h2>
            <p className="events-location">Fields of Misery</p>
            <span className="events-feature-link">{c.how}<ArrowDown size={16} /></span>
          </a>
        </div>
      </section>

      <div className="container events-content">
        <nav className="events-directory" id="adventures" aria-label={c.browse}>
          {entries.map(({ id, icon: Icon, color }, index) => <a href={`#${id}`} className={`events-directory-card event-${color}`} key={id}>
            <span className="events-directory-top"><Icon size={25} strokeWidth={1.25} aria-hidden="true" /><span>0{index + 1}</span></span>
            <h2>{c[id].name}</h2><p>{c[id].players}</p><span className="events-card-link">{c.details}<ArrowDown size={14} /></span>
          </a>)}
        </nav>

        {entries.map((entry, index) => {
          const event = c[entry.id];
          const Icon = entry.icon;
          return <article id={entry.id} key={entry.id} className={`event-guide event-${entry.color}`} aria-labelledby={`${entry.id}-title`}>
            <header className="event-guide-heading">
              <div className="event-emblem" aria-hidden="true">{'image' in entry ? <img src={entry.image} alt="" loading="lazy" /> : <Icon size={46} strokeWidth={1} />}</div>
              <div><p className="events-eyebrow">0{index + 1} / {event.kicker}</p><h2 id={`${entry.id}-title`}>{event.name}</h2></div>
            </header>
            <p className="event-summary">{event.summary}</p>
            <dl className="event-facts-strip">
              <div><dt>{c.entry}</dt><dd>{event.access}</dd></div>
              <div><dt>{c.format}</dt><dd>{event.players}</dd></div>
              <div><dt>{c.rewardLabel}</dt><dd>{event.loot}</dd></div>
            </dl>
            <div className="event-guide-body">
              <section className="event-steps" aria-label={`${c.how}: ${event.name}`}>
                <h3><Footprints size={19} aria-hidden="true" />{c.how}</h3>
                <ol>{event.steps.map((step, stepIndex) => <li key={stepIndex}><span aria-hidden="true">{stepIndex + 1}</span><p>{step}</p></li>)}</ol>
              </section>
              <aside className="event-rules">
                <h3>{c.rules}</h3>
                <ul>{event.facts.map((fact, i) => <li key={i}><Check size={15} aria-hidden="true" /><span>{fact}</span></li>)}</ul>
                <div className="event-reward"><h3><Gem size={18} aria-hidden="true" />{c.rewards}</h3><p>{event.reward}</p></div>
              </aside>
            </div>
            <p className="event-note">{event.note}</p>
          </article>;
        })}

        <section className="events-closing">
          <p className="events-eyebrow">RUINWATCH</p><h2>{c.free}</h2><p>{c.footer}</p>
          <div className="events-actions"><Link className="events-button primary" to="/builds">{c.builds}<ArrowUpRight size={16} /></Link><a className="events-button" href="/#join">{c.join}<ArrowUpRight size={16} /></a></div>
          <p className="events-updated">{c.updated}</p>
        </section>
      </div>
    </main>
    <SiteFooter />
  </div>;
}
