import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, shareReplay, startWith } from 'rxjs';
import { CATEGORY_FILTERS, COUNTRY_ID } from '../config/site.config';
import { ApiService } from './api.service';
import { Advertisement, AuctionRoom } from './models';

export function isLiveAuction(a: AuctionRoom, now = Date.now()): boolean {
  return (
    a.countryId === COUNTRY_ID &&
    !a.isCancelled &&
    !a.winner &&
    a.status !== 2 &&
    new Date(a.endTime).getTime() > now &&
    (a.currentHighestBid ?? 0) < a.limited
  );
}

export function shortProductName(name: string): string {
  return name.replace(/\s+\d+\s*(GB|TB)$/i, '').trim();
}

export function categoryLabel(a: AuctionRoom): string {
  return (
    CATEGORY_FILTERS.find((c) => c.id === a.product.categoryId)?.label ??
    a.product.categoryName ??
    ''
  );
}

@Injectable({ providedIn: 'root' })
export class PrizesService {
  /** `null` while loading. */
  readonly auctions$: Observable<AuctionRoom[] | null> = this.api.getAuctionRooms().pipe(
    map((list) =>
      list
        .filter((a) => isLiveAuction(a))
        .sort((a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime() || b.product.price - a.product.price),
    ),
    catchError(() => of([] as AuctionRoom[])),
    startWith(null),
    shareReplay(1),
  );

  /** The most expensive live prize: the curiosity hook. */
  readonly featured$: Observable<AuctionRoom | null | undefined> = this.auctions$.pipe(
    map((list) => {
      if (list === null) return undefined;
      return list.reduce<AuctionRoom | null>(
        (best, a) => (!best || a.product.price > best.product.price ? a : best),
        null,
      );
    }),
    shareReplay(1),
  );

  readonly ads$: Observable<Advertisement[]> = this.api.getAdvertisements().pipe(
    map((list) => list.filter((ad) => ad.countryId === COUNTRY_ID)),
    catchError(() => of([] as Advertisement[])),
    shareReplay(1),
  );

  constructor(private api: ApiService) {}
}
