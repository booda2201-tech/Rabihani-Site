import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';

const routes: Routes = [
  { path: '', component: LandingComponent, title: 'ربحني | اكسب النقاط واستبدلها بمنتجات' },
  { path: 'reset-password', component: ResetPasswordComponent, title: 'ربحني | تعيين كلمة مرور جديدة' },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
