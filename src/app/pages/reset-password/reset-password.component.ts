import { NgClass, NgFor, NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { MOTION_OK, gsap } from '../../animations/gsap';
import { ApiService } from '../../services/api.service';
import { IconComponent } from '../../shared/icon.component';
import { LogoComponent } from '../../shared/logo.component';
import { injectIsBrowser } from '../../shared/platform';
import { StoreButtonsComponent } from '../../shared/store-buttons.component';

type PageState = 'form' | 'success' | 'invalid-link';

interface PasswordRule {
  label: string;
  test: (value: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: '8 حروف على الأقل', test: (v) => v.length >= 8 },
  { label: 'حرف كبير (A-Z)', test: (v) => /[A-Z]/.test(v) },
  { label: 'حرف صغير (a-z)', test: (v) => /[a-z]/.test(v) },
  { label: 'رقم واحد على الأقل', test: (v) => /\d/.test(v) },
  { label: 'رمز زي ! @ # $', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

const passwordRulesValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = (control.value as string) ?? '';
  return PASSWORD_RULES.every((r) => r.test(value)) ? null : { weakPassword: true };
};

const passwordsMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const password = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password && confirm && password !== confirm ? { mismatch: true } : null;
};

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, ReactiveFormsModule, RouterLink, LogoComponent, IconComponent, StoreButtonsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements AfterViewInit, OnDestroy {
  @ViewChild('card', { static: true }) card!: ElementRef<HTMLElement>;

  readonly rules = PASSWORD_RULES;
  readonly emailOrPhone: string;
  private readonly token: string;

  state: PageState;
  submitting = false;
  serverError = '';
  showPassword = false;
  showConfirm = false;

  readonly form = this.fb.nonNullable.group(
    {
      newPassword: ['', [Validators.required, passwordRulesValidator]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator },
  );

  private ctx?: gsap.Context;
  private readonly browser = injectIsBrowser();

  constructor(
    route: ActivatedRoute,
    private fb: FormBuilder,
    private api: ApiService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
  ) {
    const params = route.snapshot.queryParamMap;
    this.emailOrPhone = params.get('emailOrPhone') ?? params.get('email') ?? params.get('phone') ?? '';
    this.token = params.get('token') ?? '';
    this.state = this.emailOrPhone && this.token ? 'form' : 'invalid-link';
  }

  get password(): string {
    return this.form.controls.newPassword.value;
  }

  get passedRules(): number {
    return this.rules.filter((r) => r.test(this.password)).length;
  }

  get strength(): { label: string; color: string; text: string; level: number } {
    const n = this.passedRules;
    if (!this.password) return { label: '', color: '', text: '', level: 0 };
    if (n <= 2) return { label: 'ضعيفة', color: 'bg-red-500', text: 'text-red-400', level: 1 };
    if (n <= 4) return { label: 'متوسطة', color: 'bg-amber-400', text: 'text-amber-300', level: 2 };
    return { label: 'قوية', color: 'bg-emerald-400', text: 'text-emerald-400', level: 3 };
  }

  get showMismatch(): boolean {
    return this.form.hasError('mismatch') && this.form.controls.confirmPassword.dirty;
  }

  get confirmMatches(): boolean {
    const { newPassword, confirmPassword } = this.form.controls;
    return !!confirmPassword.value && confirmPassword.value === newPassword.value;
  }

  ngAfterViewInit(): void {
    if (!this.browser) return;
    this.zone.runOutsideAngular(() => {
      this.ctx = gsap.context(() => {
        gsap.matchMedia().add(MOTION_OK, () => {
          gsap.from('[data-enter]', { y: 24, opacity: 0, stagger: 0.07, duration: 0.7, ease: 'power3.out' });
        });
      }, this.card.nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
  }

  submit(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      this.form.controls.confirmPassword.markAsDirty();
      return;
    }

    this.submitting = true;
    this.serverError = '';
    const { newPassword, confirmPassword } = this.form.getRawValue();

    this.api
      .resetPassword({ emailOrPhone: this.emailOrPhone, token: this.token, newPassword, confirmPassword })
      .pipe(
        timeout(20000),
        finalize(() => {
          this.submitting = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.state = 'success';
          this.form.reset();
        },
        error: (err: HttpErrorResponse) => {
          this.serverError = this.describeError(err);
        },
      });
  }

  private describeError(err: HttpErrorResponse): string {
    if (!(err instanceof HttpErrorResponse) || err.status === 0) return 'مش قادرين نوصل للسيرفر. اتأكد من النت وجرّب تاني.';

    const body = err.error;
    if (typeof body === 'string' && body.trim()) return body;
    if (body?.message) return body.message;
    if (Array.isArray(body?.errors)) return body.errors.map((e: { description?: string } | string) => (typeof e === 'string' ? e : e.description)).join('، ');
    if (body?.errors && typeof body.errors === 'object') return Object.values(body.errors).flat().join('، ');
    if (body?.title) return body.title;

    if (err.status === 400) return 'الرابط ده انتهى أو اتستخدم قبل كده. اطلب رابط جديد من التطبيق.';
    return 'حصلت مشكلة. جرّب تاني بعد شوية.';
  }
}
