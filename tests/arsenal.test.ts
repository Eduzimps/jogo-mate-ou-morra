import { test } from "node:test";
import assert from "node:assert/strict";
import {
  weapons,
  getWeapon,
  getWeaponStats,
  freshArsenal,
  defaultLoadout,
  migrateArsenal,
  purchaseWeapon,
  upgradeWeapon,
  weaponUpgradeCost,
  equipWeapon,
  type ArsenalSave,
} from "../src/arsenal";
import { fresh, load, purchase, upgrade, planes } from "../src/data";
const state = (): ArsenalSave => ({
  ...freshArsenal([0, 1, 12]),
  coins: 10000,
  owned: [0, 1, 12],
  selected: 0,
});
test("arsenal has unique IDs and complete configured categories", () => {
  assert.equal(new Set(weapons.map((w) => w.id)).size, 31);
  assert.deepEqual(
    ["primary", "secondary", "special", "tactical"].map(
      (c) => weapons.filter((w) => w.category === c).length,
    ),
    [10, 7, 8, 6],
  );
  for (const w of weapons) {
    assert.ok(w.name && w.description);
    assert.ok(Number.isFinite(w.baseDamage) && w.interval > 0);
    assert.ok(w.price >= 0);
    assert.ok(getWeaponStats(w, 5).damage >= getWeaponStats(w, 1).damage);
    assert.ok(getWeaponStats(w, 5).interval < getWeaponStats(w, 1).interval);
  }
});
test("legacy arsenal migration preserves aircraft identity and independent default patterns", () => {
  const s = migrateArsenal({ version: 2 }, [0, 1, 2, 12]);
  assert.equal(s.loadouts[0].primary, "dual");
  assert.equal(s.loadouts[1].primary, "shotgun");
  assert.equal(s.loadouts[2].left, "homing");
  assert.equal(s.loadouts[12].special, "green-storm");
  s.loadouts[0].left = null;
  assert.equal(s.loadouts[1].left, "rockets");
  assert.deepEqual(
    migrateArsenal(s as unknown as Record<string, unknown>, [0, 1, 2, 12]),
    s,
  );
});
test("purchase rejects duplicates and insufficient funds atomically", () => {
  const s = state();
  const before = s.coins;
  assert.equal(purchaseWeapon(s, "minigun"), true);
  assert.equal(s.coins, before - getWeapon("minigun")!.price);
  assert.equal(purchaseWeapon(s, "minigun"), false);
  assert.equal(purchaseWeapon(s, "unknown"), false);
  s.coins = 0;
  assert.equal(purchaseWeapon(s, "quantum"), false);
  assert.equal(s.coins, 0);
});
test("five upgrade levels cost progressively more and increase actual damage, cadence and estimated DPS", () => {
  const s = state();
  purchaseWeapon(s, "triple");
  const first = getWeaponStats("triple", 1);
  let previous = 0;
  for (let level = 1; level < 5; level++) {
    const cost = weaponUpgradeCost(s, "triple");
    assert.ok(cost > previous);
    previous = cost;
    s.coins = 100000;
    assert.equal(upgradeWeapon(s, "triple"), true);
    assert.equal(s.weaponLevels.triple, level + 1);
  }
  const final = getWeaponStats("triple", s.weaponLevels.triple);
  assert.ok(final.damage > first.damage);
  assert.ok(final.interval < first.interval);
  assert.ok(final.dps > first.dps);
  assert.equal(weaponUpgradeCost(s, "triple"), 0);
  const coins = s.coins;
  assert.equal(upgradeWeapon(s, "triple"), false);
  assert.equal(s.coins, coins);
});
test("loadouts enforce ownership and category and persist per aircraft", () => {
  const s = state();
  assert.equal(equipWeapon(s, 0, "primary", "minigun"), false);
  purchaseWeapon(s, "minigun");
  assert.equal(equipWeapon(s, 0, "left", "minigun"), false);
  assert.equal(equipWeapon(s, 5, "primary", "minigun"), false);
  assert.equal(equipWeapon(s, 0, "primary", "minigun"), true);
  assert.equal(equipWeapon(s, 0, "left", null), true);
  assert.equal(equipWeapon(s, 0, "primary", null), false);
  assert.equal(s.loadouts[0].primary, "minigun");
  assert.equal(s.loadouts[1].primary, "shotgun");
  assert.deepEqual(
    migrateArsenal(JSON.parse(JSON.stringify(s)), s.owned).loadouts,
    s.loadouts,
  );
});
test("strict import rejects malformed arsenal without modifying input", () => {
  const s = state();
  for (const patch of [
    { weaponOwned: ["unknown"] },
    { weaponLevels: { dual: 6 } },
    { loadouts: { 99: defaultLoadout(0) } },
    { loadouts: { 0: { ...defaultLoadout(0), primary: "homing" } } },
    { loadouts: { 0: { ...defaultLoadout(0), primary: "quantum" } } },
  ]) {
    const raw = { ...s, ...patch };
    const before = JSON.stringify(raw);
    assert.throws(() => migrateArsenal(raw, s.owned));
    assert.equal(JSON.stringify(raw), before);
  }
  assert.throws(() => migrateArsenal({ weaponOwned: [] }, s.owned));
});
test("spread upgrades change actual projectile count and direct DPS is mathematically consistent", () => {
  assert.equal(getWeaponStats("shotgun", 1).count, 5);
  assert.equal(getWeaponStats("shotgun", 3).count, 6);
  assert.equal(getWeaponStats("shotgun", 5).count, 7);
  const s = getWeaponStats("dual", 2);
  assert.equal(s.dps, (s.damage * s.count * 1000) / s.interval);
  assert.equal(getWeaponStats("repair", 5).dps, 0);
});

test("accepted subset inventory stays valid after every aircraft purchase without granting weapons", () => {
  const source = fresh();
  source.coins = 1000000;
  source.unlocked = 29;
  source.weaponOwned = ["single", "emp", "turbo"];
  source.weaponLevels = { single: 1, emp: 1, turbo: 1 };
  source.loadouts = {
    0: {
      primary: "single",
      left: null,
      right: null,
      special: "emp",
      tactical: "turbo",
    },
  };
  const s = load(JSON.stringify(source));
  const inventory = [...s.weaponOwned];
  for (const p of planes.slice(1)) {
    const before = s.coins;
    assert.equal(purchase(s, p.id), true);
    assert.equal(s.coins, before - p.price);
    assert.deepEqual(s.weaponOwned, inventory);
    assert.deepEqual(s.loadouts[p.id], {
      primary: "single",
      left: null,
      right: null,
      special: "emp",
      tactical: "turbo",
    });
    assert.deepEqual(load(JSON.stringify(s)), s);
  }
});
test("aircraft upgrades respect the reader's supported level boundary atomically", () => {
  const source = fresh();
  source.coins = Number.MAX_SAFE_INTEGER;
  source.levels[0] = 99999;
  const s = load(JSON.stringify(source));
  assert.equal(upgrade(s), true);
  assert.equal(s.levels[0], 100000);
  const before = JSON.stringify(s);
  assert.equal(upgrade(s), false);
  assert.equal(JSON.stringify(s), before);
  assert.deepEqual(load(JSON.stringify(s)), s);
});

test("graphics quality import accepts only a literal supported string", () => {
  for (const quality of [["low"], { value: "high" }, true, 1, "ultra"]) {
    assert.throws(() => load(JSON.stringify({ ...fresh(), quality })));
  }
  for (const quality of ["low", "medium", "high"] as const) {
    assert.equal(
      load(JSON.stringify({ ...fresh(), quality })).quality,
      quality,
    );
  }
});
