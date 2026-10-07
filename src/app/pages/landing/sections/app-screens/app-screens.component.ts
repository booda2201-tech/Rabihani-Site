import { NgFor } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { DESKTOP_MOTION, gsap } from '../../../../animations/gsap';
import { PhoneFrameComponent } from '../../../../shared/phone-frame.component';
import { PhoneScreen, PhoneScreenComponent } from '../../../../shared/phone-screen/phone-screen.component';

@Component({
  selector: 'app-app-screens',
  standalone: true,
  imports: [NgFor, PhoneFrameComponent, PhoneScreenComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-screens.component.html',
})
export class AppScreensComponent implements AfterViewInit, OnDestroy {
  @ViewChild('root', { static: true }) root!: ElementRef<HTMLElement>;

  readonly screens: { id: PhoneScreen; label: string }[] = [
    { id: 'home', label: 'الرئيسية' },
    { id: 'auctions', label: 'مزاداتي' },
    { id: 'companies', label: 'شركاتي' },
    { id: 'profile', label: 'حسابي' },
    { id: 'qr', label: 'QR الشخصي' },
    { id: 'splash', label: 'السبلاش' },
  ];

  private ctx?: gsap.Context;

  constructor(private zone: NgZone) {}

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.ctx = gsap.context(() => {
        gsap.matchMedia().add(DESKTOP_MOTION, () => this.fan());
      }, this.root.nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
  }

  /** Phones start stacked in the middle and fan out into an arc as the section scrolls in. */
  private fan(): void {
    const phones = gsap.utils.toArray<HTMLElement>('[data-fan]');
    const mid = (phones.length - 1) / 2;
    const spread = () => Math.min(innerWidth >= 1536 ? 230 : 185, (this.root.nativeElement.clientWidth - 320) / phones.length);

    gsap.set(phones, { position: 'absolute', left: '50%', top: 0, xPercent: -50 });

    gsap.fromTo(
      phones,
      {
        x: 0,
        y: (i) => i * -6,
        rotate: (i) => (i - mid) * 2,
        scale: 0.82,
        zIndex: (i) => phones.length - i,
      },
      {
        x: (i) => (mid - i) * spread(),
        y: (i) => Math.abs(i - mid) * 34,
        rotate: (i) => (mid - i) * -5,
        scale: 0.82,
        ease: 'none',
        stagger: 0,
        scrollTrigger: {
          trigger: '[data-fan-stage]',
          start: 'top 85%',
          end: 'center 55%',
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      },
    );
  }
}
