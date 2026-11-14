import { test } from "node:test";
import assert from "node:assert/strict";
import { fresh, load, purchase, planes, upgrade } from "../src/data";
import { importProgress, readProgress, SAVE_KEY } from "../src/persistence";
function storage(initial: string | null) {
  const values = new Map<string, string>();
  if (initial !== null) values.set(SAVE_KEY, initial);
  return {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => {
      values.set(k, v);
    },
    values,
  };
}
test("migration creates a byte-for-byte recovery copy before any later write", () => {
  const old = { ...fresh(), version: 1, coins: 4321 };
  const raw = JSON.stringify(old);
  const st = storage(raw);
  const r = readProgress(st);
  assert.equal(r.save?.coins, 4321);
  assert.equal(r.save?.version, 2);
  assert.equal(st.getItem(SAVE_KEY + ".backup-v1"), raw);
  assert.equal(st.getItem(SAVE_KEY), raw);
});
test("unreadable progress is left intact, not silently replaced", () => {
  const st = storage("{unreadable");
  const result = readProgress(st);
  assert.ok(result.error);
  assert.equal(result.save, undefined);
  assert.equal(st.getItem(SAVE_KEY), "{unreadable");
});
test("import rejects bad data atomically and retains prior progress on success", () => {
  const previous = JSON.stringify(fresh());
  const st = storage(previous);
  for (const values of [
    { coins: -1 },
    { coins: 1e100 },
    { selected: 12 },
    { deviceLevels: [1, -2, 1, 1, 1] },
    { stars: { 0: 4 } },
    { unlocked: 100 },
    { volume: NaN },
    { favorites: [90] },
    { reducedEffects: "yes" },
  ]) {
    assert.throws(() =>
      importProgress(JSON.stringify({ ...fresh(), ...values }), st),
    );
    assert.equal(st.getItem(SAVE_KEY), previous);
  }
  const next = { ...fresh(), coins: 9876 };
  assert.equal(importProgress(JSON.stringify(next), st).coins, 9876);
  assert.equal(st.getItem(SAVE_KEY + ".before-import"), previous);
});
test("BR-29 is purchasable, equipable and upgradable without renumbering legacy aircraft", () => {
  const s = fresh();
  assert.equal(planes[0].name, "P-41 Sentinel");
  assert.equal(planes[11].name, "Archangel");
  assert.equal(planes[12].name, "BR-29 Falcão do Brasil");
  assert.equal(purchase(s, 12), true);
  s.selected = 12;
  const before = planes[12].hp * (1 + (s.levels[12] - 1) * 0.16);
  assert.equal(upgrade(s), true);
  assert.ok(planes[12].hp * (1 + (s.levels[12] - 1) * 0.16) > before);
  assert.deepEqual(load(JSON.stringify(s)), s);
  assert.equal(purchase(s, 12), false);
});
