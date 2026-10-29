/** Export only public gameplay policy. Never copy a server/launcher config wholesale.
 * Usage: npm run sync:rates -- --config <config.mods.json>
 * Source paths stay local; the generated snapshot contains no deployment metadata.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const option = name => args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
const configPath = option('--config');
if (!configPath) throw new Error('Pass --config with the local server configuration path.');
const readJson = async path => JSON.parse((await readFile(path, 'utf8')).replace(/^\uFEFF/, ''));
const config = await readJson(configPath);
const pick = (object, keys) => Object.fromEntries(keys.split(' ').map(key => {
  if (object?.[key] === undefined) throw new Error(`Missing public gameplay field: ${key}`);
  return [key, object[key]];
}));
const snapshot = {
  updated: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()),
  benefits: pick(config.PlayerBenefits, 'BloodShardCapacity ExperienceMultiplier PlatinumMultiplier'),
  inventory: pick(config.InventoryTools, 'Enabled SalvageNormal SalvageMagic SalvageRare SalvageLegendary StashGems IncludeUnidentifiedLegendary AutoSalvage LootFilter AutoIdentify BulkPickup BulkGemUpgrade'),
  auction: { ...pick(config.AuctionHouse, 'FeePercent MaxActiveListings'), minimumPrice: config.AuctionHouse.MinimumPricePlatinumCoin },
  rates: pick(config.Rate, 'Experience Gold Drop'),
  ancient: pick(config.Items.Loot.Ancient, 'Enabled AncientChance PrimalChance RequireGR70ForPrimal'),
  difficulty: pick(config.Items.Loot.Difficulty, 'UseOverrides Tiers'),
  extendedDifficulty: config.AdventureDifficulty.Tiers,
  cow: pick(config.CowLevel, 'Enabled AncientBardicheForcesAncientLegendaries PrimalBardicheForcesAncientLegendaries ExtraTormentStepMultiplier Torment20Multiplier Equipment Materials Gems Gold ExperienceMultiplier'),
  visions: pick(config.Visions, 'Enabled SeasonalOnly PortalChancePerKill NextFloorChancePerKill MinFloors MaxFloors MonstersPerFloor ChampionFloorChance GuardianFloorChance MaterialFloorChance GoblinFloorChance SingleGoblinChance AffixChance HealthGrowthPerFloor DamageGrowthPerFloor CloseSeconds BountyMaterialsPerAct ChampionBreaths GuardianKeys ChestItems ChestLegendaryChance'),
  whimsydale: pick(config.Whimsydale, 'Enabled RainbowChancePerGoblin PrincessLilianChance SpectrumChancePerUnique HamburgerChancePerCache Monsters Uniques HappyClouds Pinatas CacheLegendaries CacheGems CacheMaterials CacheGold'),
  whimsyshire: pick(config.Whimsyshire, 'Enabled SirWilliamChance IzualPlanChance ChiltaraGemstoneChance'),
  crimson: { ...pick(config.CrimsonHarvest, 'Enabled MinimumLevel MainDurationSeconds UnlimitedCombatResources WalkThroughMonstersDuringChoice RiftGuardianDropChance GreaterRiftGuardianDropChance'), rewards: pick(config.CrimsonHarvest.Rewards, 'MinimumKills PlatinumPerKill MaximumKillPlatinum KingPlatinumBonus PerEndlessMinute PerHuntKill MaximumHuntKills MaximumPerRun') },
  globalBoss: { ...pick(config.GlobalBoss, 'SessionCapacity PartyCapacity'), scheduled: config.GlobalBoss.Schedule.some(event => event.Enabled) },
  vault: pick(config.Vault, 'Enabled AncientPuzzleRingForcesAncientLegendaries CloseSeconds GoldMultiplier EquipmentMultiplier GemMultiplier MaterialMultiplier ChestMinimumLegendaries MaxBossGoblins'),
  goblins: pick(config.Vault.GoblinLoot, 'ExtraTormentStepMultiplier Torment20Multiplier CollectorMaterials CollectorSouls CollectorPlans HoarderGems BaronGold TormentorLegendaries CommonLegendaries CommonRares CommonGold CommonGems CommonMaterials BloodThiefShards SireLegendaries SireDeathBreaths SireKeys SireGems SireMaterials SireShards SireGold'),
  infernal: pick(config.InfernalMachines, 'Enabled CountdownSeconds EquipmentPerArena MachinesByTorment OrgansByTorment'),
  nightmare: pick(config.EchoingNightmare, 'Enabled PetrifiedScreamDropChancePercent ProtectHardcoreHeroes CountdownSeconds IntroSeconds RewardTierCap WhisperRankCap'),
  rifts: pick(config.NephalemRift, 'ProgressMultiplier MaxFloors CloseCountdownSeconds'),
  greaterRifts: pick(config.GreaterRift, 'Enabled TimerSeconds EmpoweredBonusJewelUpgrades AllowTownPortal DeathPenaltyEnabled'),
  artisans: { kadala: config.Kadala.LegendaryChanceMultiplier, cube: config.KanaiCube.BonusMultiplier, salvage: config.Salvage.Multiplier, enchantChoices: config.Items.Mystic.EnchantAffixChoiceCount, sockets: config.Items.SocketCaps },
  health: pick(config.Health, 'PotionRestorePercentage PotionCooldown ResurrectionCharges'),
  anniversaryEvent: config.DarkeningOfTristram.Enabled,
  party: { campaign: config.CampaignMode.MaxPerSession, adventure: config.AdventureMode.MaxPerSession },
};
// Public rates must remain finite and non-negative; do not silently publish malformed configuration.
function validate(value) {
  if (typeof value === 'number' && (!Number.isFinite(value) || value < 0)) throw new Error('Invalid public gameplay rate.');
  if (value && typeof value === 'object') Object.values(value).forEach(validate);
}
validate(snapshot);
const output = new URL('../src/data/server-rates.json', import.meta.url);
await mkdir(fileURLToPath(new URL('../src/data/', import.meta.url)), { recursive: true });
await writeFile(output, JSON.stringify(snapshot, null, 2) + '\n');
console.log('Updated public gameplay snapshot: src/data/server-rates.json');
