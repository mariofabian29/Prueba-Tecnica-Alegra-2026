/**
 * Arte de destino generado en el cliente.
 * Evita depender de un CDN de imagenes: cada destino recibe siempre la misma
 * paleta y el mismo perfil de horizonte a partir de un hash de su nombre.
 */

const PALETTES: { sky: [string, string]; sun: string; city: string; water: string }[] = [
  { sky: ["#ffd9a8", "#f39a86"], sun: "#ffb26b", city: "#8d3a5f", water: "#c9556f" },
  { sky: ["#a8d5f2", "#f3c1d6"], sun: "#ffd18a", city: "#6a4a7a", water: "#7fa8cc" },
  { sky: ["#ffc9d8", "#c86a9b"], sun: "#ffe0a3", city: "#5e2a4e", water: "#a34a7c" },
  { sky: ["#b8e2d8", "#f6c9a8"], sun: "#ffcf8f", city: "#3f6b62", water: "#6fae9f" },
  { sky: ["#d9c4f0", "#f6a5c0"], sun: "#ffd9a0", city: "#4a2f66", water: "#8f6bb0" },
  { sky: ["#ffe1b3", "#e88a7d"], sun: "#fff0c2", city: "#7a3350", water: "#d2716f" },
];

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** Perfil de edificios reproducible para un destino dado. */
function skyline(seed: number, width: number, base: number): string {
  let x = 0;
  let path = `M0 ${base}`;
  let s = seed;
  while (x < width) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const w = 18 + (s % 42);
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const h = 26 + (s % 96);
    path += ` L${x} ${base - h} L${x + w} ${base - h}`;
    x += w;
  }
  return `${path} L${width} ${base} Z`;
}

export type DestinationArt = {
  /** SVG completo listo para usarse como background-image (data URI). */
  dataUri: string;
  palette: (typeof PALETTES)[number];
};

export function destinationArt(destination: string): DestinationArt {
  const seed = hash(destination.toLowerCase().trim() || "viaje");
  const palette = PALETTES[seed % PALETTES.length];
  const W = 1200;
  const H = 380;
  const horizon = 250;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${palette.sky[0]}"/><stop offset="100%" stop-color="${palette.sky[1]}"/></linearGradient>
<linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${palette.water}"/><stop offset="100%" stop-color="${palette.city}"/></linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#sky)"/>
<circle cx="${240 + (seed % 700)}" cy="120" r="52" fill="${palette.sun}" opacity="0.85"/>
<path d="${skyline(seed + 7, W, horizon)}" fill="${palette.city}" opacity="0.38"/>
<path d="${skyline(seed + 91, W, horizon + 14)}" fill="${palette.city}" opacity="0.72"/>
<rect y="${horizon + 14}" width="${W}" height="${H - horizon - 14}" fill="url(#water)"/>
<g opacity="0.22" fill="#ffffff">
<rect x="80" y="${horizon + 44}" width="240" height="3" rx="1.5"/>
<rect x="420" y="${horizon + 68}" width="180" height="3" rx="1.5"/>
<rect x="740" y="${horizon + 52}" width="300" height="3" rx="1.5"/>
</g>
</svg>`;

  return { dataUri: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`, palette };
}
