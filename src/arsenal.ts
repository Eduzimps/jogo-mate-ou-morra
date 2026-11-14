import { planes } from "./catalog";

export type WeaponCategory = "primary" | "secondary" | "special" | "tactical";
export type LoadoutSlot = "primary" | "left" | "right" | "special" | "tactical";
export type Weapon = {
  id: string;
  name: string;
  category: WeaponCategory;
  description: string;
  price: number;
  /** Damage per projectile or beam pulse; interval is milliseconds. */
  baseDamage: number;
  interval: number;
  count: number;
  spread: number;
  speed: number;
  color: number;
  sound: string;
  homing?: boolean;
  pierce?: number;
  blastRadius?: number;
  chain?: number;
  continuous?: boolean;
  /** Durations and cooldowns are seconds. */
  duration?: number;
  cooldown?: number;
  strength?: number;
};
export type Loadout = {
  primary: string;
  left: string | null;
  right: string | null;
  special: string;
  tactical: string;
};
export type ArsenalState = {
  weaponOwned: string[];
  weaponLevels: Record<string, number>;
  loadouts: Record<number, Loadout>;
};
export type ArsenalSave = ArsenalState & {
  coins: number;
  owned: number[];
  selected: number;
};

const weapon = (
  id: string,
  name: string,
  category: WeaponCategory,
  description: string,
  price: number,
  baseDamage: number,
  interval: number,
  count: number,
  color: number,
  extra: Partial<Weapon> = {},
): Weapon => ({
  id,
  name,
  category,
  description,
  price,
  baseDamage,
  interval,
  count,
  color,
  spread: 0,
  speed: 760,
  sound:
    category === "primary"
      ? "gun"
      : category === "secondary"
        ? "missile"
        : category,
  ...extra,
});

/** All entries have a combat implementation; no locked future-content cards. */
export const weapons: Weapon[] = [
  weapon(
    "single",
    "Metralhadora simples",
    "primary",
    "Linha precisa de tiro rápido. Uma escolha leve para acertar o alvo à distância.",
    0,
    17,
    180,
    1,
    0xffedac,
  ),
  weapon(
    "dual",
    "Metralhadora dupla",
    "primary",
    "Duas linhas paralelas concentram o ataque frontal sem dificultar a esquiva.",
    240,
    12,
    210,
    2,
    0xffe794,
  ),
  weapon(
    "triple",
    "Canhão triplo",
    "primary",
    "Três canhões frontais combinam cobertura e pressão sobre alvos grandes.",
    450,
    12,
    280,
    3,
    0xffcc75,
    { spread: 0.045, sound: "cannon" },
  ),
  weapon(
    "minigun",
    "Minigun",
    "primary",
    "Rotação acelerada e disparo contínuo de pequenos projéteis. Níveis maiores aumentam a cadência.",
    650,
    8,
    62,
    1,
    0xffd65c,
    { spread: 0.025, sound: "minigun" },
  ),
  weapon(
    "shotgun",
    "Shotgun aérea",
    "primary",
    "Cinco projéteis em leque. A cobertura cresce nos níveis 3 e 5; dano máximo exige proximidade.",
    520,
    10,
    410,
    5,
    0xffb862,
    { spread: 0.13, sound: "cannon" },
  ),
  weapon(
    "heavy",
    "Canhão pesado",
    "primary",
    "Projétil lento, pesado e perfurante: menos disparos, mais dano em cada acerto.",
    700,
    63,
    540,
    1,
    0xffa36a,
    { speed: 570, pierce: 2, sound: "cannon" },
  ),
  weapon(
    "laser",
    "Laser concentrado",
    "primary",
    "Feixe frontal contínuo. Mantê-lo alinhado ao alvo aplica dano a cada pulso.",
    900,
    13,
    85,
    1,
    0x8ceafa,
    { continuous: true, speed: 1500, pierce: 8, sound: "laser" },
  ),
  weapon(
    "plasma",
    "Canhão de plasma",
    "primary",
    "Orbes energéticos explodem no impacto e atingem inimigos próximos.",
    1000,
    37,
    340,
    1,
    0xc39cff,
    { blastRadius: 58, speed: 590, sound: "plasma" },
  ),
  weapon(
    "electric",
    "Raio elétrico",
    "primary",
    "Descargas saltam do primeiro alvo para até dois adversários próximos.",
    1100,
    28,
    310,
    1,
    0x91d9ff,
    { chain: 3, speed: 1000, sound: "electric" },
  ),
  weapon(
    "quantum",
    "Canhão quântico",
    "primary",
    "Um núcleo de energia atravessa vários alvos com dano elevado e disparo controlado.",
    1600,
    77,
    610,
    1,
    0xf7a0ef,
    { pierce: 5, blastRadius: 35, speed: 680, sound: "plasma" },
  ),

  weapon(
    "rockets",
    "Foguetes múltiplos",
    "secondary",
    "Dois foguetes em trajetória frontal por montagem de asa.",
    280,
    32,
    2100,
    2,
    0xffc37d,
    { spread: 0.055, speed: 510 },
  ),
  weapon(
    "homing",
    "Mísseis teleguiados",
    "secondary",
    "Mísseis ajustam a trajetória em direção aos inimigos ativos.",
    420,
    48,
    2600,
    1,
    0xa3edee,
    { homing: true, speed: 430 },
  ),
  weapon(
    "bombs",
    "Bombas de asa",
    "secondary",
    "Cargas de movimento lento detonam em área ao alcançar um alvo.",
    500,
    68,
    2900,
    1,
    0xffc384,
    { blastRadius: 95, speed: 290, sound: "bomb" },
  ),
  weapon(
    "pods",
    "Pods de metralhadora",
    "secondary",
    "Rajadas curtas reforçam a linha de tiro lateral do avião.",
    350,
    7,
    520,
    3,
    0xffeca4,
    { spread: 0.035, speed: 750, sound: "gun" },
  ),
  weapon(
    "side-plasma",
    "Plasma lateral",
    "secondary",
    "Orbes lançados pelas asas explodem com um raio de impacto compacto.",
    620,
    31,
    1700,
    2,
    0xc8a1ff,
    { blastRadius: 48, spread: 0.07, speed: 540, sound: "plasma" },
  ),
  weapon(
    "discharger",
    "Dispersor elétrico",
    "secondary",
    "Descarga auxiliar encadeia dano entre três inimigos próximos.",
    700,
    25,
    1900,
    1,
    0x85e1ff,
    { chain: 3, speed: 850, sound: "electric" },
  ),
  weapon(
    "drones",
    "Drones ofensivos",
    "secondary",
    "Pequenos interceptadores energéticos procuram alvos e reforçam os flancos.",
    850,
    25,
    1650,
    2,
    0x91f2ca,
    { homing: true, spread: 0.13, speed: 370, sound: "drone" },
  ),

  weapon(
    "bomb",
    "Bomba explosiva",
    "special",
    "Limpa projéteis comuns e causa uma grande explosão contra todos os inimigos visíveis.",
    380,
    360,
    1000,
    1,
    0xffce86,
    { cooldown: 20, duration: 0.7, blastRadius: 600, sound: "bomb" },
  ),
  weapon(
    "emp",
    "EMP",
    "special",
    "Pulso eletromagnético limpa tiros e interrompe temporariamente as armas inimigas.",
    750,
    110,
    1000,
    1,
    0x94e8ff,
    { cooldown: 23, duration: 3, strength: 1, sound: "electric" },
  ),
  weapon(
    "shockwave",
    "Onda de choque",
    "special",
    "Uma onda expansiva atravessa o campo, remove projéteis e danifica inimigos.",
    680,
    240,
    1000,
    1,
    0xa9e8db,
    { cooldown: 18, duration: 1.1, blastRadius: 600, sound: "bomb" },
  ),
  weapon(
    "orbital",
    "Ataque orbital",
    "special",
    "Golpes de energia atingem a posição dos alvos durante uma curta janela de ataque.",
    1100,
    105,
    380,
    1,
    0xffd28e,
    { cooldown: 25, duration: 3, blastRadius: 85, sound: "plasma" },
  ),
  weapon(
    "omega",
    "Destruidor Ômega",
    "special",
    "Explosão de energia de grande alcance, seguida por pulsos contra os sobreviventes.",
    1800,
    520,
    600,
    1,
    0xf7a0e2,
    { cooldown: 30, duration: 1.8, blastRadius: 600, sound: "plasma" },
  ),
  weapon(
    "green-storm",
    "Tempestade Verde",
    "special",
    "Rajadas verdes e amarelas durante dois segundos, finalizadas por dois mísseis guiados.",
    650,
    12,
    65,
    5,
    0xa4ff6c,
    { cooldown: 16, duration: 2, spread: 0.09, speed: 800, sound: "green" },
  ),
  weapon(
    "barrage",
    "Barragem de mísseis",
    "special",
    "Uma salva de mísseis guiados busca adversários em diferentes posições.",
    700,
    62,
    100,
    12,
    0x9eeaf5,
    { cooldown: 19, duration: 1.2, homing: true, speed: 440 },
  ),
  weapon(
    "superlaser",
    "Super laser",
    "special",
    "Feixe de alta potência causa dano contínuo enquanto o jogador alinha a aeronave.",
    850,
    28,
    100,
    1,
    0xa3f8ff,
    {
      cooldown: 24,
      duration: 3,
      continuous: true,
      pierce: 12,
      speed: 1700,
      sound: "laser",
    },
  ),

  weapon(
    "shield",
    "Escudo",
    "tactical",
    "Proteção temporária de energia bloqueia dano recebido.",
    250,
    0,
    1000,
    0,
    0x86ddff,
    { cooldown: 22, duration: 5, strength: 1, sound: "shield" },
  ),
  weapon(
    "repair",
    "Reparação",
    "tactical",
    "Recupera uma parte da vida máxima sem ultrapassar o limite da aeronave.",
    300,
    0,
    1000,
    0,
    0x8df0a7,
    { cooldown: 26, duration: 0.8, strength: 0.28, sound: "repair" },
  ),
  weapon(
    "turbo",
    "Turbo",
    "tactical",
    "Aumenta a velocidade e a resposta de movimento durante alguns segundos.",
    420,
    0,
    1000,
    0,
    0xffda8f,
    { cooldown: 18, duration: 5, strength: 1.45, sound: "turbo" },
  ),
  weapon(
    "reflector",
    "Refletor de tiros",
    "tactical",
    "Converte projéteis que atingem a barreira em disparos aliados.",
    850,
    20,
    1000,
    1,
    0xd8aaff,
    { cooldown: 25, duration: 4, strength: 1, sound: "shield" },
  ),
  weapon(
    "barrier",
    "Barreira",
    "tactical",
    "Uma barreira ampla neutraliza projéteis que se aproximam da aeronave.",
    650,
    0,
    1000,
    0,
    0x7be9dc,
    { cooldown: 23, duration: 4.5, strength: 80, sound: "shield" },
  ),
  weapon(
    "slowfield",
    "Campo de desaceleração",
    "tactical",
    "Reduz a velocidade dos tiros e aeronaves inimigas dentro do campo de combate.",
    800,
    0,
    1000,
    0,
    0x9fb6ff,
    { cooldown: 24, duration: 5, strength: 0.5, sound: "electric" },
  ),
];

const byId = new Map(weapons.map((entry) => [entry.id, entry]));
export const getWeapon = (id: string): Weapon | undefined => byId.get(id);
export const categoryForSlot = (slot: LoadoutSlot): WeaponCategory =>
  slot === "left" || slot === "right" ? "secondary" : slot;

export function getWeaponStats(idOrWeapon: string | Weapon, level = 1) {
  const source =
    typeof idOrWeapon === "string" ? getWeapon(idOrWeapon) : idOrWeapon;
  if (!source) throw new Error("Arma desconhecida.");
  const safeLevel = Math.max(
    1,
    Math.min(5, Number.isFinite(level) ? Math.floor(level) : 1),
  );
  const damage = source.baseDamage * (1 + (safeLevel - 1) * 0.22);
  const interval = source.interval / (1 + (safeLevel - 1) * 0.075);
  const count =
    source.id === "shotgun"
      ? source.count + (safeLevel >= 3 ? 1 : 0) + (safeLevel >= 5 ? 1 : 0)
      : source.count;
  return {
    level: safeLevel,
    damage,
    interval,
    count,
    shotsPerSecond: 1000 / interval,
    dps: (damage * count * 1000) / interval,
    color: source.color,
    speed: source.speed,
    spread: source.spread,
    duration: (source.duration ?? 0) * (1 + (safeLevel - 1) * 0.1),
    cooldown: (source.cooldown ?? 0) / (1 + (safeLevel - 1) * 0.045),
    strength: (source.strength ?? 0) * (1 + (safeLevel - 1) * 0.12),
    pierce: source.pierce ?? 1,
    blastRadius: (source.blastRadius ?? 0) * (1 + (safeLevel - 1) * 0.06),
    chain: source.chain ?? 1,
    homing: source.homing ?? false,
    continuous: source.continuous ?? false,
  };
}

const STARTER_WEAPONS = [
  "single",
  "dual",
  "shotgun",
  "rockets",
  "homing",
  "bomb",
  "barrage",
  "superlaser",
  "green-storm",
  "shield",
  "repair",
];
export function defaultLoadout(planeId: number): Loadout {
  return {
    primary: planeId % 3 === 1 ? "shotgun" : "dual",
    left: planeId === 12 ? null : planeId % 3 === 2 ? "homing" : "rockets",
    right: planeId === 12 ? null : planeId % 3 === 2 ? "homing" : "rockets",
    special: planeId === 12 ? "green-storm" : "bomb",
    tactical: "shield",
  };
}
export function freshArsenal(owned: number[] = [0]): ArsenalState {
  return {
    weaponOwned: [...STARTER_WEAPONS],
    weaponLevels: Object.fromEntries(STARTER_WEAPONS.map((id) => [id, 1])),
    loadouts: Object.fromEntries(owned.map((id) => [id, defaultLoadout(id)])),
  };
}

const validPlane = (id: number) =>
  Number.isInteger(id) && id >= 0 && id < planes.length;
const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const slots: LoadoutSlot[] = [
  "primary",
  "left",
  "right",
  "special",
  "tactical",
];
/** v1/v2 saves have no arsenal. A complete default is generated per owned plane.
 * v3 imports are strict: an unknown/equipment-not-owned entry is an error rather
 * than a silent replacement of a player's purchased configuration. */
export function migrateArsenal(
  raw: Record<string, unknown>,
  owned: number[],
): ArsenalState {
  const fields = ["weaponOwned", "weaponLevels", "loadouts"];
  const hasArsenal = fields.some((key) => raw[key] !== undefined);
  if (!hasArsenal) {
    if (raw.version === 3) throw new Error("Arsenal ausente no backup v3.");
    return freshArsenal(owned);
  }
  if (!fields.every((key) => raw[key] !== undefined))
    throw new Error("Arsenal incompleto no backup.");
  if (
    !Array.isArray(raw.weaponOwned) ||
    new Set(raw.weaponOwned).size !== raw.weaponOwned.length ||
    raw.weaponOwned.some((id) => typeof id !== "string" || !getWeapon(id))
  )
    throw new Error("Inventário de armas inválido.");
  if (!isPlainObject(raw.weaponLevels) || !isPlainObject(raw.loadouts))
    throw new Error("Configuração do arsenal inválida.");
  const weaponOwned = [...raw.weaponOwned] as string[];
  const weaponLevels: Record<string, number> = {};
  for (const [id, level] of Object.entries(raw.weaponLevels)) {
    if (
      !getWeapon(id) ||
      !weaponOwned.includes(id) ||
      !Number.isInteger(level) ||
      Number(level) < 1 ||
      Number(level) > 5
    )
      throw new Error("Nível de arma inválido.");
    weaponLevels[id] = Number(level);
  }
  for (const id of weaponOwned)
    if (weaponLevels[id] === undefined)
      throw new Error("Nível de arma ausente no backup.");
  const loadouts: Record<number, Loadout> = {};
  for (const [planeKey, value] of Object.entries(raw.loadouts)) {
    if (
      !/^\d+$/.test(planeKey) ||
      !validPlane(Number(planeKey)) ||
      !owned.includes(Number(planeKey)) ||
      !isPlainObject(value)
    )
      throw new Error("Aeronave de loadout inválida.");
    const loadout = {} as Loadout;
    for (const slot of slots) {
      const id = value[slot];
      if ((slot === "left" || slot === "right") && id === null) {
        loadout[slot] = null;
        continue;
      }
      if (
        typeof id !== "string" ||
        !weaponOwned.includes(id) ||
        getWeapon(id)?.category !== categoryForSlot(slot)
      )
        throw new Error("Arma incompatível ou não possuída no loadout.");
      loadout[slot] = id;
    }
    loadouts[Number(planeKey)] = loadout;
  }
  for (const id of owned) {
    if (!loadouts[id]) {
      const fallback = defaultLoadout(id);
      if (
        slots.some(
          (slot) =>
            fallback[slot] !== null && !weaponOwned.includes(fallback[slot]!),
        )
      )
        throw new Error("Loadout ausente e sem equipamento inicial no backup.");
      loadouts[id] = fallback;
    }
  }
  if (!weaponOwned.includes("single"))
    throw new Error("Arma inicial ausente no backup.");
  return { weaponOwned, weaponLevels, loadouts };
}

export function weaponUpgradeCost(
  state: Pick<ArsenalState, "weaponLevels">,
  id: string,
): number {
  const entry = getWeapon(id);
  const level = state.weaponLevels[id];
  if (!entry || !Number.isInteger(level) || level < 1 || level >= 5) return 0;
  return Math.round((130 + entry.price * 0.28) * Math.pow(level, 1.45));
}
export function purchaseWeapon(state: ArsenalSave, id: string): boolean {
  const entry = getWeapon(id);
  if (
    !entry ||
    state.weaponOwned.includes(id) ||
    !Number.isSafeInteger(state.coins) ||
    state.coins < entry.price
  )
    return false;
  state.coins -= entry.price;
  state.weaponOwned.push(id);
  state.weaponLevels[id] = 1;
  return true;
}
export function upgradeWeapon(state: ArsenalSave, id: string): boolean {
  const cost = weaponUpgradeCost(state, id);
  if (
    !state.weaponOwned.includes(id) ||
    cost <= 0 ||
    !Number.isSafeInteger(state.coins) ||
    state.coins < cost
  )
    return false;
  state.coins -= cost;
  state.weaponLevels[id] += 1;
  return true;
}
export function equipWeapon(
  state: ArsenalSave,
  planeId: number,
  slot: LoadoutSlot,
  id: string | null,
): boolean {
  if (
    !validPlane(planeId) ||
    !state.owned.includes(planeId) ||
    !slots.includes(slot)
  )
    return false;
  if (id === null) {
    if (slot !== "left" && slot !== "right") return false;
  } else if (
    !state.weaponOwned.includes(id) ||
    getWeapon(id)?.category !== categoryForSlot(slot)
  )
    return false;
  const current = state.loadouts[planeId] ?? defaultLoadout(planeId);
  state.loadouts[planeId] = { ...current, [slot]: id } as Loadout;
  return true;
}
