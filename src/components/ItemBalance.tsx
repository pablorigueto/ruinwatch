import { Link } from 'react-router-dom';
import { iconSrc, useItems, type Item } from '@/lib/items';
import ItemTooltip from '@/components/items/ItemTooltip';
import { NativeItemHover } from '@/components/items/NativeItemFrame';
import '@/components/items/items.css';

type Change = { id: keyof typeof itemSlugs; name: string; set?: boolean; before: string[]; after: string[] };

const itemSlugs = {
  akkhan: ['akkhans-leniency-P65_flail2H_norm_unique_01'],
  vigilante: ['vigilante-belt-Unique_Belt_002_x1'],
  cluckeye: ['cluckeye-Unique_Bow_015_x1'],
  dreadlands: ['dystopian-goggles-P69_Unique_Helm_Set_06', 'mechanical-pauldrons-P69_Unique_Shoulder_Set_06', 'galvanized-vest-P69_Unique_Chest_Set_06', 'gas-powered-automail-forearm-P69_Unique_Gloves_Set_06', 'cold-cathode-trousers-P69_Unique_Pants_Set_06', 'antique-vintage-boots-P69_Unique_Boots_Set_06'],
  manajuma: ['manajumas-carving-knife-Unique_CeremonialDagger_009_x1', 'manajumas-gory-fetch-Unique_Mojo_010_x1'],
};

function BalanceArt({ item, change, showName }: { item: Item; change: Change; showName: boolean }) {
  return <NativeItemHover content={<ItemTooltip item={item} />}>
    <Link className={`item-balance-link rarity-${item.rarity}`} to={`/items/${encodeURIComponent(item.slug)}`} aria-label={item.name}>
      <span className="item-balance-sprite"><img src={iconSrc(item)} alt="" loading="lazy" /></span>
      {showName && <span>{change.name}</span>}
    </Link>
  </NativeItemHover>;
}

export default function ItemBalance({ pt }: { pt: boolean }) {
  const { data: catalog = [], isError } = useItems();
  const c = (en: string, br: string) => pt ? br : en;
  const groups: { name: string; items: Change[] }[] = [
    { name: c('Crusader', 'Cruzado'), items: [
      { id: 'akkhan', name: "Akkhan’s Leniency", before: [c('Each enemy hit by Blessed Shield increases its damage by 35–40% for 3 seconds. Stacks expire individually.', 'Cada inimigo atingido por Blessed Shield aumenta seu dano em 35–40% por 3 segundos. Os acúmulos expiram individualmente.')], after: [c('Each enemy hit by Blessed Shield increases its damage by 35–40% for 6 seconds. Stacks up to 100 times; all stacks refresh together.', 'Cada inimigo atingido por Blessed Shield aumenta seu dano em 35–40% por 6 segundos. Acumula até 100 vezes; todos os acúmulos são renovados juntos.')] },
      { id: 'vigilante', name: 'Vigilante Belt', before: [c('No previous legendary power.', 'Sem poder lendário anterior.')], after: [c('While Steed Charge is active, Fist of the Heavens gains increased damage equal to your movement speed. If it is on your action bar, it is also automatically cast on a random nearby enemy at an interval based on your attack speed.', 'Enquanto Steed Charge estiver ativo, Fist of the Heavens recebe um aumento de dano igual à sua velocidade de movimento. Se estiver na barra de habilidades, também é lançado automaticamente contra um inimigo próximo aleatório, em um intervalo baseado na sua velocidade de ataque.')] },
    ] },
    { name: c('Demon Hunter', 'Caçador de Demônios'), items: [
      { id: 'dreadlands', name: 'Gears of Dreadlands', set: true, before: [c('Attacking with a Primary skill grants 4 seconds of Momentum, up to 20 seconds. Your Primary skills deal 10% increased damage per second of Momentum. The countdown starts immediately.', 'Atacar com uma habilidade primária concede 4 segundos de Momentum, até 20 segundos. Suas habilidades primárias causam 10% de dano adicional por segundo de Momentum. A contagem regressiva começa imediatamente.')], after: [c('Attacking with a Primary skill grants 4 seconds of Momentum, up to 20 seconds. The countdown now waits 5 seconds after each application. Your Primary skills still deal 10% increased damage per second of Momentum.', 'Atacar com uma habilidade primária concede 4 segundos de Momentum, até 20 segundos. Agora a contagem regressiva aguarda 5 segundos após cada aplicação. Suas habilidades primárias continuam causando 10% de dano adicional por segundo de Momentum.')] },
    ] },
    { name: c('Witch Doctor', 'Feiticeiro'), items: [
      { id: 'cluckeye', name: 'Cluckeye', before: [c('25–50% chance to cluck when attacking.', '25–50% de chance de cacarejar ao atacar.')], after: [c('Angry Chicken turns your pets into exploding chickens. Chickens deal 150–200% increased damage, and Angry Chicken deals 50% more damage per exploded chicken.', 'Angry Chicken transforma seus lacaios em galinhas explosivas. As galinhas causam 150–200% de dano adicional, e Angry Chicken causa 50% a mais de dano por galinha explodida.')] },
      { id: 'manajuma', name: 'Manajuma’s Way', set: true, before: [
        c('Angry Chicken explosion damage is increased by 2000%, and slain enemies trigger an additional explosion.', 'O dano da explosão de Angry Chicken aumenta em 2000%, e inimigos mortos provocam uma explosão adicional.'),
        c('Angry Chicken lasts 15 seconds and grants an additional 100% movement speed.', 'Angry Chicken dura 15 segundos e concede 100% de velocidade de movimento adicional.'),
        c('While in chicken form, spawn one chicken every second that seeks enemies and deals 25% of your Angry Chicken explosion damage.', 'Na forma de galinha, gere uma galinha por segundo que persegue inimigos e causa 25% do dano da explosão de Angry Chicken.'),
      ], after: [
        c('Angry Chicken explosion damage remains increased by 2000%, and slain enemies still trigger an additional explosion.', 'O dano da explosão de Angry Chicken continua aumentado em 2000%, e inimigos mortos ainda provocam uma explosão adicional.'),
        c('Angry Chicken lasts 15 seconds and grants an additional 100% movement speed, plus 75% damage reduction during the form and for 5 seconds afterward.', 'Angry Chicken dura 15 segundos e concede 100% de velocidade de movimento adicional, além de 75% de redução de dano durante a forma e por mais 5 segundos após seu término.'),
        c('While in chicken form, spawn one chicken every half second that seeks enemies and deals 100% of your Angry Chicken explosion damage.', 'Na forma de galinha, gere uma galinha a cada meio segundo que persegue inimigos e causa 100% do dano da explosão de Angry Chicken.'),
      ] },
    ] },
  ];

  return <div className="item-balance">
    <p className="item-balance-intro">{c('More time to build Momentum, stronger shields and a flock of exploding chickens. We brought these selected item and set changes from patch 2.7.6 to RuinWatch to make more builds fun to play.', 'Mais tempo para acumular Momentum, escudos mais fortes e um bando de galinhas explosivas. Trouxemos estas mudanças selecionadas de itens e conjuntos do patch 2.7.6 para o RuinWatch, para deixar mais builds divertidas de jogar.')}</p>
    <p className="item-balance-scope">{c('Selected balance changes on our 2.7.5 base — not a full upgrade to patch 2.7.6.', 'Mudanças selecionadas de balanceamento na nossa base 2.7.5 — não uma atualização completa para o patch 2.7.6.')}</p>
    {groups.map(group => <section className="item-balance-class" key={group.name} aria-label={group.name}>
      <h3>{group.name}</h3>
      {group.items.map(item => <article className="item-balance-item" key={item.name}>
        {item.set && <h4 className="item-balance-set">{item.name}</h4>}
        <div className="item-balance-art" role="group" aria-label={item.name}>
          {itemSlugs[item.id].map(slug => {
            const piece = catalog.find(entry => entry.slug === slug);
            return piece ? (item.set
              ? <BalanceArt key={slug} item={piece} change={item} showName={false} />
              : <h4 key={slug}><BalanceArt item={piece} change={item} showName /></h4>) : null;
          })}
          {!catalog.length && <p role="status">{isError ? c('Item previews are unavailable. Please reload to try again.', 'As prévias dos itens estão indisponíveis. Recarregue para tentar novamente.') : c('Loading item previews…', 'Carregando prévias dos itens…')}</p>}
        </div>
        <div className="item-balance-before"><h5>{c('Before', 'Antes')}</h5><ul>{item.before.map(text => <li key={text}>{text}</li>)}</ul></div>
        <div className="item-balance-after"><h5>{c('Now on RuinWatch', 'Agora no RuinWatch')}</h5><ul>{item.after.map(text => <li key={text}>{text}</li>)}</ul></div>
      </article>)}
    </section>)}
    <p className="item-balance-source">{c('Patch reference:', 'Referência do patch:')} <a href="https://maxroll.gg/d3/news/season-29-patch-2-7-6-ptr" target="_blank" rel="noopener noreferrer">Maxroll · 2.7.6 PTR</a><span aria-hidden="true"> · </span><a href="https://news.blizzard.com/en-us/article/23987087/diablo-iii-ptr-2-7-6-has-concluded" target="_blank" rel="noopener noreferrer">{c('Blizzard patch notes', 'Notas do patch da Blizzard')}</a></p>
  </div>;
}
