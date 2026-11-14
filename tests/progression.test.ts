import { test } from "node:test";
import assert from "node:assert/strict";
import {
  fresh,
  load,
  purchase,
  upgrade,
  upgradeCost,
  power,
  reward,
  planes,
  stages,
} from "../src/data";
test("purchase is atomic and rejects duplicate or unaffordable purchases", () => {
  const s = fresh();
  s.coins = 100000;
  const initial = s.coins;
  assert.equal(purchase(s, 1), true);
  assert.equal(s.coins, initial - planes[1].price);
  assert.equal(purchase(s, 1), false);
  assert.equal(purchase(s, 11), false);
  s.coins = 0;
  assert.equal(purchase(s, 2), false);
  assert.equal(s.coins, 0);
});
test("upgrade deducts exact cost, increases power and persists", () => {
  const s = fresh(),
    before = power(s),
    cost = upgradeCost(s);
  assert.equal(upgrade(s), true);
  assert.equal(s.coins, 1200 - cost);
  assert.ok(power(s) > before);
  assert.deepEqual(load(JSON.stringify(s)), s);
  s.coins = 0;
  const level = s.levels[0];
  assert.equal(upgrade(s), false);
  assert.equal(s.levels[0], level);
});
test("victory unlocks next stage and preserves best stars", () => {
  const s = fresh();
  reward(s, 0, 3, 400);
  reward(s, 0, 1, 200);
  assert.equal(s.unlocked, 1);
  assert.equal(s.stars[0], 3);
  assert.equal(s.coins, 1800);
  assert.equal(s.stats.wins, 2);
  assert.equal(s.stats.earned, 600);
});
test("invalid saves recover and campaign has 30 configured stages", () => {
  assert.deepEqual(load("{broken"), fresh());
  assert.equal(stages.length, 30);
  assert.equal(planes.length, 12);
  assert.equal(new Set(stages.map((s) => s.environment)).size, 6);
});
