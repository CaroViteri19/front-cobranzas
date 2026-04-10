import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);

  email    = signal('admin@fintra.co');
  password = signal('admin123');
  error    = signal('');
  loading  = signal(false);

  async onSubmit(e: Event): Promise<void> {
    e.preventDefault();
    this.error.set('');
    this.loading.set(true);

    try {
      console.log(`Intentando login con email=${this.email()} y password=${this.password()}`);
      await this.auth.login(this.email(), this.password());
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.error.set(err.message);
    } finally {
      this.loading.set(false);
    }
  }
}
