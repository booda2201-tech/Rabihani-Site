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

/** Calls `onChange` as `target` enters or leaves the viewport. Endless loops use it to idle while nobody can see them. */
export function whileVisible(target: Element, onChange: (visible: boolean) => void): () => void {
  const io = new IntersectionObserver(([entry]) => onChange(entry.isIntersecting), { rootMargin: '120px' });
  io.observe(target);
  return () => io.disconnect();
}

/** Pauses endless tweens while `target` is off screen and resumes them where they left off. */
export function playWhileVisible(target: Element, ...animations: gsap.core.Animation[]): () => void {
  return whileVisible(target, (visible) => animations.forEach((a) => (visible ? a.resume() : a.pause())));
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
