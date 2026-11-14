import {
  planes,
  wingmen,
  wingDescriptions,
  rarities,
  rarityColors,
  planeStars,
} from "../catalog";
import { power, upgradeCost, type Save, devices } from "../data";
import { aircraft, companionArt, svgUrl } from "../art";
export type HangarFilter = {
  query: string;
  collection: string;
  rarity: string;
  tier: string;
  owned: boolean;
  favorites: boolean;
};
export const emptyFilter = (): HangarFilter => ({
  query: "",
  collection: "",
  rarity: "",
  tier: "",
  owned: false,
  favorites: false,
});
export const planeImage = (id: number, cls = "", lazy = false) =>
  `<img class="${cls}" ${lazy ? 'loading="lazy"' : ""} decoding="async" src="${svgUrl(aircraft(planes[id].color, id, lazy ? 200 : 640))}" alt="${planes[id].name}">`;
const btn = (text: string, action: string, cls = "", disabled = false) =>
  `<button data-action="${action}" class="${cls}" ${disabled ? "disabled" : ""}>${text}</button>`;
const badge = (p: (typeof planes)[number]) =>
  `<span class="rarity" style="--rarity:${rarityColors[p.rarity]}">${p.rarity}</span>`;
const options = (values: string[], current: string) =>
  values
    .map((v) => `<option ${v === current ? "selected" : ""}>${v}</option>`)
    .join("");
export function hangarHTML(
  save: Save,
  preview: number,
  filter: HangarFilter,
  compare: boolean,
) {
  const p = planes[preview],
    owned = save.owned.includes(p.id),
    level = save.levels[p.id] || 1,
    mult = 1 + (level - 1) * 0.16,
    locked = p.tier > 1 + Math.floor(save.unlocked / 4);
  const list = planes.filter(
    (p) =>
      (!filter.query ||
        p.name
          .toLocaleLowerCase("pt-BR")
          .includes(filter.query.toLocaleLowerCase("pt-BR"))) &&
      (!filter.collection || p.collection === filter.collection) &&
      (!filter.rarity || p.rarity === filter.rarity) &&
      (!filter.tier || p.tier === Number(filter.tier)) &&
      (!filter.owned || save.owned.includes(p.id)) &&
      (!filter.favorites || save.favorites.includes(p.id)),
  );
  const stat = (label: string, value: string | number, percent: number) =>
    `<div class="spec"><span>${label}</span><b>${value}</b><i style="--stat:${Math.min(100, percent)}%"></i></div>`;
  return `<section class="page hangar-page"><div class="page-heading"><div><div class="eyebrow">HANGAR / DIVISÃO DE ENGENHARIA</div><h2>Força aérea, <em>à sua maneira.</em></h2></div><span class="collection-count">${save.owned.length}<small> / ${planes.length} AERONAVES</small></span></div>
 <div class="hangar-detail" style="--rarity:${rarityColors[p.rarity]}"><div class="showroom"><div class="hangar-light"></div><div class="landing-pad"></div><span class="showroom-code">SS / ${String(p.id + 1).padStart(3, "0")}<small>${p.propeller ? "TURBOÉLICE" : "PROPULSÃO A JATO"}</small></span>${planeImage(p.id, "showroom-plane")}<div class="showroom-footer"><span>VISTA SUPERIOR / ${p.collection.toLocaleUpperCase("pt-BR")}</span>${btn(save.favorites.includes(p.id) ? "★" : "☆", "favorite:" + p.id, "favorite")}</div></div>
 <div class="aircraft-specs"><div class="spec-top">${badge(p)}<span>TIER ${p.tier}</span></div><h2>${p.name}</h2><p>${p.description}</p><div class="power-strip"><span>PODER TOTAL<strong>${power(save, p.id)}</strong></span><span>NÍVEL<strong>${level} <small>${"★".repeat(planeStars(level))}</small></strong></span></div><div class="specs-grid">${stat("VIDA", Math.round(p.hp * mult), (p.hp * mult) / 4)}${stat("DANO", (p.damage * mult).toFixed(1), p.damage * mult * 2)}${stat("VELOCIDADE", p.speed, p.speed / 5)}${stat("CADÊNCIA", ((1000 / p.rate) * (1 + (level - 1) * 0.06)).toFixed(1) + "/s", (1000 / p.rate) * 8)}</div><div class="armament"><span>PRIMÁRIA <b>${p.weapon}</b></span><span>SECUNDÁRIA <b>${p.secondary}</b></span></div>${p.special ? `<div class="exclusive"><b>TEMPESTADE VERDE</b><span>Rajadas auriverdes + 2 mísseis guiados · ESPAÇO</span></div>` : ""}
 <div class="spec-actions">${owned ? btn(save.selected === p.id ? "AERONAVE EQUIPADA" : "EQUIPAR AERONAVE", "equip:" + p.id, "primary", save.selected === p.id) : btn(locked ? "LIBERE A MISSÃO " + ((p.tier - 1) * 4 + 1) : "ADQUIRIR · ◈ " + p.price, "buy:" + p.id, "primary", locked || save.coins < p.price)}${owned ? btn("MELHORAR · ◈ " + upgradeCost({ ...save, selected: p.id }), "upgrade:" + p.id, "outline", save.coins < upgradeCost({ ...save, selected: p.id })) : ""}</div><small class="hint">${owned ? "+16% vida e dano por nível; cadência +6% por nível." : "Prévia de catálogo. Compre para equipar e melhorar."}</small><div class="detail-tools">${btn("VER ARMAMENTO", "preview-skill:" + p.id, "text-button")}${btn(compare ? "FECHAR COMPARAÇÃO" : "COMPARAR COM EQUIPADA", "compare", "text-button", p.id === save.selected)}</div></div></div>
 ${
   compare && p.id !== save.selected
     ? `<div class="comparison"><h3>Comparação com ${planes[save.selected].name}</h3><p>Valores no nível atual de cada aeronave.</p><table><thead><tr><th>Atributo</th><th>${planes[save.selected].name}</th><th>${p.name}</th></tr></thead><tbody>${[
         ["Poder", power(save), power(save, p.id)],
         [
           "Vida",
           Math.round(
             planes[save.selected].hp *
               (1 + ((save.levels[save.selected] || 1) - 1) * 0.16),
           ),
           Math.round(p.hp * mult),
         ],
         ["Velocidade", planes[save.selected].speed, p.speed],
       ]
         .map(
           ([label, a, b]) =>
             `<tr><td>${label}</td><td>${a}</td><td>${b}</td></tr>`,
         )
         .join("")}</tbody></table></div>`
     : ""
 }
 <div class="catalog-title"><h3>Seu próximo voo começa aqui.</h3><span>${list.length} modelos</span></div><div class="catalog-filters"><label class="search-field">BUSCAR AERONAVE<input id="plane-search" placeholder="Nome ou modelo…" autocomplete="off"></label><label>COLEÇÃO<select id="filter-collection"><option value="">Todas as coleções</option>${options([...new Set(planes.map((p) => p.collection))], filter.collection)}</select></label><label>RARIDADE<select id="filter-rarity"><option value="">Todas</option>${options([...rarities], filter.rarity)}</select></label><label>TIER<select id="filter-tier"><option value="">Todos</option>${options(["1", "2", "3", "4"], filter.tier)}</select></label></div><div class="catalog-toggles">${btn("Todos os modelos", "filter-all", !filter.owned && !filter.favorites ? "active" : "")}${btn("Meus aviões", "filter-owned", filter.owned ? "active" : "")}${btn("★ Favoritos", "filter-favorites", filter.favorites ? "active" : "")}</div>
 <div class="plane-grid">${list.map((p) => `<button class="plane-card ${p.id === preview ? "selected" : ""}" data-action="plane:${p.id}" style="--rarity:${rarityColors[p.rarity]}"><div class="card-top">${badge(p)}<span>T${p.tier}</span></div><div class="card-aircraft">${planeImage(p.id, "", true)}</div><strong>${p.name}</strong><small>${p.weapon}</small><div class="card-bottom"><span>${save.owned.includes(p.id) ? "NV. " + (save.levels[p.id] || 1) : "◈ " + p.price}</span><span>${save.selected === p.id ? "EQUIPADA" : save.owned.includes(p.id) ? "PODER " + power(save, p.id) : p.tier > 1 + Math.floor(save.unlocked / 4) ? "BLOQUEADA" : "DISPONÍVEL"}</span></div></button>`).join("") || '<p class="empty-state">Nenhuma aeronave corresponde aos filtros.</p>'}</div>
 <div class="section-heading"><div class="eyebrow">VOE EM FORMAÇÃO</div><h3>Companheiros de combate</h3><p>Uma dupla do tipo selecionado acompanha a aeronave. Níveis individuais por tipo.</p></div><div class="wing-grid">${wingmen.map((name, i) => `<div class="wing-card ${save.wing === i ? "selected" : ""}"><img loading="lazy" src="${svgUrl(companionArt(i))}" alt="${name}"><div><h3>${name}</h3><p>${wingDescriptions[i]}</p><small>NV. ${save.wingLevels[i] || 1} · DANO ${5 + (save.wingLevels[i] || 1) * 3}</small></div>${btn(save.wing === i ? "EQUIPADO" : "EQUIPAR", "wing:" + i, "outline", save.wing === i)}${btn("MELHORAR · ◈ " + (save.wingLevels[i] || 1) * 200, "wingup:" + i, "text-button", save.coins < (save.wingLevels[i] || 1) * 200)}</div>`).join("")}</div>
 <div class="section-heading"><div class="eyebrow">ARSENAL TÁTICO</div><h3>Dispositivos de combate</h3><p>Equipe até três dispositivos. Teclas 1–5 ou botões na batalha.</p></div><div class="equipment">${devices.map((d, i) => `<div>${btn(`${i + 1}. ${d}<small>NV. ${save.deviceLevels[i]} · ${save.equipped.includes(i) ? "EQUIPADO" : "EQUIPAR"}</small>`, "device:" + i, save.equipped.includes(i) ? "selected" : "")}${btn("MELHORAR · ◈ " + save.deviceLevels[i] * 180, "deviceup:" + i, "text-button", save.coins < save.deviceLevels[i] * 180)}</div>`).join("")}</div></section>`;
}
