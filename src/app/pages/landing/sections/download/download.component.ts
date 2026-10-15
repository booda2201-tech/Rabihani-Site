import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { MOTION_OK, gsap } from '../../../../animations/gsap';
import { DOWNLOAD_LINKS, SITE_URL } from '../../../../config/site.config';
import { LogoComponent } from '../../../../shared/logo.component';
import { injectIsBrowser } from '../../../../shared/platform';
import { QrCodeComponent } from '../../../../shared/qr-code.component';
import { StoreButtonsComponent } from '../../../../shared/store-buttons.component';

@Component({
  selector: 'app-download',
  standalone: true,
  imports: [LogoComponent, StoreButtonsComponent, QrCodeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './download.component.html',
})
export class DownloadComponent implements AfterViewInit, OnDestroy {
  @ViewChild('root', { static: true }) root!: ElementRef<HTMLElement>;

  readonly qrValue = DOWNLOAD_LINKS.qr || `${SITE_URL}/#download`;

  private ctx?: gsap.Context;
  private readonly browser = injectIsBrowser();

  constructor(private zone: NgZone) {}

  ngAfterViewInit(): void {
    if (!this.browser) return;
    this.zone.runOutsideAngular(() => {
      this.ctx = gsap.context(() => {
        gsap.matchMedia().add(MOTION_OK, () => {
          const tl = gsap.timeline({ scrollTrigger: { trigger: this.root.nativeElement, start: 'top 70%' } });
          tl.from('[data-dl-card]', { scale: 0.92, opacity: 0, y: 60, duration: 1, ease: 'expo.out' })
            .from('[data-dl]', { y: 30, opacity: 0, stagger: 0.1 }, '-=0.6')
            .from('[data-dl-qr]', { rotateY: 90, opacity: 0, duration: 0.9 }, '-=0.6');
        });
      }, this.root.nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
  }
}
