import { NgIf } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { MOTION_OK, ScrollTrigger, gsap, prefersReducedMotion } from '../../../../animations/gsap';
import { PARTNERS } from '../../../../config/site.config';
import { PrizesService } from '../../../../services/prizes.service';
import { CountdownComponent } from '../../../../shared/countdown.component';
import { IconComponent } from '../../../../shared/icon.component';
import { LogoComponent } from '../../../../shared/logo.component';
import { StoreButtonsComponent } from '../../../../shared/store-buttons.component';
import { HeroScene } from '../../../../three/hero-scene/hero-scene';

interface HeroStats {
  live: number;
  minStart: number;
  nextEnd: string;
}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [NgIf, LogoComponent, StoreButtonsComponent, CountdownComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero.component.html',
})
export class HeroComponent implements AfterViewInit, OnDestroy {
  @ViewChild('root', { static: true }) root!: ElementRef<HTMLElement>;
  @ViewChild('stage', { static: true }) stage!: ElementRef<HTMLDivElement>;

  stats: HeroStats | null = null;
  readonly partnersCount = PARTNERS.length;

  private scene?: HeroScene;
  private ctx?: gsap.Context;
  private sub?: Subscription;
  private removePointer?: () => void;

  constructor(private prizes: PrizesService, private zone: NgZone, private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      const reduced = prefersReducedMotion();
      try {
        this.scene = new HeroScene(this.stage.nativeElement, reduced);
        this.scene.start();
      } catch {
        /* WebGL unavailable: the glow backdrop stays */
      }
      this.ctx = gsap.context(() => this.animate(), this.root.nativeElement);
    });

    this.sub = this.prizes.auctions$.subscribe((list) => {
      if (!list?.length) return;
      this.stats = {
        live: list.length,
        minStart: Math.min(...list.map((a) => a.startPoints)),
        nextEnd: list.reduce((a, b) => (new Date(a.endTime) < new Date(b.endTime) ? a : b)).endTime,
      };
      this.cdr.detectChanges();
      this.zone.runOutsideAngular(() => {
        this.countUp();
        this.scene?.setPrizes([...new Set(list.map((a) => a.product.imageUrl).filter(Boolean))].slice(0, 6));
      });
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.removePointer?.();
    this.ctx?.revert();
    this.scene?.dispose();
  }

  private animate(): void {
    const mm = gsap.matchMedia();

    mm.add(MOTION_OK, () => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from('[data-intro-logo]', { y: 24, scale: 0.8, opacity: 0, duration: 0.7, ease: 'back.out(1.6)' })
        .from('[data-intro-glow]', { scale: 0.4, opacity: 0, duration: 0.9 }, 0)
        .from('[data-intro-sub]', { y: 12, opacity: 0, duration: 0.5 }, '-=0.3')
        .to('[data-intro-bar]', { scaleX: 1, duration: 0.9, ease: 'power2.inOut' }, '-=0.25')
        .to('[data-intro-logo]', { scale: 1.06, duration: 0.25, ease: 'power2.out', yoyo: true, repeat: 1 })
        .fromTo('[data-intro]', { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.8, ease: 'expo.inOut' })
        .set('[data-intro]', { display: 'none' });

      tl.addLabel('enter', '-=0.4');
      if (this.scene) {
        tl.fromTo(this.scene.entrance, { y: 6 }, { y: 0, duration: 1.3, ease: 'bounce.out' }, 'enter')
          .fromTo(this.scene.entrance, { spin: Math.PI * 1.5 }, { spin: 0, duration: 1.6, ease: 'power3.out' }, 'enter')
          .call(() => this.scene?.burst(), [], 'enter+=1.05');
      }
      tl.from('[data-glow]', { opacity: 0, scale: 0.5, duration: 1.4 }, 'enter')
        .from('[data-line]', { yPercent: 115, duration: 1, stagger: 0.12, ease: 'expo.out' }, 'enter+=0.1')
        .from('[data-hero-fade]', { y: 26, opacity: 0, stagger: 0.08, duration: 0.7 }, 'enter+=0.45')
        .from('[data-float]', { y: 40, scale: 0.7, opacity: 0, stagger: 0.15, duration: 0.9, ease: 'back.out(1.7)' }, 'enter+=1.1');

      this.pointerParallax();

      gsap.to('[data-hero-content]', {
        yPercent: -14,
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: this.root.nativeElement, start: 'top top', end: 'bottom top', scrub: true },
      });
      gsap.to('[data-float-layer]', {
        yPercent: -35,
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: this.root.nativeElement, start: 'top top', end: '70% top', scrub: true },
      });
    });

    mm.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set('[data-intro]', { display: 'none' });
    });

    ScrollTrigger.create({
      trigger: this.root.nativeElement,
      start: 'top top',
      end: 'bottom top',
      onUpdate: (self) => this.scene?.setScroll(self.progress),
    });
  }

  /** Floating cards drift against the pointer at different depths; the 3D scene tilts with it. */
  private pointerParallax(): void {
    const floats = gsap.utils.toArray<HTMLElement>('[data-depth]').map((el) => ({
      depth: parseFloat(el.dataset['depth'] ?? '1'),
      x: gsap.quickTo(el, 'x', { duration: 0.8, ease: 'power3.out' }),
      y: gsap.quickTo(el, 'y', { duration: 0.8, ease: 'power3.out' }),
    }));

    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / innerWidth) * 2 - 1;
      const ny = (e.clientY / innerHeight) * 2 - 1;
      this.scene?.setPointer(nx, ny);
      floats.forEach((f) => {
        f.x(-nx * 18 * f.depth);
        f.y(-ny * 14 * f.depth);
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    this.removePointer = () => window.removeEventListener('pointermove', onMove);
  }

  private countUp(): void {
    const els = this.root.nativeElement.querySelectorAll<HTMLElement>('[data-count]');
    els.forEach((el) => {
      const target = Number(el.dataset['count']);
      if (prefersReducedMotion()) {
        el.textContent = target.toLocaleString('en-US');
        return;
      }
      const counter = { v: 0 };
      gsap.to(counter, {
        v: target,
        duration: 1.4,
        ease: 'power3.out',
        delay: 0.6,
        onUpdate: () => (el.textContent = Math.round(counter.v).toLocaleString('en-US')),
      });
    });
  }
}
