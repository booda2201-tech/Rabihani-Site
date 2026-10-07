import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LogoComponent } from '../../shared/logo.component';
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
export class LandingComponent {
  readonly year = new Date().getFullYear();
}
