import "@fontsource/barlow/400.css";
import "@fontsource/barlow/600.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/barlow-condensed/800.css";
import Phaser from "phaser";
import "./style.css";
import "./ultimate.css";
import { aircraft, svgUrl } from "./art";
import {
  planes,
  stages,
  stageRegion,
  devices,
  wingmen,
  fresh,
  power,
  upgrade,
  upgradeCost,
  purchase,
  reward,
  type Save,
} from "./data";
import { audio } from "./audio";
import { Battle, type BattleResult } from "./battle";
import { rarityColors } from "./catalog";
import {
  hangarHTML,
  planeImage,
  emptyFilter,
  type HangarFilter,
} from "./ui/hangar";
import { readProgress, importProgress, SAVE_KEY } from "./persistence";
const root = document.querySelector<HTMLDivElement>("#app")!;
const startup = readProgress(localStorage);
let recovery = !!startup.error;
let save: Save = startup.save ?? fresh();
let preview = save.selected;
let filter: HangarFilter = emptyFilter();
let compare = false;
let game: Phaser.Game | undefined;
let tab = "home";
let mission = 0;
let result: BattleResult | undefined;
const persist = () => {
  if (recovery) return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    toast("Não foi possível salvar. Exporte um backup nas configurações.");
  }
  audio.volume = save.volume;
};
audio.volume = save.volume;
const img = planeImage;
const button = (label: string, action: string, cls = "", disabled = false) =>
  `<button class="${cls}" data-action="${action}" ${disabled ? "disabled" : ""}>${label}</button>`;
function shell(content: string) {
  root.innerHTML = `<div class="shell"><aside class="rail"><a class="brand" data-action="home">S<span>✦</span>S<small>SKY STRIKE / 1945</small></a><div class="rail-line"></div><span class="vertical">ESCADRÃO DE OPERAÇÕES ESPECIAIS</span><span class="rail-bottom">EST. 1945</span></aside><main><header><div class="breadcrumb">COMANDO AÉREO <span>/ ${({ home: "BASE DE OPERAÇÕES", hangar: "HANGAR", campaign: "CAMPANHA", missions: "MISSÕES", settings: "CONFIGURAÇÕES", inventory: "INVENTÁRIO", events: "EVENTOS", achievements: "CONQUISTAS" } as Record<string, string>)[tab] || "MELHORIAS"}</span></div><div class="wallet"><span class="coin">◈</span> ${save.coins.toLocaleString("pt-BR")} <span class="gem">◆</span> ${save.gems}</div></header>${content}<nav>${[
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
  else if (["hangar", "upgrades", "inventory"].includes(tab)) hangar();
  else if (tab === "campaign") campaign();
  else if (["missions", "events", "achievements"].includes(tab)) missions();
  else settings();
}
function home() {
  const p = planes[save.selected];
  shell(`<section class="hero ultimate-hero"><div class="hero-copy"><div class="eyebrow"><i></i> ULTIMATE / ESQUADRÃO 01</div><h1>SKY<br>STRIKE<span>1945</span></h1><p class="lead">Sua aeronave. Seu esquadrão.<br>O próximo voo começa agora.</p><div class="hero-actions">${button("INICIAR MISSÃO <span>→</span>", "campaign", "primary")}${button("EXPLORAR HANGAR →", "hangar", "text-button")}</div><div class="service"><span>30</span> OPERAÇÕES <b>•</b><span>${planes.length}</span> AERONAVES <b>•</b> PROGRESSO LOCAL</div></div><div class="hero-art"><div class="hangar-light"></div><div class="landing-pad"></div><div class="radar r1"></div><div class="radar r2"></div><div class="coordinate">HANGAR 01 / SISTEMAS PRONTOS</div>${img(save.selected, "hero-plane")}<div class="aircraft-label"><small>${p.collection.toLocaleUpperCase("pt-BR")} / TIER ${p.tier}</small><h3>${p.name}</h3><span>NÍVEL ${save.levels[p.id] || 1} <b>★</b> PODER ${power(save)}</span><span class="rarity" style="--rarity:${rarityColors[p.rarity]}">${p.rarity}</span></div><span class="art-caption">ESQUADRÃO SKY STRIKE — VISTA SUPERIOR</span></div></section>
 <section class="lobby-shortcuts">${[
   ["inventory", "INVENTÁRIO", save.owned.length + " aeronaves na sua frota"],
   ["missions", "MISSÕES", "Objetivos e recompensas"],
   ["events", "EVENTOS", "Suprimentos diários"],
   ["achievements", "CONQUISTAS", "Seu histórico de combate"],
 ]
   .map(([id, title, desc]) =>
     button(
       `<strong>${title}</strong><small>${desc}</small><span>→</span>`,
       id,
     ),
   )
   .join("")}</section>
 <section class="briefing"><div><div class="eyebrow">SUA PRÓXIMA OPERAÇÃO</div><h2>${stages[save.unlocked].name}</h2><p>${stageRegion(save.unlocked)} <span>/</span> MISSÃO ${String(save.unlocked + 1).padStart(2, "0")}</p></div><div class="brief-reward"><small>RECOMPENSA BASE</small><strong>◈ ${stages[save.unlocked].reward}</strong></div>${button("VER OPERAÇÃO →", "campaign", "outline")}</section>
 <section class="brazil-banner"><div class="brazil-mark">BR<span>29</span></div><div><div class="eyebrow">NOVO / COLEÇÃO BRASILEIRA</div><h3>Falcão do Brasil</h3><p>Um novo voo. A mesma coragem. Conheça a Tempestade Verde.</p></div>${button("CONHECER AERONAVE →", "discover:12", "outline")}</section>`);
}
function hangar() {
  shell(hangarHTML(save, preview, filter, compare));
  const search = document.querySelector<HTMLInputElement>("#plane-search")!;
  search.value = filter.query;
  search.addEventListener("input", () => {
    const position = search.selectionStart;
    filter.query = search.value;
    hangar();
    const next = document.querySelector<HTMLInputElement>("#plane-search")!;
    next.focus({ preventScroll: true });
    next.setSelectionRange(position, position);
  });
  for (const key of ["collection", "rarity", "tier"] as const)
    document
      .querySelector("#filter-" + key)
      ?.addEventListener("change", (e) => {
        filter[key] = (e.target as HTMLSelectElement).value;
        hangar();
      });
}
function campaign() {
  shell(
    `<section class="page"><div class="eyebrow">TEATRO DE OPERAÇÕES</div><h2>Conquiste os céus.</h2><p>30 missões · Rio de Janeiro + 6 regiões · 3 classes de chefes. Vença para avançar.</p><div class="mission-grid">${stages.map((s) => `<button data-action="start:${s.id}" class="mission ${s.id > save.unlocked ? "locked" : ""}" ${s.id > save.unlocked ? "disabled" : ""}><small>${stageRegion(s.id)}</small><strong>${String(s.id + 1).padStart(2, "0")}</strong><h3>${s.name}</h3><span>${"★".repeat(save.stars[s.id] || 0)}${"☆".repeat(3 - (save.stars[s.id] || 0))}</span><small>${s.id > save.unlocked ? "BLOQUEADA" : "DECOLAR →"} · ◈ ${s.reward}</small></button>`).join("")}</div></section>`,
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
    `<section class="page"><div class="eyebrow">CENTRAL DE INTELIGÊNCIA</div><h2>${tab === "events" ? "Suprimentos do dia." : tab === "achievements" ? "Seu legado nos céus." : "Cada voo conta."}</h2><div class="profile-summary"><span>VITÓRIAS <b>${save.stats.wins}</b></span><span>INIMIGOS <b>${save.stats.kills}</b></span><span>CHEFES <b>${save.stats.bosses}</b></span><span>MISSÕES <b>${Object.keys(save.stars).length}/30</b></span></div><div class="challenge"><div><h3>Suprimentos diários</h3><p>100 moedas e 2 gemas a cada dia do calendário local.</p></div>${button(save.daily === new Date().toLocaleDateString() ? "RESGATADO" : "RESGATAR", "daily", "primary", save.daily === new Date().toLocaleDateString())}</div>${challenges.map(([key, name, desc, target, coins]) => `<div class="challenge"><div><h3>${name}</h3><p>${desc} · ${Math.min(target, save.stats[key])}/${target}</p><progress max="${target}" value="${save.stats[key]}"></progress></div>${button(save.claimed.includes(key) ? "RESGATADO" : `◈ ${coins} + ◆ 5`, "claim:" + key, "outline", save.claimed.includes(key) || save.stats[key] < target)}</div>`).join("")}</section>`,
  );
}
function settings() {
  shell(`<section class="page settings"><div class="eyebrow">SISTEMAS DE BORDO</div><h2>Seu voo. Suas regras.</h2><label>Dificuldade<select id="difficulty">${["Fácil", "Normal", "Difícil"].map((v) => `<option ${save.difficulty === v ? "selected" : ""}>${v}</option>`).join("")}</select></label><p>Altera resistência, velocidade e cadência inimiga.</p><label>Volume geral<input id="volume" type="range" min="0" max="1" step=".05" value="${save.volume}"></label>
 <h3>Acessibilidade e desempenho</h3>${[
   ["reducedEffects", "Efeitos reduzidos"],
   ["screenShake", "Tremor de câmera"],
   ["largeHud", "HUD ampliado"],
 ]
   .map(
     ([id, label]) =>
       `<label>${label}<input type="checkbox" id="${id}" ${save[id as "reducedEffects"] ? "checked" : ""}></label>`,
   )
   .join("")}
 <label>Deslocamento acima do dedo <output id="offset-value">${save.touchOffset}px</output><input id="touchOffset" type="range" min="0" max="140" step="5" value="${save.touchOffset}"></label><label>Resposta do ponteiro <input id="sensitivity" type="range" min=".5" max="2" step=".1" value="${save.sensitivity}"></label>
 <h3>Controles</h3><p>WASD / setas ou mouse. No celular, arraste dentro do campo. Tiros automáticos. Teclas 1–5: dispositivos. Espaço: Tempestade Verde (BR-29). Esc: pausa.</p>
 <h3>Seu progresso está com você.</h3><p>O progresso é salvo neste navegador. Exporte um arquivo para transferir a outro dispositivo ou guardar uma cópia.</p><div class="backup-actions">${button("EXPORTAR BACKUP JSON", "export", "primary")}<label class="file-button">IMPORTAR BACKUP<input type="file" id="import-save" accept=".json,application/json"></label></div><p>Ao importar, validamos o arquivo e guardamos uma cópia do progresso anterior. Saves antigos são migrados sem renumerar aeronaves ou missões.</p><p id="backup-status" role="status"></p></section>`);
  document.querySelector("#difficulty")?.addEventListener("change", (e) => {
    save.difficulty = (e.target as HTMLSelectElement).value;
    persist();
  });
  for (const key of ["volume", "sensitivity", "touchOffset"] as const)
    document.querySelector("#" + key)?.addEventListener("input", (e) => {
      save[key] = Number((e.target as HTMLInputElement).value);
      if (key === "touchOffset")
        document.querySelector("#offset-value")!.textContent =
          save.touchOffset + "px";
      persist();
    });
  for (const key of ["reducedEffects", "screenShake", "largeHud"] as const)
    document.querySelector("#" + key)?.addEventListener("change", (e) => {
      save[key] = (e.target as HTMLInputElement).checked;
      persist();
    });
}
function download(raw: string, name: string) {
  const a = document.createElement("a");
  const url = URL.createObjectURL(
    new Blob([raw], { type: "application/json" }),
  );
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function recoveryScreen() {
  root.innerHTML = `<div class="recovery-screen"><div class="eyebrow">RECUPERAÇÃO DE PROGRESSO</div><h2>Seu save foi preservado.</h2><p>Não conseguimos ler o progresso atual. Nenhum dado foi substituído. Exporte o arquivo para guardá-lo ou importe um backup válido.</p>${button("BAIXAR SAVE ORIGINAL", "export-original", "primary")}<label class="file-button">IMPORTAR BACKUP<input type="file" id="import-save" accept=".json,application/json"></label>${button("USAR CÓPIA ANTERIOR", "restore-backup", "outline")}${button("COMEÇAR NOVO PROGRESSO", "new-save", "text-button")}<p id="backup-status" role="status"></p></div>`;
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
  audio.paused = false;
  lastHud = 0;
  result = undefined;
  game?.destroy(true);
  root.innerHTML = `<div class="battle-layout"><aside><div class="eyebrow">AO VIVO / OPERAÇÃO ${id + 1}</div><h1>SKY<br>STRIKE<span>1945</span></h1><h3>${stages[id].name}</h3><p>${stageRegion(id)}</p><div class="battle-instructions">MOVA · WASD / SETAS / MOUSE<br>HABILIDADES · 1—5<br>PAUSA · ESC</div>${button("ABORTAR MISSÃO", "abort", "outline")}</aside><div id="field" class="${save.largeHud ? "large-hud" : ""} ${save.reducedEffects ? "reduced-effects" : ""}"><div id="canvas"></div><div id="loading" role="status">PREPARANDO AERONAVE<span>Inicializando os sistemas de combate…</span></div><div id="hud"></div><div id="skillbar"></div><div id="route-caption" aria-live="polite"></div><div id="overlay"></div></div><aside class="right-aside"><small>SEU ESQUADRÃO</small>${img(save.selected)}<h3>${planes[save.selected].name}</h3><p>Poder ${power(save)}<br>${save.difficulty}</p><div class="eyebrow">OBJETIVOS</div><p>${id === 0 ? "Atravesse a costa.<br>Sobrevoe o Corcovado.<br>Defenda a Guanabara." : "Elimine as formações.<br>Sobreviva ao ataque.<br>Destrua o chefe."}</p></aside></div>`;
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
  game.events.once("world-load-error", () => {
    const loading = document.getElementById("loading");
    if (loading)
      loading.innerHTML = `CENÁRIO NÃO CARREGADO<span>Verifique a conexão e tente novamente. Seu progresso foi preservado.</span>${button("TENTAR CARREGAR NOVAMENTE", "retry", "primary")}${button("VOLTAR À BASE", "abort", "outline")}`;
  });
  game.scene.add("battle", scene, true, {
    save,
    stage: id,
    done: finish,
    hud: updateHud,
  });
  audio.start();
}
let lastHud = 0,
  lastPaused = false;
function updateHud(b: Battle) {
  const now = performance.now();
  if (now - lastHud < 80 && b.paused === lastPaused) return;
  lastHud = now;
  lastPaused = b.paused;
  const caption = document.getElementById("route-caption");
  if (caption && b.rioWorld) {
    const state = b.rioWorld.state;
    if (caption.dataset.section !== state.section) {
      caption.dataset.section = state.section;
      caption.innerHTML = `<small>OPERAÇÃO GUANABARA / BRASIL</small><strong>${state.label}</strong>${state.section === "christ" ? "<span>CORCOVADO / SOBREVOO DO MARCO</span>" : ""}`;
    }
    caption.classList.toggle("landmark-caption", state.section === "christ");
    caption.hidden = b.paused || b.ended;
  }
  const hud = document.querySelector("#hud");
  if (!hud) return;
  document.getElementById("loading")?.remove();
  if (!hud.children.length)
    hud.innerHTML = `<div class="hud-top"><div class="health-block"><div class="hp-caption"><span>BLINDAGEM / HP</span><strong id="hp-percent"></strong></div><div class="hp-track"><i id="hp-fill"></i></div><progress id="hp-native" class="sr-only" aria-label="Vida da aeronave"></progress><div class="hp-values"><span id="hp-value"></span><b id="hp-status"></b></div></div><div class="score"><span id="score-value"></span><small id="coins-value"></small></div>${button("II", "pause", "pause")}</div><div class="shield-block" id="shield-block"><span id="shield-value"></span><progress id="shield-progress" aria-label="Escudo de energia"></progress></div><progress class="stage-progress" id="stage-progress" aria-label="Progresso da missão"></progress><div class="bossbar" id="bossbar" hidden><div><small id="boss-name"></small><strong id="boss-phase"></strong></div><progress id="boss-progress" aria-label="Vida do chefe"></progress><span id="boss-value"></span></div><div id="critical-alert" hidden>ALERTA / VIDA CRÍTICA</div>`;
  const txt = (id: string, v: string) => {
    document.getElementById(id)!.textContent = v;
  };
  const progress = (id: string, value: number, max: number) => {
    const el = document.getElementById(id) as HTMLProgressElement;
    el.max = max;
    el.value = value;
  };
  const ratio = b.hp / b.maxHp,
    critical = ratio < 0.25;
  document
    .querySelector("#field")
    ?.classList.toggle("critical", critical && !b.ended);
  hud.setAttribute(
    "data-health",
    critical ? "critical" : ratio < 0.5 ? "warning" : "healthy",
  );
  txt("hp-percent", Math.ceil(ratio * 100) + "%");
  txt("hp-value", Math.ceil(b.hp) + " / " + Math.ceil(b.maxHp) + " HP");
  txt("hp-status", critical ? "CRÍTICA" : ratio < 0.5 ? "ATENÇÃO" : "ESTÁVEL");
  document.getElementById("hp-fill")!.style.width = ratio * 100 + "%";
  progress("hp-native", b.hp, b.maxHp);
  txt("score-value", String(b.score).padStart(6, "0"));
  txt("coins-value", "◈ " + b.coins);
  const shield = document.getElementById("shield-block")!;
  shield.hidden = b.shield <= 0;
  txt("shield-value", "ESCUDO / " + b.shield.toFixed(1) + "s");
  progress("shield-progress", b.shield, 5 + save.deviceLevels[1]);
  progress("stage-progress", b.elapsed, stages[mission].duration);
  document.getElementById("critical-alert")!.hidden = !critical || b.ended;
  const boss = b.enemies.find((e) => e.boss);
  document.getElementById("bossbar")!.hidden = !boss;
  if (boss) {
    txt(
      "boss-name",
      ["FORTALEZA VOADORA", "ENCOURAÇADO DE GUERRA", "MÁQUINA DE DESTRUIÇÃO"][
        stages[mission].boss
      ],
    );
    txt("boss-phase", "FASE " + boss.phase + "/3");
    txt(
      "boss-value",
      Math.max(0, Math.ceil(boss.hp)) + " / " + Math.ceil(boss.max) + " HP",
    );
    progress("boss-progress", Math.max(0, boss.hp), boss.max);
    document.getElementById("bossbar")!.dataset.phase = String(boss.phase);
  }
  const skills = document.querySelector("#skillbar")!;
  if (!skills.children.length)
    skills.innerHTML =
      save.equipped
        .map((i) =>
          button(
            `<small>${i + 1}</small>${devices[i]}<b id="cooldown-${i}"></b>`,
            "ability:" + i,
            "skill",
          ),
        )
        .join("") +
      (save.selected === 12
        ? button(
            '<small>ESPAÇO</small>Tempestade<b id="cooldown-special"></b>',
            "special",
            "skill brazil-skill",
          )
        : "");
  for (const i of save.equipped) {
    const el = skills.querySelector<HTMLButtonElement>(
      `[data-action="ability:${i}"]`,
    )!;
    el.disabled = b.cooldowns[i] > 0;
    txt(
      "cooldown-" + i,
      b.cooldowns[i] > 0 ? Math.ceil(b.cooldowns[i]) + "s" : "PRONTO",
    );
  }
  if (save.selected === 12) {
    const el = skills.querySelector<HTMLButtonElement>(
      '[data-action="special"]',
    )!;
    el.disabled = b.specialCooldown > 0;
    txt(
      "cooldown-special",
      b.specialCooldown > 0 ? Math.ceil(b.specialCooldown) + "s" : "PRONTO",
    );
  }
  const overlay = document.querySelector("#overlay")!;
  if (
    !result &&
    ((b.paused && !overlay.children.length) ||
      (!b.paused && overlay.children.length))
  )
    overlay.innerHTML = b.paused
      ? `<div class="modal"><div class="eyebrow">SISTEMAS EM ESPERA</div><h2>Voo pausado</h2>${button("CONTINUAR", "pause", "primary")}${button("VOLTAR À BASE", "abort", "text-button")}</div>`
      : "";
}
function finish(r: BattleResult) {
  if (result) return;
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
  audio.paused = false;
  audio.tone(r.win ? 660 : 100, 0.7, "triangle");
  document.querySelector("#overlay")!.innerHTML =
    `<div class="modal"><div class="eyebrow">RELATÓRIO DE VOO</div><h2>${r.win ? "Missão cumprida." : "Aeronave abatida."}</h2>${img(save.selected, "result-plane")}<p class="result-aircraft">${planes[save.selected].name}</p><div class="result-stars">${r.win ? "★".repeat(stars) + "☆".repeat(3 - stars) : "—"}</div><p>${r.score.toLocaleString("pt-BR")} pontos · ${r.kills} alvos</p><h3>◈ +${amount}</h3>${button(r.win ? "PRÓXIMA MISSÃO" : "TENTAR NOVAMENTE", "retry", "primary")}${button("VOLTAR AO HANGAR", "exit", "outline")}${button("VOLTAR AO LOBBY", "abort", "text-button")}</div>`;
}
root.addEventListener("click", (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>("[data-action]");
  if (!el || el.hasAttribute("disabled")) return;
  audio.start();
  audio.tone(420, 0.06, "triangle", 0.12);
  const [a, v] = el.dataset.action!.split(":");
  if (
    [
      "home",
      "hangar",
      "upgrades",
      "campaign",
      "missions",
      "settings",
      "inventory",
      "events",
      "achievements",
    ].includes(a)
  ) {
    tab = a;
    if (a === "inventory") {
      filter = emptyFilter();
      filter.owned = true;
      preview = save.selected;
    }
    if (a === "hangar") {
      filter = emptyFilter();
      preview = save.selected;
    }
    render();
  } else if (a === "plane" || a === "discover") {
    preview = Number(v);
    if (a === "discover") {
      tab = "hangar";
      filter = emptyFilter();
    }
    compare = false;
    render();
    document
      .querySelector(".hangar-detail")
      ?.scrollIntoView({ block: "start", behavior: "smooth" });
  } else if (a === "buy") {
    if (purchase(save, Number(v))) {
      save.selected = Number(v);
      render();
      toast("Aeronave adquirida e equipada.");
    } else toast("Moedas insuficientes ou tier bloqueado.");
  } else if (a === "equip") {
    if (save.owned.includes(Number(v))) {
      save.selected = Number(v);
      render();
      toast("Aeronave equipada.");
    }
  } else if (a === "upgrade") {
    const id = v === undefined ? save.selected : Number(v);
    if (upgrade(save, id)) {
      render();
      toast("Melhoria aplicada. Poder " + power(save, id));
    }
  } else if (a === "favorite") {
    const id = Number(v);
    save.favorites = save.favorites.includes(id)
      ? save.favorites.filter((n) => n !== id)
      : [...save.favorites, id];
    render();
  } else if (a === "compare") {
    compare = !compare;
    render();
  } else if (
    a === "filter-all" ||
    a === "filter-owned" ||
    a === "filter-favorites"
  ) {
    filter.owned = a === "filter-owned" ? !filter.owned : false;
    filter.favorites = a === "filter-favorites" ? !filter.favorites : false;
    render();
  } else if (a === "preview-skill") {
    const p = planes[Number(v)];
    const modal = document.createElement("div");
    modal.className = "dialog-backdrop";
    modal.innerHTML = `<div class="modal arsenal-modal" role="dialog" aria-modal="true" aria-label="Armamento de ${p.name}"><div class="eyebrow">ARSENAL / ${p.name}</div><div class="weapon-preview">${img(p.id)}<i></i><i></i><i></i></div><h3>${p.weapon}</h3><p>${p.secondary}. ${p.special ? "Tempestade Verde: rajadas durante 2 segundos, finalizando com dois mísseis guiados. Recarga de 16 segundos." : "Disparo automático. Melhorias aumentam vida, dano e cadência."}</p>${button("FECHAR PRÉVIA", "close-dialog", "primary")}</div>`;
    root.append(modal);
    modal.querySelector("button")?.focus();
  } else if (a === "close-dialog") {
    document.querySelector(".dialog-backdrop")?.remove();
  } else if (a === "wing") {
    save.wing = Number(v);
    render();
  } else if (a === "wingup") {
    const id = v === undefined ? save.wing : Number(v),
      cost = (save.wingLevels[id] || 1) * 200;
    if (save.coins >= cost) {
      save.coins -= cost;
      save.wingLevels[id] = (save.wingLevels[id] || 1) + 1;
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
  } else if (a === "export") {
    download(JSON.stringify(save, null, 2), "sky-strike-backup.json");
  } else if (a === "export-original") {
    download(startup.raw ?? "", "sky-strike-original.json");
  } else if (a === "restore-backup") {
    const raw =
      localStorage.getItem(SAVE_KEY + ".backup-v1") ||
      localStorage.getItem(SAVE_KEY + ".before-import");
    if (raw) {
      try {
        save = importProgress(raw, localStorage);
        recovery = false;
        preview = save.selected;
        render();
      } catch {
        document.querySelector("#backup-status")!.textContent =
          "A cópia também não pôde ser lida. Importe outro backup.";
      }
    } else
      document.querySelector("#backup-status")!.textContent =
        "Nenhuma cópia anterior encontrada. Importe um arquivo de backup.";
  } else if (a === "new-save") {
    const original = startup.raw;
    if (original !== null)
      localStorage.setItem(SAVE_KEY + ".unreadable", original);
    recovery = false;
    save = fresh();
    preview = 0;
    render();
  } else if (a === "start") start(Number(v));
  else if (a === "special")
    (game?.scene.getScene("battle") as Battle)?.special();
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
    audio.paused = false;
    tab = a === "exit" ? "hangar" : "home";
    render();
  }
});
root.addEventListener("change", async (e) => {
  const input = e.target as HTMLInputElement;
  if (input.id !== "import-save" || !input.files?.[0]) return;
  try {
    const file = input.files[0];
    if (file.size > 1024 * 1024) throw new Error("Backup maior que 1 MB.");
    const next = importProgress(await file.text(), localStorage);
    save = next;
    recovery = false;
    preview = save.selected;
    render();
    toast("Progresso importado com segurança.");
  } catch (error) {
    const status = document.querySelector("#backup-status");
    if (status)
      status.textContent =
        error instanceof Error ? error.message : "Falha ao importar.";
    input.value = "";
  }
});
if (recovery) recoveryScreen();
else render();
if (import.meta.env.PROD && "serviceWorker" in navigator)
  navigator.serviceWorker.register("./sw.js").catch(() => {});

export { game };
if (import.meta.env.DEV)
  Object.defineProperty(window, "__skyGame", {
    configurable: true,
    get: () => game,
  });
