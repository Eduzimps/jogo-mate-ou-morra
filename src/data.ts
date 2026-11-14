import {
  freshArsenal,
  migrateArsenal,
  defaultLoadout,
  getWeapon,
  categoryForSlot,
  type LoadoutSlot,
  type ArsenalState,
} from "./arsenal";
import { brazilRegionForStage, brazilRegions } from "./world/brazilRegions";
import { planes } from "./catalog";
export { planes, wingmen } from "./catalog";
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
  name:
    i === 0
      ? "Operação Guanabara"
      : brazilRegionForStage(i)
        ? brazilRegions[brazilRegionForStage(i)!].mission
        : [
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
export const stageRegion = (id: number) =>
  id === 0
    ? "Rio de Janeiro · Brasil"
    : brazilRegionForStage(id)
      ? brazilRegions[brazilRegionForStage(id)!].label
      : environments[stages[id].environment];
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
export type Save = ArsenalState & {
  version: 3;
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
  favorites: number[];
  reducedEffects: boolean;
  screenShake: boolean;
  largeHud: boolean;
  touchOffset: number;
  sensitivity: number;
  musicVolume: number;
  effectsVolume: number;
  uiVolume: number;
  quality: "low" | "medium" | "high";
};
export const fresh = (): Save => ({
  version: 3,
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
  favorites: [],
  reducedEffects: false,
  screenShake: true,
  largeHud: false,
  touchOffset: 75,
  sensitivity: 1,
  musicVolume: 0.6,
  effectsVolume: 0.75,
  uiVolume: 0.6,
  quality: "medium",
  ...freshArsenal(),
});
/** Strict migration: invalid data throws, so callers never overwrite an unreadable save. */
export function load(raw: string | null): Save {
  if (raw === null) return fresh();
  let s: Record<string, unknown>;
  try {
    s = JSON.parse(raw);
  } catch {
    throw new Error("O arquivo não contém JSON válido.");
  }
  if (
    !s ||
    typeof s !== "object" ||
    Array.isArray(s) ||
    ![1, 2, 3].includes(s.version as number)
  )
    throw new Error("Versão de progresso não reconhecida.");
  const f = fresh();
  for (const key of Object.keys(f))
    if (s[key] === null) throw new Error("Campo nulo inválido: " + key);
  const num = (
    v: unknown,
    name: string,
    min = 0,
    max = Number.MAX_SAFE_INTEGER,
    integer = true,
  ) => {
    if (
      typeof v !== "number" ||
      !Number.isFinite(v) ||
      v < min ||
      v > max ||
      (integer && !Number.isInteger(v))
    )
      throw new Error("Valor inválido: " + name);
    return v;
  };
  const array = (v: unknown, name: string, max: number) => {
    if (!Array.isArray(v) || new Set(v).size !== v.length)
      throw new Error("Lista inválida: " + name);
    return v.map((n) => num(n, name, 0, max));
  };
  const map = (
    v: unknown,
    name: string,
    idMax: number,
    valueMax = 1000000,
    min = 0,
  ) => {
    if (!v || typeof v !== "object" || Array.isArray(v))
      throw new Error("Mapa inválido: " + name);
    const out: Record<number, number> = {};
    for (const [k, x] of Object.entries(v)) {
      if (!/^\d+$/.test(k)) throw new Error("Identificador inválido: " + name);
      num(Number(k), name, 0, idMax);
      out[Number(k)] = num(x, name, min, valueMax);
    }
    return out;
  };
  const owned = array(s.owned, "aeronaves", planes.length - 1);
  const selected = num(s.selected, "seleção", 0, planes.length - 1);
  if (!owned.includes(selected) || !owned.includes(0))
    throw new Error("A aeronave selecionada não está no inventário.");
  const levels = map(s.levels, "níveis", planes.length - 1, 100000, 1);
  for (const id of owned) levels[id] ??= 1;
  const wing = num(s.wing ?? 0, "companheiro", 0, 3);
  const wingLevel = num(s.wingLevel ?? 1, "nível de companheiro", 1, 100000);
  const wingLevels = s.wingLevels
    ? map(s.wingLevels, "companheiros", 3, 100000, 1)
    : { [wing]: wingLevel };
  const dl = s.deviceLevels ?? f.deviceLevels;
  if (!Array.isArray(dl) || dl.length !== 5)
    throw new Error("Níveis de dispositivos inválidos.");
  const deviceLevels = dl.map((v) => num(v, "nível de dispositivo", 1, 100000));
  const equipped = array(s.equipped ?? f.equipped, "equipamento", 4);
  if (equipped.length > 3) throw new Error("Máximo de três dispositivos.");
  const stats = { ...f.stats };
  if (s.stats !== undefined) {
    if (!s.stats || typeof s.stats !== "object" || Array.isArray(s.stats))
      throw new Error("Estatísticas inválidas.");
    for (const [k, v] of Object.entries(s.stats))
      stats[k] = num(v, "estatística", 0, Number.MAX_SAFE_INTEGER, false);
  }
  if (
    !["Fácil", "Normal", "Difícil"].includes(
      String(s.difficulty ?? f.difficulty),
    )
  )
    throw new Error("Dificuldade inválida.");
  const claimed = s.claimed ?? [];
  if (
    !Array.isArray(claimed) ||
    claimed.some((v) => typeof v !== "string" || v.length > 80)
  )
    throw new Error("Conquistas inválidas.");
  for (const key of ["reducedEffects", "screenShake", "largeHud"])
    if (s[key] !== undefined && typeof s[key] !== "boolean")
      throw new Error("Configuração inválida.");
  if (s.daily !== undefined && typeof s.daily !== "string")
    throw new Error("Data inválida.");
  return {
    ...f,
    version: 3,
    coins: num(s.coins, "moedas"),
    gems: num(s.gems ?? 0, "gemas"),
    selected,
    owned,
    levels,
    stats,
    stars: map(s.stars ?? {}, "estrelas", 29, 3),
    unlocked: num(s.unlocked ?? 0, "missão", 0, 29),
    wing,
    wingLevel,
    wingLevels: { ...f.wingLevels, ...wingLevels },
    deviceLevels,
    equipped,
    difficulty: String(s.difficulty ?? f.difficulty),
    volume: num(s.volume ?? f.volume, "volume", 0, 1, false),
    daily: String(s.daily ?? ""),
    claimed: [...new Set(claimed)] as string[],
    favorites: array(s.favorites ?? [], "favoritos", planes.length - 1),
    reducedEffects: (s.reducedEffects ?? false) as boolean,
    screenShake: (s.screenShake ?? true) as boolean,
    largeHud: (s.largeHud ?? false) as boolean,
    touchOffset: num(s.touchOffset ?? 75, "deslocamento", 0, 140),
    sensitivity: num(s.sensitivity ?? 1, "sensibilidade", 0.5, 2, false),
    musicVolume: num(s.musicVolume ?? 0.6, "música", 0, 1, false),
    effectsVolume: num(s.effectsVolume ?? 0.75, "efeitos", 0, 1, false),
    uiVolume: num(s.uiVolume ?? 0.6, "interface", 0, 1, false),
    quality: validateQuality(s.quality),
    ...migrateArsenal(s, owned),
  };
}
function validateQuality(value: unknown): Save["quality"] {
  if (value === undefined) return "medium";
  if (typeof value !== "string" || !["low", "medium", "high"].includes(value))
    throw new Error("Qualidade inválida.");
  return value as Save["quality"];
}
export const upgradeCost = (s: Save, id = s.selected) =>
  Math.round(180 * Math.pow(s.levels[id] || 1, 1.55));
export function upgrade(s: Save, id = s.selected) {
  if (!s.owned.includes(id) || (s.levels[id] || 1) >= 100000) return false;
  const cost = upgradeCost(s, id);
  if (s.coins < cost) return false;
  s.coins -= cost;
  s.levels[id] = (s.levels[id] || 1) + 1;
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
  // Valid imported inventories can contain a smaller set than the original
  // starter package. Never equip unowned defaults or grant equipment for free.
  const loadout = defaultLoadout(id);
  const previous = s.loadouts[s.selected];
  const slots: LoadoutSlot[] = [
    "primary",
    "left",
    "right",
    "special",
    "tactical",
  ];
  for (const slot of slots) {
    const defaultWeapon = loadout[slot];
    if (defaultWeapon === null || s.weaponOwned.includes(defaultWeapon))
      continue;
    const fallback = previous?.[slot];
    if ((slot === "left" || slot === "right") && fallback === null) {
      loadout[slot] = null;
      continue;
    }
    if (
      typeof fallback !== "string" ||
      !s.weaponOwned.includes(fallback) ||
      getWeapon(fallback)?.category !== categoryForSlot(slot)
    )
      return false;
    loadout[slot] = fallback;
  }
  s.coins -= p.price;
  s.owned.push(id);
  s.levels[id] = 1;
  s.loadouts[id] = loadout;
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
