import Phaser from "phaser";
import { getRioRoute, RIO_LANDMARK_Y, type RioRouteState } from "./rioRoute";

/** The flight uses screen-space combat. Only these scenery layers travel through
 * the world, so scrolling never changes collisions or the player's controls. */
export class RioWorld {
  static hasAssets(scene: Phaser.Scene) {
    return ["route-upper", "route-lower", "mountain-finale"].every((name) =>
      scene.textures.exists("rio-" + name),
    );
  }
  static preload(scene: Phaser.Scene) {
    for (const name of ["route-upper", "route-lower", "mountain-finale"])
      scene.load.image(
        "rio-" + name,
        `${import.meta.env.BASE_URL}assets/rio/${name}.webp`,
      );
  }
  state: RioRouteState = getRioRoute(0);
  readonly landmarkDepth = 0.5;
  flyoverComplete = false;
  readonly terrainContainer: Phaser.GameObjects.Container;
  private ocean: Phaser.GameObjects.TileSprite;
  private glints: Phaser.GameObjects.TileSprite;
  private clouds: Phaser.GameObjects.TileSprite;
  private cloudShadows: Phaser.GameObjects.TileSprite;
  private scene: Phaser.Scene;
  private cloudDrift = 0;
  private cameraX = 270;
  private readonly reduced: boolean;
  private boats: Phaser.GameObjects.Container[] = [];
  constructor(scene: Phaser.Scene, reduced = false) {
    this.scene = scene;
    this.reduced = reduced;
    this.makeAtmosphere();
    this.ocean = scene.add
      .tileSprite(270, 480, 540, 960, "rio-water")
      .setDepth(-0.4);
    this.glints = scene.add
      .tileSprite(270, 480, 540, 960, "rio-glints")
      .setDepth(-0.3)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(reduced ? 0.08 : 0.14);
    this.terrainContainer = scene.add
      .container(0, 0)
      .setDepth(this.landmarkDepth);
    // All GPU textures are <=1100px on either axis. The long route is two chunks,
    // not a huge full-world canvas or repeating map.
    const top = this.maskEdges(
      "rio-route-upper",
      "rio-upper-ready",
      true,
      false,
    );
    const bottom = this.maskEdges(
      "rio-route-lower",
      "rio-lower-ready",
      false,
      true,
    );
    this.terrainContainer.add(
      scene.add
        .image(0, 0, "rio-mountain-finale")
        .setOrigin(0)
        .setDisplaySize(1080, 1480),
    );
    const imageScale = 1080 / 724,
      routeTop = RIO_LANDMARK_Y - 350 * imageScale;
    this.terrainContainer.add(
      scene.add
        .image(0, routeTop, top)
        .setOrigin(0)
        .setDisplaySize(1080, 1086 * imageScale),
    );
    this.terrainContainer.add(
      scene.add
        .image(0, routeTop + 1086 * imageScale, bottom)
        .setOrigin(0)
        .setDisplaySize(1080, 1086 * imageScale),
    );
    for (const [x, y, angle] of [
      [650, 6020, -12],
      [450, 5510, 16],
      [750, 4940, 8],
    ]) {
      const boat = scene.add.container(x, y);
      const wake = scene.add.triangle(
        0,
        27,
        0,
        0,
        14,
        65,
        28,
        0,
        0xc2eff0,
        0.2,
      );
      const hull = scene.add
        .ellipse(0, 0, 13, 42, 0xf5e6c5)
        .setStrokeStyle(1, 0x2d5861);
      const cabin = scene.add
        .rectangle(0, 1, 7, 18, 0x36575c)
        .setStrokeStyle(1, 0xf3f0da);
      boat.add([wake, hull, cabin]).setAngle(angle);
      this.terrainContainer.add(boat);
      this.boats.push(boat);
    }
    this.cloudShadows = scene.add
      .tileSprite(270, 480, 540, 960, "rio-clouds")
      .setTint(0x031e2c)
      .setAlpha(reduced ? 0.04 : 0.13)
      .setDepth(1.2);
    this.clouds = scene.add
      .tileSprite(270, 480, 540, 960, "rio-clouds")
      .setAlpha(reduced ? 0.12 : 0.22)
      .setDepth(2.1);
    this.update(0, 48, 0);
  }
  private maskEdges(
    sourceKey: string,
    key: string,
    top: boolean,
    bottom: boolean,
  ) {
    const source = this.scene.textures
      .get(sourceKey)
      .getSourceImage() as HTMLImageElement;
    const canvas = document.createElement("canvas");
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(source, 0, 0);
    ctx.globalCompositeOperation = "destination-in";
    const fade = ctx.createLinearGradient(0, 0, 0, canvas.height);
    fade.addColorStop(0, top ? "#ffffff00" : "#ffffff");
    fade.addColorStop(0.11, "#ffffff");
    fade.addColorStop(0.92, "#ffffff");
    fade.addColorStop(1, bottom ? "#ffffff00" : "#ffffff");
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.scene.textures.addCanvas(key, canvas);
    this.scene.textures.remove(sourceKey);
    return key;
  }
  private makeAtmosphere() {
    const water = document.createElement("canvas");
    water.width = 512;
    water.height = 512;
    const ctx = water.getContext("2d")!;
    const data = ctx.createImageData(512, 512);
    let seed = 1945;
    const random = () => {
      seed = (1664525 * seed + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let y = 0; y < 512; y++)
      for (let x = 0; x < 512; x++) {
        const value =
          Math.sin(
            (x / 512) * Math.PI * 12 + Math.sin((y / 512) * Math.PI * 8) * 1.7,
          ) *
            Math.cos((y / 512) * Math.PI * 26) +
          Math.sin(((x + y) / 512) * Math.PI * 54) * 0.3;
        const i = (y * 512 + x) * 4,
          n = random() * 4;
        data.data[i] = 11 + value * 3 + n;
        data.data[i + 1] = 90 + value * 7 + n;
        data.data[i + 2] = 109 + value * 8 + n;
        data.data[i + 3] = 255;
      }
    ctx.putImageData(data, 0, 0);
    ctx.lineCap = "round";
    for (let i = 0; i < 900; i++) {
      const x = random() * 512,
        y = random() * 512;
      ctx.strokeStyle = `rgba(150,224,222,${0.02 + random() * 0.1})`;
      ctx.lineWidth = 0.4 + random();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 4, y - 2, x + 6 + random() * 12, y);
      ctx.stroke();
    }
    this.scene.textures.addCanvas("rio-water", water);
    const glints = document.createElement("canvas");
    glints.width = 512;
    glints.height = 512;
    const g = glints.getContext("2d")!;
    for (let i = 0; i < 110; i++) {
      const x = random() * 512,
        y = random() * 512;
      g.fillStyle = `rgba(255,244,202,${0.15 + random() * 0.4})`;
      g.fillRect(x, y, 1 + random() * 5, 0.7);
    }
    this.scene.textures.addCanvas("rio-glints", glints);
    const cloud = document.createElement("canvas");
    cloud.width = 768;
    cloud.height = 1024;
    const c = cloud.getContext("2d")!;
    for (let k = 0; k < 6; k++) {
      const cx = random() * 768,
        cy = random() * 1024;
      for (let j = 0; j < 10; j++) {
        const x = cx + (random() - 0.5) * 170,
          y = cy + (random() - 0.5) * 90,
          r = 35 + random() * 70;
        const gr = c.createRadialGradient(x, y, 3, x, y, r);
        gr.addColorStop(0, "#f3f5e8aa");
        gr.addColorStop(0.5, "#e4eef150");
        gr.addColorStop(1, "#d7efff00");
        c.fillStyle = gr;
        c.fillRect(x - r, y - r, r * 2, r * 2);
      }
    }
    this.scene.textures.addCanvas("rio-clouds", cloud);
  }
  update(elapsed: number, duration: number, dt: number) {
    this.state = getRioRoute(elapsed, duration);
    const { progress, cameraY, cloudSpeed } = this.state;
    // Pan from open sea to beach, forest and the summit without moving combat.
    this.cameraX =
      progress < 0.2
        ? 470
        : progress < 0.65
          ? 470 - ((progress - 0.2) / 0.45) * 200
          : 270;
    this.terrainContainer.setPosition(-this.cameraX, -cameraY);
    this.ocean.tilePositionY = -cameraY * 0.82;
    this.ocean.tilePositionX = Math.sin(elapsed * 0.035) * 15;
    this.glints.tilePositionY = -cameraY * 0.87 - elapsed * 5;
    this.glints.tilePositionX = elapsed * 2;
    this.glints.setAlpha(
      (this.reduced ? 0.07 : 0.13) + Math.sin(elapsed * 0.6) * 0.025,
    );
    this.cloudDrift += dt * cloudSpeed;
    this.clouds.tilePositionY = -cameraY * 0.25 - this.cloudDrift;
    this.clouds.tilePositionX = elapsed * 3;
    this.cloudShadows.tilePositionY = this.clouds.tilePositionY + 40;
    this.cloudShadows.tilePositionX = this.clouds.tilePositionX + 24;
    // Landmark is scenery, never a target or a hitbox. Once it has passed below
    // the entire battlefield every allowed player position has flown over it.
    if (this.state.landmarkScreenY > 960) this.flyoverComplete = true;
  }
  destroy() {
    this.terrainContainer.destroy(true);
    this.ocean.destroy();
    this.glints.destroy();
    this.clouds.destroy();
    this.cloudShadows.destroy();
  }
}
