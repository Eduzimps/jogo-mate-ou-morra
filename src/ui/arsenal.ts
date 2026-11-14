import { planes } from "../catalog";
import type { Save } from "../data";
import {
  weapons,
  getWeapon,
  getWeaponStats,
  weaponUpgradeCost,
  defaultLoadout,
  type ArsenalState,
  type Loadout,
  type LoadoutSlot,
  type Weapon,
  type WeaponCategory,
} from "../arsenal";
import { planeImage } from "./hangar";
import { svgUrl } from "../art";

export type ArsenalSave = Save & ArsenalState;
export type ArsenalFilter = "all" | WeaponCategory;
const categories: Record<WeaponCategory, string> = {
  primary: "Principais",
  secondary: "Armas de asa",
  special: "Especiais",
  tactical: "Dispositivos táticos",
};
const slotNames: Record<LoadoutSlot, string> = {
  primary: "Principal",
  left: "Asa esquerda",
  right: "Asa direita",
  special: "Especial",
  tactical: "Tático",
};
const categoryNames: Record<WeaponCategory, string> = {
  primary: "ARMA PRINCIPAL",
  secondary: "ARMA SECUNDÁRIA",
  special: "HABILIDADE ESPECIAL",
  tactical: "DISPOSITIVO TÁTICO",
};
const colorHex = (color: number) => "#" + color.toString(16).padStart(6, "0");
const button = (
  label: string,
  action: string,
  classes = "",
  disabled = false,
) =>
  `<button type="button" data-action="${action}" class="${classes}" ${disabled ? "disabled" : ""}>${label}</button>`;
const currentLoadout = (save: ArsenalSave, planeId: number): Loadout =>
  save.loadouts[planeId] || defaultLoadout(planeId);
const getLevel = (save: ArsenalSave, id: string) => save.weaponLevels[id] || 1;
const format = (n: number, decimals = 1) =>
  n.toLocaleString("pt-BR", { maximumFractionDigits: decimals });

/** Original small vector weapon silhouettes; these are also the mount preview
 * shown beside the selected plane, not images borrowed from another game. */
export function weaponIcon(weaponId: string, level = 1) {
  const weapon = getWeapon(weaponId);
  if (!weapon) return "";
  const color = colorHex(weapon.color),
    leds = Array.from(
      { length: 5 },
      (_, i) =>
        `<rect x="${32 + i * 12}" y="109" width="8" height="4" rx="1" fill="${i < level ? color : "#344d54"}"/>`,
    ).join("");
  let body = "";
  if (weapon.category === "tactical") {
    body = `<path d="M60 12L99 28 94 68Q90 88 60 105Q30 88 26 68L21 28Z" fill="url(#metal)" stroke="#142732" stroke-width="3"/><path d="M60 25L85 35 81 65Q79 78 60 91Q41 78 39 65L35 35Z" fill="#112c36" stroke="${color}" stroke-width="2"/><path d="M60 40V75M43 57H77" stroke="${color}" stroke-width="5"/>`;
  } else if (weapon.category === "special") {
    body = `<path d="M60 10L91 28 103 62 86 91 60 103 34 91 17 62 29 28Z" fill="url(#metal)" stroke="#142732" stroke-width="3"/><circle cx="60" cy="57" r="25" fill="#102c36" stroke="${color}" stroke-width="3"/><circle cx="60" cy="57" r="14" fill="${color}" opacity=".3"/><path d="M60 30L53 53 67 53 58 82 74 50H63L69 30Z" fill="${color}"/>`;
  } else if (weapon.homing || weaponId === "rockets" || weaponId === "bombs") {
    body = [-18, 18]
      .map(
        (x) =>
          `<g transform="translate(${x} 0)"><path d="M60 9Q48 22 48 37V80L39 96 51 92 60 105 69 92 81 96 72 80V37Q72 22 60 9Z" fill="url(#metal)" stroke="#142732" stroke-width="3"/><path d="M48 38H72M48 69H72" stroke="${color}" stroke-width="7"/><path d="M57 19V33" stroke="#f0edd8" stroke-width="2"/></g>`,
      )
      .join("");
  } else {
    const barrels =
      weaponId === "minigun"
        ? Math.min(6, 2 + level)
        : weaponId === "triple"
          ? 3
          : weaponId === "dual"
            ? 2
            : weaponId === "shotgun"
              ? 5
              : weaponId === "heavy"
                ? 1
                : Math.min(3, 1 + Math.floor(level / 2));
    body = `<path d="M34 62L28 80 31 102H89L92 80 86 62Z" fill="url(#metal)" stroke="#142732" stroke-width="3"/><rect x="38" y="60" width="44" height="29" rx="7" fill="#183442" stroke="#91a7a5" stroke-width="2"/>${Array.from(
      { length: barrels },
      (_, i) => {
        const x = 60 + (i - (barrels - 1) / 2) * 11;
        return `<rect x="${x - 4}" y="${16 + (i % 2) * 5}" width="8" height="55" rx="3" fill="url(#metal)" stroke="#142732" stroke-width="2"/><rect x="${x - 4}" y="${20 + (i % 2) * 5}" width="8" height="6" fill="${color}"/>`;
      },
    ).join(
      "",
    )}<path d="M39 77H81M40 85H80" stroke="${color}" stroke-width="3"/><path d="M39 95H81" stroke="#d3d9c6" opacity=".4"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" aria-hidden="true"><defs><linearGradient id="metal"><stop stop-color="#203b48"/><stop offset=".38" stop-color="#c5d2c6"/><stop offset=".52" stop-color="#809992"/><stop offset="1" stop-color="#254453"/></linearGradient></defs>${body}${leds}</svg>`;
}

export function mountedWeaponsHTML(save: ArsenalSave, planeId = save.selected) {
  const loadout = currentLoadout(save, planeId);
  const mount = (slot: "left" | "right") => {
    const id = loadout[slot];
    return id
      ? `<div class="mounted-pod mounted-${slot}" data-mount="${slot}" title="${slotNames[slot]}: ${getWeapon(id)?.name || id}"><img src="${svgUrl(weaponIcon(id, getLevel(save, id)))}" alt="${getWeapon(id)?.name || id}"></div>`
      : "";
  };
  return `<div class="loadout-aircraft" data-plane-id="${planeId}"><div class="loadout-platform"></div>${planeImage(planeId, "loadout-plane")}${mount("left")}${mount("right")}<div class="mounted-main"><img src="${svgUrl(weaponIcon(loadout.primary, getLevel(save, loadout.primary)))}" alt="${getWeapon(loadout.primary)?.name || loadout.primary}"></div><span class="mount-pin pin-left">ASA ESQUERDA</span><span class="mount-pin pin-right">ASA DIREITA</span><span class="loadout-tail-code">SKY STRIKE / ARMAMENTO CONFIGURADO</span></div>`;
}

function slotHTML(save: ArsenalSave, loadout: Loadout, slot: LoadoutSlot) {
  const id = loadout[slot],
    weapon = id ? getWeapon(id) : undefined;
  return `<div class="loadout-slot" data-slot="${slot}"><span class="slot-index">${({ primary: "01", left: "02", right: "03", special: "04", tactical: "05" } as const)[slot]}</span><div><small>${slotNames[slot].toLocaleUpperCase("pt-BR")}</small><strong>${weapon?.name || "Sem equipamento"}</strong><span>${weapon ? "NÍVEL " + getLevel(save, weapon.id) + "/5" : "Escolha uma arma secundária no catálogo"}</span></div>${weapon ? `<img src="${svgUrl(weaponIcon(weapon.id, getLevel(save, weapon.id)))}" alt="">` : ""}${slot === "left" || slot === "right" ? button("REMOVER", "weapon-clear:" + slot, "slot-remove", !id) : ""}</div>`;
}

function equippedSlots(loadout: Loadout, id: string) {
  return (Object.keys(loadout) as LoadoutSlot[]).filter(
    (slot) => loadout[slot] === id,
  );
}
function weaponCard(
  save: ArsenalSave,
  planeId: number,
  weapon: Weapon,
  loadout: Loadout,
) {
  const owned = save.weaponOwned.includes(weapon.id),
    level = getLevel(save, weapon.id),
    stats = getWeaponStats(weapon, level),
    cost = weaponUpgradeCost(save, weapon.id),
    equipped = equippedSlots(loadout, weapon.id),
    planeOwned = save.owned.includes(planeId);
  const slots: LoadoutSlot[] =
    weapon.category === "secondary"
      ? ["left", "right"]
      : [
          weapon.category === "primary"
            ? "primary"
            : weapon.category === "special"
              ? "special"
              : "tactical",
        ];
  const comparisonId = loadout[slots[0]],
    comparison = comparisonId ? getWeapon(comparisonId) : undefined;
  const comparisonStats = comparison
    ? getWeaponStats(comparison, getLevel(save, comparison.id))
    : undefined;
  const diff = comparisonStats ? stats.dps - comparisonStats.dps : 0;
  const tacticalLabel =
    weapon.id === "repair"
      ? "CURA"
      : weapon.id === "turbo"
        ? "VELOCIDADE"
        : weapon.id === "reflector"
          ? "DANO REFLETIDO"
          : weapon.id === "barrier"
            ? "RAIO DO CAMPO"
            : weapon.id === "slowfield"
              ? "REDUÇÃO"
              : "PROTEÇÃO";
  const tacticalValue =
    weapon.id === "repair"
      ? format(stats.strength * 100) + "%"
      : weapon.id === "turbo"
        ? format(stats.strength) + "×"
        : weapon.id === "reflector"
          ? format(stats.damage)
          : weapon.id === "barrier"
            ? format(stats.strength) + "px"
            : weapon.id === "slowfield"
              ? format(Math.min(0.85, stats.strength) * 100) + "%"
              : "TOTAL";
  const statsHTML =
    weapon.category === "tactical"
      ? `<div><small>${tacticalLabel}</small><strong>${tacticalValue}</strong></div><div><small>DURAÇÃO</small><strong>${format(stats.duration)}<em>s</em></strong></div><div><small>RECARGA</small><strong>${format(stats.cooldown)}<em>s</em></strong></div>`
      : weapon.category === "special"
        ? `<div><small>DANO POR ACERTO</small><strong>${format(stats.damage)}</strong></div><div><small>DURAÇÃO</small><strong>${format(stats.duration)}<em>s</em></strong></div><div><small>RECARGA</small><strong>${format(stats.cooldown)}<em>s</em></strong></div>`
        : `<div><small>DANO POR TIRO</small><strong>${format(stats.damage)}</strong></div><div><small>CADÊNCIA</small><strong>${format(stats.shotsPerSecond)}<em>/s</em></strong></div><div><small>DPS ESTIMADO</small><strong>${format(stats.dps)}</strong></div>`;
  const equipHTML = owned
    ? `<div class="weapon-equip-actions">${slots.map((slot) => button(loadout[slot] === weapon.id ? "EQUIPADA" + (slots.length > 1 ? " · " + (slot === "left" ? "E" : "D") : "") : "EQUIPAR" + (slots.length > 1 ? " · " + slotNames[slot].toLocaleUpperCase("pt-BR") : ""), `weapon-equip:${weapon.id}:${slot}`, "outline", !planeOwned || loadout[slot] === weapon.id)).join("")}</div>`
    : "";
  return `<article class="weapon-card ${equipped.length ? "weapon-equipped" : ""}" data-weapon="${weapon.id}" style="--weapon-color:${colorHex(weapon.color)}"><div class="weapon-card-top"><span>${categoryNames[weapon.category]}</span><b>${owned ? "ADQUIRIDA" : "CATÁLOGO"}</b></div><div class="weapon-illustration"><img loading="lazy" src="${svgUrl(weaponIcon(weapon.id, level))}" alt="${weapon.name}"><span class="weapon-level">${level}<small>/5</small></span></div><h3>${weapon.name}</h3><p>${weapon.description}</p><div class="weapon-stats">${statsHTML}</div><div class="weapon-level-track" aria-label="Nível ${level} de cinco">${Array.from({ length: 5 }, (_, i) => `<i class="${i < level ? "filled" : ""}"></i>`).join("")}</div>${weapon.category === "primary" || weapon.category === "secondary" ? `<div class="weapon-comparison">${comparison && comparison.id !== weapon.id ? `vs. ${comparison.name}: <b class="${diff >= 0 ? "positive" : "negative"}">${diff >= 0 ? "+" : ""}${format(diff)} DPS</b>` : "Padrão de tiro disponível no campo de teste"}</div>` : `<div class="weapon-comparison">${equipped.length ? "EQUIPADA · " + equipped.map((slot) => slotNames[slot]).join(" / ") : "Ativação manual com duração e recarga"}</div>`}<div class="weapon-purchase-actions">${owned ? button(level >= 5 ? "NÍVEL MÁXIMO" : "MELHORAR · ◈ " + cost, "weapon-upgrade:" + weapon.id, "primary", level >= 5 || save.coins < cost) : button("ADQUIRIR · ◈ " + weapon.price, "weapon-buy:" + weapon.id, "primary", save.coins < weapon.price)}${button("TESTAR →", "train-weapon:" + weapon.id, "text-button")}</div>${equipHTML}</article>`;
}

export function arsenalHTML(
  save: ArsenalSave,
  planeId = save.selected,
  category: ArsenalFilter | string = "all",
) {
  const plane = planes[planeId] || planes[save.selected],
    id = plane.id,
    loadout = currentLoadout(save, id),
    owned = save.owned.includes(id);
  const safeCategory =
    category === "all" || Object.keys(categories).includes(category)
      ? category
      : "all";
  const list = weapons.filter(
    (w) => safeCategory === "all" || w.category === safeCategory,
  );
  const primary = getWeapon(loadout.primary),
    left = loadout.left ? getWeapon(loadout.left) : undefined,
    right = loadout.right ? getWeapon(loadout.right) : undefined;
  const dps = [primary, left, right].reduce(
    (sum, w) => sum + (w ? getWeaponStats(w, getLevel(save, w.id)).dps : 0),
    0,
  );
  return `<section class="page arsenal-page"><div class="page-heading"><div><div class="eyebrow">DIVISÃO DE ARMAMENTO / LOADOUT</div><h2>Prepare cada <em>detalhe do ataque.</em></h2></div>${button("CAMPO DE TESTE →", "train", "outline")}</div><div class="arsenal-intro"><p>Compre e melhore seu arsenal. A combinação é salva individualmente por aeronave. Teste armas e níveis sem gastar moedas.</p><span>${save.weaponOwned.length}<small> / ${weapons.length} ARMAS ADQUIRIDAS</small></span></div><div class="loadout-workbench">${mountedWeaponsHTML(save, id)}<div class="loadout-details"><div class="eyebrow">CONFIGURAÇÃO ${owned ? "SALVA AUTOMATICAMENTE" : "EM PRÉVIA"}</div><h3>${plane.name}</h3><p>${owned ? "Cada alteração fica salva para esta aeronave, mesmo ao sair do hangar." : "Adquira esta aeronave no hangar para salvar sua configuração."}</p><div class="loadout-summary"><strong>${format(dps)}<small>DPS BASE ESTIMADO</small></strong><span>Ataques automáticos combinados.<br>Não inclui habilidades, nível do avião ou alvos adicionais.</span></div><div class="loadout-slots">${(["primary", "left", "right", "special", "tactical"] as LoadoutSlot[]).map((slot) => slotHTML(save, loadout, slot)).join("")}</div></div></div><div class="arsenal-catalog-heading"><div><div class="eyebrow">ARSENAL COMPLETO</div><h3>Encontre seu padrão de combate.</h3></div><span>${list.length} opções</span></div><div class="arsenal-tabs" aria-label="Categorias de armamento">${button("Todas · " + weapons.length, "arsenal-category:all", safeCategory === "all" ? "active" : "")}${(Object.keys(categories) as WeaponCategory[]).map((c) => button(categories[c] + " · " + weapons.filter((w) => w.category === c).length, "arsenal-category:" + c, safeCategory === c ? "active" : "")).join("")}</div><div class="weapon-grid">${list.map((w) => weaponCard(save, id, w, loadout)).join("")}</div><div class="arsenal-notes"><h3>Precisão nos números.</h3><p>DPS estimado = dano de cada projétil × projéteis por disparo × disparos por segundo. Área, encadeamento, perfuração e tempo real de contato podem alterar o dano causado. O campo de teste permite observar o comportamento real de cada combinação.</p></div></section>`;
}
