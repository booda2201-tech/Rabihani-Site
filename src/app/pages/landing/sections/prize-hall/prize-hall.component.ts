import { DecimalPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { MOTION_OK, ScrollTrigger, gsap, prefersReducedMotion, queueScrollRefresh } from '../../../../animations/gsap';
import { CATEGORY_FILTERS, CURRENCY_LABEL, CategoryFilter } from '../../../../config/site.config';
import { AuctionRoom } from '../../../../services/models';
import { PrizesService, categoryLabel, cocktail, hiddenPrize } from '../../../../services/prizes.service';
import { CountdownComponent } from '../../../../shared/countdown.component';
import { IconComponent } from '../../../../shared/icon.component';
import { injectIsBrowser } from '../../../../shared/platform';
import type { PrizeOrbit } from '../../../../three/prize-orbit/prize-orbit';

/** The hall is a teaser, not a catalogue: the rest is only visible in the app. */
const TEASER_SIZE = 4;

@Component({
  selector: 'app-prize-hall',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, DecimalPipe, CountdownComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './prize-hall.component.html',
})
export class PrizeHallComponent implements AfterViewInit, OnDestroy {
  @ViewChild('root', { static: true }) root!: ElementRef<HTMLElement>;
  @ViewChild('orbit', { static: true }) orbitHost!: ElementRef<HTMLDivElement>;
  @ViewChild('grid') grid?: ElementRef<HTMLElement>;

  auctions: AuctionRoom[] | null = null;
  active: number | null = null;
  slide = 0;
  /** Matching the active filter. */
  visibleAuctions: AuctionRoom[] = [];
  /** The teaser picked from them. */
  shownAuctions: AuctionRoom[] = [];
  /** A few of the ones left out, as blurred thumbnails. */
  peek: AuctionRoom[] = [];
  private shownIds = new Set<number>();
  readonly filters = CATEGORY_FILTERS;
  readonly currency = CURRENCY_LABEL;
  readonly categoryLabel = categoryLabel;
  readonly skeletons = [0, 1, 2, 3];
  private orbit?: PrizeOrbit;
  private orbitObserver?: IntersectionObserver;
  private scrollProgress = 0;
  private destroyed = false;
  private ctx?: gsap.Context;
  private sub?: Subscription;
  private entered = false;

  private readonly browser = injectIsBrowser();

  constructor(private prizes: PrizesService, private zone: NgZone, private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    if (!this.browser) return;
    this.zone.runOutsideAngular(() => {
      this.loadOrbitWhenNear();
      this.ctx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: this.root.nativeElement,
          start: 'top bottom',
          end: 'bottom top',
          onUpdate: (self) => {
            this.scrollProgress = self.progress;
            this.orbit?.setScroll(self.progress);
          },
        });
        gsap.matchMedia().add(MOTION_OK, () => {
          gsap.from('[data-hall-head] > *', { y: 40, opacity: 0, stagger: 0.1, scrollTrigger: { trigger: this.root.nativeElement, start: 'top 75%' } });
        });
      }, this.root.nativeElement);
    });

    this.sub = this.prizes.auctions$.subscribe((list) => {
      this.auctions = list;
      this.recompute();
      this.cdr.detectChanges();
      if (list?.length) this.zone.runOutsideAngular(() => this.enterFromDepth());
      queueScrollRefresh();
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.orbitObserver?.disconnect();
    this.sub?.unsubscribe();
    this.ctx?.revert();
    this.orbit?.dispose();
  }

  /**
   * three.js is most of the bundle and WebGL setup is slow on iOS, so neither happens at startup:
   * the backdrop is fetched and built once the hall is within a screen or so of the viewport.
   */
  private loadOrbitWhenNear(): void {
    this.orbitObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        this.orbitObserver?.disconnect();
        import('../../../../three/prize-orbit/prize-orbit')
          .then(({ PrizeOrbit }) => {
            if (this.destroyed) return;
            this.orbit = new PrizeOrbit(this.orbitHost.nativeElement, prefersReducedMotion());
            this.orbit.setScroll(this.scrollProgress);
            this.orbit.start();
          })
          .catch(() => {
            /* WebGL or the chunk unavailable: the gradient backdrop stays */
          });
      },
      { rootMargin: '800px 0px' },
    );
    this.orbitObserver.observe(this.root.nativeElement);
  }

  matches(a: AuctionRoom): boolean {
    return this.active === null || a.product.categoryId === this.active;
  }

  count(f: CategoryFilter): number {
    return (this.auctions ?? []).filter((a) => f.id === null || a.product.categoryId === f.id).length;
  }

  /** Live auctions in the active tab that are not on screen: the reason to open the app. */
  get moreInApp(): number {
    return this.visibleAuctions.length - this.shownAuctions.length;
  }

  private recompute(): void {
    const all = this.auctions ?? [];
    const secret = hiddenPrize(all);
    this.visibleAuctions = all.filter((a) => this.matches(a));
    this.shownAuctions = cocktail(this.visibleAuctions, TEASER_SIZE, secret?.id);
    this.shownIds = new Set(this.shownAuctions.map((a) => a.id));
    this.peek = this.visibleAuctions.filter((a) => !this.shownIds.has(a.id) && a.id !== secret?.id).slice(0, 3);
  }

  /** Mobile carousel: which card is centred. */
  onSwipe(): void {
    const el = this.grid?.nativeElement;
    const card = el?.querySelector<HTMLElement>('[data-card]');
    if (!el || !card) return;
    const step = card.offsetWidth + parseFloat(getComputedStyle(el).columnGap || '0');
    this.slide = Math.round(Math.abs(el.scrollLeft) / step);
  }

  goTo(i: number): void {
    const card = this.grid?.nativeElement.querySelectorAll<HTMLElement>('[data-card]')[i];
    card?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  trackById(_: number, a: AuctionRoom): number {
    return a.id;
  }

  setFilter(id: number | null): void {
    if (id === this.active) return;
    const grid = this.grid?.nativeElement;

    const apply = () => {
      this.active = id;
      this.recompute();
      this.slide = 0;
      grid?.scrollTo({ left: 0 });
      this.cdr.detectChanges();
      queueScrollRefresh();
    };

    this.orbit?.pulse();
    if (!grid || prefersReducedMotion()) {
      apply();
      return;
    }

    const cards = grid.querySelectorAll<HTMLElement>('[data-card]');
    this.zone.runOutsideAngular(() => {
      gsap.killTweensOf(cards);
      gsap.to(grid.querySelectorAll('[data-card]'), {
        opacity: 0,
        y: 12,
        duration: 0.18,
        ease: 'power1.in',
        onComplete: () => {
          apply();
          gsap.fromTo(
            grid.querySelectorAll('[data-card]'),
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out', stagger: 0.06, clearProps: 'opacity,transform' },
          );
        },
      });
    });
  }

  private enterFromDepth(): void {
    if (this.entered || prefersReducedMotion() || !this.grid) return;
    this.entered = true;
    this.ctx?.add(() => {
      gsap.from(this.grid!.nativeElement.querySelectorAll('[data-card]'), {
        opacity: 0,
        z: -600,
        rotateX: 35,
        y: 120,
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.09,
        scrollTrigger: { trigger: this.grid!.nativeElement, start: 'top 82%' },
      });
    });
  }
}
