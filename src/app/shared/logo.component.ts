import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <img
      [src]="variant === 'light' ? 'assets/logo-light.png' : 'assets/logo-color.png'"
      alt="ربحني"
      class="block w-auto select-none"
      [ngClass]="sizes[size]"
      draggable="false"
      decoding="async"
    />
  `,
  host: { class: 'inline-block' },
})
export class LogoComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  /** `light` = white lettering for the dark theme, `color` = original navy for light backgrounds. */
  @Input() variant: 'light' | 'color' = 'light';

  readonly sizes = {
    sm: 'h-9',
    md: 'h-12',
    lg: 'h-28 sm:h-36',
  };
}
