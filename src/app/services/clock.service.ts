import { Injectable } from '@angular/core';
import { Observable, map, shareReplay, timer } from 'rxjs';

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
}

export function countdownParts(end: string | number | Date, now: number): CountdownParts {
  const diff = Math.max(0, new Date(end).getTime() - now);
  const s = Math.floor(diff / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    done: diff === 0,
  };
}

@Injectable({ providedIn: 'root' })
export class ClockService {
  readonly now$: Observable<number> = timer(0, 1000).pipe(
    map(() => Date.now()),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
}
