import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { RouteSeo } from './services/seo.service';

const routes: Routes = [
  {
    path: '',
    component: LandingComponent,
    title: 'ربحني | اكسب نقاط وزايد بيها على جوايز حقيقية',
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
    title: 'ربحني | تعيين كلمة مرور جديدة',
    data: { seo: { description: 'عيّن كلمة مرور جديدة لحسابك في ربحني.', noindex: true } satisfies RouteSeo },
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { initialNavigation: 'enabledBlocking' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
