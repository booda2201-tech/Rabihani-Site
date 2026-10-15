import * as THREE from 'three';

/** Phone GPUs are fill-rate bound; past 1.5x the extra pixels are not visible on a small screen. */
function pixelRatioCap(): number {
  const handheld = window.matchMedia('(max-width: 1023px), (pointer: coarse)').matches;
  return handheld ? 1.5 : 2;
}

/** Shared renderer lifecycle: resize, pause offscreen, dispose. Run it outside Angular's zone. */
export abstract class ThreeStage {
  protected readonly renderer: THREE.WebGLRenderer;
  protected readonly scene = new THREE.Scene();
  protected readonly camera: THREE.PerspectiveCamera;
  protected elapsed = 0;

  private readonly clock = new THREE.Clock();
  private raf = 0;
  private running = false;
  private visible = true;
  private readonly resizeObserver: ResizeObserver;
  private readonly visibilityObserver: IntersectionObserver;

  constructor(protected readonly host: HTMLElement, protected readonly reducedMotion: boolean, fov = 40) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap()));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

    const canvas = this.renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    host.appendChild(canvas);

    this.camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);

    this.visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        this.visible = entry.isIntersecting;
        if (this.visible) this.kick();
      },
      { rootMargin: '120px' },
    );
    this.visibilityObserver.observe(host);
  }

  protected abstract update(delta: number, elapsed: number): void;

  protected onResize(_width: number, _height: number): void {}

  start(): void {
    this.running = true;
    this.resize();
    this.kick();
  }

  dispose(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    this.visibilityObserver.disconnect();
    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      mesh.geometry?.dispose();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      (Array.isArray(material) ? material : material ? [material] : []).forEach((m) => m.dispose());
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private kick(): void {
    if (!this.running || this.raf) return;
    this.clock.getDelta();
    this.raf = requestAnimationFrame(this.tick);
  }

  private readonly tick = (): void => {
    if (!this.running || !this.visible) {
      this.raf = 0;
      return;
    }
    const delta = Math.min(this.clock.getDelta(), 0.05);
    if (!this.reducedMotion) this.elapsed += delta;
    this.update(delta, this.elapsed);
    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.tick);
  };

  private resize(): void {
    const width = this.host.clientWidth;
    const height = this.host.clientHeight;
    if (!width || !height) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.onResize(width, height);
  }
}
