import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, NavigationEnd, Router, TitleStrategy } from '@angular/router';
import { filter } from 'rxjs';
import { SITE_DESCRIPTION, SITE_URL } from '../config/site.config';

/** Route `data.seo`. Titles come from the route's `title`. */
export interface RouteSeo {
  description?: string;
  /** Keep the page out of search results (e.g. one-off links from emails). */
  noindex?: boolean;
}

/** Keeps description, canonical, Open Graph URL and robots in step with the active route. Runs during prerender too. */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly meta = inject(Meta);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly titles = inject(TitleStrategy);

  init(): void {
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe(() => {
      this.apply(this.deepest(this.router.routerState.snapshot.root));
    });
  }

  private apply(route: ActivatedRouteSnapshot): void {
    const seo: RouteSeo = route.data['seo'] ?? {};
    const path = this.router.url.split(/[?#]/)[0];
    const url = SITE_URL + (path === '/' ? '/' : path);
    const description = seo.description ?? SITE_DESCRIPTION;

    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ name: 'robots', content: seo.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large' });

    const title = this.titles.buildTitle(this.router.routerState.snapshot) ?? this.document.title;
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ name: 'twitter:title', content: title });

    this.canonical().setAttribute('href', url);
  }

  private canonical(): HTMLLinkElement {
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    return link;
  }

  private deepest(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
    while (route.firstChild) route = route.firstChild;
    return route;
  }
}
