import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const baseURL = process.env.SKY_STRIKE_TEST_URL || "http://127.0.0.1:4173";
const context = await browser.newContext();
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(baseURL);
await page.evaluate(() => navigator.serviceWorker.ready);
await page.reload();
await page.waitForTimeout(1000);
await page.evaluate(() => {
  const progress = JSON.parse(localStorage.getItem("sky-strike"));
  progress.unlocked = 29;
  localStorage.setItem("sky-strike", JSON.stringify(progress));
});
await context.setOffline(true);
await page.reload();
assert.equal(
  await page.evaluate(() => !!window.__skyGame),
  false,
  "Production must not expose development controls",
);
for (let mission = 0; mission < 6; mission++) {
  await page.locator('[data-action="campaign"]').first().click();
  await page.locator(`[data-action="start:${mission}"]`).click();
  await page.locator("#hud progress").first().waitFor();
  await page.waitForTimeout(500);
  assert.equal(
    await page.locator("canvas").count(),
    1,
    `No offline battle ${mission}`,
  );
  assert.equal(
    await page.locator("#loading").count(),
    0,
    `World ${mission} failed to load`,
  );
  assert.ok(
    await page.locator("#route-caption strong").innerText(),
    `Missing route ${mission}`,
  );
  await page.keyboard.press("Escape");
  await page.locator('#overlay [data-action="abort"]').click();
}
await page.locator('[data-action="arsenal"]').first().click();
await page.locator('[data-action="train"]').click();
await page.locator("#hud progress").first().waitFor();
assert.equal(await page.locator("#training-weapon option").count(), 31);
await page.locator("#training-weapon").selectOption("quantum");
await page.locator("#training-level").selectOption("5");
const field = await page.locator("canvas").boundingBox();
assert.ok(field);
await page.mouse.move(field.x + field.width / 2, field.y + field.height * 0.8);
await page.waitForFunction(
  () =>
    Number(
      document.getElementById("score-value")?.textContent?.replace(/\D/g, ""),
    ) > 0,
  undefined,
  { timeout: 10000 },
);
assert.match(await page.locator("#coins-value").innerText(), /TREINO GRATUITO/);
assert.ok(
  Number((await page.locator("#score-value").innerText()).replace(/\D/g, "")) >
    0,
  "Offline training must deal actual damage",
);
if (errors.length) throw Error(errors.join("\n"));
console.log(
  "PASS: production reload, all six Brazilian maps and arsenal training work offline",
);
await browser.close();
