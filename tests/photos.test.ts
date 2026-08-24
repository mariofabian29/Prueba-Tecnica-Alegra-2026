/**
 * Selección de la foto de un destino.
 *
 * La consulta a Wikimedia no se ejecuta aquí: se prueba la lógica que elige la
 * imagen a partir de respuestas reales de MediaWiki, para poder verificarla sin
 * depender de la red.
 *
 * Ejecutar con `npm test`.
 */
import { buildQueryUrl, pickImage } from "../src/lib/photos";

let passed = 0;
let failed = 0;

function check(label: string, condition: boolean) {
  if (condition) {
    passed++;
    console.log(`  ok    ${label}`);
  } else {
    failed++;
    console.log(`  FALLO ${label}`);
  }
}

/* ------------------------------ pickImage -------------------------------- */

check(
  "elige la imagen original",
  pickImage({
    query: {
      pages: {
        "123": {
          index: 1,
          title: "Cartagena de Indias",
          original: { source: "https://upload.wikimedia.org/commons/a/a1/Cartagena.jpg", width: 2000, height: 1300 },
        },
      },
    },
  }) === "https://upload.wikimedia.org/commons/a/a1/Cartagena.jpg"
);

check(
  "usa el thumbnail cuando no hay original",
  pickImage({
    query: {
      pages: { "1": { index: 1, thumbnail: { source: "https://upload.wikimedia.org/x/Lisboa.jpg", width: 1600 } } },
    },
  }) === "https://upload.wikimedia.org/x/Lisboa.jpg"
);

check(
  "respeta el orden de relevancia de la búsqueda",
  pickImage({
    query: {
      pages: {
        "9": { index: 2, original: { source: "https://upload.wikimedia.org/segunda.jpg", width: 1200 } },
        "4": { index: 1, original: { source: "https://upload.wikimedia.org/primera.jpg", width: 1200 } },
      },
    },
  }) === "https://upload.wikimedia.org/primera.jpg"
);

check(
  "descarta escudos y banderas",
  pickImage({
    query: {
      pages: {
        "1": { index: 1, original: { source: "https://upload.wikimedia.org/Escudo_de_Madrid.png", width: 1200 } },
        "2": { index: 2, original: { source: "https://upload.wikimedia.org/Madrid_skyline.jpg", width: 1800 } },
      },
    },
  }) === "https://upload.wikimedia.org/Madrid_skyline.jpg"
);

check(
  "descarta imágenes vectoriales",
  pickImage({
    query: { pages: { "1": { index: 1, original: { source: "https://upload.wikimedia.org/mapa.svg", width: 2000 } } } },
  }) === null
);

check(
  "descarta imágenes demasiado pequeñas para un banner",
  pickImage({
    query: { pages: { "1": { index: 1, original: { source: "https://upload.wikimedia.org/mini.jpg", width: 320 } } } },
  }) === null
);

check(
  "rechaza orígenes que no son https",
  pickImage({
    query: { pages: { "1": { index: 1, original: { source: "http://inseguro.example/foto.jpg", width: 2000 } } } },
  }) === null
);

check("tolera una respuesta vacía", pickImage({}) === null);
check("tolera null", pickImage(null) === null);
check("tolera una búsqueda sin resultados", pickImage({ query: { pages: {} } }) === null);

/* ---------------------------- buildQueryUrl ------------------------------ */

const withCountry = buildQueryUrl("Cartagena", "Colombia");
check("la consulta apunta a la API pública de Wikipedia", withCountry.startsWith("https://es.wikipedia.org/w/api.php?"));
check("la consulta combina destino y país", withCountry.includes("gsrsearch=Cartagena+Colombia"));
check("la consulta pide las imágenes de la página", withCountry.includes("prop=pageimages"));

const withoutCountry = buildQueryUrl("Lisboa", null);
check("funciona sin país", withoutCountry.includes("gsrsearch=Lisboa") && !withoutCountry.includes("null"));

/* --------------------------------- Total --------------------------------- */

console.log(`\n  ${passed} correctas, ${failed} fallidas\n`);
process.exit(failed > 0 ? 1 : 0);
