import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/site.config';
import { Advertisement, AuctionRoom } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = API_BASE_URL;

  constructor(private http: HttpClient) {}

  get<T>(path: string, params?: Record<string, string | number>): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${path}`, {
      params: params ? new HttpParams({ fromObject: params }) : undefined,
    });
  }

  getAuctionRooms(): Observable<AuctionRoom[]> {
    return this.get<AuctionRoom[]>('AuctionRooms');
  }

  getAdvertisements(): Observable<Advertisement[]> {
    return this.get<Advertisement[]>('Advertisements');
  }
}
