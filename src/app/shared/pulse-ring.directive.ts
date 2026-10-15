import { Directive, ElementRef, Input, NgZone, OnDestroy, OnInit } from '@angular/core';
import { prefersReducedMotion } from '../animations/gsap';

/**
 * Expanding halo behind a call-to-action. Same look as an animated `box-shadow` spread,
 * but driven by transform/opacity so it runs on the compositor instead of repainting every frame.
 * Put it on an absolutely positioned element that covers the button, placed before the button.
 */
@Directive({
  selector: '[appPulseRing]',
  standalone: true,
  host: { class: 'pointer-events-none absolute inset-0 opacity-0', 'aria-hidden': 'true' },
})
export class PulseRingDirective implements OnInit, OnDestroy {
  /** How far the halo grows past the button edge, in px. */
  @Input() pulseSpread = 18;

  private animation?: Animation;
  private observer?: ResizeObserver;
  private size = '';

  constructor(private el: ElementRef<HTMLElement>, private zone: NgZone) {}

  ngOnInit(): void {
    if (prefersReducedMotion() || typeof this.el.nativeElement.animate !== 'function') return;
    this.zone.runOutsideAngular(() => {
      this.observer = new ResizeObserver(([entry]) => this.play(entry.contentRect.width, entry.contentRect.height));
      this.observer.observe(this.el.nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.animation?.cancel();
  }

  private play(width: number, height: number): void {
    if (!width || !height) return;
    const size = `${Math.round(width)}x${Math.round(height)}`;
    if (size === this.size) return;
    this.size = size;

    const grown = `scale(${1 + (2 * this.pulseSpread) / width}, ${1 + (2 * this.pulseSpread) / height})`;
    const time = this.animation?.currentTime ?? 0;
    this.animation?.cancel();
    this.animation = this.el.nativeElement.animate(
      [
        { transform: 'scale(1)', opacity: 0.55, offset: 0, easing: 'ease-out' },
        { transform: grown, opacity: 0, offset: 0.7 },
        { transform: grown, opacity: 0, offset: 1 },
      ],
      { duration: 2200, iterations: Infinity },
    );
    this.animation.currentTime = time;
  }
}
