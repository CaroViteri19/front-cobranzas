import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Componente de error 403 – Acceso denegado.
 *
 * Se muestra cuando el usuario autenticado intenta acceder a un módulo
 * para el que su rol no tiene permisos según la matriz de acceso definida.
 */
@Component({
  selector: 'app-unauthorized',
  standalone: true,
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-6 text-center px-4">
      <div class="text-8xl">🔒</div>
      <h1 class="text-3xl font-bold text-gray-800">Acceso denegado</h1>
      <p class="text-gray-500 max-w-md">
        No tienes permisos para acceder a este módulo.<br>
        Comunícate con el administrador del sistema si crees que esto es un error.
      </p>
      <button
        (click)="goBack()"
        class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
        Volver al inicio
      </button>
    </div>
  `
})
export class UnauthorizedComponent {
  private router = inject(Router);

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
