import { test } from "node:test";
import assert from "node:assert/strict";
import { load, power } from "../src/data";
const legacy = {
  version: 1,
  coins: 28755,
  gems: 34,
  selected: 11,
  owned: [0, 2, 7, 11],
  levels: { 0: 4, 2: 8, 7: 5, 11: 9 },
  stats: {
    kills: 3421,
    wins: 64,
    bosses: 55,
    earned: 48000,
    upgrades: 32,
    perfect: 7,
  },
  stars: { 0: 3, 1: 2, 29: 1 },
  unlocked: 29,
  wing: 3,
  wingLevel: 6,
  wingLevels: { 0: 2, 1: 4, 2: 5, 3: 6 },
  deviceLevels: [3, 2, 4, 5, 6],
  equipped: [1, 3, 4],
  difficulty: "Difícil",
  volume: 0.65,
  daily: "13/11/2026",
  claimed: ["wins", "kills"],
};
test("old save retains all progression, numeric IDs, equipment and settings", () => {
  const s = load(JSON.stringify(legacy));
  for (const key of Object.keys(legacy).filter((k) => k !== "version"))
    assert.deepEqual(
      s[key as keyof typeof s],
      legacy[key as keyof typeof legacy],
      key,
    );
  assert.equal(power(s), Math.round((34 * 10 + 232) * (1 + 8 * 0.16)));
  assert.deepEqual(load(JSON.stringify(s)), s);
});
test("old save without per-wing levels retains its equipped wing upgrade", () => {
  const { wingLevels, ...early } = legacy;
  const s = load(JSON.stringify(early));
  assert.equal(s.wingLevels[3], 6);
});
