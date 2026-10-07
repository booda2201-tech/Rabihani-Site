import * as THREE from 'three';
import { ThreeStage } from '../three-stage';

/** Ambient backdrop for the prize hall: a glowing core inside tilted gold rings and a slow galaxy of points. */
export class PrizeOrbit extends ThreeStage {
  private readonly rings = new THREE.Group();
  private readonly galaxy: THREE.Points;
  private readonly core: THREE.Mesh;
  private boost = 0;
  private scroll = 0;

  constructor(host: HTMLElement, reducedMotion: boolean) {
    super(host, reducedMotion, 50);
    this.camera.position.set(0, 2.5, 11);
    this.camera.lookAt(0, 0, 0);

    this.core = new THREE.Mesh(
      new THREE.SphereGeometry(0.9, 48, 48),
      new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }),
    );

    const ringMat = new THREE.MeshBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
    [3.2, 4.6, 6.2].forEach((radius, i) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.012 + i * 0.004, 8, 200), ringMat);
      ring.rotation.set(Math.PI / 2 + (i - 1) * 0.35, i * 0.4, 0);
      this.rings.add(ring);
    });

    this.galaxy = this.buildGalaxy();
    this.scene.add(this.core, this.rings, this.galaxy);
  }

  /** A short burst of speed, e.g. when the prize filter changes. */
  pulse(): void {
    this.boost = 1;
  }

  setScroll(progress: number): void {
    this.scroll = progress;
  }

  protected update(delta: number, t: number): void {
    this.boost = Math.max(0, this.boost - delta * 1.2);
    const speed = 1 + this.boost * 6;

    this.galaxy.rotation.y += delta * 0.06 * speed * (this.reducedMotion ? 0 : 1);
    this.rings.children.forEach((ring, i) => {
      ring.rotation.z += delta * (0.08 + i * 0.04) * speed * (this.reducedMotion ? 0 : 1) * (i % 2 ? -1 : 1);
    });

    const breathe = 1 + Math.sin(t * 1.4) * 0.06 + this.boost * 0.4;
    this.core.scale.setScalar(breathe);

    this.camera.position.y = 2.5 - this.scroll * 3;
    this.camera.lookAt(0, 0, 0);
  }

  private buildGalaxy(): THREE.Points {
    const count = 2200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const inner = new THREE.Color(0x93c5fd);
    const outer = new THREE.Color(0xd4af37);

    for (let i = 0; i < count; i++) {
      const radius = 1.5 + Math.pow(Math.random(), 0.7) * 9;
      const arm = (i % 3) * ((Math.PI * 2) / 3);
      const angle = arm + radius * 0.45 + (Math.random() - 0.5) * 0.9;
      positions.set([Math.cos(angle) * radius, (Math.random() - 0.5) * 0.6, Math.sin(angle) * radius], i * 3);
      const c = inner.clone().lerp(outer, radius / 10.5);
      colors.set([c.r, c.g, c.b], i * 3);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        size: 0.05,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
  }
}
