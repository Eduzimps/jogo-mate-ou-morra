export const planes = [
  "P-41 Sentinel",
  "F6 Corsair",
  "Hawk MK.II",
  "Viper A-7",
  "Tempest",
  "Iron Falcon",
  "Spectre",
  "Thunderbolt",
  "Crimson Ace",
  "Valkyrie",
  "Night Raven",
  "Archangel",
].map((name, i) => ({
  id: i,
  name,
  tier: 1 + Math.floor(i / 3),
  color: ["#d8e2ca", "#67b7ba", "#db985c", "#b5a5d3"][Math.floor(i / 3)],
  hp: 100 + i * 12,
  damage: 12 + i * 2,
  speed: 310 + i * 8,
  rate: 210 - i * 6,
  price: i === 0 ? 0 : 700 + i * i * 140,
  weapon: ["Canhões duplos", "Dispersão", "Mísseis"][i % 3],
}));
export const wingmen = [
  "Wasp · interceptador",
  "Kite · dispersão",
  "Ghost · laser",
  "Lynx · mísseis",
];
export const devices = ["Bomba", "Escudo", "Laser", "Mísseis", "Reparação"];
export const environments = [
  "Mar de Coral",
  "Floresta de Ferro",
  "Dunas de Fogo",
  "Fronteira Polar",
  "Cidade em Cinzas",
  "Fortaleza Celeste",
];
export const stages = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  name: [
    "Operação Aurora",
    "Arquipélago Hostil",
    "Asas de Aço",
    "Linha de Fogo",
    "Comboio Fantasma",
    "Céu Partido",
  ][i % 6],
  environment: i % 6,
  duration: 48 + Math.min(i, 12) * 2,
  reward: 350 + i * 90,
  boss: i % 3,
  difficulty: 1 + i * 0.12,
}));
export const enemyTypes = [
  "Scout",
  "Dart",
  "Armor",
  "Bomber",
  "Helicopter",
  "Drone",
  "Turret",
  "Ship",
  "Tank",
  "Fan",
  "Hunter",
  "Elite",
];
export type Save = {
  version: 1;
  coins: number;
  gems: number;
  selected: number;
  owned: number[];
  levels: Record<number, number>;
  stats: Record<string, number>;
  stars: Record<number, number>;
  unlocked: number;
  wing: number;
  wingLevel: number;
  wingLevels: Record<number, number>;
  deviceLevels: number[];
  equipped: number[];
  difficulty: string;
  volume: number;
  daily: string;
  claimed: string[];
};
export const fresh = (): Save => ({
  version: 1,
  coins: 1200,
  gems: 0,
  selected: 0,
  owned: [0],
  levels: { 0: 1 },
  stats: { kills: 0, wins: 0, bosses: 0, earned: 0, upgrades: 0, perfect: 0 },
  stars: {},
  unlocked: 0,
  wing: 0,
  wingLevel: 1,
  wingLevels: { 0: 1, 1: 1, 2: 1, 3: 1 },
  deviceLevels: [1, 1, 1, 1, 1],
  equipped: [0, 1, 2],
  difficulty: "Normal",
  volume: 0.35,
  daily: "",
  claimed: [],
});
export function load(raw: string | null): Save {
  try {
    const s = JSON.parse(raw || "null");
    if (s?.version !== 1) return fresh();
    const f = fresh();
    return {
      ...f,
      ...s,
      stats: { ...f.stats, ...s.stats },
      wingLevels: { ...f.wingLevels, ...s.wingLevels },
      selected: planes[s.selected] ? s.selected : 0,
      coins: Math.max(0, Number(s.coins) || 0),
    };
  } catch {
    return fresh();
  }
}
export const upgradeCost = (s: Save) =>
  Math.round(180 * Math.pow(s.levels[s.selected] || 1, 1.55));
export function upgrade(s: Save) {
  const cost = upgradeCost(s);
  if (s.coins < cost) return false;
  s.coins -= cost;
  s.levels[s.selected] = (s.levels[s.selected] || 1) + 1;
  s.stats.upgrades++;
  return true;
}
export function purchase(s: Save, id: number) {
  const p = planes[id];
  if (
    !p ||
    s.owned.includes(id) ||
    s.coins < p.price ||
    p.tier > 1 + Math.floor(s.unlocked / 4)
  )
    return false;
  s.coins -= p.price;
  s.owned.push(id);
  s.levels[id] = 1;
  return true;
}
export function reward(s: Save, id: number, stars: number, coins: number) {
  s.coins += coins;
  s.stats.earned += coins;
  s.stats.wins++;
  s.stars[id] = Math.max(s.stars[id] || 0, stars);
  s.unlocked = Math.max(s.unlocked, Math.min(29, id + 1));
}
export const power = (s: Save, id = s.selected) =>
  Math.round(
    (planes[id].damage * 10 + planes[id].hp) *
      (1 + ((s.levels[id] || 1) - 1) * 0.16),
  );
