import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Tripflow · Controla el gasto de tu viaje con ayuda de IA",
    template: "%s · Tripflow",
  },
  description:
    "Crea tu viaje, registra gastos a mano o contandoselos a la IA, y mira en tiempo real como va tu presupuesto con gráficas y recomendaciones.",
};

export const viewport: Viewport = {
  themeColor: "#d6247a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-cream-100">{children}</body>
    </html>
  );
}
