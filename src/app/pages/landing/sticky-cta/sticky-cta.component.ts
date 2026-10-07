import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { ScrollTrigger, gsap } from '../../../animations/gsap';
import { DOWNLOAD_LINKS } from '../../../config/site.config';
import { IconComponent } from '../../../shared/icon.component';

@Component({
  selector: 'app-sticky-cta',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div #bar class="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 opacity-0">
      <div class="pointer-events-auto flex items-center gap-2 rounded-full bg-card/90 p-1.5 pr-5 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
        <span class="hidden text-sm font-semibold text-slate-300 sm:block">العداد ماشي. الجايزة مش هتستنى.</span>
        <a [href]="links.android" class="grid h-10 w-10 place-items-center rounded-full bg-white/5 text-white ring-1 ring-white/10 transition hover:bg-white/10" aria-label="Google Play">
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M3.6 1.8c-.3.3-.5.8-.5 1.4v17.6c0 .6.2 1.1.5 1.4L13.6 12 3.6 1.8Zm13.4 6.7-3.4 3.5 3.4 3.5 3.9-2.2c1.1-.6 1.1-1.7 0-2.3L17 8.5ZM3.6 22.2c.4.4 1 .4 1.7.1L17 15.5 13.6 12 3.6 22.2ZM17 8.5 5.3 1.8c-.7-.4-1.3-.3-1.7 0L13.6 12 17 8.5Z" /></svg>
        </a>
        <a [href]="links.ios" class="grid h-10 w-10 place-items-center rounded-full bg-white/5 text-white ring-1 ring-white/10 transition hover:bg-white/10" aria-label="App Store">
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" /></svg>
        </a>
        <a href="#download" class="flex animate-cta-pulse items-center gap-2 rounded-full bg-bid px-5 py-2.5 text-sm font-bold text-white">
          <app-icon name="download" class="h-4 w-4"></app-icon>
          حمّل وزايد
        </a>
      </div>
    </div>
  `,
})
export class StickyCtaComponent implements AfterViewInit, OnDestroy {
  @ViewChild('bar', { static: true }) bar!: ElementRef<HTMLElement>;
  readonly links = DOWNLOAD_LINKS;

  private triggers: ScrollTrigger[] = [];
  private pastHero = false;
  private atDownload = false;

  constructor(private zone: NgZone) {}

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      gsap.set(this.bar.nativeElement, { yPercent: 150 });
      this.triggers.push(
        ScrollTrigger.create({
          trigger: '#hero',
          start: 'bottom 75%',
          end: 'max',
          onToggle: (self) => {
            this.pastHero = self.isActive;
            this.sync();
          },
        }),
        ScrollTrigger.create({
          trigger: '#download',
          start: 'top 85%',
          end: 'bottom top',
          onToggle: (self) => {
            this.atDownload = self.isActive;
            this.sync();
          },
        }),
      );
    });
  }

  ngOnDestroy(): void {
    this.triggers.forEach((t) => t.kill());
  }

  private sync(): void {
    const show = this.pastHero && !this.atDownload;
    gsap.to(this.bar.nativeElement, {
      yPercent: show ? 0 : 150,
      opacity: show ? 1 : 0,
      duration: 0.5,
      ease: show ? 'back.out(1.6)' : 'power2.in',
      overwrite: true,
    });
  }
}
