import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ThreeStage } from '../three-stage';

const GOLD = 0xd4af37;
const GOLD_LIGHT = 0xf3d77a;
const BLUE = 0x2563eb;
/** Horizontal extent of the coin orbit plus margin; the camera backs off until it fits the canvas width. */
const SCENE_RADIUS = 3.7;
const SPARK_COUNT = 180;
const SPARK_LIFE = 1.9;
const AUTO_BURST_EVERY = 5.5;
const POINT_REWARDS = [50, 100, 250, 75];
const PAYLOAD_SIZE = 2;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function canvasTexture(draw: (ctx: CanvasRenderingContext2D, size: number) => void): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  draw(canvas.getContext('2d')!, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Bounding box of the non-transparent pixels, so padded PNGs fill the card. */
function opaqueBounds(img: HTMLImageElement): { x: number; y: number; w: number; h: number } {
  const full = { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight };
  const scale = Math.min(1, 256 / Math.max(full.w, full.h));
  const cw = Math.max(1, Math.round(full.w * scale));
  const ch = Math.max(1, Math.round(full.h * scale));
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, cw, ch);
  const data = ctx.getImageData(0, 0, cw, ch).data;

  let minX = cw, minY = ch, maxX = -1, maxY = -1;
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      if (data[(y * cw + x) * 4 + 3] > 12) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return full;
  return { x: minX / scale, y: minY / scale, w: (maxX - minX + 1) / scale, h: (maxY - minY + 1) / scale };
}

/** The product as a floating cut-out over a soft gold halo. */
function prizeCard(img: HTMLImageElement): THREE.CanvasTexture {
  const src = opaqueBounds(img);
  const hasAlpha = src.w < img.naturalWidth - 2 || src.h < img.naturalHeight - 2;
  return canvasTexture((ctx, s) => {
    const c = s / 2;
    const halo = ctx.createRadialGradient(c, c, 0, c, c, c);
    halo.addColorStop(0, 'rgba(255,236,170,.5)');
    halo.addColorStop(0.45, 'rgba(212,175,55,.2)');
    halo.addColorStop(1, 'rgba(212,175,55,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, s, s);

    const box = s * 0.68;
    const ratio = Math.min(box / src.w, box / src.h);
    const w = src.w * ratio;
    const h = src.h * ratio;
    const x = (s - w) / 2;
    const y = (s - h) / 2;

    ctx.save();
    ctx.shadowColor = 'rgba(255,210,110,.55)';
    ctx.shadowBlur = 22;
    if (!hasAlpha) {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 36);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.clip();
    }
    ctx.drawImage(img, src.x, src.y, src.w, src.h, x, y, w, h);
    ctx.restore();
  });
}

function beamTexture(): THREE.CanvasTexture {
  return canvasTexture((ctx, s) => {
    const v = ctx.createLinearGradient(0, s, 0, 0);
    v.addColorStop(0, 'rgba(255,236,170,.95)');
    v.addColorStop(1, 'rgba(255,236,170,0)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, s, s);
    ctx.globalCompositeOperation = 'destination-in';
    const h = ctx.createLinearGradient(0, 0, s, 0);
    h.addColorStop(0, 'rgba(0,0,0,0)');
    h.addColorStop(0.5, 'rgba(0,0,0,1)');
    h.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = h;
    ctx.fillRect(0, 0, s, s);
  });
}

function pointsBadge(points: number): THREE.CanvasTexture {
  return canvasTexture((ctx, s) => {
    const c = s / 2;
    const r = c * 0.66;
    const halo = ctx.createRadialGradient(c, c, 0, c, c, c);
    halo.addColorStop(0, 'rgba(255,236,170,.7)');
    halo.addColorStop(0.5, 'rgba(212,175,55,.25)');
    halo.addColorStop(1, 'rgba(212,175,55,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, s, s);

    const coin = ctx.createRadialGradient(c - r * 0.35, c - r * 0.4, 0, c, c, r);
    coin.addColorStop(0, '#fff3c4');
    coin.addColorStop(0.45, '#f3d77a');
    coin.addColorStop(1, '#a8861f');
    ctx.save();
    ctx.shadowColor = 'rgba(255,225,140,.9)';
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.fillStyle = coin;
    ctx.fill();
    ctx.restore();
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#8a6a14';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(c, c, r - 28, 0, Math.PI * 2);
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(138,106,20,.55)';
    ctx.stroke();

    ctx.fillStyle = '#050816';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 104px Cairo, sans-serif';
    ctx.fillText(`+${points}`, c, c - 22);
    ctx.font = '900 64px Cairo, sans-serif';
    ctx.direction = 'rtl';
    ctx.fillStyle = '#3b2a05';
    ctx.fillText('نقطة', c, c + 68);
  });
}

const easeOutBack = (x: number) => 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2);

function glowTexture(inner: string, outer: string): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * A navy gift in the splash-screen gold ribbon on a glowing pedestal. Coins flip around it,
 * and every few seconds the lid pops and gold sparks fly out. Follows the pointer.
 */
export class HeroScene extends ThreeStage {
  /** Tweened from outside for the entrance drop. */
  readonly entrance = { y: 0, spin: 0 };

  private readonly gift = new THREE.Group();
  private readonly lid = new THREE.Group();
  private readonly coins = new THREE.Group();
  private readonly stand = new THREE.Group();
  private readonly dust: THREE.Points;
  private readonly sparks: THREE.Points;
  private readonly sparkOrigin: Float32Array;
  private readonly sparkVelocity: Float32Array;
  private readonly innerLight = new THREE.PointLight(GOLD_LIGHT, 0, 6);
  private readonly glow: THREE.Sprite;
  private readonly payload = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false }));
  private readonly beam: THREE.Sprite;
  private prizeCards: THREE.Texture[] = [];
  private badges: THREE.Texture[] = [];
  private payloadIndex = 0;
  private readonly lidSide = new THREE.Vector3(1, 0, 0);
  private readonly lidAxis = new THREE.Vector3();
  private readonly lidOffset = new THREE.Vector3();
  private readonly textures: THREE.Texture[] = [];
  private readonly pointer = new THREE.Vector2();
  private readonly smoothed = new THREE.Vector2();
  private scroll = 0;
  private cameraZ = 9.5;
  private burstAt = 0;

  constructor(host: HTMLElement, reducedMotion: boolean) {
    super(host, reducedMotion, 35);
    this.renderer.toneMappingExposure = 1.15;

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.camera.position.set(0, 0.8, 9.5);

    this.buildLights();
    this.buildGift();
    this.buildStand();
    this.buildCoins();
    this.dust = this.buildDust();

    const sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SPARK_COUNT * 3), 3));
    this.sparkOrigin = new Float32Array(SPARK_COUNT * 3);
    this.sparkVelocity = new Float32Array(SPARK_COUNT * 3);
    const sparkTex = glowTexture('rgba(255,240,190,1)', 'rgba(212,175,55,0)');
    this.textures.push(sparkTex);
    this.sparks = new THREE.Points(
      sparkGeo,
      new THREE.PointsMaterial({ size: 0.16, map: sparkTex, color: GOLD_LIGHT, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }),
    );

    const glowTex = glowTexture('rgba(212,175,55,0.9)', 'rgba(212,175,55,0)');
    this.textures.push(glowTex);
    this.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.glow.scale.setScalar(7.5);
    this.glow.position.set(0, 0.4, -2);

    this.gift.rotation.set(0.28, -0.6, 0);
    this.innerLight.position.set(0, 0.1, 0);
    this.gift.add(this.innerLight);
    this.payload.visible = false;
    this.payload.renderOrder = 10;
    const beamTex = beamTexture();
    this.textures.push(beamTex);
    this.beam = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: beamTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    this.beam.center.set(0.5, 0);
    this.beam.renderOrder = 9;
    this.scene.add(this.glow, this.stand, this.gift, this.coins, this.sparks, this.dust, this.beam, this.payload);

    document.fonts.ready.then(() => {
      this.badges = POINT_REWARDS.map(pointsBadge);
      this.textures.push(...this.badges);
    });
  }

  /** Product images that take turns popping out of the box, between point rewards. */
  async setPrizes(urls: string[]): Promise<void> {
    const loaded = await Promise.allSettled(urls.map(loadImage));
    const cards = loaded.flatMap((r) => (r.status === 'fulfilled' ? [prizeCard(r.value)] : []));
    this.prizeCards = cards;
    this.textures.push(...cards);
  }

  /** x, y in [-1, 1] */
  setPointer(x: number, y: number): void {
    this.pointer.set(x, y);
  }

  /** 0 → hero fully visible, 1 → scrolled past */
  setScroll(progress: number): void {
    this.scroll = progress;
  }

  /** Pop the lid and throw gold sparks out of the box. */
  burst(): void {
    this.burstAt = this.elapsed;
    this.nextPayload();

    // hinge the lid on whichever edge keeps it swinging sideways on screen, never toward the camera
    const toCam = this.camera.position.clone().sub(this.gift.position).applyQuaternion(this.gift.quaternion.clone().invert());
    this.lidSide.set(-toCam.z, 0, toCam.x).normalize();
    if (!Number.isFinite(this.lidSide.x)) this.lidSide.set(1, 0, 0);
    for (let i = 0; i < SPARK_COUNT; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.7;
      this.sparkOrigin.set([Math.cos(a) * r, 1.1, Math.sin(a) * r], i * 3);
      const speed = 2.2 + Math.random() * 3.2;
      const spread = 0.35 + Math.random() * 0.9;
      this.sparkVelocity.set([Math.cos(a) * spread * 1.6, speed, Math.sin(a) * spread * 1.6], i * 3);
    }
  }

  override dispose(): void {
    this.textures.forEach((t) => t.dispose());
    super.dispose();
  }

  protected override onResize(width: number): void {
    const scale = width < 640 ? 0.82 : 1;
    this.gift.scale.setScalar(scale);
    this.coins.scale.setScalar(scale);
    this.stand.scale.setScalar(scale);

    const halfTan = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    this.cameraZ = Math.max(9.5, (SCENE_RADIUS * scale) / (halfTan * this.camera.aspect));
  }

  protected update(delta: number, t: number): void {
    this.smoothed.lerp(this.pointer, 1 - Math.pow(0.002, delta));

    if (!this.reducedMotion && t - this.burstAt > AUTO_BURST_EVERY) this.burst();
    const since = t - this.burstAt;

    const float = 0.25 + Math.sin(t * 1.3) * 0.1;
    this.gift.position.y = float + this.entrance.y - this.scroll * 1.4;
    this.gift.rotation.y = -0.6 + t * 0.3 - this.smoothed.x * 0.8 + this.entrance.spin;
    this.gift.rotation.x = 0.28 + this.smoothed.y * 0.25 + this.scroll * 0.6;

    // lid: snap open, hold, settle back
    const open =
      since < 0.3 ? 1 - Math.pow(1 - since / 0.3, 3) : since < 1.5 ? 1 : since < 2.1 ? 1 - (since - 1.5) / 0.6 : 0;
    this.swingLid(open);
    this.beam.position.set(this.gift.position.x, this.gift.position.y + 0.75 * this.gift.scale.y, this.gift.position.z);
    this.beam.scale.set(2.2 * this.gift.scale.x, 3.6 * this.gift.scale.y, 1);
    this.beam.material.opacity = open * 0.55;
    this.innerLight.intensity = open * 14;
    this.gift.rotation.x += open * 0.3;
    (this.glow.material as THREE.SpriteMaterial).opacity = 0.32 + open * 0.4 + Math.sin(t * 2) * 0.03;

    this.updateSparks(since);
    this.updatePayload(since);

    this.coins.rotation.y = t * 0.35 - this.smoothed.x * 0.4;
    this.coins.children.forEach((coin, i) => {
      coin.rotation.y = t * 2.4 + i * 0.9;
      coin.position.y = (coin.userData['baseY'] as number) + Math.sin(t * 1.4 + i) * 0.18 - this.scroll * 0.8;
    });

    this.stand.position.y = -1.35 - this.scroll * 1.2;
    this.dust.rotation.y = t * 0.03;

    this.camera.position.x = this.smoothed.x * 0.5;
    this.camera.position.y = 0.8 - this.smoothed.y * 0.3;
    this.camera.position.z = this.cameraZ;
    this.camera.lookAt(0, 0.1, 0);
  }

  /** Lid pops up a little, then swings open around its bottom edge on the `lidSide` side. */
  private swingLid(open: number): void {
    const angle = open * 1.9;
    const d = this.lidSide;
    this.lidAxis.set(d.z, 0, -d.x);
    // pivot sits on the lid's bottom edge, 1.12 out from its centre and 0.23 below it
    this.lidOffset.set(-d.x * 1.12, 0.23, -d.z * 1.12).applyAxisAngle(this.lidAxis, angle);
    this.lid.position.set(d.x * 1.12 + this.lidOffset.x, 0.74 + open * 0.25 + this.lidOffset.y, d.z * 1.12 + this.lidOffset.z);
    this.lid.quaternion.setFromAxisAngle(this.lidAxis, angle);
  }

  /** Alternates prize, points, prize, points… falling back to points alone until prize images load. */
  private nextPayload(): void {
    const mat = this.payload.material;
    const i = this.payloadIndex++;
    const usePrize = this.prizeCards.length > 0 && i % 2 === 0;
    const pool = usePrize ? this.prizeCards : this.badges;
    mat.map = pool.length ? pool[Math.floor(i / 2) % pool.length] : null;
    mat.needsUpdate = true;
  }

  private updatePayload(since: number): void {
    const mat = this.payload.material;
    const start = 0.08;
    const end = 2.3;
    if (!mat.map || since < start || since > end) {
      this.payload.visible = false;
      return;
    }
    const s = since - start;
    const rise = easeOutBack(Math.min(1, s / 0.6));
    const leaving = Math.max(0, since - 1.6);

    this.payload.visible = true;
    // hidden by the box walls while still inside, then always drawn over the lifted lid
    const emerged = s > 0.18;
    if (mat.depthTest === emerged) {
      mat.depthTest = !emerged;
      mat.needsUpdate = true;
    }
    this.payload.position.set(
      this.gift.position.x,
      this.gift.position.y + (-0.15 + rise * 1.95 + leaving * 0.4 + Math.sin(s * 3) * 0.05) * this.gift.scale.y,
      this.gift.position.z + 0.6 + Math.min(rise, 1) * 1.2,
    );
    this.payload.scale.setScalar(PAYLOAD_SIZE * this.gift.scale.x * (0.1 + 0.9 * Math.min(rise, 1.06)));
    mat.rotation = Math.sin(s * 2.4) * 0.07;
    mat.opacity = Math.min(1, s * 5) * (1 - leaving / (end - 1.6));
  }

  private updateSparks(since: number): void {
    const mat = this.sparks.material as THREE.PointsMaterial;
    if (since < 0 || since > SPARK_LIFE) {
      mat.opacity = 0;
      return;
    }
    const pos = this.sparks.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    const g = -3.2;
    for (let i = 0; i < SPARK_COUNT * 3; i += 3) {
      arr[i] = this.sparkOrigin[i] + this.sparkVelocity[i] * since;
      arr[i + 1] = this.sparkOrigin[i + 1] + this.sparkVelocity[i + 1] * since + 0.5 * g * since * since;
      arr[i + 2] = this.sparkOrigin[i + 2] + this.sparkVelocity[i + 2] * since;
    }
    pos.needsUpdate = true;
    this.sparks.position.copy(this.gift.position);
    mat.opacity = Math.min(1, since * 8) * (1 - since / SPARK_LIFE);
  }

  private buildLights(): void {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.45));

    const key = new THREE.DirectionalLight(0xffffff, 2.6);
    key.position.set(4, 7, 6);
    const goldRim = new THREE.PointLight(GOLD, 55, 22);
    goldRim.position.set(-4, 3, -2);
    const blueFill = new THREE.PointLight(0x3b82f6, 60, 22);
    blueFill.position.set(4.5, -1, 3.5);
    const top = new THREE.SpotLight(0xffffff, 40, 20, 0.5, 0.6);
    top.position.set(0, 8, 2);

    this.scene.add(key, goldRim, blueFill, top);
  }

  private buildGift(): void {
    const wrap = new THREE.MeshPhysicalMaterial({
      color: 0x10235f,
      metalness: 0.45,
      roughness: 0.22,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      sheen: 0.6,
      sheenColor: new THREE.Color(0x3b82f6),
    });
    const ribbon = new THREE.MeshStandardMaterial({ color: 0xe6c35a, metalness: 0.75, roughness: 0.28, emissive: 0x8a6a14, emissiveIntensity: 0.55 });
    const accent = new THREE.MeshStandardMaterial({ color: BLUE, metalness: 0.4, roughness: 0.25, emissive: 0x1d4ed8, emissiveIntensity: 0.9 });

    const base = this.buildOpenBox(wrap, ribbon);

    const lidBox = new THREE.Mesh(new THREE.BoxGeometry(2.24, 0.46, 2.24), wrap);
    const lidBandA = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.48, 2.27), ribbon);
    const lidBandB = new THREE.Mesh(new THREE.BoxGeometry(2.27, 0.48, 0.36), ribbon);
    const lidTrim = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.06, 2.26), accent);
    lidTrim.position.y = -0.2;

    // bow: two upright loops angled out over the knot
    const loopGeo = new THREE.TorusGeometry(0.4, 0.1, 20, 64);
    const bow = new THREE.Group();
    [-1, 1].forEach((side) => {
      const loop = new THREE.Mesh(loopGeo, ribbon);
      loop.scale.set(1.2, 0.8, 1);
      loop.position.set(side * 0.38, 0.2, 0);
      loop.rotation.set(0, side * 1.05, side * -0.3);
      bow.add(loop);
    });
    const knot = new THREE.Mesh(new THREE.SphereGeometry(0.19, 24, 24), ribbon);
    knot.scale.set(1, 0.8, 1);
    bow.add(knot);
    bow.position.y = 0.3;

    this.lid.add(lidBox, lidBandA, lidBandB, lidTrim, bow);
    this.lid.position.y = 0.97;

    this.gift.add(base, this.lid);
  }

  /** 2 × 1.7 × 2 box with no top: four walls and a floor, ribbon on the outside only, so the lid reveals a real cavity. */
  private buildOpenBox(wrap: THREE.Material, ribbon: THREE.Material): THREE.Group {
    const W = 2;
    const H = 1.7;
    const T = 0.08;
    const inner = new THREE.MeshStandardMaterial({ color: 0x081236, roughness: 0.9, metalness: 0, envMapIntensity: 0.25, emissive: 0x050b26, emissiveIntensity: 0.6 });
    const box = new THREE.Group();

    // BoxGeometry face order: +x, -x, +y, -y, +z, -z
    const faces = (innerFace: number): THREE.Material[] =>
      [0, 1, 2, 3, 4, 5].map((i) => (i === innerFace ? inner : i === 2 ? ribbon : wrap));

    const front = new THREE.Mesh(new THREE.BoxGeometry(W, H, T), faces(5));
    front.position.z = W / 2 - T / 2;
    const back = new THREE.Mesh(new THREE.BoxGeometry(W, H, T), faces(4));
    back.position.z = -(W / 2 - T / 2);
    const right = new THREE.Mesh(new THREE.BoxGeometry(T, H, W - T * 2), faces(1));
    right.position.x = W / 2 - T / 2;
    const left = new THREE.Mesh(new THREE.BoxGeometry(T, H, W - T * 2), faces(0));
    left.position.x = -(W / 2 - T / 2);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(W - T * 2, T, W - T * 2), [wrap, wrap, inner, wrap, wrap, wrap]);
    floor.position.y = -H / 2 + T / 2;
    box.add(front, back, right, left, floor);

    const strip = 0.34;
    const out = W / 2 + 0.012;
    const zStrip = new THREE.BoxGeometry(strip, H + 0.02, 0.024);
    const xStrip = new THREE.BoxGeometry(0.024, H + 0.02, strip);
    const under = new THREE.BoxGeometry(strip, 0.024, W + 0.03);
    [
      [zStrip, 0, 0, out],
      [zStrip, 0, 0, -out],
      [xStrip, out, 0, 0],
      [xStrip, -out, 0, 0],
    ].forEach(([geo, x, y, z]) => {
      const m = new THREE.Mesh(geo as THREE.BufferGeometry, ribbon);
      m.position.set(x as number, y as number, z as number);
      box.add(m);
    });
    const underA = new THREE.Mesh(under, ribbon);
    underA.position.y = -H / 2 - 0.012;
    const underB = underA.clone();
    underB.rotation.y = Math.PI / 2;
    box.add(underA, underB);

    return box;
  }

  private buildStand(): void {
    const top = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2.25, 0.28, 96),
      new THREE.MeshPhysicalMaterial({ color: 0x0b1226, metalness: 0.6, roughness: 0.2, clearcoat: 1 }),
    );
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(2.02, 0.035, 12, 160),
      new THREE.MeshStandardMaterial({ color: GOLD, emissive: GOLD, emissiveIntensity: 1.2, metalness: 1, roughness: 0.2 }),
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.14;

    const haloTex = glowTexture('rgba(59,130,246,0.75)', 'rgba(59,130,246,0)');
    this.textures.push(haloTex);
    const halo = new THREE.Mesh(
      new THREE.PlaneGeometry(7, 7),
      new THREE.MeshBasicMaterial({ map: haloTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = -0.16;

    this.stand.add(halo, top, rim);
    this.stand.position.y = -1.35;
  }

  private buildCoins(): void {
    const face = new THREE.MeshStandardMaterial({ color: 0xdcb143, metalness: 0.85, roughness: 0.32, emissive: 0x6b5410, emissiveIntensity: 0.35 });
    const edge = new THREE.MeshStandardMaterial({ color: 0xb8902a, metalness: 0.9, roughness: 0.4, emissive: 0x4a3608, emissiveIntensity: 0.3 });
    const discGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.06, 48);
    const ringGeo = new THREE.TorusGeometry(0.18, 0.018, 8, 48);
    const count = 8;

    for (let i = 0; i < count; i++) {
      const coin = new THREE.Group();
      const disc = new THREE.Mesh(discGeo, [edge, face, face]);
      disc.rotation.x = Math.PI / 2;
      const ringFront = new THREE.Mesh(ringGeo, edge);
      ringFront.position.z = 0.032;
      const ringBack = ringFront.clone();
      ringBack.position.z = -0.032;
      coin.add(disc, ringFront, ringBack);

      const angle = (i / count) * Math.PI * 2;
      const radius = 2.75 + (i % 2) * 0.35;
      const y = -0.5 + ((i * 37) % 10) / 10 * 1.9;
      coin.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      coin.rotation.z = (i % 3 - 1) * 0.35;
      coin.userData['baseY'] = y;
      coin.scale.setScalar(0.85 + (i % 3) * 0.15);
      this.coins.add(coin);
    }
    this.coins.rotation.x = 0.12;
  }

  private buildDust(): THREE.Points {
    const count = 700;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const gold = new THREE.Color(GOLD);
    const blue = new THREE.Color(0x60a5fa);

    for (let i = 0; i < count; i++) {
      const r = 4 + Math.random() * 7;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions.set([r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi) * 0.6, r * Math.sin(phi) * Math.sin(theta) - 3], i * 3);
      const c = Math.random() > 0.55 ? gold : blue;
      colors.set([c.r, c.g, c.b], i * 3);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return new THREE.Points(geo, mat);
  }
}
