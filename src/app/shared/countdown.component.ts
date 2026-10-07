import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ClockService, CountdownParts, countdownParts } from '../services/clock.service';

@Component({
  selector: 'app-countdown',
  standalone: true,
  imports: [NgIf, NgFor, AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *ngIf="clock.now$ | async as now">
      <ng-container *ngIf="parts(now) as p">
        <div *ngIf="variant === 'boxes'; else inline" class="flex gap-1.5 tabular-nums" role="timer" aria-live="off">
          <div *ngFor="let unit of units(p)" class="flex min-w-[3rem] flex-col items-center rounded-xl bg-white/5 px-2 py-1.5 ring-1 ring-white/10">
            <span class="text-lg font-bold text-white">{{ unit.value }}</span>
            <span class="text-[10px] font-medium text-slate-400">{{ unit.label }}</span>
          </div>
        </div>
        <ng-template #inline>
          <span class="inline-flex items-center gap-1 font-semibold tabular-nums" role="timer" dir="ltr">
            <span *ngIf="p.days">{{ p.days }}d</span>
            <span>{{ pad(p.hours) }}:{{ pad(p.minutes) }}:{{ pad(p.seconds) }}</span>
          </span>
        </ng-template>
      </ng-container>
    </ng-container>
  `,
})
export class CountdownComponent {
  @Input({ required: true }) end!: string;
  @Input() variant: 'boxes' | 'inline' = 'boxes';

  constructor(public clock: ClockService) {}

  parts(now: number): CountdownParts {
    return countdownParts(this.end, now);
  }

  pad(n: number): string {
    return n.toString().padStart(2, '0');
  }

  units(p: CountdownParts): { value: string; label: string }[] {
    return [
      { value: this.pad(p.days), label: 'يوم' },
      { value: this.pad(p.hours), label: 'ساعة' },
      { value: this.pad(p.minutes), label: 'دقيقة' },
      { value: this.pad(p.seconds), label: 'ثانية' },
    ];
  }
}
