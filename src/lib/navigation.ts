"use client";

/**
 * Navegación con red de seguridad.
 *
 * `router.replace()` navega del lado del cliente, pero si la transición se
 * pierde —por ejemplo, si otra actualización la cancela— la pantalla se queda
 * cargando sin salida. Se programa una navegación dura de respaldo que solo
 * entra en acción si, pasado el plazo, seguimos exactamente donde estábamos.
 *
 * Comparar con la ruta de partida (y no con el destino) es lo que evita
 * arrastrar al usuario de vuelta si ya siguió navegando por su cuenta.
 */
export function navigateWithFallback(
  replace: (href: string) => void,
  href: string,
  timeoutMs = 4000
): () => void {
  const startPath = window.location.pathname;
  const startedAt = Date.now();

  replace(href);

  const interval = window.setInterval(() => {
    // Cualquier cambio de ruta significa que el router respondió.
    if (window.location.pathname !== startPath) {
      window.clearInterval(interval);
      return;
    }
    if (Date.now() - startedAt >= timeoutMs) {
      window.clearInterval(interval);
      window.location.assign(href);
    }
  }, 250);

  return () => window.clearInterval(interval);
}
