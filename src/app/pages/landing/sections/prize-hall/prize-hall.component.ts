import { DecimalPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { Flip, MOTION_OK, ScrollTrigger, gsap, prefersReducedMotion, queueScrollRefresh } from '../../../../animations/gsap';
import { CATEGORY_FILTERS, CURRENCY_LABEL, CategoryFilter } from '../../../../config/site.config';
import { AuctionRoom } from '../../../../services/models';
import { PrizesService, categoryLabel } from '../../../../services/prizes.service';
import { CountdownComponent } from '../../../../shared/countdown.component';
import { IconComponent } from '../../../../shared/icon.component';
import { PrizeOrbit } from '../../../../three/prize-orbit/prize-orbit';

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
  readonly filters = CATEGORY_FILTERS;
  readonly currency = CURRENCY_LABEL;
  readonly categoryLabel = categoryLabel;
  readonly skeletons = [0, 1, 2, 3];
  private orbit?: PrizeOrbit;
  private ctx?: gsap.Context;
  private sub?: Subscription;
  private entered = false;

  constructor(private prizes: PrizesService, private zone: NgZone, private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      try {
        this.orbit = new PrizeOrbit(this.orbitHost.nativeElement, prefersReducedMotion());
        this.orbit.start();
      } catch {
        /* WebGL unavailable: the gradient backdrop stays */
      }
      this.ctx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: this.root.nativeElement,
          start: 'top bottom',
          end: 'bottom top',
          onUpdate: (self) => this.orbit?.setScroll(self.progress),
        });
        gsap.matchMedia().add(MOTION_OK, () => {
          gsap.from('[data-hall-head] > *', { y: 40, opacity: 0, stagger: 0.1, scrollTrigger: { trigger: this.root.nativeElement, start: 'top 75%' } });
        });
      }, this.root.nativeElement);
    });

    this.sub = this.prizes.auctions$.subscribe((list) => {
      this.auctions = list;
      this.cdr.detectChanges();
      if (list?.length) this.zone.runOutsideAngular(() => this.enterFromDepth());
      queueScrollRefresh();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.ctx?.revert();
    this.orbit?.dispose();
  }

  matches(a: AuctionRoom): boolean {
    return this.active === null || a.product.categoryId === this.active;
  }

  count(f: CategoryFilter): number {
    return (this.auctions ?? []).filter((a) => f.id === null || a.product.categoryId === f.id).length;
  }

  get visibleAuctions(): AuctionRoom[] {
    return (this.auctions ?? []).filter((a) => this.matches(a));
  }

  get visibleCount(): number {
    return this.visibleAuctions.length;
  }

  /** Mobile carousel: which card is centred. */
  onSwipe(): void {
    const el = this.grid?.nativeElement;
    const card = el?.querySelector<HTMLElement>('[data-card]:not(.hidden)');
    if (!el || !card) return;
    const step = card.offsetWidth + parseFloat(getComputedStyle(el).columnGap || '0');
    this.slide = Math.round(Math.abs(el.scrollLeft) / step);
  }

  goTo(i: number): void {
    const card = this.grid?.nativeElement.querySelectorAll<HTMLElement>('[data-card]:not(.hidden)')[i];
    card?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  trackById(_: number, a: AuctionRoom): number {
    return a.id;
  }

  setFilter(id: number | null): void {
    if (id === this.active) return;
    const cards = this.grid?.nativeElement.querySelectorAll<HTMLElement>('[data-card]');
    const state = cards?.length ? Flip.getState(cards) : null;

    this.active = id;
    this.slide = 0;
    this.grid?.nativeElement.scrollTo({ left: 0 });
    this.cdr.detectChanges();
    this.orbit?.pulse();

    if (!state || prefersReducedMotion()) return;
    this.zone.runOutsideAngular(() => {
      Flip.from(state, {
        duration: 0.65,
        ease: 'power3.inOut',
        scale: true,
        absolute: true,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.7, rotateX: 25 }, { opacity: 1, scale: 1, rotateX: 0, duration: 0.6, delay: 0.15 }),
        onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.7, duration: 0.4 }),
        onComplete: queueScrollRefresh,
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
