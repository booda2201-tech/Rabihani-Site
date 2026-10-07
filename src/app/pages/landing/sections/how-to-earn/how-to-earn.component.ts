import { NgFor } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { DESKTOP_MOTION, MOBILE_OR_REDUCED, ScrollTrigger, gsap, prefersReducedMotion } from '../../../../animations/gsap';
import { IconComponent, IconName } from '../../../../shared/icon.component';
import { PhoneFrameComponent } from '../../../../shared/phone-frame.component';
import { PhoneScreen, PhoneScreenComponent } from '../../../../shared/phone-screen/phone-screen.component';

interface Step {
  title: string;
  text: string;
  icon: IconName;
  screen: PhoneScreen;
}

@Component({
  selector: 'app-how-to-earn',
  standalone: true,
  imports: [NgFor, IconComponent, PhoneFrameComponent, PhoneScreenComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './how-to-earn.component.html',
})
export class HowToEarnComponent implements AfterViewInit, OnDestroy {
  @ViewChild('root', { static: true }) root!: ElementRef<HTMLElement>;

  readonly steps: Step[] = [
    { title: 'امسح QR عند الشريك', text: 'اشرب، اغسل العربية، اشتري شاي… وامسح الكود اللي عند الكاشير.', icon: 'qr', screen: 'scan' },
    { title: 'النقاط تدخل محفظتك', text: 'في ثانية. من غير كروت، من غير ورق.', icon: 'wallet', screen: 'wallet' },
    { title: 'زايد وخد الجائزة', text: 'بالنقاط مش بالفلوس. خليك الأعلى لحد ما العداد يقفل.', icon: 'gift', screen: 'bid' },
  ];

  private ctx?: gsap.Context;

  constructor(private zone: NgZone) {}

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.ctx = gsap.context(() => {
        const mm = gsap.matchMedia();
        mm.add(DESKTOP_MOTION, () => this.pinnedStory());
        mm.add(MOBILE_OR_REDUCED, () => this.simpleStory());
      }, this.root.nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
  }

  /** Desktop: pin the section and flip the phone between real app screens as the user scrolls. */
  private pinnedStory(): void {
    const steps = gsap.utils.toArray<HTMLElement>('[data-step]');
    const screens = gsap.utils.toArray<HTMLElement>('[data-screen]');
    const phone = '[data-phone]';

    gsap.set(screens, { autoAlpha: 0 });
    gsap.set(screens[0], { autoAlpha: 1 });
    gsap.set(steps, { opacity: 0.3 });
    gsap.set(steps[0], { opacity: 1 });

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: '[data-pin]',
        start: 'top top',
        end: () => `+=${window.innerHeight * 2.2}`,
        pin: true,
        scrub: 0.8,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    tl.fromTo(phone, { rotateY: -28, rotateX: 10, y: 40 }, { rotateY: 0, rotateX: 0, y: 0, duration: 1 })
      .fromTo('[data-progress]', { scaleY: 0 }, { scaleY: 1 / 3, duration: 1 }, 0);

    for (let i = 1; i < screens.length; i++) {
      tl.to(phone, { rotateY: 90, duration: 0.5, ease: 'power2.in' })
        .set(screens[i - 1], { autoAlpha: 0 })
        .set(screens[i], { autoAlpha: 1 })
        .fromTo(phone, { rotateY: -90 }, { rotateY: 0, duration: 0.5, ease: 'power2.out' })
        .to(steps[i - 1], { opacity: 0.3, duration: 0.3 }, '<-0.3')
        .to(steps[i], { opacity: 1, duration: 0.3 }, '<')
        .to('[data-progress]', { scaleY: (i + 1) / 3, duration: 0.6 }, '<')
        .to({}, { duration: 0.6 });
    }
  }

  /** Mobile / reduced motion: no pin; the phone cycles through the steps while it is on screen. */
  private simpleStory(): void {
    const steps = gsap.utils.toArray<HTMLElement>('[data-step]');
    const screens = gsap.utils.toArray<HTMLElement>('[data-screen]');
    const fade = prefersReducedMotion() ? 0 : 0.4;
    const show = (i: number) => {
      screens.forEach((s, j) => gsap.to(s, { autoAlpha: i === j ? 1 : 0, duration: fade }));
      steps.forEach((s, j) => s.classList.toggle('is-active', i === j));
      gsap.to('[data-progress]', { scaleY: (i + 1) / steps.length, duration: fade });
    };
    show(0);

    const cycle = gsap.timeline({ repeat: -1, paused: true });
    steps.forEach((_, i) => cycle.call(show, [i]).to({}, { duration: 2.8 }));

    ScrollTrigger.create({
      trigger: this.root.nativeElement,
      start: 'top 70%',
      end: 'bottom 20%',
      onToggle: (self) => (self.isActive ? cycle.play() : cycle.pause()),
    });
  }
}
