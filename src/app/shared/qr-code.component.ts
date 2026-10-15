import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges } from '@angular/core';
import * as QRCode from 'qrcode';
import { injectIsBrowser } from './platform';

@Component({
  selector: 'app-qr-code',
  standalone: true,
  imports: [NgIf],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<img *ngIf="src" [src]="src" [alt]="alt" class="block h-full w-full [image-rendering:pixelated]" />`,
})
export class QrCodeComponent implements OnChanges {
  @Input({ required: true }) value!: string;
  @Input() alt = 'QR';
  @Input() dark = '#050816';
  @Input() light = '#ffffff';

  src = '';
  private readonly browser = injectIsBrowser();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(): void {
    if (!this.browser) return;
    QRCode.toDataURL(this.value, {
      margin: 1,
      width: 512,
      errorCorrectionLevel: 'M',
      color: { dark: this.dark, light: this.light },
    }).then((url) => {
      this.src = url;
      this.cdr.markForCheck();
    });
  }
}
