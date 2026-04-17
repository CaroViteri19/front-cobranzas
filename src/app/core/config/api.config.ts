/**
 * Configuración centralizada de los endpoints del backend Spring Boot.
 *
 * <p>Si en algún momento se habilita el proxy de Angular (`proxy.conf.json`),
 * basta con cambiar {@link API_BASE_URL} a {@code ''} y todas las peticiones
 * pasarán por el proxy (/api/v1/...).
 */

/** Host base del backend. Dejar vacío para usar el proxy de Angular. */
export const API_BASE_URL = 'http://localhost:8080';

/** Rutas versionadas del API. */
export const API_PATHS = {
  auth:         `${API_BASE_URL}/api/v1/auth`,
  clients:      `${API_BASE_URL}/api/v1/clients`,
  obligations:  `${API_BASE_URL}/api/v1/obligations`,
  cargaMasiva:  `${API_BASE_URL}/api/v1/carga-masiva`,
  cases:        `${API_BASE_URL}/api/v1/cases`,
  payments:     `${API_BASE_URL}/api/v1/payments`,
  scoring:      `${API_BASE_URL}/api/v1/scoring`,
  interactions: `${API_BASE_URL}/api/v1/interactions`,
  policies:     `${API_BASE_URL}/api/v1/policies`,
  strategies:   `${API_BASE_URL}/api/v1/strategies`,
  orchestration:`${API_BASE_URL}/api/v1/orchestration`,
  audit:        `${API_BASE_URL}/api/v1/audit`,
} as const;
