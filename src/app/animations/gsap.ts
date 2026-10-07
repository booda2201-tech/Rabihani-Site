import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger, Flip);
gsap.defaults({ ease: 'power3.out', duration: 0.8 });

export { Flip, ScrollTrigger, gsap };

export const MOTION_OK = '(prefers-reduced-motion: no-preference)';
export const DESKTOP_MOTION = '(min-width: 1024px) and (prefers-reduced-motion: no-preference)';
export const MOBILE_OR_REDUCED = '(max-width: 1023px), (prefers-reduced-motion: reduce)';

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

let refreshQueued = false;

/** Coalesces layout-changing updates (API data, images) into one ScrollTrigger refresh. */
export function queueScrollRefresh(): void {
  if (refreshQueued) return;
  refreshQueued = true;
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      refreshQueued = false;
      ScrollTrigger.refresh();
    }),
  );
}
