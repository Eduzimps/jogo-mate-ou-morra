import Phaser from "phaser";
import {
  brazilRegions,
  getBrazilRoute,
  BRAZIL_WORLD_HEIGHT,
  BRAZIL_WORLD_WIDTH,
  type BrazilRegion,
  type BrazilRouteState,
} from "./brazilRegions";

/** Original authored Brazilian routes. Their terrain moves; combat coordinates never do.
 * A single 512×1536 WebP is loaded only for the selected region. */
export class BrazilWorld {
  static preload(scene: Phaser.Scene, region: BrazilRegion) {
    scene.load.image(
      "brazil-" + region,
      `${import.meta.env.BASE_URL}assets/brazil/${region}.webp`,
    );
  }
  static hasAssets(scene: Phaser.Scene, region: BrazilRegion) {
    return scene.textures.exists("brazil-" + region);
  }
  readonly region: BrazilRegion;
  readonly terrainContainer: Phaser.GameObjects.Container;
  readonly terrainDepth = 0.5;
  state: BrazilRouteState;
  private readonly scene: Phaser.Scene;
  private readonly reduced: boolean;
  private readonly mist: Phaser.GameObjects.TileSprite;
  private readonly shadows: Phaser.GameObjects.TileSprite;
  private readonly water: Phaser.GameObjects.TileSprite;
  private readonly waterMask: Phaser.GameObjects.Graphics;
  private readonly mask: Phaser.Display.Masks.GeometryMask;
  private readonly movingDecor: Phaser.GameObjects.Container[] = [];
  private readonly decorOrigins: number[] = [];
  private falls?: Phaser.GameObjects.TileSprite;
  private spray?: Phaser.GameObjects.Image;
  private drift = 0;
  get label() {
    return this.state.label;
  }
  get section() {
    return this.state.section;
  }
  get progress() {
    return this.state.progress;
  }
  constructor(scene: Phaser.Scene, region: BrazilRegion, reduced = false) {
    this.scene = scene;
    this.region = region;
    this.reduced = reduced;
    this.state = getBrazilRoute(region, 0, 50);
    this.makeAtmosphere();
    this.terrainContainer = scene.add
      .container(0, 0)
      .setDepth(this.terrainDepth);
    this.terrainContainer.add(
      scene.add
        .image(0, 0, "brazil-" + region)
        .setOrigin(0)
        .setDisplaySize(BRAZIL_WORLD_WIDTH, BRAZIL_WORLD_HEIGHT),
    );
    this.water = scene.add
      .tileSprite(270, 480, 540, 960, "brazil-shimmer")
      .setDepth(0.7)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(reduced ? 0.025 : 0.055);
    this.waterMask = scene.make.graphics({ x: 0, y: 0 });
    this.drawWaterMask();
    this.mask = this.waterMask.createGeometryMask();
    this.water.setMask(this.mask);
    this.addMovingDecor();
    if (region === "iguacu") {
      this.falls = scene.add
        .tileSprite(380, 1120, 560, 700, "brazil-falls")
        .setAlpha(reduced ? 0.045 : 0.11)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.spray = scene.add
        .image(390, 1210, "brazil-spray")
        .setDisplaySize(650, 440)
        .setAlpha(reduced ? 0.11 : 0.23);
      this.terrainContainer.add([this.falls, this.spray]);
    }
    this.shadows = scene.add
      .tileSprite(270, 480, 540, 960, "brazil-mist")
      .setDepth(1.2)
      .setTint(0x061b28)
      .setAlpha(reduced ? 0.035 : 0.095);
    this.mist = scene.add
      .tileSprite(270, 480, 540, 960, "brazil-mist")
      .setDepth(2.1)
      .setAlpha(brazilRegions[region].mist * (reduced ? 0.45 : 1));
    this.update(0, 50, 0);
  }
  private makeAtmosphere() {
    if (this.scene.textures.exists("brazil-mist")) return;
    let seed = 194508;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const mist = document.createElement("canvas");
    mist.width = 768;
    mist.height = 1024;
    const m = mist.getContext("2d")!;
    for (let cluster = 0; cluster < 7; cluster++) {
      const cx = random() * 768,
        cy = random() * 1024;
      for (let puff = 0; puff < 9; puff++) {
        const x = cx + (random() - 0.5) * 180,
          y = cy + (random() - 0.5) * 130,
          r = 40 + random() * 85;
        const gradient = m.createRadialGradient(x, y, 0, x, y, r);
        gradient.addColorStop(0, "#f5f3e8b5");
        gradient.addColorStop(0.5, "#dcebee55");
        gradient.addColorStop(1, "#dbeeff00");
        m.fillStyle = gradient;
        m.fillRect(x - r, y - r, r * 2, r * 2);
      }
    }
    this.scene.textures.addCanvas("brazil-mist", mist);
    const shimmer = document.createElement("canvas");
    shimmer.width = 512;
    shimmer.height = 512;
    const c = shimmer.getContext("2d")!;
    for (let i = 0; i < 1400; i++) {
      const x = random() * 512,
        y = random() * 512;
      c.strokeStyle = `rgba(205,239,225,${0.12 + random() * 0.5})`;
      c.lineWidth = 0.5 + random();
      c.beginPath();
      c.moveTo(x, y);
      c.quadraticCurveTo(x + 3, y - 2, x + 5 + random() * 14, y);
      c.stroke();
    }
    this.scene.textures.addCanvas("brazil-shimmer", shimmer);
    const streaks = document.createElement("canvas");
    streaks.width = 512;
    streaks.height = 512;
    const f = streaks.getContext("2d")!;
    for (let i = 0; i < 210; i++) {
      const x = random() * 512,
        y = random() * 512;
      f.strokeStyle = `rgba(222,247,250,${0.04 + random() * 0.2})`;
      f.lineWidth = 0.5 + random() * 2;
      f.beginPath();
      f.moveTo(x, y);
      f.lineTo(x + (random() - 0.5) * 6, y + 15 + random() * 70);
      f.stroke();
    }
    this.scene.textures.addCanvas("brazil-falls", streaks);
    const spray = document.createElement("canvas");
    spray.width = 512;
    spray.height = 256;
    const s = spray.getContext("2d")!;
    for (let i = 0; i < 22; i++) {
      const x = 40 + random() * 432,
        y = 45 + random() * 160,
        r = 40 + random() * 65;
      const gradient = s.createRadialGradient(x, y, 0, x, y, r);
      gradient.addColorStop(0, "#f0f6eccc");
      gradient.addColorStop(1, "#ddeeff00");
      s.fillStyle = gradient;
      s.fillRect(x - r, y - r, r * 2, r * 2);
    }
    this.scene.textures.addCanvas("brazil-spray", spray);
  }
  private drawWaterMask() {
    const g = this.waterMask;
    g.fillStyle(0xffffff);
    if (this.region === "brasilia") {
      g.fillRect(339, 1200, 44, 310);
      g.fillRect(258, 280, 30, 230);
    } else if (this.region === "amazon") {
      g.fillPoints(
        [
          { x: 290, y: 430 },
          { x: 480, y: 730 },
          { x: 340, y: 1100 },
          { x: 490, y: 1540 },
          { x: 440, y: 2160 },
          { x: 240, y: 2160 },
          { x: 300, y: 1530 },
          { x: 180, y: 1100 },
          { x: 310, y: 740 },
        ],
        true,
      );
    } else if (this.region === "iguacu") {
      g.fillPoints(
        [
          { x: 290, y: 0 },
          { x: 520, y: 0 },
          { x: 520, y: 550 },
          { x: 690, y: 1050 },
          { x: 500, y: 1600 },
          { x: 440, y: 2160 },
          { x: 190, y: 2160 },
          { x: 240, y: 1580 },
          { x: 240, y: 1110 },
          { x: 220, y: 600 },
        ],
        true,
      );
    } else if (this.region === "atlantic") {
      g.fillRect(0, 1620, 720, 540);
      g.fillRect(290, 520, 430, 400);
      g.fillRect(400, 870, 320, 680);
    } else {
      g.fillRect(0, 500, 720, 1660);
    }
  }
  private addMovingDecor() {
    const scene = this.scene;
    if (this.region === "brasilia") {
      for (const [x, y] of [
        [330, 1960],
        [365, 1870],
        [380, 1680],
      ]) {
        const vehicle = scene.add.container(x, y);
        vehicle.add([
          scene.add.rectangle(3, 4, 10, 23, 0x071f28, 0.3),
          scene.add
            .rectangle(0, 0, 9, 21, 0x9bbaaf)
            .setStrokeStyle(1, 0x183439),
          scene.add.rectangle(0, -3, 7, 6, 0x234854),
        ]);
        this.movingDecor.push(vehicle);
        this.decorOrigins.push(y);
        this.terrainContainer.add(vehicle);
      }
    } else if (this.region !== "iguacu") {
      const positions =
        this.region === "atlantic"
          ? [
              [360, 1970],
              [580, 1800],
            ]
          : this.region === "amazon"
            ? [
                [360, 1860],
                [370, 1540],
              ]
            : [
                [270, 1970],
                [450, 1560],
              ];
      for (const [x, y] of positions) {
        const boat = scene.add.container(x, y);
        boat.add([
          scene.add.triangle(0, 20, 0, 0, 16, 65, 32, 0, 0xcbe5d7, 0.15),
          scene.add.ellipse(0, 0, 12, 36, 0xd4d9ba).setStrokeStyle(1, 0x244a50),
          scene.add.rectangle(0, -1, 7, 14, 0x3e6265),
        ]);
        this.movingDecor.push(boat);
        this.decorOrigins.push(y);
        this.terrainContainer.add(boat);
      }
    }
  }
  update(elapsed: number, duration: number, dt: number) {
    this.state = getBrazilRoute(this.region, elapsed, duration);
    const { cameraX, cameraY } = this.state;
    this.terrainContainer.setPosition(-cameraX, -cameraY);
    this.waterMask.setPosition(-cameraX, -cameraY);
    this.drift +=
      Math.max(0, Number.isFinite(dt) ? dt : 0) *
      (this.region === "iguacu" ? 22 : 12);
    this.water.tilePositionY = -cameraY * 0.7 - elapsed * 8;
    this.water.tilePositionX = elapsed * 2;
    this.mist.tilePositionY = -cameraY * 0.25 - this.drift;
    this.mist.tilePositionX = elapsed * 2;
    this.shadows.tilePositionY = this.mist.tilePositionY + 36;
    this.shadows.tilePositionX = this.mist.tilePositionX + 28;
    if (this.falls) this.falls.tilePositionY = -elapsed * 115;
    if (this.spray)
      this.spray
        .setAlpha(
          (this.reduced ? 0.09 : 0.21) + Math.sin(elapsed * 0.8) * 0.025,
        )
        .setScale(
          (650 / 512) * (1 + Math.sin(elapsed * 0.4) * 0.025),
          (440 / 256) * (1 + Math.sin(elapsed * 0.5) * 0.02),
        );
    this.movingDecor.forEach((object, index) => {
      const speed = this.region === "brasilia" ? 0.06 : 0.035;
      object.y =
        this.decorOrigins[index] + Math.sin(elapsed * speed + index * 0.8) * 18;
    });
  }
  destroy() {
    this.terrainContainer.destroy(true);
    this.water.clearMask();
    this.mask.destroy();
    this.waterMask.destroy();
    this.water.destroy();
    this.mist.destroy();
    this.shadows.destroy();
  }
}
