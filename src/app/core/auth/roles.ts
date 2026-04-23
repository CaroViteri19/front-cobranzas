/**
 * Catálogo centralizado de roles de la aplicación.
 *
 * El backend emite los roles en MAYÚSCULAS dentro del claim `roles` del JWT.
 * Por convención del backend (ver `SecurityBootstrapDataLoader.ensureAdminRole`
 * y los `@PreAuthorize("hasAnyRole('ADMINISTRATOR', ...)")` en cada controller),
 * el rol de administrador se emite en **inglés**: `"ADMINISTRATOR"`.
 *
 * Este módulo es la única fuente de verdad: no se deben escribir literales
 * como "ADMINISTRATOR" / "SUPERVISOR" sueltos en el código del frontend;
 * siempre importar las constantes desde acá.
 *
 * Nota: los identificadores de la constante `ROLES` están en español por
 * razones de legibilidad interna del front (ADMINISTRADOR = "administrador"),
 * pero el VALOR que se compara contra el JWT es el string que emite el
 * backend: "ADMINISTRATOR". Cualquier drift entre el string literal y el
 * JWT implica un 403 en todos los módulos protegidos.
 */

export const ROLES = {
  /** Acceso total al sistema. El backend lo emite como "ADMINISTRATOR". */
  ADMINISTRADOR: 'ADMINISTRATOR',
  SUPERVISOR:    'SUPERVISOR',
  AGENTE:        'AGENTE',
  AUDITOR:       'AUDITOR',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

/** Todos los roles (usar para rutas abiertas a cualquier usuario autenticado). */
export const ALL_ROLES: readonly Role[] = [
  ROLES.ADMINISTRADOR,
  ROLES.SUPERVISOR,
  ROLES.AGENTE,
  ROLES.AUDITOR,
] as const;

/** ADMINISTRADOR, SUPERVISOR y AUDITOR (sin AGENTE). */
export const NON_AGENT_ROLES: readonly Role[] = [
  ROLES.ADMINISTRADOR,
  ROLES.SUPERVISOR,
  ROLES.AUDITOR,
] as const;

/** ADMINISTRADOR, SUPERVISOR y AGENTE (sin AUDITOR). */
export const OPERATIONAL_ROLES: readonly Role[] = [
  ROLES.ADMINISTRADOR,
  ROLES.SUPERVISOR,
  ROLES.AGENTE,
] as const;

/** Solo ADMINISTRADOR y AUDITOR (configuración, reportes de auditoría, etc.). */
export const ADMIN_AND_AUDITOR: readonly Role[] = [
  ROLES.ADMINISTRADOR,
  ROLES.AUDITOR,
] as const;

/** Solo ADMINISTRADOR (acciones sensibles: crear usuarios, cambiar políticas, etc.). */
export const ADMIN_ONLY: readonly Role[] = [ROLES.ADMINISTRADOR] as const;
