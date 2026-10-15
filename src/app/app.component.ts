import { Component } from '@angular/core';
import { SeoService } from './services/seo.service';

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet>',
})
export class AppComponent {
  constructor(seo: SeoService) {
    seo.init();
  }
}
