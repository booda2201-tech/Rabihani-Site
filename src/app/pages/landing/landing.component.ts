import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy } from '@angular/core';
import { whileVisible } from '../../animations/gsap';
import { SOCIAL_LINKS } from '../../config/site.config';
import { LogoComponent } from '../../shared/logo.component';
import { injectIsBrowser } from '../../shared/platform';
import { AppScreensComponent } from './sections/app-screens/app-screens.component';
import { CuriosityComponent } from './sections/curiosity/curiosity.component';
import { DownloadComponent } from './sections/download/download.component';
import { HeroComponent } from './sections/hero/hero.component';
import { HowToEarnComponent } from './sections/how-to-earn/how-to-earn.component';
import { PartnersComponent } from './sections/partners/partners.component';
import { PrizeHallComponent } from './sections/prize-hall/prize-hall.component';
import { SiteNavComponent } from './site-nav/site-nav.component';
import { StickyCtaComponent } from './sticky-cta/sticky-cta.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    LogoComponent,
    SiteNavComponent,
    HeroComponent,
    CuriosityComponent,
    HowToEarnComponent,
    PrizeHallComponent,
    PartnersComponent,
    AppScreensComponent,
    DownloadComponent,
    StickyCtaComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-site-nav></app-site-nav>
    <main>
      <app-hero></app-hero>
      <app-curiosity></app-curiosity>
      <app-how-to-earn></app-how-to-earn>
      <app-prize-hall></app-prize-hall>
      <app-partners></app-partners>
      <app-app-screens></app-app-screens>
      <app-download></app-download>
    </main>
    <footer class="border-t border-white/5 py-7">
      <div class="container-x flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-right">
        <app-logo size="sm"></app-logo>
        <p class="text-sm font-semibold text-slate-400">اكسب النقاط واستبدلها بمنتجات</p>
        <div class="flex flex-col items-center gap-3 sm:items-end">
          <div class="flex items-center gap-2">
            <a
              [href]="social.instagram"
              target="_blank"
              rel="noopener"
              aria-label="ربحني على Instagram"
              class="grid h-12 w-12 place-items-center rounded-xl bg-white/5 text-slate-300 ring-1 ring-white/10 transition hover:bg-gradient-to-tr hover:from-[#f9ce34] hover:via-[#ee2a7b] hover:to-[#6228d7] hover:text-white hover:ring-transparent"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" class="h-6 w-6" aria-hidden="true">
                <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16ZM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.13 1.38A5.88 5.88 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.13a5.88 5.88 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.88 5.88 0 0 0 2.13-1.38 5.88 5.88 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.88 5.88 0 0 0-1.38-2.13A5.88 5.88 0 0 0 19.86.63C19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0Zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88Z" />
              </svg>
            </a>
            <a
              [href]="social.facebook"
              target="_blank"
              rel="noopener"
              aria-label="ربحني على Facebook"
              class="grid h-12 w-12 place-items-center rounded-xl bg-white/5 text-slate-300 ring-1 ring-white/10 transition hover:bg-[#1877f2] hover:text-white hover:ring-transparent"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" class="h-6 w-6" aria-hidden="true">
                <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07Z" />
              </svg>
            </a>
          </div>
          <p class="text-xs font-medium text-slate-600">© {{ year }} ربحني</p>
        </div>
      </div>
    </footer>
    <app-sticky-cta></app-sticky-cta>
  `,
})
export class LandingComponent implements AfterViewInit, OnDestroy {
  readonly year = new Date().getFullYear();
  readonly social = SOCIAL_LINKS;

  private readonly browser = injectIsBrowser();
  private unwatch: (() => void)[] = [];

  constructor(private host: ElementRef<HTMLElement>, private zone: NgZone) {}

  /** CSS loops (live dots, scan lines…) freeze while their section is off screen; see `[data-offscreen]` in styles.scss. */
  ngAfterViewInit(): void {
    if (!this.browser) return;
    this.zone.runOutsideAngular(() => {
      this.host.nativeElement.querySelectorAll('main section').forEach((section) => {
        this.unwatch.push(whileVisible(section, (visible) => section.toggleAttribute('data-offscreen', !visible)));
      });
    });
  }

  ngOnDestroy(): void {
    this.unwatch.forEach((stop) => stop());
  }
}
