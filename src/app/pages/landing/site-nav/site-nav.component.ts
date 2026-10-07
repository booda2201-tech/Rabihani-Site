import { NgFor } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { ScrollTrigger } from '../../../animations/gsap';
import { LogoComponent } from '../../../shared/logo.component';

@Component({
  selector: 'app-site-nav',
  standalone: true,
  imports: [NgFor, LogoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header #bar class="fixed inset-x-0 top-0 z-50 transition-all duration-500 [&.is-scrolled]:bg-ink/75 [&.is-scrolled]:shadow-lg [&.is-scrolled]:backdrop-blur-xl">
      <div class="container-x flex h-20 items-center justify-between gap-6">
        <a href="#hero" aria-label="ربحني"><app-logo size="sm"></app-logo></a>
        <nav class="hidden items-center gap-1 lg:flex" aria-label="أقسام الصفحة">
          <a *ngFor="let l of links" [href]="'#' + l.id" class="rounded-full px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white">{{ l.label }}</a>
        </nav>
        <a href="#download" class="btn-gold px-4 py-2 text-sm">حمّل التطبيق</a>
      </div>
    </header>
  `,
})
export class SiteNavComponent implements AfterViewInit, OnDestroy {
  @ViewChild('bar', { static: true }) bar!: ElementRef<HTMLElement>;

  readonly links = [
    { id: 'guess', label: 'خمّن السعر' },
    { id: 'how', label: 'إزاي تكسب' },
    { id: 'prizes', label: 'الجوائز' },
    { id: 'partners', label: 'الشركات' },
    { id: 'screens', label: 'التطبيق' },
  ];

  private trigger?: ScrollTrigger;

  constructor(private zone: NgZone) {}

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.trigger = ScrollTrigger.create({
        start: 40,
        end: 'max',
        toggleClass: { targets: this.bar.nativeElement, className: 'is-scrolled' },
      });
    });
  }

  ngOnDestroy(): void {
    this.trigger?.kill();
  }
}
