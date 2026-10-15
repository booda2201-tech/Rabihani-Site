import { NgIf } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { MOTION_OK, gsap, prefersReducedMotion, queueScrollRefresh } from '../../../../animations/gsap';
import { CURRENCY_LABEL } from '../../../../config/site.config';
import { AuctionRoom } from '../../../../services/models';
import { PrizesService } from '../../../../services/prizes.service';
import { IconComponent } from '../../../../shared/icon.component';
import { injectIsBrowser } from '../../../../shared/platform';

const PRICE_DIGITS = 5;

@Component({
  selector: 'app-curiosity',
  standalone: true,
  imports: [NgIf, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './curiosity.component.html',
})
export class CuriosityComponent implements AfterViewInit, OnDestroy {
  @ViewChild('root', { static: true }) root!: ElementRef<HTMLElement>;
  @ViewChild('price', { static: true }) price!: ElementRef<HTMLElement>;
  @ViewChild('start', { static: true }) start!: ElementRef<HTMLElement>;

  featured: AuctionRoom | null | undefined;
  readonly currency = CURRENCY_LABEL;

  private ctx?: gsap.Context;
  private scramble?: number;
  private sub?: Subscription;

  private readonly browser = injectIsBrowser();

  constructor(private prizes: PrizesService, private zone: NgZone, private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    if (!this.browser) return;
    this.sub = this.prizes.featured$.subscribe((f) => {
      this.featured = f;
      this.cdr.detectChanges();
      queueScrollRefresh();
      if (f) this.zone.runOutsideAngular(() => this.startScramble());
    });

    this.zone.runOutsideAngular(() => {
      this.ctx = gsap.context(() => {
        gsap.matchMedia().add(MOTION_OK, () => {
          gsap.fromTo(
            '[data-product]',
            { y: 60, rotate: -3, scale: 0.92 },
            { y: -30, rotate: 2, scale: 1, ease: 'none', scrollTrigger: { trigger: this.root.nativeElement, start: 'top bottom', end: 'bottom top', scrub: true } },
          );
          gsap.to('[data-ring]', { rotate: 360, duration: 40, ease: 'none', repeat: -1 });
          gsap.to('[data-qmark]', { y: -8, rotate: 4, duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
          gsap.from('[data-guess]', {
            y: 40,
            opacity: 0,
            stagger: 0.12,
            scrollTrigger: { trigger: this.root.nativeElement, start: 'top 70%' },
          });
        });
      }, this.root.nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    clearInterval(this.scramble);
    this.ctx?.revert();
  }

  private startScramble(): void {
    if (this.scramble || !this.featured) return;
    const startDigits = Math.round(this.featured.startPoints).toString().length;
    const random = (digits: number) =>
      Math.floor(Math.random() * 10 ** digits)
        .toString()
        .padStart(digits, '0')
        .replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    const tick = () => {
      this.price.nativeElement.textContent = random(PRICE_DIGITS);
      this.start.nativeElement.textContent = random(startDigits);
    };
    tick();
    if (!prefersReducedMotion()) this.scramble = window.setInterval(tick, 90);
  }
}
