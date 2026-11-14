import { test } from "node:test";
import assert from "node:assert/strict";
import { statSync, readFileSync } from "node:fs";
import {
  brazilRegions,
  brazilRegionForStage,
  getBrazilRoute,
  BRAZIL_WORLD_HEIGHT,
  BRAZIL_VIEW_HEIGHT,
  type BrazilRegion,
} from "../src/world/brazilRegions";

test("five new authored regions map only to existing mission IDs1..5", () => {
  const regions = Object.keys(brazilRegions) as BrazilRegion[];
  assert.equal(regions.length, 5);
  assert.equal(new Set(regions.map((id) => brazilRegions[id].label)).size, 5);
  assert.equal(brazilRegionForStage(0), null);
  assert.equal(brazilRegionForStage(6), null);
  assert.equal(brazilRegionForStage(-1), null);
  assert.equal(brazilRegionForStage(2.2), null);
  assert.deepEqual([1, 2, 3, 4, 5].map(brazilRegionForStage), [
    "amazon",
    "pantanal",
    "brasilia",
    "iguacu",
    "atlantic",
  ]);
});
test("all Brazilian routes progress once, expose distinct sections and hold their final frame", () => {
  for (const region of Object.keys(brazilRegions) as BrazilRegion[]) {
    const first = getBrazilRoute(region, 0, 50),
      last = getBrazilRoute(region, 50, 50);
    assert.equal(first.cameraY, BRAZIL_WORLD_HEIGHT - BRAZIL_VIEW_HEIGHT);
    assert.equal(last.cameraY, 0);
    assert.equal(last.finished, true);
    assert.deepEqual(
      [0.01, 0.26, 0.51, 0.76].map(
        (p) => getBrazilRoute(region, p * 50, 50).label,
      ),
      [...brazilRegions[region].sections],
    );
    const beyond = getBrazilRoute(region, 500, 50);
    assert.deepEqual(beyond, last);
    let previous = Infinity;
    for (let i = 0; i <= 500; i++) {
      const state = getBrazilRoute(region, i / 10, 50);
      assert.ok(state.cameraY <= previous);
      assert.ok(state.cameraX >= 0 && state.cameraX <= 180);
      previous = state.cameraY;
    }
    assert.ok(Number.isFinite(getBrazilRoute(region, NaN, 0).cameraY));
  }
});
test("five optimized original map assets fit the deployment budget and safe texture dimensions", () => {
  let total = 0;
  for (const region of Object.keys(brazilRegions)) {
    const path = new URL(
      `../public/assets/brazil/${region}.webp`,
      import.meta.url,
    );
    total += statSync(path).size;
    const file = readFileSync(path);
    assert.equal(file.toString("ascii", 0, 4), "RIFF");
    assert.equal(file.toString("ascii", 8, 12), "WEBP");
    assert.equal(file.toString("ascii", 12, 16), "VP8 ");
    assert.equal(file.readUInt16LE(26) & 0x3fff, 512);
    assert.equal(file.readUInt16LE(28) & 0x3fff, 1536);
  }
  assert.ok(total < 2 * 1024 * 1024, `map budget exceeded: ${total}`);
});
