"use client";

/**
 * Último recurso: se activa si falla el propio layout raíz, por lo que debe
 * traer sus propias etiquetas html/body y no depender de otros componentes.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body
        style={{
          minHeight: "100vh",
          margin: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fdf9f5",
          color: "#2a171d",
          fontFamily: "system-ui, -apple-system, sans-serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>La aplicación no pudo cargar</h1>
          <p style={{ marginTop: "0.75rem", color: "#4f333b", maxWidth: 420 }}>
            Ocurrió un error inesperado. Vuelve a intentarlo; si continúa, recarga la página.
          </p>
          {error.digest && (
            <p style={{ marginTop: "1rem", fontSize: "0.75rem", color: "#8a7078" }}>
              Referencia del error: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              padding: "0.75rem 1.75rem",
              borderRadius: 9999,
              border: "none",
              cursor: "pointer",
              color: "#fff",
              fontWeight: 600,
              fontSize: "0.9rem",
              backgroundImage: "linear-gradient(96deg, #ee5a9b 0%, #d6247a 58%, #a81e5c 100%)",
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
