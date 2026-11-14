import "@fontsource/barlow/400.css";
import "@fontsource/barlow/600.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/barlow-condensed/800.css";
import Phaser from "phaser";
import "./style.css";
import { aircraft, svgUrl } from "./art";
import {
  planes,
  stages,
  environments,
  devices,
  wingmen,
  load,
  power,
  upgrade,
  upgradeCost,
  purchase,
  reward,
  type Save,
} from "./data";
import { audio } from "./audio";
import { Battle, type BattleResult } from "./battle";
const root = document.querySelector<HTMLDivElement>("#app")!;
let save: Save = load(localStorage.getItem("sky-strike"));
let game: Phaser.Game | undefined;
let tab = "home";
let mission = 0;
let result: BattleResult | undefined;
const persist = () => {
  localStorage.setItem("sky-strike", JSON.stringify(save));
  audio.volume = save.volume;
};
audio.volume = save.volume;
const img = (id: number, cls = "") =>
  `<img class="${cls}" src="${svgUrl(aircraft(planes[id].color, id))}" alt="${planes[id].name}">`;
const button = (label: string, action: string, cls = "", disabled = false) =>
  `<button class="${cls}" data-action="${action}" ${disabled ? "disabled" : ""}>${label}</button>`;
function shell(content: string) {
  root.innerHTML = `<div class="shell"><aside class="rail"><a class="brand" data-action="home">S<span>✦</span>S<small>SKY STRIKE / 1945</small></a><div class="rail-line"></div><span class="vertical">ESCADRÃO DE OPERAÇÕES ESPECIAIS</span><span class="rail-bottom">EST. 1945</span></aside><main><header><div class="breadcrumb">COMANDO AÉREO <span>/ ${({ home: "BASE DE OPERAÇÕES", hangar: "HANGAR", campaign: "CAMPANHA", missions: "MISSÕES", settings: "CONFIGURAÇÕES" } as Record<string, string>)[tab] || "MELHORIAS"}</span></div><div class="wallet"><span class="coin">◈</span> ${save.coins.toLocaleString("pt-BR")} <span class="gem">◆</span> ${save.gems}</div></header>${content}<nav>${[
    ["home", "01", "BASE"],
    ["campaign", "02", "CAMPANHA"],
    ["hangar", "03", "HANGAR"],
    ["missions", "04", "MISSÕES"],
    ["settings", "05", "OPÇÕES"],
  ]
    .map(([id, n, t]) =>
      button(`<small>${n}</small>${t}`, id, tab === id ? "active" : ""),
    )
    .join("")}</nav></main></div><div id="toast" role="status"></div>`;
}
function render() {
  persist();
  if (tab === "home") home();
  else if (tab === "hangar" || tab === "upgrades") hangar();
  else if (tab === "campaign") campaign();
  else if (tab === "missions") missions();
  else settings();
}
function home() {
  const p = planes[save.selected];
  shell(
    `<section class="hero"><div class="hero-copy"><div class="eyebrow"><i></i> PRONTO PARA DECOLAR</div><h1>SKY<br>STRIKE<span>1945</span></h1><p class="lead">O céu não tem limites.<br>A sua missão também não.</p><div class="hero-actions">${button("INICIAR MISSÃO <span>→</span>", "campaign", "primary")}${button("EXPLORAR HANGAR →", "hangar", "text-button")}</div><div class="service"><span>30</span> OPERAÇÕES <b>•</b><span>12</span> AERONAVES <b>•</b> UM SÓ ESQUADRÃO</div></div><div class="hero-art"><div class="radar r1"></div><div class="radar r2"></div><div class="crosshair c1">+</div><div class="crosshair c2">+</div><div class="coordinate">23° 41′ N / 142° 08′ E</div>${img(save.selected, "hero-plane")}<div class="aircraft-label"><small>AERONAVE ATIVA / TIER ${p.tier}</small><h3>${p.name}</h3><span>NÍVEL ${save.levels[p.id] || 1} <b>★</b> PODER ${power(save)}</span></div><span class="art-caption">AIR SUPERIORITY DIVISION — 01</span></div></section><section class="briefing"><div><div class="eyebrow">SUA PRÓXIMA OPERAÇÃO</div><h2>${stages[save.unlocked].name}</h2><p>${environments[stages[save.unlocked].environment]} <span>/</span> MISSÃO ${String(save.unlocked + 1).padStart(2, "0")}</p></div><div class="brief-reward"><small>RECOMPENSA BASE</small><strong>◈ ${stages[save.unlocked].reward}</strong></div>${button("VER OPERAÇÃO →", "campaign", "outline")}</section>`,
  );
}
function hangar() {
  const p = planes[save.selected];
  shell(
    `<section class="page"><div class="eyebrow">DIVISÃO DE ENGENHARIA</div><h2>Seu esquadrão. <em>Seu legado.</em></h2><div class="hangar-detail">${img(p.id)}<div><small>TIER ${p.tier} / ${p.weapon}</small><h2>${p.name}</h2><p>Nível ${save.levels[p.id] || 1} · ${"★".repeat(Math.min(5, 1 + Math.floor((save.levels[p.id] || 1) / 3)))} · Poder ${power(save)}</p><div class="stats"><span>BLINDAGEM <b>${Math.round(p.hp * (1 + ((save.levels[p.id] || 1) - 1) * 0.16))}</b></span><span>DANO <b>${(p.damage * (1 + ((save.levels[p.id] || 1) - 1) * 0.16)).toFixed(1)}</b></span><span>VELOCIDADE <b>${p.speed}</b></span></div>${button(`MELHORAR · ◈ ${upgradeCost(save)}`, "upgrade", "primary", save.coins < upgradeCost(save))}<small class="hint">+16% vida e dano por nível; cadência e estrelas evoluem.</small></div></div><div class="plane-grid">${planes
      .map((p) => {
        const owned = save.owned.includes(p.id),
          locked = p.tier > 1 + Math.floor(save.unlocked / 4);
        return `<button class="plane-card ${p.id === save.selected ? "selected" : ""}" data-action="plane:${p.id}" ${locked ? "disabled" : ""}><small>TIER ${p.tier} <span>${owned ? "DISPONÍVEL" : locked ? "BLOQUEADO" : "◈ " + p.price}</span></small>${img(p.id)}<strong>${p.name}</strong><small>${p.weapon} · NV. ${save.levels[p.id] || 1}</small></button>`;
      })
      .join(
        "",
      )}</div><h3>Companheiros de combate</h3><div class="equipment">${wingmen.map((w, i) => button(`${w}<small>${save.wing === i ? "EQUIPADO · NV. " + (save.wingLevels[save.wing] || 1) : "EQUIPAR"}</small>`, "wing:" + i, save.wing === i ? "selected" : "")).join("")}${button("MELHORAR DUPLA · ◈ " + (save.wingLevels[save.wing] || 1) * 200, "wingup", "outline")}</div><h3>Dispositivos <small>Escolha até 3 · teclas 1–5</small></h3><div class="equipment">${devices.map((d, i) => `<div>${button(`${i + 1}. ${d}<small>NV. ${save.deviceLevels[i]} · ${save.equipped.includes(i) ? "EQUIPADO" : "EQUIPAR"}</small>`, "device:" + i, save.equipped.includes(i) ? "selected" : "")}${button("MELHORAR · ◈ " + save.deviceLevels[i] * 180, "deviceup:" + i, "text-button")}</div>`).join("")}</div></section>`,
  );
}
function campaign() {
  shell(
    `<section class="page"><div class="eyebrow">TEATRO DE OPERAÇÕES</div><h2>Conquiste os céus.</h2><p>30 missões · 6 regiões · 3 classes de chefes. Vença para avançar.</p><div class="mission-grid">${stages.map((s) => `<button data-action="start:${s.id}" class="mission ${s.id > save.unlocked ? "locked" : ""}" ${s.id > save.unlocked ? "disabled" : ""}><small>${environments[s.environment]}</small><strong>${String(s.id + 1).padStart(2, "0")}</strong><h3>${s.name}</h3><span>${"★".repeat(save.stars[s.id] || 0)}${"☆".repeat(3 - (save.stars[s.id] || 0))}</span><small>${s.id > save.unlocked ? "BLOQUEADA" : "DECOLAR →"} · ◈ ${s.reward}</small></button>`).join("")}</div></section>`,
  );
}
const challenges = [
  ["kills", "Ás do combate", "Destrua 50 inimigos", 50, 400],
  ["wins", "Primeira campanha", "Conclua 3 missões", 3, 600],
  ["bosses", "Caça gigantes", "Derrote 3 chefes", 3, 600],
  ["earned", "Tesouro de guerra", "Ganhe 2000 moedas", 2000, 500],
  ["upgrades", "Engenharia de ponta", "Melhore aeronaves 3 vezes", 3, 450],
  ["perfect", "Intocável", "Vença com vida completa", 1, 800],
] as const;
function missions() {
  shell(
    `<section class="page"><div class="eyebrow">CENTRAL DE INTELIGÊNCIA</div><h2>Cada voo conta.</h2><div class="challenge"><div><h3>Suprimentos diários</h3><p>100 moedas e 2 gemas a cada dia do calendário local.</p></div>${button(save.daily === new Date().toLocaleDateString() ? "RESGATADO" : "RESGATAR", "daily", "primary", save.daily === new Date().toLocaleDateString())}</div>${challenges.map(([key, name, desc, target, coins]) => `<div class="challenge"><div><h3>${name}</h3><p>${desc} · ${Math.min(target, save.stats[key])}/${target}</p><progress max="${target}" value="${save.stats[key]}"></progress></div>${button(save.claimed.includes(key) ? "RESGATADO" : `◈ ${coins} + ◆ 5`, "claim:" + key, "outline", save.claimed.includes(key) || save.stats[key] < target)}</div>`).join("")}</section>`,
  );
}
function settings() {
  shell(
    `<section class="page settings"><div class="eyebrow">SISTEMAS DE BORDO</div><h2>Configurações</h2><label>Dificuldade<select id="difficulty">${["Fácil", "Normal", "Difícil"].map((v) => `<option ${save.difficulty === v ? "selected" : ""}>${v}</option>`).join("")}</select></label><p>Altera a resistência, velocidade dos projéteis e cadência inimiga.</p><label>Volume <input id="volume" type="range" min="0" max="1" step=".05" value="${save.volume}"></label><h3>Controles</h3><p>WASD / setas para mover. Mouse para apontar. No celular, arraste no campo de batalha; o avião fica acima do dedo.</p><p>Teclas 1–5: dispositivos equipados. Esc: pausar. Disparos e companheiros são automáticos.</p><h3>Progresso local</h3><p>Salvo automaticamente neste navegador. Sem compras com dinheiro real e sem serviços externos durante o jogo.</p></section>`,
  );
  document.querySelector("#difficulty")?.addEventListener("change", (e) => {
    save.difficulty = (e.target as HTMLSelectElement).value;
    persist();
  });
  document.querySelector("#volume")?.addEventListener("input", (e) => {
    save.volume = Number((e.target as HTMLInputElement).value);
    persist();
  });
}
function toast(t: string) {
  const el = document.querySelector("#toast");
  if (el) {
    el.textContent = t;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 2200);
  }
}
function start(id: number) {
  if (id > save.unlocked) return;
  mission = id;
  result = undefined;
  game?.destroy(true);
  root.innerHTML = `<div class="battle-layout"><aside><div class="eyebrow">AO VIVO / OPERAÇÃO ${id + 1}</div><h1>SKY<br>STRIKE<span>1945</span></h1><h3>${stages[id].name}</h3><p>${environments[stages[id].environment]}</p><div class="battle-instructions">MOVA · WASD / SETAS / MOUSE<br>HABILIDADES · 1—5<br>PAUSA · ESC</div>${button("ABORTAR MISSÃO", "abort", "outline")}</aside><div id="field"><div id="canvas"></div><div id="hud"></div><div id="skillbar"></div><div id="overlay"></div></div><aside class="right-aside"><small>SEU ESQUADRÃO</small>${img(save.selected)}<h3>${planes[save.selected].name}</h3><p>Poder ${power(save)}<br>${save.difficulty}</p><div class="eyebrow">OBJETIVOS</div><p>Elimine as formações.<br>Sobreviva ao ataque.<br>Destrua o chefe.</p></aside></div>`;
  const scene = new Battle();
  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: "canvas",
    width: 540,
    height: 960,
    backgroundColor: "#163d4e",
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [],
    render: { antialias: true },
    audio: { noAudio: true },
  });
  game.scene.add("battle", scene, true, {
    save,
    stage: id,
    done: finish,
    hud: updateHud,
  });
  audio.start();
}
let lastHud = 0;
let lastPaused = false;
function updateHud(b: Battle) {
  const now = performance.now();
  if (now - lastHud < 100 && b.paused === lastPaused) return;
  lastHud = now;
  lastPaused = b.paused;
  const hud = document.querySelector("#hud");
  if (!hud) return;
  const boss = b.enemies.find((e) => e.boss);
  hud.innerHTML = `<div class="hud-top"><div><small>INTEGRIDADE</small><progress value="${b.hp}" max="${b.maxHp}"></progress><small>${Math.ceil(b.hp)} / ${Math.ceil(b.maxHp)} ${b.shield > 0 ? " · ESCUDO " + b.shield.toFixed(1) + "s" : ""}</small></div><div class="score">${String(b.score).padStart(6, "0")}<small>◈ ${b.coins}</small></div>${button("II", "pause", "pause")}</div><progress class="stage-progress" value="${b.elapsed}" max="${stages[mission].duration}"></progress>${boss ? `<div class="bossbar"><small>${["FORTALEZA VOADORA", "ENCOURAÇADO DE GUERRA", "MÁQUINA DE DESTRUIÇÃO"][stages[mission].boss]} · FASE ${boss.phase}/3</small><progress value="${boss.hp}" max="${boss.max}"></progress></div>` : ""}`;
  document.querySelector("#skillbar")!.innerHTML = save.equipped
    .map((i) =>
      button(
        `<small>${i + 1}</small>${devices[i]}<b>${b.cooldowns[i] > 0 ? Math.ceil(b.cooldowns[i]) + "s" : "PRONTO"}</b>`,
        "ability:" + i,
        "skill",
        b.cooldowns[i] > 0,
      ),
    )
    .join("");
  if (!result)
    document.querySelector("#overlay")!.innerHTML = b.paused
      ? `<div class="modal"><div class="eyebrow">SISTEMAS EM ESPERA</div><h2>Voo pausado</h2>${button("CONTINUAR", "pause", "primary")}${button("VOLTAR À BASE", "abort", "text-button")}</div>`
      : "";
}
function finish(r: BattleResult) {
  result = r;
  save.stats.kills += r.kills;
  save.stats.bosses += r.bosses;
  let amount = r.coins,
    stars = r.hp >= 0.99 ? 3 : r.hp >= 0.45 ? 2 : 1;
  if (r.win) {
    amount += stages[mission].reward;
    reward(save, mission, stars, amount);
    if (r.hp >= 0.99) save.stats.perfect++;
  } else {
    save.coins += amount;
    save.stats.earned += amount;
  }
  persist();
  audio.mode = "menu";
  audio.tone(r.win ? 660 : 100, 0.7, "triangle");
  document.querySelector("#overlay")!.innerHTML =
    `<div class="modal"><div class="eyebrow">RELATÓRIO DE VOO</div><h2>${r.win ? "Missão cumprida." : "Aeronave abatida."}</h2><div class="result-stars">${r.win ? "★".repeat(stars) + "☆".repeat(3 - stars) : "—"}</div><p>${r.score.toLocaleString("pt-BR")} pontos · ${r.kills} alvos</p><h3>◈ +${amount}</h3>${button(r.win ? "PRÓXIMA MISSÃO" : "TENTAR NOVAMENTE", "retry", "primary")}${button("VOLTAR AO HANGAR", "exit", "outline")}</div>`;
}
root.addEventListener("click", (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>("[data-action]");
  if (!el || el.hasAttribute("disabled")) return;
  audio.start();
  audio.tone(420, 0.06, "triangle", 0.12);
  const [a, v] = el.dataset.action!.split(":");
  if (
    ["home", "hangar", "upgrades", "campaign", "missions", "settings"].includes(
      a,
    )
  ) {
    tab = a;
    render();
  } else if (a === "plane") {
    const id = Number(v);
    if (save.owned.includes(id) || purchase(save, id)) {
      save.selected = id;
      render();
    } else toast("Moedas insuficientes ou categoria bloqueada.");
  } else if (a === "upgrade") {
    if (upgrade(save)) {
      render();
      toast("Aeronave melhorada. Poder " + power(save));
    }
  } else if (a === "wing") {
    save.wing = Number(v);
    render();
  } else if (a === "wingup") {
    const c = (save.wingLevels[save.wing] || 1) * 200;
    if (save.coins >= c) {
      save.coins -= c;
      save.wingLevels[save.wing] = (save.wingLevels[save.wing] || 1) + 1;
      render();
    } else toast("Moedas insuficientes.");
  } else if (a === "device") {
    const i = Number(v);
    if (save.equipped.includes(i))
      save.equipped = save.equipped.filter((x) => x !== i);
    else if (save.equipped.length < 3) save.equipped.push(i);
    else {
      toast("Remova um dispositivo para equipar outro.");
      return;
    }
    render();
  } else if (a === "deviceup") {
    const i = Number(v),
      c = save.deviceLevels[i] * 180;
    if (save.coins >= c) {
      save.coins -= c;
      save.deviceLevels[i]++;
      render();
    } else toast("Moedas insuficientes.");
  } else if (a === "daily") {
    const day = new Date().toLocaleDateString();
    if (save.daily !== day) {
      save.daily = day;
      save.coins += 100;
      save.gems += 2;
      render();
    }
  } else if (a === "claim") {
    const c = challenges.find((c) => c[0] === v);
    if (c && !save.claimed.includes(v) && save.stats[v] >= c[3]) {
      save.claimed.push(v);
      save.coins += c[4];
      save.gems += 5;
      render();
    }
  } else if (a === "start") start(Number(v));
  else if (a === "ability")
    (game?.scene.getScene("battle") as Battle)?.ability(Number(v));
  else if (a === "pause")
    (game?.scene.getScene("battle") as Battle)?.togglePause();
  else if (a === "retry")
    start(result?.win ? Math.min(29, mission + 1) : mission);
  else if (a === "exit" || a === "abort") {
    game?.destroy(true);
    game = undefined;
    result = undefined;
    audio.mode = "menu";
    tab = a === "exit" ? "hangar" : "home";
    render();
  }
});
render();
if (import.meta.env.PROD && "serviceWorker" in navigator)
  navigator.serviceWorker.register("./sw.js").catch(() => {});

export { game };
if (import.meta.env.DEV)
  Object.defineProperty(window, "__skyGame", {
    configurable: true,
    get: () => game,
  });
