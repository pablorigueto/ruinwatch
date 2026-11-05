// RuinWatch's selected 2.7.6 backports on existing 2.7.5 item identities.
// Apply after native data extraction; do not remap to later-patch item IDs.
const akkhan = 'Each enemy hit by your Blessed Shield increases the damage of your Blessed Shield by %d%% for 6 seconds. Stacks up to 100 times. All stacks refresh together.';
const vigilante = 'While Steed Charge is active, Fist of the Heavens deals increased damage equal to your movement speed, and is automatically called down on a random nearby enemy at an interval based on your attack speed if it is on your action bar.';
const cluckeye = 'Angry Chicken turns all your pets into exploding chickens. Chickens deal %d%% increased damage, and Angry Chicken deals 50%% more damage per exploded chicken.';
const powers = {
  P4_flail2H_norm_unique_01: { id: 'leg_akkhansleniency', name: 'Blessed Shield Damage Bonus', format: akkhan, min: 15, max: 20, klass: 'crusader' },
  P65_flail2H_norm_unique_01: { id: 'leg_akkhansleniency', name: 'Blessed Shield Damage Bonus', format: akkhan, min: 35, max: 40, klass: 'crusader' },
  Unique_Bow_015_x1: { id: 'leg_cluckeye', name: 'Exploding Chicken Damage', format: cluckeye, min: 150, max: 200, klass: 'witchdoctor' },
  Unique_Belt_002_x1: { id: 'leg_vigilantebelt', name: 'Mounted Fist of the Heavens', format: vigilante, args: 0, klass: 'crusader' },
};
const sets = {
  dreadlands: { name: 'Gears of Dreadlands', texts: [
    'Gain 4 seconds of Momentum when attacking with a Primary skill, at a maximum duration of 20 seconds. This duration begins counting down after a delay of 5 seconds after each application. Your Primary skills deal 10% increased damage per second of Momentum.',
  ] },
  manajuma: { name: "Manajuma's Way", texts: [
    'Your Hex - Angry Chicken explosion damage is increased by 2000% and slain enemies trigger an additional explosion.',
    'Your Hex - Angry Chicken lasts 15 seconds and movement speed as a chicken is increased by an additional 100%. Gain 75% damage reduction while a chicken and for 5 seconds after.',
    'While you are an angry chicken, you spawn a chicken every half second that seeks enemies and deals 100% of your Angry Chicken explosion damage.',
  ] },
};

export function applyPlannerBackports(planner) {
  for (const item of planner.items) {
    const power = powers[item.id];
    if (!power) continue;
    const { klass, ...custom } = power;
    item.required = { ...item.required, custom };
    planner.powerClasses[custom.id] = klass;
  }
  for (const [id, { texts }] of Object.entries(sets)) {
    if (planner.sets[id]) planner.sets[id].bonuses['2'] = texts.map(text => ({ format: text.replaceAll('%', '%%') }));
  }
  return planner;
}

export function applyCodexBackports(items) {
  for (const item of items) {
    const id = item.slug.slice(item.slug.lastIndexOf('-') + 1);
    const power = powers[id];
    if (power) {
      const range = `<span class="d3-color-magic">[${power.min} - ${power.max}]</span>`;
      const text = power.format.replace('%d', range).replaceAll('%%', '%');
      const klass = power.klass === 'crusader' ? 'Crusader' : 'Witch Doctor';
      const line = `<span class="d3-color-ffff8000">${text}</span> <span class="d3-color-ffff0000">(${klass} Only)</span>`;
      const index = item.secondary.findIndex(x => x.includes('d3-color-ffff8000'));
      if (index >= 0) item.secondary[index] = line;
      else item.secondary.unshift(line);
    }
    const set = Object.values(sets).find(s => s.name === item.item_set?.name);
    if (set) {
      const index = item.item_set.bonuses.findIndex(x => /^\(2\) Set:/.test(x));
      if (index >= 0) item.item_set.bonuses[index] = '(2) Set: <br/> ' + set.texts.map(text => `<span class="tooltip-icon-bullet"></span> ${text}`).join('<br/> ');
    }
  }
  return items;
}
