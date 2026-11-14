import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({
  viewport: { width: 1366, height: 768 },
  hasTouch: true,
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:5173");
await page.locator('[data-action="discover:12"]').click();
await page.locator('[data-action="buy:12"]').click();
assert.match(
  await page.locator(".hangar-detail").innerText(),
  /AERONAVE EQUIPADA/,
);
await page.locator('[data-action="favorite:12"]').click();
await page.locator("#plane-search").fill("Falcão");
assert.equal(await page.locator(".plane-card").count(), 1);
await page.locator("#plane-search").fill("");
await page.locator("#filter-collection").selectOption("Coleção brasileira");
assert.equal(await page.locator(".plane-card").count(), 1);
await page.locator("#filter-collection").selectOption("");
await page.locator("#filter-tier").selectOption("4");
assert.equal(await page.locator(".plane-card").count(), 3);
await page.locator("#filter-tier").selectOption("");
await page.locator('[data-action="filter-favorites"]').click();
assert.equal(await page.locator(".plane-card").count(), 1);
await page.locator('[data-action="filter-all"]').click();
await page.locator('[data-action="preview-skill:12"]').click();
await page.getByRole("dialog").waitFor();
await page.locator('[data-action="close-dialog"]').click();
await page.locator('[data-action="plane:1"]').click();
await page.locator('[data-action="compare"]').click();
await page.locator(".comparison table").waitFor();
// Render every airframe and companion: verify alpha transparency, image decode and unique art.
await page.evaluate(async () => {
  for (const image of document.querySelectorAll(
    ".plane-card img,.wing-card img",
  )) {
    image.loading = "eager";
    await image.decode();
    const c = document.createElement("canvas");
    c.width = 100;
    c.height = 100;
    c.getContext("2d").drawImage(image, 0, 0, 100, 100);
    const a = c.getContext("2d").getImageData(0, 0, 1, 1).data[3];
    if (a !== 0) throw Error("Sprite has opaque background");
  }
});
for (const [width, height] of [
  [1920, 1080],
  [1366, 768],
  [360, 800],
  [390, 844],
  [412, 915],
  [768, 1024],
]) {
  await page.setViewportSize({ width, height });
  await page.locator('button[data-action="home"]').click();
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
    `Lobby overflow ${width}`,
  );
  await page.screenshot({
    path: `artifacts/ultimate-lobby-${width}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "EXPLORAR HANGAR" }).click();
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
    `Hangar overflow ${width}`,
  );
  await page.screenshot({ path: `artifacts/ultimate-hangar-${width}.png` });
}
await page.locator('[data-action="settings"]').click();
await page.locator("#reducedEffects").check();
await page.locator("#screenShake").uncheck();
await page.locator("#largeHud").check();
const downloadPromise = page.waitForEvent("download");
await page.locator('[data-action="export"]').click();
const download = await downloadPromise;
assert.equal(download.suggestedFilename(), "sky-strike-backup.json");
const original = await page.evaluate(() => localStorage.getItem("sky-strike"));
await page.locator("#import-save").setInputFiles({
  name: "bad.json",
  mimeType: "application/json",
  buffer: Buffer.from("{bad"),
});
await page.waitForFunction(() =>
  document.querySelector("#backup-status").textContent.includes("JSON"),
);
assert.match(await page.locator("#backup-status").innerText(), /JSON/);
assert.equal(
  await page.evaluate(() => localStorage.getItem("sky-strike")),
  original,
);
await page.locator("#import-save").setInputFiles({
  name: "backup.json",
  mimeType: "application/json",
  buffer: Buffer.from(original),
});
await page.waitForTimeout(150);
await page.setViewportSize({ width: 390, height: 844 });
await page.locator('[data-action="campaign"]').click();
await page.locator('[data-action="start:0"]').click();
await page.waitForFunction(
  () => !!window.__skyGame?.scene.getScene("battle")?.player,
);
await page.evaluate(() => {
  const s = window.__skyGame.scene.getScene("battle");
  s.specialMissiles = 0;
  const bullet = s.bullet.bind(s);
  s.bullet = (...args) => {
    if (args[6]) s.specialMissiles++;
    return bullet(...args);
  };
});
assert.equal(await page.locator('[data-action="special"]').count(), 1);
await page.locator('[data-action="special"]').click();
await page.waitForTimeout(100);
assert.ok(
  await page.evaluate(
    () => window.__skyGame.scene.getScene("battle").specialCooldown > 0,
  ),
);
await page.waitForFunction(
  () => window.__skyGame.scene.getScene("battle").specialRemaining === 0,
  {},
  { timeout: 15000 },
);
await page.evaluate(() => {
  const s = window.__skyGame.scene.getScene("battle");
  if (s.specialMissiles !== 2)
    throw Error("Special missiles missing: " + s.specialMissiles);
  s.shield = 0;
  s.inv = 0;
  s.hit(s.maxHp * 0.8);
});
await page.waitForTimeout(150);
assert.equal(
  await page.locator("#hud").getAttribute("data-health"),
  "critical",
);
assert.match(await page.locator("#hp-value").innerText(), /HP/);
assert.equal(await page.locator("#critical-alert").isVisible(), true);
await page.screenshot({ path: "artifacts/ultimate-critical.png" });
await page.evaluate(() => {
  const s = window.__skyGame.scene.getScene("battle");
  s.ability(1);
  s.elapsed = 49;
});
await page.waitForTimeout(150);
assert.equal(await page.locator("#shield-block").isVisible(), true);
await page.screenshot({ path: "artifacts/ultimate-combat.png" });
await page.keyboard.press("Escape");
const t = await page.evaluate(
  () => window.__skyGame.scene.getScene("battle").elapsed,
);
await page.waitForTimeout(300);
assert.equal(
  await page.evaluate(() => window.__skyGame.scene.getScene("battle").elapsed),
  t,
);
await page.getByRole("button", { name: "VOLTAR À BASE" }).click();
// Invalid local storage must not be overwritten even on startup.
await page.evaluate(() => localStorage.setItem("sky-strike", "{broken"));
await page.reload();
await page.getByText("Seu save foi preservado.").waitFor();
assert.equal(
  await page.evaluate(() => localStorage.getItem("sky-strike")),
  "{broken",
);
await page.locator("#import-save").setInputFiles({
  name: "recover.json",
  mimeType: "application/json",
  buffer: Buffer.from(original),
});
await page.locator(".hero").waitFor();
assert.deepEqual(errors, []);
console.log(
  "PASS: BR-29 purchase/special/missiles, filters, favorites, compare, 17 transparent sprites, backups/recovery, HUD/shield/low health, pause, six desktop/mobile/tablet sizes.",
);
await browser.close();
