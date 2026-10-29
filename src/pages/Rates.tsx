import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUpRight, Check, Gem, Hammer, PackageOpen, ShieldCheck, Sparkles, Filter, ScanEye, Magnet } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import Seo from '@/components/Seo';
import data from '@/data/server-rates.json';
import { DONATE_URL } from '@/lib/site';
import hero from '@/assets/hero-watchtower.webp';
import './rates.css';

type Row = [ReactNode, ReactNode, ReactNode?];
type Range = { T1: number[]; T10: number[]; T16: number[] };

function Table({ headers, rows, caption }: { headers: string[]; rows: Row[]; caption: string }) {
  return <div className="rates-table-wrap" tabIndex={0} role="region" aria-label={caption}>
    <table className="rates-table"><caption className="sr-only">{caption}</caption>
      <thead><tr>{headers.map(h => <th key={h} scope="col">{h}</th>)}</tr></thead>
      <tbody>{rows.map(([label, ...values], index) => <tr key={index}><th scope="row">{label}</th>{values.slice(0, headers.length - 1).map((v, i) => <td key={i}>{v}</td>)}</tr>)}</tbody>
    </table>
  </div>;
}

export default function Rates() {
  const { i18n } = useTranslation();
  const pt = i18n.language.startsWith('pt');
  const c = (en: string, br: string) => pt ? br : en;
  const n = (v: number) => new Intl.NumberFormat(pt ? 'pt-BR' : 'en-US', { maximumFractionDigits: 4 }).format(v);
  const pct = (v: number) => `${n(v * 100)}%`;
  const mult = (v: number) => `${n(v)}×`;
  const yes = (v: boolean) => v ? <span className="rates-yes"><Check size={14} aria-hidden="true" />{c('Enabled', 'Ativo')}</span> : c('Disabled', 'Desativado');
  const [event, setEvent] = useState('rifts');
  const [tier, setTier] = useState<'T1' | 'T10' | 'T16'>('T16');
  const xp = data.benefits.ExperienceMultiplier;
  const platinum = data.benefits.PlatinumMultiplier;
  const capacity = data.benefits.BloodShardCapacity;
  const feature = (enabled: boolean) => data.inventory.Enabled && enabled;
  const range = (r: Range) => r[tier].map(n).join('–');
  const eventNames = [
    ['rifts', c('Rifts', 'Fendas')], ['visions', 'Visions of Enmity'], ['vault', 'The Vault'],
    ['cow', c('Cow Level', 'Nível das Vacas')], ['whimsy', 'Whimsydale'], ['shire', 'Whimsyshire'], ['infernal', c('Infernal Machines', 'Máquinas Infernais')], ['nightmare', 'Echoing Nightmare'], ['crimson', 'Crimson Harvest'], ['global', 'Global Boss'],
  ];
  const valueHeaders = [c('Rule / reward', 'Regra / recompensa'), c('Value', 'Valor')];
  const rewardHeaders = [c('Reward', 'Recompensa'), `${tier} · ${c('amount', 'quantidade')}`];
  const detail = (text: ReactNode) => <p className="rates-note">{text}</p>;
  const sectionTitle = (id: string, number: string, title: string, subtitle: string) => <div className="rates-section-title"><span>{number}</span><div><h2 id={id}>{title}</h2><p>{subtitle}</p></div></div>;
  const rewardSelector = <div className="rates-tier-picker"><span>{c('Reward reference', 'Referência de recompensas')}</span><div role="group" aria-label={c('Torment reference', 'Referência de Suplício')}>{(['T1', 'T10', 'T16'] as const).map(t => <button key={t} onClick={() => setTier(t)} aria-pressed={tier === t}>{t}</button>)}</div></div>;
  const ordinaryAncient = data.ancient.Enabled ? Math.max(0, data.ancient.AncientChance - data.ancient.PrimalChance) : 0;
  const auctionExample = (fee: number) => n(100 - (fee > 0 ? Math.max(1, Math.floor(100 * fee / 100)) : 0));
  const accountRules: Row[] = [
    [c('Play & use every QoL tool', 'Jogar e usar todas as ferramentas de QoL'), c('Free, included with every account', 'Grátis, incluído em todas as contas')],
    [c('Hero & Paragon XP', 'XP do herói e Paragon'), mult(data.rates.Experience * xp)],
    [c('All Platinum rewards', 'Todas as recompensas de Platinum'), mult(platinum)],
    [c('Blood Shard capacity', 'Limite de Blood Shards'), n(capacity)],
    [c('Auction sale fee', 'Taxa de venda no leilão'), `${n(data.auction.FeePercent)}%`],
    [c('Active auction listings per account', 'Anúncios ativos por conta'), n(data.auction.MaxActiveListings)],
    [c('You receive on a 100-material sale', 'Você recebe numa venda de 100 materiais'), auctionExample(data.auction.FeePercent)],
    [c('Bulk salvage: normal / magic / rare', 'Reciclar em lote: normal / mágico / raro'), feature(data.inventory.SalvageNormal && data.inventory.SalvageMagic && data.inventory.SalvageRare) ? c('1 click, anywhere', '1 clique, em qualquer lugar') : c('Disabled', 'Desativado')],
    [c('Bulk salvage: ordinary legendary / set', 'Reciclar em lote: lendário / conjunto regular'), feature(data.inventory.SalvageLegendary) ? c('One batch, with confirmation; Ancient and Primal excluded', 'Um lote, com confirmação; Ancient e Primal excluídos') : c('Disabled', 'Desativado')],
    [c('Shared stash access', 'Acesso ao baú compartilhado'), c('Open the stash in town', 'Abra o baú na cidade')],
    [c('Move all loose gems to stash', 'Guardar todas as gemas soltas'), feature(data.inventory.StashGems) ? c('1 click with the nearby physical stash open', '1 clique com o baú físico próximo aberto') : c('Disabled', 'Desativado')],
    [c('Auto Salvage', 'Reciclagem automática'), yes(feature(data.inventory.AutoSalvage))],
    [c('Advanced Loot Filter', 'Filtro avançado de loot'), yes(feature(data.inventory.LootFilter))],
    [c('Bulk gem upgrades', 'Upgrade de gemas em lote'), yes(feature(data.inventory.BulkGemUpgrade))],
    [c('Automatic legendary identification', 'Identificação automática de lendários'), yes(feature(data.inventory.AutoIdentify))],
    [c('Nearby currency & consumable pickup', 'Coleta próxima de moedas e consumíveis'), yes(feature(data.inventory.BulkPickup))],
    [c('Gold, loot & Ancient / Primal odds', 'Ouro, loot e chances Ancient / Primal'), c('Same server rules for every account', 'Mesmas regras do servidor para todas as contas')],
  ];
  const difficulties: Row[] = Object.entries(data.difficulty.Tiers).map(([id, row]) => {
    const names = ['Normal', 'Hard', 'Expert', 'Master'];
    return [Number(id) < 4 ? names[Number(id)] : `Torment ${Number(id) - 3}`, pct(row.GoldFindBonus * data.rates.Gold), mult(row.LegendaryMultiplier)];
  });
  for (const [id, row] of Object.entries(data.extendedDifficulty)) difficulties.push([`Torment ${Number(id) - 3}`, pct(row.GoldFindBonus * data.rates.Gold), mult(row.LegendaryMultiplier)]);

  return <div className="rates-page min-h-screen bg-background text-foreground">
    <Seo path="/rates" title={c("Free to Play · Rates, Features & QoL", "Grátis para jogar · Rates, recursos e QoL")} description={c("Play RuinWatch for free. Every account includes the same rates, custom events, material-based auction and quality-of-life tools. Explore every feature and reward.", "Jogue RuinWatch de graça. Todas as contas incluem os mesmos rates, eventos customizados, leilão por materiais e ferramentas de qualidade de vida. Confira os recursos e recompensas.")} />
    <SiteHeader />
    <main lang={pt ? 'pt-BR' : 'en'}>
      <section className="rates-hero">
        <img className="rates-hero-bg" src={hero} alt="" aria-hidden="true" />
        <div className="container rates-hero-grid">
          <div><p className="rates-eyebrow">{c('THE RUINWATCH EXPERIENCE', 'A EXPERIÊNCIA RUINWATCH')}</p>
            <h1>{c('More adventure.', 'Mais aventura.')}<br /><em>{c('Free to play.', 'Grátis para jogar.')}</em></h1>
            <p className="rates-intro">{c('Custom events, a material-based auction and tools that simplify your inventory. Everything is included: every player gets the same features, rates and reward rules, at no cost.', 'Eventos customizados, leilão por materiais e ferramentas para facilitar seu inventário. Tudo incluído: todos jogam com os mesmos recursos, rates e regras de recompensa, sem pagar nada.')}</p>
            <a className="rates-jump" href="#shortcuts">{c('Explore the features', 'Conheça os recursos')}<ArrowDown size={16} /></a>
          </div>
          <aside className="rates-access"><ShieldCheck size={32} strokeWidth={1.3} aria-hidden="true" />
            <p className="rates-eyebrow">{c('BUILT FOR EVERY PLAYER', 'FEITO PARA TODOS OS JOGADORES')}</p>
            <h2>{c('All the tools. Already yours.', 'Todas as ferramentas. Já são suas.')}</h2>
            <p>{c('Salvage in bulk, filter your loot, upgrade gems and collect nearby materials. Choose the settings that suit your way of playing.', 'Recicle em lote, filtre seus drops, evolua gemas e colete materiais próximos. Ajuste as opções ao seu jeito de jogar.')}</p>
            <div className="rates-access-foot"><Check size={16} />{c('Free accounts. Full access. Optional donations.', 'Contas gratuitas. Acesso completo. Doações opcionais.')}</div>
            <a className="rates-donate" href={DONATE_URL}>{c('Donate to RuinWatch', 'Apoiar o RuinWatch')}<ArrowUpRight size={16} aria-hidden="true" /></a>
            <p className="rates-donate-note">{c('Support the project. Your donation does not change your in-game rates, rewards or access.', 'Apoie o projeto. Sua doação não altera rates, recompensas ou acesso a recursos no jogo.')}</p>
          </aside>
        </div>
        <div className="container rates-highlights">
          <div><span>{c('BLOOD SHARD CAPACITY', 'LIMITE DE BLOOD SHARDS')}</span><strong>{n(capacity)}</strong><small>{c('For every account', 'Para todas as contas')}</small></div>
          <div><span>{c('ACTIVE AUCTION LISTINGS', 'ANÚNCIOS ATIVOS NO LEILÃO')}</span><strong>{n(data.auction.MaxActiveListings)}</strong><small>{c('Per account, paid in materials', 'Por conta, com pagamento em materiais')}</small></div>
          <div><span>{c('AUCTION FEE', 'TAXA NO LEILÃO')}</span><strong>{n(data.auction.FeePercent)}<i>%</i></strong><small>{c('Charged only when sold', 'Cobrada somente ao vender')}</small></div>
        </div>
      </section>
      <nav className="rates-section-nav" aria-label={c('On this page', 'Nesta página')}><div className="container">{[['account-rules', c('Equal accounts', 'Contas iguais')], ['shortcuts', c('Inventory tools', 'Ferramentas de inventário')], ['server-rates', c('Server rates', 'Rates do servidor')], ['events', c('Events & rewards', 'Eventos e recompensas')], ['details', c('Good to know', 'Saiba mais')]].map(([id, title]) => <a key={id} href={`#${id}`}>{title}</a>)}</div></nav>
      <div className="container rates-content">
        <section aria-labelledby="account-rules">
          {sectionTitle('account-rules', '01', c('Your account, at a glance', 'Sua conta, em resumo'), c('Playing is free. All accounts include every tool below and follow the same rates and reward rules.', 'Jogar é gratuito. Todas as contas incluem as ferramentas abaixo e seguem os mesmos rates e regras de recompensa.'))}
          <div className="rates-account-rules"><Table caption={c('Shared account rules', 'Regras comuns das contas')} headers={[c('Feature', 'Recurso'), c('All accounts', 'Todas as contas')]} rows={accountRules} /></div>
          {detail(c('Difficulty, equipment and bonuses earned through gameplay still affect your progression. Platinum is earned through achievements and events; the reward multiplier shown above applies to all of them.', 'Dificuldade, equipamentos e bônus conquistados jogando continuam influenciando sua progressão. Platinum é obtido por conquistas e eventos; o multiplicador da tabela vale para todas essas recompensas.'))}
          {detail(c(`Auction minimum: ${n(data.auction.minimumPrice)} units of the selected material. The seller pays the fee only on a sale; fractional fees round down, with a minimum of 1 material when the fee is positive. Existing listings retain their original fee.`, `Mínimo no leilão: ${n(data.auction.minimumPrice)} unidades do material escolhido. O vendedor paga a taxa somente na venda; frações são descartadas, com mínimo de 1 material quando há taxa. Anúncios existentes mantêm a taxa original.`))}
        </section>

        <section aria-labelledby="shortcuts">
          {sectionTitle('shortcuts', '02', c('Less town. More adventure.', 'Menos cidade. Mais aventura.'), c('Inventory tools are free for everyone. Salvage without visiting the Blacksmith.', 'Ferramentas de inventário grátis para todos. Recicle sem precisar ir ao ferreiro.'))}
          <div className="rates-tools">
            <article><Hammer aria-hidden="true" /><h3>{c('Salvage in bulk', 'Recicle em lote')}</h3><p>{c('Normal, magic and rare: one click per quality. Ordinary legendaries and set items: select the batch, then confirm once in the Blacksmith-style warning.', 'Normais, mágicos e raros: um clique por qualidade. Lendários e conjuntos regulares: selecione o lote e confirme uma vez na modal do ferreiro.')}</p><strong>{c('This manual shortcut protects Ancient & Primal.', 'Este atalho manual protege Ancient e Primal.')}</strong></article>
            <article><PackageOpen aria-hidden="true" /><h3>{c('Trade with materials', 'Negocie com materiais')}</h3><p>{c('List equipment or part of a gem stack. Choose items from your backpack or stash, set a buyout price and optionally accept bids. Trade in crafting materials, bounty materials, Hellfire organs or Greater Rift Keystones.', 'Anuncie equipamentos ou parte de uma pilha de gemas. Escolha os itens da mochila ou do baú, defina o preço de compra e, se quiser, aceite lances. Negocie com materiais de criação, caçadas, órgãos Hellfire ou chaves de Fenda Maior.')}</p><strong>{c(`${data.auction.MaxActiveListings} active listings per account. ${data.auction.FeePercent}% fee on completed sales.`, `${data.auction.MaxActiveListings} anúncios ativos por conta. Taxa de ${data.auction.FeePercent}% nas vendas concluídas.`)}</strong></article>
            <article><Gem aria-hidden="true" /><h3>{c('Store every gem', 'Guarde todas as gemas')}</h3><p>{c('With the stash open, click the diamond to move all loose gems at once, including legendary gems. No confirmation. Socketed gems stay in their items.', 'Com o baú aberto, clique no diamante para guardar todas as gemas soltas, inclusive lendárias. Sem confirmação. Gemas engastadas continuam nos itens.')}</p><strong>{c('One click. All loose gem stacks.', 'Um clique. Todas as pilhas de gemas.')}</strong></article>
            <article><Hammer aria-hidden="true" /><h3>{c('Auto Salvage, your rules', 'Auto Salvage, suas regras')}</h3><p>{c('Opt in separately for normal, magic, rare, ordinary legendary, ordinary set, Ancient legendary and Ancient set drops. Matching equipment is salvaged when collected; existing backpack items are not swept.', 'Ative separadamente para drops normais, mágicos, raros, lendários regulares, conjuntos regulares, lendários Ancient e conjuntos Ancient. Os equipamentos escolhidos são reciclados ao coletar; os itens já na mochila não entram nessa varredura.')}</p><strong>{c('Primal, socketed, crafted, transmogrified and actor-bound items are protected.', 'Primal, itens engastados, fabricados, transmogrificados e vinculados ao ator ficam protegidos.')}</strong></article>
            <article><Filter aria-hidden="true" /><h3>{c('See the loot you want', 'Veja o loot que interessa')}</h3><p>{c('Hide ground equipment by rarity, weapons, armor, offhands, jewelry or minimum item level. Your account keeps your choices.', 'Oculte equipamentos no chão por raridade, armas, armaduras, itens de mão secundária, joias ou nível mínimo. Suas escolhas ficam salvas na conta.')}</p><strong>{c('Visibility only. Drop chances stay the same.', 'Só muda a visibilidade. As chances de drop são iguais.')}</strong></article>
            <article><Gem aria-hidden="true" /><h3>{c('Upgrade gems in bulk', 'Evolua gemas em lote')}</h3><p>{c('Drag a normal gem into the slot, then click Upgrade gems. The batch starts at that exact color and tier and follows its upgrade recipes as far as your resources allow. Lower tiers remain untouched. You can stop after the current batch.', 'Arraste uma gema comum ao slot e clique em Upgrade gems. O lote começa exatamente na cor e no grau escolhidos e segue as receitas de evolução até onde seus recursos permitirem. Graus inferiores ficam intactos. Você pode parar após o lote atual.')}</p><strong>{c('Learned recipes and normal gold/material costs apply. Legendary gems are excluded.', 'Exige as receitas aprendidas e cobra ouro e materiais normalmente. Gemas lendárias não entram.')}</strong></article>
            <article><ScanEye aria-hidden="true" /><h3>{c('Identified legendary drops', 'Drops lendários identificados')}</h3><p>{c('Enable automatic identification so your legendary drops arrive identified, ready to inspect. Toggle it in Inventory Tools.', 'Ative a identificação automática para receber seus drops lendários já identificados e prontos para conferir. A opção fica no Inventory Tools.')}</p><strong>{c('Less time identifying each drop.', 'Menos tempo identificando cada drop.')}</strong></article>
            <article><Magnet aria-hidden="true" /><h3>{c('Collect nearby materials', 'Colete materiais próximos')}</h3><p>{c('Automatically collect nearby gold, Blood Shards, crafting and bounty materials, Hellfire organs, Rift keys, loose gems and eligible consumables such as plans, potions and dyes.', 'Colete automaticamente ouro, Blood Shards, materiais de criação e caçadas, órgãos Hellfire, chaves de fenda, gemas soltas e consumíveis elegíveis próximos, como receitas, poções e tinturas.')}</p><strong>{c('Reach, inventory space and currency caps still apply.', 'Alcance, espaço no inventário e limites de saldo continuam valendo.')}</strong></article>
          </div>
          {detail(c('Only eligible backpack items are salvaged. Normal/magic/rare bulk salvage keeps the game’s exclusions for socketed, transmogrified and actor-bound items. Legendary salvage returns socketed gems. If there is not enough space for returned or stored gems, the operation is refused without a partial transfer.', 'Somente itens elegíveis da mochila são reciclados. Normais/mágicos/raros mantêm as exclusões do jogo para itens engastados, transmogrificados e vinculados ao ator. A reciclagem de lendários devolve as gemas. Sem espaço para devolver ou guardar as gemas, a operação é recusada sem transferência parcial.'))}
          {data.inventory.IncludeUnidentifiedLegendary && detail(c('Unidentified ordinary legendaries are included in legendary bulk salvage. Check your backpack before confirming.', 'Lendários regulares não identificados também entram na reciclagem em lote. Confira a mochila antes de confirmar.'))}
          {detail(c('Inventory Tools settings are saved per account. The diamond shortcut stays visible in your inventory; open a nearby physical stash before using it.', 'As configurações de Inventory Tools ficam salvas por conta. O atalho do diamante permanece visível no inventário; abra um baú físico próximo antes de usá-lo.'))}
          {detail(c('Vendor-bought items cannot be salvaged.', 'Itens comprados de vendedores não podem ser reciclados.'))}
        </section>

        <section aria-labelledby="server-rates">
          {sectionTitle('server-rates', '03', c('The server baseline', 'A base do servidor'), c('The same base rates for every account.', 'Os mesmos rates base para todas as contas.'))}
          <div className="rates-columns">
            <Table caption={c('Base rates', 'Rates base')} headers={valueHeaders} rows={[
              [c('Base XP', 'XP base'), mult(data.rates.Experience)], [c('Gold rate setting', 'Rate de ouro'), mult(data.rates.Gold)], [c('Loot rate setting', 'Rate de loot'), mult(data.rates.Drop)],
              [c('Kadala legendary chance multiplier', 'Multiplicador de chance lendária da Kadala'), mult(data.artisans.kadala)],
              [c('Salvage material multiplier', 'Multiplicador de materiais da reciclagem'), mult(data.artisans.salvage)],
              [c('Kanai’s Cube bonus multiplier', 'Multiplicador de bônus do Cubo'), mult(data.artisans.cube)],
            ]} />
            <Table caption={c('Ancient and Primal', 'Ancient e Primal')} headers={valueHeaders} rows={[
              [c('Ancient-or-better roll', 'Rolagem Ancient ou superior'), pct(data.ancient.Enabled ? data.ancient.AncientChance : 0)],
              [c('Primal, when unlocked', 'Primal, quando desbloqueado'), pct(data.ancient.Enabled ? data.ancient.PrimalChance : 0)],
              [c('Ancient only, after Primal unlock', 'Somente Ancient, após desbloquear Primal'), pct(ordinaryAncient)],
              [c('Solo GR70 required for Primal', 'GR70 solo exigido para Primal'), yes(data.ancient.RequireGR70ForPrimal)],
              [c('Ancient Bardiche → Ancient legendaries', 'Bardiche Ancient → lendários Ancient'), yes(data.cow.AncientBardicheForcesAncientLegendaries)],
              [c('Primal Bardiche → Ancient legendaries', 'Bardiche Primal → lendários Ancient'), yes(data.cow.PrimalBardicheForcesAncientLegendaries)],
              [c('Ancient Vault → Ancient legendaries', 'Vault Ancient → lendários Ancient'), yes(data.vault.AncientPuzzleRingForcesAncientLegendaries)],
            ]} />
          </div>
          {detail(c('Ancient/Primal percentages apply to eligible legendary/set rank rolls, not to every monster kill. Primal is part of the Ancient-or-better roll, not an additional chance. Convert Set Item cannot produce Ancient/Primal. Ancient Vault and the enabled Bardiche rules force eligible legendary/set drops to Ancient, not Primal; they do not turn every drop into a legendary.', 'As porcentagens Ancient/Primal valem para rolagens elegíveis de lendários/conjuntos, não para cada monstro morto. Primal está dentro da chance Ancient ou superior, não é uma chance adicional. Converter Item de Conjunto não gera Ancient/Primal. O Vault Ancient e as regras ativas do Bardiche forçam os drops lendários/conjuntos a Ancient, não Primal; nem todo drop vira lendário.'))}
          <details className="rates-disclosure"><summary>{c('Difficulty scaling · Normal to Torment XX', 'Escala por dificuldade · Normal a Suplício XX')}</summary>
            {detail(c('Gold Find is the configured difficulty bonus. Legendary values are multipliers, not drop percentages. T17–T20 are custom RuinWatch difficulties.', 'Gold Find é o bônus configurado da dificuldade. Valores de lendários são multiplicadores, não porcentagens de drop. T17–T20 são dificuldades customizadas do RuinWatch.'))}
            {data.difficulty.UseOverrides ? <Table caption="Difficulty scaling" headers={[c('Difficulty', 'Dificuldade'), c('Gold Find bonus', 'Bônus de Gold Find'), c('Legendary multiplier', 'Multiplicador lendário')]} rows={difficulties} /> : detail(c('Native difficulty tables are active.', 'As tabelas nativas de dificuldade estão ativas.'))}
            <Table caption="Extended difficulty" headers={[c('Difficulty', 'Dificuldade'), c('XP vs. T16', 'XP relativo a T16'), c('Bounty materials', 'Materiais de caçadas')]} rows={Object.entries(data.extendedDifficulty).map(([id, r]) => [`Torment ${Number(id) - 3}`, mult(r.ExperienceMultiplier), n(r.BountyMaterials)])} />
          </details>
        </section>

        <section aria-labelledby="events">
          {sectionTitle('events', '04', c('Choose your next run', 'Escolha sua próxima aventura'), c('Event rules and reward ranges, without the guesswork.', 'Regras dos eventos e faixas de recompensas, de forma direta.'))}
          <div className="rates-event-tabs" role="group" aria-label={c('Choose an event', 'Escolha um evento')}>{eventNames.map(([key, label]) => <button key={key} aria-pressed={event === key} onClick={() => setEvent(key)}>{label}</button>)}</div>
          <div className="rates-event-panel" aria-live="polite">
            <h3><Sparkles size={20} aria-hidden="true" />{eventNames.find(([key]) => key === event)?.[1]}</h3>
            {event === 'crimson' && <>
              {detail(c('A solo survival run opened through Kanai’s Cube. Defeat waves of varied monsters, fill the Blood Essence bar and choose powers at the pillars to shape your build for that run. The event awards Platinum at the end, including when you die; monsters do not shower the arena with normal loot.', 'Uma aventura solo de sobrevivência aberta pelo Cubo de Kanai. Derrote ondas de monstros variados, preencha a barra de Blood Essence e escolha poderes nos pilares para montar sua build daquela partida. O evento entrega Platinum ao encerrar, inclusive ao morrer; os monstros não espalham loot comum pela arena.'))}
              <Table caption="Crimson Harvest" headers={valueHeaders} rows={[
                [c('Event enabled', 'Evento ativo'), yes(data.crimson.Enabled)],
                [c('Minimum hero level / players', 'Nível mínimo do herói / jogadores'), `${data.crimson.MinimumLevel} / 1`],
                [c('Entry item from Nephalem / Greater Rift Guardian', 'Item de entrada no Guardião Nefalem / Fenda Maior'), `${pct(data.crimson.RiftGuardianDropChance)} / ${pct(data.crimson.GreaterRiftGuardianDropChance)}`],
                [c('Main survival phase, before the final encounter', 'Fase principal de sobrevivência, antes do confronto final'), `${n(data.crimson.MainDurationSeconds / 60)} min`],
                [c('Combat resources kept full', 'Recursos de combate sempre cheios'), yes(data.crimson.UnlimitedCombatResources)],
                [c('Walk through monsters during power selection', 'Atravessar monstros durante a escolha de poderes'), yes(data.crimson.WalkThroughMonstersDuringChoice)],
                [c('Minimum kills for a reward', 'Abates mínimos para receber recompensa'), n(data.crimson.rewards.MinimumKills)],
                [c('Platinum per kill / kill reward cap', 'Platinum por abate / limite por abates'), `${n(data.crimson.rewards.PlatinumPerKill)} / ${n(data.crimson.rewards.MaximumKillPlatinum)}`],
                [c('King defeat bonus', 'Bônus por derrotar o Rei'), `${n(data.crimson.rewards.KingPlatinumBonus)} Platinum`],
                [c('Platinum per endless minute', 'Platinum por minuto no modo infinito'), n(data.crimson.rewards.PerEndlessMinute)],
                [c('Platinum per hunt kill / maximum hunt kills', 'Platinum por abate da caçada / máximo de abates da caçada'), `${n(data.crimson.rewards.PerHuntKill)} / ${n(data.crimson.rewards.MaximumHuntKills)}`],
                [c('Maximum reward per run', 'Recompensa máxima por partida'), `${n(data.crimson.rewards.MaximumPerRun * platinum)} Platinum`],
              ]} />
              {detail(c('Platinum is based on what you accomplish, not a guaranteed maximum. The Treasure Hunter power increases the reward up to the run cap. Combat resources stay full, but life costs, skill cooldowns and Hardcore death rules still apply.', 'O Platinum depende do seu desempenho; o máximo não é garantido. O poder Treasure Hunter aumenta a recompensa até o limite da partida. Os recursos de combate ficam cheios, mas custos de vida, recargas de habilidades e regras de morte Hardcore continuam valendo.'))}
            </>}
            {event === 'global' && <>
              {detail(c('Fight a world boss with health shared across Global Boss sessions. Players contribute to the same encounter, with optional parties inside each session.', 'Enfrente um chefe com vida compartilhada entre as sessões do Global Boss. Os jogadores contribuem para o mesmo confronto e podem formar grupos dentro de cada sessão.'))}
              <Table caption="Global Boss" headers={valueHeaders} rows={[
                [c('Players per session', 'Jogadores por sessão'), n(data.globalBoss.SessionCapacity)],
                [c('Players per party', 'Jogadores por grupo'), n(data.globalBoss.PartyCapacity)],
                [c('Automatic event schedule', 'Agenda automática do evento'), data.globalBoss.scheduled ? c('Active; watch in-game announcements', 'Ativa; acompanhe os avisos no jogo') : c('Off; encounters are started by the team', 'Desativada; os encontros são iniciados pela equipe')],
              ]} />
            </>}
            {event === 'shire' && <>
              {detail(c('Craft the Staff of Herding at the Blacksmith and visit the Ghost of the Cow King to enter Whimsyshire. Rainbow Goblins instead lead to Whimsydale, where Princess Lilian can appear with Cosmic Wings.', 'Fabrique o Staff of Herding no ferreiro e visite o Ghost of the Cow King para entrar em Whimsyshire. Já os Rainbow Goblins levam a Whimsydale, onde Princess Lilian pode aparecer com Cosmic Wings.'))}
              <Table caption="Whimsyshire" headers={valueHeaders} rows={[
                [c('Event enabled', 'Evento ativo'), yes(data.whimsyshire.Enabled)],
                [c('Staff of Herding plan from Izual', 'Plano do Staff of Herding no Izual'), pct(data.whimsyshire.IzualPlanChance)],
                [c('Gibbering Gemstone from Chiltara', 'Gibbering Gemstone na Chiltara'), pct(data.whimsyshire.ChiltaraGemstoneChance)],
                [c('Sir William appearance chance', 'Chance de aparecer Sir William'), pct(data.whimsyshire.SirWilliamChance)],
                [c('Sir William reward', 'Recompensa de Sir William'), 'Rainbow Portrait'],
              ]} />
            </>}
            {event === 'rifts' && <><Table caption="Rift rules" headers={valueHeaders} rows={[
              [c('Nephalem progress rate', 'Progresso das Fendas Nefalem'), mult(data.rifts.ProgressMultiplier)],
              [c('Nephalem maximum floors', 'Máximo de andares Nefalem'), n(data.rifts.MaxFloors)],
              [c('Nephalem closing countdown', 'Contagem para fechar Nefalem'), `${data.rifts.CloseCountdownSeconds}s`],
              [c('Greater Rift timer', 'Tempo da Fenda Maior'), `${n(data.greaterRifts.TimerSeconds / 60)} min`],
              [c('Extra gem upgrade when empowered', 'Upgrade extra de gema ao potencializar'), `+${data.greaterRifts.EmpoweredBonusJewelUpgrades}`],
              [c('Town Portal in Greater Rifts', 'Portal da Cidade em Fendas Maiores'), yes(data.greaterRifts.AllowTownPortal)],
              [c('Greater Rift death penalty', 'Penalidade de morte em Fendas Maiores'), yes(data.greaterRifts.DeathPenaltyEnabled)],
              [c('Completion Platinum multiplier', 'Multiplicador de Platinum na conclusão'), mult(platinum)],
            ]} />{detail(c('Successful Rift completions use the same base Platinum multiplier as other gameplay rewards, including achievements. Timed-out Greater Rifts grant no completion Platinum.', 'Conclusões bem-sucedidas de fendas usam o mesmo multiplicador base de Platinum das demais recompensas do jogo, incluindo conquistas. Fendas Maiores fora do tempo não concedem Platinum de conclusão.'))}</>}
            {event === 'visions' && <>{rewardSelector}<Table caption="Vision rewards" headers={rewardHeaders} rows={[
              [c('Final chest: bounty materials per act', 'Baú final: materiais de caçadas por ato'), range(data.visions.BountyMaterialsPerAct)],
              [c('Champion Death’s Breaths', 'Suspiros da Morte dos campeões'), range(data.visions.ChampionBreaths)],
              [c('Guardian Greater Rift keys', 'Chaves de Fenda Maior dos guardiões'), range(data.visions.GuardianKeys)],
            ]} /><Table caption="Vision rules" headers={valueHeaders} rows={[
              [c('Event enabled', 'Evento ativo'), yes(data.visions.Enabled)], [c('Seasonal only', 'Somente temporada'), yes(data.visions.SeasonalOnly)],
              [c('Portal roll per eligible kill', 'Rolagem de portal por morte elegível'), pct(data.visions.PortalChancePerKill)],
              [c('Next-floor roll per eligible kill', 'Rolagem de próximo andar por morte elegível'), pct(data.visions.NextFloorChancePerKill)],
              [c('Floors / monsters per floor', 'Andares / monstros por andar'), `${data.visions.MinFloors}–${data.visions.MaxFloors} / ${data.visions.MonstersPerFloor}`],
              [c('Final chest items / legendary roll', 'Itens do baú final / rolagem lendária'), `${data.visions.ChestItems} / ${pct(data.visions.ChestLegendaryChance)}`],
              [c('Champion / Guardian floor roll', 'Rolagem de andar campeão / guardião'), `${pct(data.visions.ChampionFloorChance)} / ${pct(data.visions.GuardianFloorChance)}`],
              [c('Material / Goblin floor roll', 'Rolagem de andar de materiais / goblins'), `${pct(data.visions.MaterialFloorChance)} / ${pct(data.visions.GoblinFloorChance)}`],
              [c('Single Goblin / affix roll', 'Rolagem de goblin individual / afixo'), `${pct(data.visions.SingleGoblinChance)} / ${pct(data.visions.AffixChance)}`],
              [c('Health / damage growth per floor', 'Crescimento de vida / dano por andar'), `${pct(data.visions.HealthGrowthPerFloor)} / ${pct(data.visions.DamageGrowthPerFloor)}`],
              [c('Closing countdown', 'Contagem para fechar'), `${data.visions.CloseSeconds}s`],
            ]} /></>}
            {event === 'vault' && <><Table caption="Vault rules" headers={valueHeaders} rows={[
              [c('Event enabled', 'Evento ativo'), yes(data.vault.Enabled)],
              [c('Ancient/Primal Puzzle Ring', 'Puzzle Ring Ancient/Primal'), data.vault.AncientPuzzleRingForcesAncientLegendaries ? c('Legendary/set drops forced to Ancient', 'Drops lendários/conjuntos forçados a Ancient') : c('Natural rank rolls', 'Rolagens naturais')],
              [c('Gold / equipment / gems / materials', 'Ouro / equipamentos / gemas / materiais'), [data.vault.GoldMultiplier, data.vault.EquipmentMultiplier, data.vault.GemMultiplier, data.vault.MaterialMultiplier].map(mult).join(' / ')],
              [c('Chest minimum legendaries', 'Mínimo de lendários do baú'), data.vault.ChestMinimumLegendaries],
              [c('Maximum boss Goblins', 'Máximo de goblins do chefe'), data.vault.MaxBossGoblins],
              [c('Goblin reward steps T17–T19 / T20 factor', 'Passos de recompensa de goblins T17–T19 / fator T20'), `${mult(data.goblins.ExtraTormentStepMultiplier)} / ${mult(data.goblins.Torment20Multiplier)}`],
              [c('Closing countdown', 'Contagem para fechar'), `${data.vault.CloseSeconds}s`],
            ]} />{rewardSelector}<Table caption="Goblin reward ranges" headers={rewardHeaders} rows={([
              ['CollectorMaterials', c('Odious Collector · materials', 'Odious Collector · materiais')], ['CollectorSouls', c('Odious Collector · souls', 'Odious Collector · almas')], ['CollectorPlans', c('Odious Collector · plans', 'Odious Collector · planos')],
              ['HoarderGems', c('Gem Hoarder · gems', 'Gem Hoarder · gemas')], ['BaronGold', 'Gilded Baron · Gold'], ['TormentorLegendaries', c('Malevolent Tormentor · legendaries', 'Malevolent Tormentor · lendários')],
              ['CommonLegendaries', c('Common Goblin · legendaries', 'Goblin comum · lendários')], ['CommonRares', c('Common Goblin · rares', 'Goblin comum · raros')], ['CommonGold', 'Common Goblin · Gold'], ['CommonGems', c('Common Goblin · gems', 'Goblin comum · gemas')], ['CommonMaterials', c('Common Goblin · materials', 'Goblin comum · materiais')],
              ['BloodThiefShards', 'Blood Thief · Blood Shards'], ['SireLegendaries', c('Gelatinous Sire family · legendaries', 'Família Gelatinous Sire · lendários')], ['SireDeathBreaths', 'Gelatinous Sire · Death’s Breath'], ['SireKeys', c('Gelatinous Sire · keys', 'Gelatinous Sire · chaves')], ['SireGems', c('Gelatinous Sire · gems', 'Gelatinous Sire · gemas')], ['SireMaterials', c('Gelatinous Sire · materials', 'Gelatinous Sire · materiais')], ['SireShards', 'Gelatinous Sire · Blood Shards'], ['SireGold', 'Gelatinous Sire · Gold'],
            ] as const).map(([key, label]) => [label, range(data.goblins[key])])} />{detail(c('Gelatinous Sire rewards are shared across its family, not awarded in full per child. Above T16, rewards scale by the configured extra-tier factors.', 'As recompensas do Gelatinous Sire são divididas entre a família, não entregues integralmente por descendente. Acima de T16, as recompensas usam os fatores dos tiers extras.'))}</>}
            {event === 'cow' && <><Table caption="Cow level rules" headers={valueHeaders} rows={[
              [c('Event enabled', 'Evento ativo'), yes(data.cow.Enabled)],
              [c('Ancient Bardiche forces Ancient legendaries', 'Bardiche Ancient força lendários Ancient'), yes(data.cow.AncientBardicheForcesAncientLegendaries)],
              [c('Primal Bardiche forces Ancient legendaries', 'Bardiche Primal força lendários Ancient'), yes(data.cow.PrimalBardicheForcesAncientLegendaries)],
              [c('Event XP multiplier', 'Multiplicador de XP do evento'), mult(data.cow.ExperienceMultiplier)],
              [c('Each step T17–T19 / T20 factor', 'Cada passo T17–T19 / fator T20'), `${mult(data.cow.ExtraTormentStepMultiplier)} / ${mult(data.cow.Torment20Multiplier)}`],
            ]} />{rewardSelector}<Table caption="Cow level reward scale" headers={[c('Reward', 'Recompensa'), c('Budget scale relative to T16', 'Escala do orçamento relativa a T16')]} rows={(['Equipment', 'Materials', 'Gems', 'Gold'] as const).map((key, i) => [c(key, ['Equipamentos', 'Materiais', 'Gemas', 'Ouro'][i]), mult(data.cow[key][tier === 'T1' ? 'Torment1' : tier === 'T10' ? 'Torment10' : 'Torment16'] * data.cow[key].Multiplier)])} />{detail(c('These are whole-map reward budget factors, not extra drop chances per monster. Ancient rules affect only legendary/set equipment; other loot keeps its usual quality.', 'Estes são fatores do orçamento de recompensas do mapa inteiro, não chances extras por monstro. As regras Ancient afetam somente equipamentos lendários/conjuntos; os demais drops mantêm sua qualidade.'))}</>}
            {event === 'whimsy' && <>{rewardSelector}<Table caption="Whimsydale cache rewards" headers={rewardHeaders} rows={[
              [c('Cache legendaries', 'Lendários por cache'), range(data.whimsydale.CacheLegendaries)], [c('Cache gems', 'Gemas por cache'), range(data.whimsydale.CacheGems)], [c('Cache materials', 'Materiais por cache'), range(data.whimsydale.CacheMaterials)], [c('Cache gold', 'Ouro por cache'), range(data.whimsydale.CacheGold)],
            ]} /><Table caption="Whimsydale rules" headers={valueHeaders} rows={[
              [c('Event enabled', 'Evento ativo'), yes(data.whimsydale.Enabled)],
              [c('Rainbow roll per eligible Goblin', 'Rolagem Rainbow por goblin elegível'), pct(data.whimsydale.RainbowChancePerGoblin)],
              [c('Princess Lilian chance', 'Chance de Princess Lilian'), pct(data.whimsydale.PrincessLilianChance)],
              [c('Spectrum per unique / Hamburger per cache', 'Spectrum por único / Hamburger por cache'), `${pct(data.whimsydale.SpectrumChancePerUnique)} / ${pct(data.whimsydale.HamburgerChancePerCache)}`],
              [c('Monsters / uniques / clouds / piñatas', 'Monstros / únicos / nuvens / pinhatas'), `${data.whimsydale.Monsters} / ${data.whimsydale.Uniques} / ${data.whimsydale.HappyClouds} / ${data.whimsydale.Pinatas}`],
            ]} /></>}
            {event === 'infernal' && <><Table caption="Infernal Machines rules" headers={valueHeaders} rows={[
              [c('Event enabled', 'Evento ativo'), yes(data.infernal.Enabled)], [c('Equipment per arena', 'Equipamentos por arena'), data.infernal.EquipmentPerArena], [c('Closing countdown', 'Contagem para fechar'), `${data.infernal.CountdownSeconds}s`],
            ]} />{detail(c('Counts below are expected amounts: the whole number is guaranteed and the decimal is the chance of one extra. Example: 3.25 means 3 guaranteed + 25% for a fourth. T17–T20 are custom server rates.', 'Os valores abaixo são quantidades esperadas: a parte inteira é garantida e a decimal é a chance de mais um. Exemplo: 3,25 significa 3 garantidos + 25% para o quarto. T17–T20 são rates customizados.'))}<Table caption="Infernal Machines by Torment" headers={['Torment', c('Machines per eligible kill', 'Máquinas por morte elegível'), c('Organs per reward', 'Órgãos por recompensa')]} rows={Object.entries(data.infernal.MachinesByTorment).map(([t, amount]) => [`T${t}`, n(amount), n(data.infernal.OrgansByTorment[t as keyof typeof data.infernal.OrgansByTorment])])} /></>}
            {event === 'nightmare' && <><Table caption="Echoing Nightmare rules" headers={valueHeaders} rows={[
              [c('Event enabled', 'Evento ativo'), yes(data.nightmare.Enabled)],
              [c('Petrified Scream from GR Guardian (level 70)', 'Petrified Scream no Guardião de GR (nível 70)'), `${n(data.nightmare.PetrifiedScreamDropChancePercent)}%`],
              [c('Reward tier cap', 'Limite de tier das recompensas'), data.nightmare.RewardTierCap],
              [c('Whisper of Atonement rank cap', 'Rank máximo de Whisper of Atonement'), data.nightmare.WhisperRankCap],
              [c('Hardcore permanent-death protection', 'Proteção contra morte permanente Hardcore'), yes(data.nightmare.ProtectHardcoreHeroes)],
              [c('Intro / closing countdown', 'Introdução / contagem para fechar'), `${data.nightmare.IntroSeconds}s / ${data.nightmare.CountdownSeconds}s`],
            ]} />{detail(c('Petrified Scream chance is independent of Torment and Greater Rift tier. With Hardcore protection enabled, death ends the event without permanently losing the hero.', 'A chance de Petrified Scream independe do Suplício e tier da Fenda Maior. Com a proteção Hardcore ativa, morrer encerra o evento sem perder permanentemente o herói.'))}</>}
          </div>
          {detail(c('Ranges show the configured T1, T10 and T16 reference values, not a promise for every drop. Eligibility, event context and intermediate difficulty scaling still apply.', 'As faixas mostram os valores de referência configurados para T1, T10 e T16, não uma promessa para cada drop. Elegibilidade, contexto do evento e escala das dificuldades intermediárias continuam valendo.'))}
        </section>

        <section aria-labelledby="details">
          {sectionTitle('details', '05', c('Good to know', 'Saiba mais'), c('A few small rules worth knowing before your next run.', 'Algumas regras úteis antes da próxima aventura.'))}
          <Table caption="Other gameplay rules" headers={valueHeaders} rows={[
            ['Altar of Rites', c('Permanent progression through seals and potion powers', 'Progressão permanente por selos e poderes de poção')],
            [c('Ethereal weapons', 'Armas Ethereal'), c('Available to hunt for every class', 'Disponíveis para buscar em todas as classes')],
            [c('Cosmetics', 'Cosméticos'), c('Wings, pets, pennants, portraits and transmogs unlockable for free', 'Asas, mascotes, estandartes, retratos e transmogs desbloqueáveis gratuitamente')],
            [c('Potion healing / cooldown', 'Cura da poção / recarga'), `${n(data.health.PotionRestorePercentage)}% / ${data.health.PotionCooldown}s`],
            [c('Enchant property choices', 'Opções de propriedades no encantamento'), data.artisans.enchantChoices],
            [c('Socket caps: chest / pants', 'Limites de engastes: torso / calças'), `${data.artisans.sockets.Chest} / ${data.artisans.sockets.Pants}`],
            [c('Socket caps: weapon / helm / ring / amulet', 'Engastes: arma / elmo / anel / amuleto'), [data.artisans.sockets.Weapon, data.artisans.sockets.Helm, data.artisans.sockets.Ring, data.artisans.sockets.Amulet].join(' / ')],
            [c('Campaign / Adventure party size', 'Grupo em Campanha / Aventura'), `${data.party.campaign} / ${data.party.adventure}`],
            ['Darkening of Tristram', yes(data.anniversaryEvent)],
          ]} />
          <div className="rates-faq">
            <details><summary>{c('Where do I configure my inventory tools?', 'Onde configuro as ferramentas de inventário?')}</summary><p>{c('Open your inventory and select Inventory Tools. Choose your Auto Salvage, Loot Filter and pickup preferences, then save. Your settings are stored per account. Bulk gem upgrades start only after you select a gem and click Upgrade gems.', 'Abra o inventário e selecione Inventory Tools. Escolha as opções de reciclagem automática, filtro e coleta, depois salve. As preferências ficam guardadas por conta. A evolução de gemas em lote começa somente após escolher uma gema e clicar em Upgrade gems.')}</p></details>
            <details><summary>{c('Do I need to donate to use any of this?', 'Preciso doar para usar algum desses recursos?')}</summary><p>{c('No. Playing and using these features is free. Donations are optional support for the project and do not unlock account tiers, gameplay tools, higher rates or extra in-game rewards.', 'Não. Jogar e usar esses recursos é gratuito. Doações são um apoio opcional ao projeto e não liberam categorias de conta, ferramentas, rates maiores ou recompensas extras no jogo.')}</p></details>
            <details><summary>{c('What happens to socketed gems when I sell an item?', 'O que acontece com as gemas ao anunciar um item?')}</summary><p>{c('Listing an item automatically removes its socketed gems and returns them to your backpack. If there is not enough space, the listing is refused and a message asks you to free space. This protection applies to every account.', 'Anunciar um item remove automaticamente as gemas engastadas e devolve-as à mochila. Se não houver espaço, o anúncio é recusado e uma mensagem pede que você libere espaço. A proteção vale para todas as contas.')}</p></details>
            <details><summary>{c('Does Greater Rift progress increase my Blood Shard cap?', 'Progredir em Fendas Maiores aumenta o limite de Blood Shards?')}</summary><p>{c(`No. Every account can hold up to ${n(capacity)} Blood Shards, across heroes, seasons and modes. Existing excess is preserved; spend below the cap before collecting more.`, `Não. Todas as contas podem acumular até ${n(capacity)} Blood Shards, entre heróis, temporadas e modos. O excedente existente é preservado; gaste até ficar abaixo do limite para coletar mais.`)}</p></details>
          </div>
          <p className="rates-updated">{c('Gameplay policy updated', 'Regras atualizadas em')} · {data.updated}</p>
        </section>
        <section className="rates-support" aria-labelledby="rates-support-title">
          <div><p className="rates-eyebrow">{c('SUPPORT THE PROJECT', 'APOIE O PROJETO')}</p><h2 id="rates-support-title">{c('Enjoy RuinWatch? Help it grow.', 'Curtiu o RuinWatch? Ajude o projeto a crescer.')}</h2><p>{c('Contributing is optional. You can play and use every feature on this page for free, whether you donate or not.', 'Contribuir é opcional. Você pode jogar e usar todos os recursos desta página gratuitamente, com ou sem doação.')}</p></div>
          <a className="rates-donate" href={DONATE_URL}>{c('Donate to RuinWatch', 'Apoiar o RuinWatch')}<ArrowUpRight size={16} aria-hidden="true" /></a>
        </section>
      </div>
    </main>
    <SiteFooter />
  </div>;
}
