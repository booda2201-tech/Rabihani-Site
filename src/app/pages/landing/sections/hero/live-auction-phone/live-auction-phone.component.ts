import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { gsap, prefersReducedMotion } from '../../../../../animations/gsap';
import { AuctionRoom } from '../../../../../services/models';
import { categoryLabel } from '../../../../../services/prizes.service';
import { IconComponent } from '../../../../../shared/icon.component';
import { PhoneFrameComponent } from '../../../../../shared/phone-frame.component';
import { injectIsBrowser } from '../../../../../shared/platform';

interface Bid {
  id: number;
  name: string;
  points: number;
  me: boolean;
}

/** Illustrative rivals; the prizes and their start points are real. */
const RIVALS = ['محمود س.', 'نور أ.', 'أحمد ع.', 'مريم ح.', 'يوسف ك.', 'سارة م.', 'عمر ط.'];
const ME = 'إنت';
/** Seconds on the in-phone timer at the start of a round. */
const ROUND_SECONDS = 9;
/** Rival bids, seconds into the round. Yours lands last, then the timer runs out. */
const RIVAL_BIDS_AT = [0.9, 2.1, 3.2, 4.4, 5.6];
const MY_BID_AT = 7;
const CONFETTI_COUNT = 42;
const CONFETTI_COLORS = ['#f3d77a', '#d4af37', '#22c55e', '#ffffff', '#3b82f6', '#f97316'];

/** The app's auction screen, playing a full round on a loop: rivals bid, you bid last, the clock hits zero, you win. */
@Component({
  selector: 'app-live-auction-phone',
  standalone: true,
  imports: [NgIf, NgFor, DecimalPipe, IconComponent, PhoneFrameComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './live-auction-phone.component.html',
})
export class LiveAuctionPhoneComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() prizes: AuctionRoom[] = [];

  @ViewChild('screen', { static: true }) screen!: ElementRef<HTMLElement>;
  @ViewChild('confetti', { static: true }) confettiCanvas!: ElementRef<HTMLCanvasElement>;

  prize?: AuctionRoom;
  bid = 0;
  leader = '';
  leaderIsMe = false;
  secondsLeft = ROUND_SECONDS;
  history: Bid[] = [];
  won = false;
  readonly categoryLabel = categoryLabel;

  private round = 0;
  private bidSeq = 0;
  private timeline?: gsap.core.Timeline;
  private observer?: IntersectionObserver;
  private visible = true;
  private started = false;
  private viewReady = false;
  private readonly browser = injectIsBrowser();

  constructor(private zone: NgZone, private cdr: ChangeDetectorRef) {}

  get clock(): string {
    return `00:00:${String(Math.max(0, this.secondsLeft)).padStart(2, '0')}`;
  }

  ngOnChanges(): void {
    if (!this.prizes.length || this.started) return;
    if (!this.browser || prefersReducedMotion()) this.showWonFrame(this.prizes[0]);
    else if (this.viewReady) this.start();
  }

  ngAfterViewInit(): void {
    if (!this.browser) return;
    this.viewReady = true;
    this.zone.runOutsideAngular(() => {
      this.observer = new IntersectionObserver(([entry]) => {
        this.visible = entry.isIntersecting;
        if (this.visible) this.timeline?.resume();
        else this.timeline?.pause();
      });
      this.observer.observe(this.screen.nativeElement);
    });
    if (this.prizes.length && !this.started && !prefersReducedMotion()) this.start();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.timeline?.kill();
  }

  trackBid(_: number, b: Bid): number {
    return b.id;
  }

  private start(): void {
    this.started = true;
    this.zone.runOutsideAngular(() => gsap.delayedCall(0.05, () => this.playRound()));
  }

  /** Static end state for reduced motion and prerendering: the win, no movement. */
  private showWonFrame(prize: AuctionRoom): void {
    this.prize = prize;
    const step = this.stepFor(prize);
    this.history = [
      { id: 2, name: ME, points: prize.startPoints + step * 3, me: true },
      { id: 1, name: RIVALS[0], points: prize.startPoints + step * 2, me: false },
      { id: 0, name: RIVALS[1], points: prize.startPoints + step, me: false },
    ];
    this.bid = this.history[0].points;
    this.leader = ME;
    this.leaderIsMe = true;
    this.secondsLeft = 0;
    this.won = true;
    this.cdr.markForCheck();
  }

  private playRound(): void {
    const prize = this.prizes[this.round % this.prizes.length];
    const step = this.stepFor(prize);
    const root = this.screen.nativeElement;
    const q = gsap.utils.selector(root);
    const rivals = gsap.utils.shuffle([...RIVALS]);

    this.prize = prize;
    this.bid = prize.startPoints;
    this.leader = rivals[rivals.length - 1];
    this.leaderIsMe = false;
    this.secondsLeft = ROUND_SECONDS;
    this.history = [];
    this.won = false;
    this.render();

    const tl = gsap.timeline({
      onComplete: () => {
        this.round++;
        this.playRound();
      },
    });
    if (!this.visible) tl.pause();
    this.timeline = tl;

    tl.fromTo(q('[data-content]'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }, 0)
      .fromTo(q('[data-product]'), { scale: 0.6, rotate: -8 }, { scale: 1, rotate: 0, duration: 0.7, ease: 'back.out(1.8)' }, 0.05);

    for (let s = 1; s <= ROUND_SECONDS; s++) {
      tl.call(() => {
        this.secondsLeft = ROUND_SECONDS - s;
        this.render();
      }, [], s);
    }

    RIVAL_BIDS_AT.forEach((at, i) => tl.call(() => this.placeBid(rivals[i % rivals.length], step, false), [], at));

    tl.call(() => this.tap(), [], MY_BID_AT - 0.35)
      .call(() => this.placeBid(ME, step, true), [], MY_BID_AT)
      .call(() => this.win(), [], ROUND_SECONDS + 0.05)
      .to({}, { duration: 3.2 })
      .to(q('[data-content]'), { opacity: 0, y: -12, duration: 0.35, ease: 'power2.in' });
  }

  private placeBid(name: string, step: number, me: boolean): void {
    this.bid += step * (me ? 2 : 1);
    this.leader = name;
    this.leaderIsMe = me;
    this.history = [{ id: ++this.bidSeq, name, points: this.bid, me }, ...this.history].slice(0, 3);
    this.render();

    const root = this.screen.nativeElement;
    gsap.fromTo(root.querySelector('[data-price]'), { scale: 1.3, color: me ? '#f3d77a' : '#93c5fd' }, { scale: 1, color: '#3b82f6', duration: 0.5, ease: 'back.out(2)' });
    gsap.from(root.querySelector('[data-bid-row]'), { y: -14, opacity: 0, duration: 0.4, ease: 'power3.out' });
    gsap.fromTo(root.querySelector('[data-leader]'), { x: 10, opacity: 0.3 }, { x: 0, opacity: 1, duration: 0.35 });
  }

  /** A finger press on the bid button just before your bid lands. */
  private tap(): void {
    const root = this.screen.nativeElement;
    const button = root.querySelector('[data-bid-button]');
    const ripple = root.querySelector('[data-ripple]');
    gsap.timeline()
      .to(button, { scale: 0.94, duration: 0.12, ease: 'power2.out' })
      .to(button, { scale: 1, duration: 0.3, ease: 'back.out(3)' })
      .fromTo(ripple, { scale: 0, opacity: 0.6 }, { scale: 3.2, opacity: 0, duration: 0.6, ease: 'power2.out' }, 0);
  }

  private win(): void {
    this.won = true;
    this.render();
    const root = this.screen.nativeElement;
    gsap.fromTo(root.querySelector('[data-banner]'), { yPercent: -140, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'back.out(1.6)' });
    gsap.fromTo(root.querySelector('[data-product]'), { scale: 1 }, { scale: 1.08, duration: 0.5, yoyo: true, repeat: 1, ease: 'power2.out' });

    const burst = this.confettiBurst();
    if (burst) this.timeline?.add(burst, this.timeline.time());
  }

  /** 42 paper pieces drawn on one canvas: a single element to update per frame instead of 42. */
  private confettiBurst(): gsap.core.Tween | null {
    const canvas = this.confettiCanvas.nativeElement;
    const g = canvas.getContext('2d');
    if (!g) return null;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    const random = gsap.utils.random;
    const ease = gsap.parseEase('power1.in');
    const pieces = Array.from({ length: CONFETTI_COUNT }, (_, i) => {
      const wide = i % 3 === 0;
      const x = random(w * 0.15, w * 0.85);
      const y = random(-60, 10);
      const rotate = random(0, 180);
      return {
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        pw: wide ? 12 : 6,
        ph: wide ? 6 : 10,
        delay: i * 0.012,
        duration: random(1.8, 2.8),
        x,
        y,
        rotate,
        dx: random(-50, 50),
        dy: random(380, 560) - y,
        dr: random(300, 900),
      };
    });
    const total = Math.max(...pieces.map((p) => p.delay + p.duration));
    const clock = { t: 0 };

    const draw = () => {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h);
      for (const p of pieces) {
        const local = (clock.t - p.delay) / p.duration;
        if (local <= 0 || local >= 1) continue;
        const k = ease(local);
        g.save();
        g.globalAlpha = 1 - k;
        g.translate(p.x + p.dx * k + p.pw / 2, p.y + p.dy * k + p.ph / 2);
        g.rotate(((p.rotate + p.dr * k) * Math.PI) / 180);
        g.fillStyle = p.color;
        g.fillRect(-p.pw / 2, -p.ph / 2, p.pw, p.ph);
        g.restore();
      }
    };
    return gsap.to(clock, { t: total, duration: total, ease: 'none', onUpdate: draw, onComplete: () => g.clearRect(0, 0, canvas.width, canvas.height) });
  }

  private stepFor(prize: AuctionRoom): number {
    return Math.max(10, Math.round((prize.startPoints * 0.1) / 10) * 10);
  }

  private render(): void {
    this.cdr.detectChanges();
  }
}
