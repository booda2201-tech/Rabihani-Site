import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-phone-frame',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative h-[540px] w-[264px] rounded-[46px] bg-gradient-to-b from-[#1c2333] to-[#0b0f19] p-[9px] shadow-phone">
      <span class="absolute -right-[3px] top-28 h-14 w-[3px] rounded-l bg-[#252c3d]"></span>
      <span class="absolute -left-[3px] top-24 h-10 w-[3px] rounded-r bg-[#252c3d]"></span>
      <span class="absolute -left-[3px] top-36 h-10 w-[3px] rounded-r bg-[#252c3d]"></span>
      <div class="relative h-full w-full overflow-hidden rounded-[38px] bg-night">
        <span class="absolute left-1/2 top-2.5 z-30 h-[22px] w-[84px] -translate-x-1/2 rounded-full bg-black"></span>
        <ng-content></ng-content>
      </div>
    </div>
  `,
  host: { class: 'block' },
})
export class PhoneFrameComponent {}
