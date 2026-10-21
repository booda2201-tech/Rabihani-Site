import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy } from '@angular/core';
import { whileVisible } from '../../animations/gsap';
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
    <footer class="border-t border-white/5 py-10 pb-28">
      <div class="container-x flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-right">
        <app-logo size="sm"></app-logo>
        <p class="text-sm font-semibold text-slate-400">اكسب النقاط واستبدلها بمنتجات</p>
        <p class="text-xs font-medium text-slate-600">© {{ year }} ربحني</p>
      </div>
    </footer>
    <app-sticky-cta></app-sticky-cta>
  `,
})
export class LandingComponent implements AfterViewInit, OnDestroy {
  readonly year = new Date().getFullYear();

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
