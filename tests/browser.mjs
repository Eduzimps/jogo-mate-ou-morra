import { chromium } from "@playwright/test";
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  hasTouch: true,
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:5173");
await page.screenshot({ path: "artifacts/menu.png" });
await page.getByRole("button", { name: "EXPLORAR HANGAR" }).click();
const before = await page.locator(".hangar-detail").innerText();
await page
  .getByRole("button", { name: /MELHORAR · ◈/ })
  .first()
  .click();
const after = await page.locator(".hangar-detail").innerText();
if (before === after) throw Error("Upgrade did not update");
await page.reload();
if (!(await page.locator(".hero").innerText()).includes("NÍVEL 2"))
  throw Error("Save did not persist");
await page.getByRole("button", { name: /INICIAR MISSÃO/ }).click();
await page.locator('[data-action="start:0"]').click();
await page.waitForFunction(async () => {
  const game = window.__skyGame;
  return !!game?.scene.getScene("battle")?.player;
});
await page.waitForTimeout(1000);
const state = () =>
  page.evaluate(async () => {
    const game = window.__skyGame;
    const b = game.scene.getScene("battle");
    return {
      x: b.player.x,
      y: b.player.y,
      bullets: b.bullets.length,
      enemies: b.enemies.length,
      hp: b.hp,
      max: b.maxHp,
      textures: game.textures.getTextureKeys(),
    };
  });
const initial = await state();
if (!initial.textures.includes("plane0") || initial.bullets < 1)
  throw Error("Combat did not load");
await page.keyboard.down("ArrowLeft");
await page.waitForTimeout(300);
await page.keyboard.up("ArrowLeft");
if ((await state()).x >= initial.x) throw Error("Keyboard failed");
const box = await page.locator("#field").boundingBox();
await page.mouse.move(box.x + box.width * 0.65, box.y + box.height * 0.75);
await page.waitForTimeout(400);
if ((await state()).x < 300) throw Error("Mouse failed");
await page.keyboard.press("1");
await page.keyboard.press("2");
await page.waitForTimeout(300);
await page.screenshot({ path: "artifacts/battle.png" });
await page.keyboard.press("Escape");
await page.getByRole("button", { name: "CONTINUAR" }).waitFor();
await page.getByRole("button", { name: "CONTINUAR" }).click();
await page.evaluate(async () => {
  const game = window.__skyGame;
  const b = game.scene.getScene("battle");
  b.shield = 0;
  b.inv = 0;
  b.hit(10);
  if (b.hp === b.maxHp) throw Error("Damage failed");
  b.ability(2);
  b.elapsed = 49;
});
await page.waitForTimeout(2000);
if (!(await page.locator(".bossbar").count())) throw Error("Boss missing");
await page.evaluate(async () => {
  const game = window.__skyGame;
  const b = game.scene.getScene("battle");
  const boss = b.enemies.find((e) => e.boss);
  boss.hp = boss.max * 0.3;
});
await page.waitForTimeout(200);
if (!(await page.locator(".bossbar").innerText()).includes("FASE 3"))
  throw Error("Boss phases failed");
await page.screenshot({ path: "artifacts/boss.png" });
await page.evaluate(async () => {
  const game = window.__skyGame;
  game.scene.getScene("battle").enemies.find((e) => e.boss).hp = 0;
});
await page.getByText("Missão cumprida.").waitFor();
await page.getByRole("button", { name: "VOLTAR AO HANGAR" }).click();
await page.locator('[data-action="campaign"]').first().click();
if (await page.locator('[data-action="start:1"]').isDisabled())
  throw Error("Unlock failed");
await page.locator('[data-action="start:1"]').click();
await page.waitForTimeout(1000);
await page.evaluate(async () => {
  const game = window.__skyGame;
  const b = game.scene.getScene("battle");
  b.inv = 0;
  b.shield = 0;
  b.hit(999999);
});
await page.getByText("Aeronave abatida.").waitFor();
await page.getByRole("button", { name: "TENTAR NOVAMENTE" }).click();
await page.waitForTimeout(1500);
if ((await state()).hp <= 0) throw Error("Retry failed");
await page.getByRole("button", { name: "ABORTAR MISSÃO" }).click();
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: "artifacts/mobile.png" });
if (
  await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
)
  throw Error("Mobile overflow");
await page.getByRole("button", { name: /INICIAR MISSÃO/ }).click();
await page.locator('[data-action="start:0"]').click();
await page.waitForTimeout(1500);
const cdp = await page.context().newCDPSession(page);
const bounds = await page.locator("#field").boundingBox();
await cdp.send("Input.dispatchTouchEvent", {
  type: "touchStart",
  touchPoints: [
    { x: bounds.x + bounds.width * 0.4, y: bounds.y + bounds.height * 0.8 },
  ],
});
await cdp.send("Input.dispatchTouchEvent", {
  type: "touchMove",
  touchPoints: [
    { x: bounds.x + bounds.width * 0.7, y: bounds.y + bounds.height * 0.6 },
  ],
});
await page.waitForTimeout(300);
await cdp.send("Input.dispatchTouchEvent", {
  type: "touchEnd",
  touchPoints: [],
});
if ((await state()).x < 300) throw Error("Touch movement failed");
console.log(
  JSON.stringify({
    initial,
    errors,
    checks: [
      "upgrade",
      "persistence",
      "keyboard",
      "mouse",
      "touch",
      "skills",
      "pause",
      "damage",
      "boss phases",
      "victory",
      "unlock",
      "defeat",
      "retry",
      "mobile layout",
    ],
  }),
);
await browser.close();
if (errors.length) process.exit(1);
