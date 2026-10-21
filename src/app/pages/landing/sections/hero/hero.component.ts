import { NgIf } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { MOTION_OK, gsap, playWhileVisible, prefersReducedMotion } from '../../../../animations/gsap';
import { PARTNERS } from '../../../../config/site.config';
import { AuctionRoom } from '../../../../services/models';
import { PrizesService, cocktail, hiddenPrize } from '../../../../services/prizes.service';
import { CountdownComponent } from '../../../../shared/countdown.component';
import { IconComponent } from '../../../../shared/icon.component';
import { PulseRingDirective } from '../../../../shared/pulse-ring.directive';
import { LogoComponent } from '../../../../shared/logo.component';
import { injectIsBrowser } from '../../../../shared/platform';
import { StoreButtonsComponent } from '../../../../shared/store-buttons.component';
import { LiveAuctionPhoneComponent } from './live-auction-phone/live-auction-phone.component';

/** Resting tilt of the phone, in degrees: turned toward the copy beside it on desktop, facing the reader on phones. */
function phoneRest(): { x: number; y: number } {
  return matchMedia('(min-width: 1024px)').matches ? { x: 6, y: 14 } : { x: 3, y: 0 };
}

interface HeroStats {
  live: number;
  minStart: number;
  nextEnd: string;
}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [NgIf, LogoComponent, StoreButtonsComponent, CountdownComponent, IconComponent, PulseRingDirective, LiveAuctionPhoneComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero.component.html',
})
export class HeroComponent implements AfterViewInit, OnDestroy {
  @ViewChild('root', { static: true }) root!: ElementRef<HTMLElement>;

  stats: HeroStats | null = null;
  /** Prizes the phone cycles through: a mix across categories, never the secret one. */
  showcase: AuctionRoom[] = [];
  readonly partnersCount = PARTNERS.length;

  private ctx?: gsap.Context;
  private sub?: Subscription;
  private removePointer?: () => void;
  private unwatchFloat?: () => void;

  private readonly browser = injectIsBrowser();

  constructor(private prizes: PrizesService, private zone: NgZone, private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    if (!this.browser) return;
    this.zone.runOutsideAngular(() => {
      this.ctx = gsap.context(() => this.animate(), this.root.nativeElement);
    });

    this.sub = this.prizes.auctions$.subscribe((list) => {
      if (!list?.length) return;
      this.stats = {
        live: list.length,
        minStart: Math.min(...list.map((a) => a.startPoints)),
        nextEnd: list.reduce((a, b) => (new Date(a.endTime) < new Date(b.endTime) ? a : b)).endTime,
      };
      this.showcase = cocktail(list, 4, hiddenPrize(list)?.id);
      this.cdr.detectChanges();
      this.zone.runOutsideAngular(() => this.countUp());
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.unwatchFloat?.();
    this.removePointer?.();
    this.ctx?.revert();
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

      const rest = phoneRest();
      tl.addLabel('enter', '-=0.4');
      tl.fromTo(
        '[data-phone]',
        { y: 140, rotationY: -48, rotationX: 18, rotationZ: -6, opacity: 0 },
        { y: 0, rotationY: rest.y, rotationX: rest.x, rotationZ: 0, opacity: 1, duration: 1.5, ease: 'expo.out' },
        'enter',
      )
        .from('[data-stand]', { scaleX: 0.3, opacity: 0, duration: 1.2 }, 'enter+=0.2')
        .from('[data-glow]', { opacity: 0, scale: 0.5, duration: 1.4 }, 'enter')
        .from('[data-line]', { yPercent: 115, duration: 1, stagger: 0.12, ease: 'expo.out' }, 'enter+=0.1')
        .from('[data-hero-fade]', { y: 26, opacity: 0, stagger: 0.08, duration: 0.7 }, 'enter+=0.45')
        .from('[data-float]', { y: 40, scale: 0.7, opacity: 0, stagger: 0.15, duration: 0.9, ease: 'back.out(1.7)' }, 'enter+=1.1');

      tl.add(() => {
        const float = gsap.to('[data-phone-float]', { y: -14, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
        this.unwatchFloat = playWhileVisible(this.root.nativeElement, float);
        this.pointerParallax();
      });

      gsap.to('[data-phone-float]', {
        yPercent: 12,
        scale: 0.94,
        ease: 'none',
        scrollTrigger: { trigger: this.root.nativeElement, start: 'top top', end: 'bottom top', scrub: true },
      });

      gsap.to('[data-hero-content]', {
        yPercent: -14,
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: this.root.nativeElement, start: 'top top', end: 'bottom top', scrub: true },
      });
      // On phones the floating card sits right under the device, so it fades in place instead of sliding over it.
      const narrow = () => window.innerWidth < 640;
      gsap.to('[data-float-layer]', {
        yPercent: () => (narrow() ? 0 : -35),
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: this.root.nativeElement, start: 'top top', end: () => (narrow() ? '30% top' : '70% top'), scrub: true, invalidateOnRefresh: true },
      });
    });

    mm.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set('[data-intro]', { display: 'none' });
      const rest = phoneRest();
      gsap.set('[data-phone]', { rotationY: rest.y, rotationX: rest.x });
    });
  }

  /** Floating cards drift against the pointer at different depths; the phone turns toward it. */
  private pointerParallax(): void {
    const floats = gsap.utils.toArray<HTMLElement>('[data-depth]').map((el) => ({
      depth: parseFloat(el.dataset['depth'] ?? '1'),
      x: gsap.quickTo(el, 'x', { duration: 0.8, ease: 'power3.out' }),
      y: gsap.quickTo(el, 'y', { duration: 0.8, ease: 'power3.out' }),
    }));
    const phone = this.root.nativeElement.querySelector('[data-phone]');
    const turnY = gsap.quickTo(phone, 'rotationY', { duration: 1, ease: 'power3.out' });
    const turnX = gsap.quickTo(phone, 'rotationX', { duration: 1, ease: 'power3.out' });

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const nx = (e.clientX / innerWidth) * 2 - 1;
      const ny = (e.clientY / innerHeight) * 2 - 1;
      const rest = phoneRest();
      turnY(rest.y + nx * 16);
      turnX(rest.x - ny * 10);
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
