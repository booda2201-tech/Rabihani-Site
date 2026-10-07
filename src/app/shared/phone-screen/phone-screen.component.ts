import { AsyncPipe, DecimalPipe, NgClass, NgFor, NgIf, NgSwitch, NgSwitchCase } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CATEGORY_FILTERS, PARTNERS } from '../../config/site.config';
import { PrizesService } from '../../services/prizes.service';
import { CountdownComponent } from '../countdown.component';
import { IconComponent, IconName } from '../icon.component';
import { LogoComponent } from '../logo.component';
import { QrCodeComponent } from '../qr-code.component';

export type PhoneScreen = 'home' | 'auctions' | 'companies' | 'profile' | 'splash' | 'qr' | 'scan' | 'wallet' | 'bid';

@Component({
  selector: 'app-phone-screen',
  standalone: true,
  imports: [NgIf, NgFor, NgSwitch, NgSwitchCase, NgClass, AsyncPipe, DecimalPipe, IconComponent, LogoComponent, CountdownComponent, QrCodeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './phone-screen.component.html',
  host: { class: 'block h-full w-full' },
})
export class PhoneScreenComponent {
  @Input({ required: true }) screen!: PhoneScreen;

  readonly auctions$ = this.prizes.auctions$;
  readonly featured$ = this.prizes.featured$;
  readonly ads$ = this.prizes.ads$;
  readonly partners = PARTNERS;
  readonly categories = CATEGORY_FILTERS;

  readonly tabs: { id: PhoneScreen; label: string; icon: IconName }[] = [
    { id: 'home', label: 'الرئيسية', icon: 'home' },
    { id: 'auctions', label: 'مزاداتي', icon: 'trophy' },
    { id: 'companies', label: 'شركاتي', icon: 'store' },
    { id: 'profile', label: 'حسابي', icon: 'user' },
  ];

  constructor(private prizes: PrizesService) {}

  get hasTabBar(): boolean {
    return this.tabs.some((t) => t.id === this.screen);
  }
}
