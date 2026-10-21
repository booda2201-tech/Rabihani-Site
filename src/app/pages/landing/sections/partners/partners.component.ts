import { NgFor, NgIf } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { MOTION_OK, gsap, playWhileVisible, queueScrollRefresh } from '../../../../animations/gsap';
import { PARTNERS, Partner } from '../../../../config/site.config';
import { Advertisement } from '../../../../services/models';
import { PrizesService } from '../../../../services/prizes.service';
import { IconComponent } from '../../../../shared/icon.component';
import { injectIsBrowser } from '../../../../shared/platform';

@Component({
  selector: 'app-partners',
  standalone: true,
  imports: [NgFor, NgIf, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './partners.component.html',
})
export class PartnersComponent implements AfterViewInit, OnDestroy {
  @ViewChild('root', { static: true }) root!: ElementRef<HTMLElement>;
  @ViewChild('track') track?: ElementRef<HTMLElement>;

  readonly partners = PARTNERS;
  ads: Advertisement[] = [];
  open: Partner | null = null;

  private ctx?: gsap.Context;
  private sub?: Subscription;

  private readonly browser = injectIsBrowser();

  constructor(private prizes: PrizesService, private zone: NgZone, private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    if (!this.browser) return;
    this.zone.runOutsideAngular(() => {
      this.ctx = gsap.context(() => {
        gsap.matchMedia().add(MOTION_OK, () => {
          gsap.from('[data-partner]', {
            y: 60,
            opacity: 0,
            rotateY: -20,
            stagger: 0.08,
            scrollTrigger: { trigger: '[data-partner-grid]', start: 'top 80%' },
          });
        });
      }, this.root.nativeElement);
    });

    this.sub = this.prizes.ads$.subscribe((ads) => {
      this.ads = ads;
      this.cdr.detectChanges();
      queueScrollRefresh();
      if (ads.length) this.zone.runOutsideAngular(() => this.marquee());
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.ctx?.revert();
  }

  toggle(p: Partner): void {
    this.open = this.open === p ? null : p;
  }

  /** Track holds the ads twice; sliding it by half its width loops seamlessly. */
  private marquee(): void {
    const track = this.track?.nativeElement;
    if (!track) return;
    this.ctx?.add(() => {
      gsap.matchMedia().add(MOTION_OK, () => {
        const tween = gsap.fromTo(track, { xPercent: -50 }, { xPercent: 0, duration: Math.max(18, this.ads.length * 7), ease: 'none', repeat: -1 });
        const slow = () => gsap.to(tween, { timeScale: 0.2, duration: 0.5 });
        const resume = () => gsap.to(tween, { timeScale: 1, duration: 0.5 });
        track.addEventListener('pointerenter', slow);
        track.addEventListener('pointerleave', resume);
        const unwatch = playWhileVisible(track, tween);
        return () => {
          unwatch();
          track.removeEventListener('pointerenter', slow);
          track.removeEventListener('pointerleave', resume);
        };
      });
    });
  }
}
