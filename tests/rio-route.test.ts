import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getRioRoute,
  RIO_DEFAULT_DURATION,
  RIO_FIELD_HEIGHT,
  RIO_LANDMARK_Y,
  RIO_WORLD_HEIGHT,
} from "../src/world/rioRoute";

const at = (progress: number) => getRioRoute(progress * 100, 100);

test("Guanabara begins over the ocean and ends without repeating the terrain", () => {
  const start = getRioRoute(0);
  assert.equal(start.progress, 0);
  assert.equal(start.section, "ocean");
  assert.equal(start.cameraY, RIO_WORLD_HEIGHT - RIO_FIELD_HEIGHT);
  assert.equal(start.bossReady, false);
  assert.ok(start.landmarkScreenY < 0);

  const end = getRioRoute(RIO_DEFAULT_DURATION);
  assert.equal(end.section, "finale");
  assert.equal(end.progress, 1);
  assert.equal(end.cameraY, 0);
  assert.equal(end.bossReady, true);
  assert.deepEqual(getRioRoute(RIO_DEFAULT_DURATION * 10), end);
});

test("the five route sections follow the specified mission thresholds", () => {
  assert.equal(at(0.1999).section, "ocean");
  assert.equal(at(0.2).section, "coast");
  assert.equal(at(0.4199).section, "coast");
  assert.equal(at(0.42).section, "hills");
  assert.equal(at(0.6499).section, "hills");
  assert.equal(at(0.65).section, "christ");
  assert.equal(at(0.8499).section, "christ");
  assert.equal(at(0.85).section, "finale");
  for (const p of [0, 0.2, 0.42, 0.65, 0.85]) assert.ok(at(p).label.length > 5);
});

test("camera scroll is continuous, bounded and strictly monotonic", () => {
  let previous = at(0).cameraY;
  for (let i = 1; i <= 10000; i++) {
    const current = at(i / 10000).cameraY;
    assert.ok(current < previous, `camera reversed at ${i / 10000}`);
    assert.ok(current >= 0 && current <= RIO_WORLD_HEIGHT - RIO_FIELD_HEIGHT);
    previous = current;
  }
  for (const boundary of [0.2, 0.42, 0.65, 0.85]) {
    const before = at(boundary - 0.000001).cameraY;
    const after = at(boundary + 0.000001).cameraY;
    assert.ok(before - after < 0.02);
  }
});

test("Christ is a visible, slower landmark and passes beneath the plane before the boss", () => {
  const entry = at(0.65);
  const exit = at(0.85);
  assert.equal(entry.landmarkScreenY, RIO_LANDMARK_Y - entry.cameraY);
  assert.ok(entry.landmarkScreenY >= 0);
  assert.ok(entry.landmarkScreenY < RIO_FIELD_HEIGHT);
  assert.ok(entry.landmarkScreenY < 790);
  assert.ok(exit.landmarkScreenY > 790);
  assert.equal(exit.bossReady, false);
  assert.ok(at(1).landmarkScreenY > RIO_FIELD_HEIGHT);

  const hillSpeed = (at(0.45).cameraY - at(0.6).cameraY) / 0.15;
  const cinematicSpeed = (at(0.68).cameraY - at(0.82).cameraY) / 0.14;
  assert.ok(cinematicSpeed < hillSpeed * 0.8);
  assert.ok(entry.cloudSpeed < at(0.45).cloudSpeed);
});

test("absolute time is deterministic and invalid timing never creates NaN coordinates", () => {
  assert.deepEqual(getRioRoute(24, 48), getRioRoute(50, 100));
  assert.deepEqual(getRioRoute(-10), getRioRoute(0));
  assert.deepEqual(getRioRoute(Number.NaN), getRioRoute(0));
  assert.deepEqual(getRioRoute(Number.POSITIVE_INFINITY), getRioRoute(0));
  for (const duration of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    const state = getRioRoute(20, duration);
    assert.deepEqual(state, getRioRoute(20));
    assert.ok(Number.isFinite(state.cameraY));
    assert.ok(Number.isFinite(state.landmarkScreenY));
  }
});
