import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DOWNLOAD_LINKS } from '../../config/site.config';
import { LogoComponent } from '../../shared/logo.component';
import { injectIsBrowser } from '../../shared/platform';
import { QrCodeComponent } from '../../shared/qr-code.component';
import { StoreButtonsComponent } from '../../shared/store-buttons.component';

function storeFor(userAgent: string, touchPoints: number): string | null {
  if (/android/i.test(userAgent)) return DOWNLOAD_LINKS.android;
  // iPadOS reports itself as a Mac; touch support gives it away
  if (/iphone|ipad|ipod/i.test(userAgent) || (/macintosh/i.test(userAgent) && touchPoints > 1)) return DOWNLOAD_LINKS.ios;
  return null;
}

/** Target of the printed QR codes: phones go straight to their store, everyone else gets both buttons. */
@Component({
  selector: 'app-download-redirect',
  standalone: true,
  imports: [NgIf, RouterLink, LogoComponent, StoreButtonsComponent, QrCodeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-5 py-12">
      <div class="pointer-events-none absolute inset-0 overflow-hidden">
        <div class="absolute -left-40 top-0 h-[34rem] w-[34rem] rounded-full bg-bid/20 blur-[140px]"></div>
        <div class="absolute -right-40 bottom-0 h-[28rem] w-[28rem] rounded-full bg-gold/10 blur-[140px]"></div>
      </div>

      <section class="relative w-full max-w-md text-center">
        <a routerLink="/" class="mx-auto mb-8 flex w-fit" aria-label="الرئيسية"><app-logo size="md"></app-logo></a>

        <div class="rounded-[2rem] bg-card/90 p-7 shadow-2xl ring-1 ring-white/10 sm:p-9">
          <ng-container *ngIf="redirecting; else choose">
            <span class="mx-auto block h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-gold"></span>
            <h1 class="mt-6 text-2xl font-black text-white">بنفتحلك المتجر…</h1>
            <p class="mt-2 text-sm font-semibold text-slate-400">لو ماتفتحش لوحده، اختار من هنا:</p>
            <div class="mt-6 flex justify-center"><app-store-buttons></app-store-buttons></div>
          </ng-container>

          <ng-template #choose>
            <h1 class="text-2xl font-black text-white sm:text-3xl">حمّل <span class="text-gold-gradient">ربحني</span></h1>
            <p class="mt-2 text-sm font-semibold text-slate-400">اختار المتجر، أو امسح الكود بكاميرا موبايلك.</p>
            <div class="mx-auto mt-7 w-fit rounded-3xl bg-white p-3 shadow-glow-gold">
              <app-qr-code class="block h-40 w-40" [value]="qr" alt="QR تحميل تطبيق ربحني"></app-qr-code>
            </div>
            <div class="mt-7 flex justify-center"><app-store-buttons></app-store-buttons></div>
          </ng-template>
        </div>

        <a routerLink="/" class="mt-6 inline-block text-sm font-bold text-slate-400 transition hover:text-white">اعرف أكتر عن ربحني</a>
      </section>
    </main>
  `,
})
export class DownloadRedirectComponent implements OnInit {
  readonly qr = DOWNLOAD_LINKS.qr;
  redirecting = false;

  private readonly browser = injectIsBrowser();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (!this.browser) return;
    const target = storeFor(navigator.userAgent, navigator.maxTouchPoints ?? 0);
    if (!target) return;
    this.redirecting = true;
    this.cdr.markForCheck();
    window.location.replace(target);
  }
}
