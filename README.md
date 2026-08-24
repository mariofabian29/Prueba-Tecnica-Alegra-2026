# Tripflow · Control de gastos de viaje

Plataforma para planificar el presupuesto de un viaje, registrar los gastos por
**dos vías** (formulario manual y asistente de IA) y ver en tiempo real cómo
evoluciona el presupuesto, con un panel de recomendaciones económicas siempre
visible.

![Estado](https://img.shields.io/badge/estado-funcional-e94e8f) ![Stack](https://img.shields.io/badge/Next.js-15-black) ![DB](https://img.shields.io/badge/SQLite-Prisma-2e86ab)

---

## Cómo ejecutarla

Necesitas **Node.js 20 o superior**. No hace falta instalar ninguna base de
datos: el proyecto usa SQLite en un archivo local.

```bash
# 1. Instalar dependencias
npm install

# 2. Preparar el entorno (crea .env, aplica migraciones y carga datos de demo)
npm run setup

# 3. Arrancar en modo desarrollo
npm run dev
```

Abre **http://localhost:3000** e inicia sesión con la cuenta de demostración:

| Correo | Contraseña |
| --- | --- |
| `demo@tripflow.app` | `demo1234` |

También puedes crear tu propia cuenta desde **Regístrate**.

### Modo producción

```bash
npm run build
npm start
```

### Otros comandos

| Comando | Qué hace |
| --- | --- |
| `npm run setup` | Crea `.env`, aplica migraciones y carga los datos de demostración |
| `npm run seed` | Recarga solo los datos de demostración |
| `npm run db:reset` | Borra la base de datos, la vuelve a crear y la puebla |
| `npm run db:studio` | Abre Prisma Studio para inspeccionar los datos |
| `npm run typecheck` | Comprueba los tipos con TypeScript |
| `npm test` | Ejecuta las pruebas de la selección de fotos de destino |

---

## Activar la IA real (opcional)

La aplicación **funciona al 100% sin ninguna API key**: cuando no hay
credenciales, el asistente y el panel de recomendaciones usan un motor
heurístico local determinista.

Si quieres usar Claude de verdad, añade tu clave a `.env`:

```bash
ANTHROPIC_API_KEY="sk-ant-..."
ANTHROPIC_MODEL="claude-sonnet-5"
```

Reinicia el servidor. Con la clave activa:

| Función | Sin API key | Con API key |
| --- | --- | --- |
| Panel de análisis | Motor heurístico local | Análisis redactado por Claude |
| Chat de gastos | Parser propio de lenguaje natural | Comprensión conversacional de Claude |
| Foto del recibo | Se guarda la imagen y pides el monto | Claude lee el total, la categoría y la fecha |

El panel indica siempre qué motor generó el análisis, así que la diferencia es
verificable a simple vista.

---

## Qué hace la aplicación

### Autenticación
Registro e inicio de sesión con correo y contraseña. Las sesiones son JWT
firmados guardados en una cookie `httpOnly`, y un middleware protege las rutas
privadas.

El acceso se reparte en dos pantallas conectadas entre sí:

| Pantalla | Campos |
| --- | --- |
| `/login` | Correo y contraseña |
| `/registro` | Nombre, correo y contraseña |

Ambas validan en el cliente antes de llamar al servidor y marcan en rojo el
campo que falla, que se limpia al corregirlo. Los errores del servidor —correo
ya registrado, credenciales incorrectas— se muestran sobre el formulario, y
mientras se crea la cuenta o se inicia sesión se ve la pantalla de carga de la
marca.

Cada ruta tiene además su pantalla de carga (`loading.tsx`) y su límite de error
(`error.tsx`) con opción de reintentar, más un `global-error` autónomo por si
falla el propio layout.

### Viajes
Se crea un viaje con destino, límite de presupuesto, fechas, moneda y
acompañantes. Las fechas son opcionales: si no se indican, se planifica una
ventana de 7 días desde hoy.

Desde **Mis viajes** se puede eliminar un viaje directamente con la papelera de
su tarjeta, sin necesidad de abrirlo, con confirmación previa.

> **Viajes pasados:** por decisión de producto, los viajes cuya fecha de fin ya
> pasó se ignoran y no aparecen en el listado. La sección "Viajes pasados" del
> diseño se incluye como vitrina ilustrativa: se muestra atenuada y en escala de
> grises, y no es navegable.

### Registro de gastos: dos vías

**1. Formulario manual** — Un pop-up superpuesto al dashboard con monto,
selector de 12 categorías, descripción opcional, quién pagó, división del gasto
entre acompañantes, fecha y foto del recibo.

Las 12 categorías de captura se agrupan en los 4 grupos que resume la gráfica:

| Grupo de la gráfica | Categorías que suman |
| --- | --- |
| Alojamiento | Alojamiento |
| Comida | Comida, Bebidas, Comestibles |
| Actividades | Turismo, Actividades, Compras |
| Transporte y otros | Vuelos, Alquiler de coches, Transporte, Gasolina, Otro |

**2. Asistente de IA** — Un chat donde describes el gasto en lenguaje natural
y queda registrado. Entiende, entre otras cosas:

```
gasté 45.500 en la cena de anoche      → 45.500 · Comida     · ayer
pagué 120 euros de hotel ayer          → 120    · Alojamiento · ayer
Laura compró 60.000 en souvenirs       → 60.000 · Compras     · pagado por Laura
un taxi de 25.000                      → 25.000 · Transporte  · hoy
45k en el mercado                      → 45.000 · Comestibles · hoy
```

También responde preguntas sobre el presupuesto (*"¿cuánto me queda?"*,
*"dame una recomendación"*) y permite **subir la foto de una factura**: se
extraen monto, categoría y fecha, y se muestra una tarjeta editable para
confirmar antes de cargar el gasto.

### Fotos de los destinos
Cada viaje muestra una foto real de su ciudad, tanto en la tarjeta de **Mis
viajes** como en el banner del viaje. Se resuelve contra la API pública de
Wikimedia —sin clave ni registro— y la dirección se guarda en el viaje para no
repetir la consulta.

Si no hay red o el destino no tiene una foto adecuada, se usa una ilustración
generada a partir del nombre del destino, de modo que nunca queda un hueco en
blanco. El filtro descarta escudos, banderas, logotipos e imágenes demasiado
pequeñas para un banner; esa lógica está cubierta por `npm test`.

### Navegación
La barra lateral incluye un desplegable en **Presupuesto** con los viajes
vigentes, para saltar entre ellos sin volver al listado. Se abre solo al entrar
en un viaje y resalta el que estás viendo.

El asistente de IA se abre desde su botón y se cierra con la X o con «Volver al
viaje», que devuelven al viaje desde el que se abrió.

### Visualización en tiempo real
Cada gasto que se registra —por cualquiera de las dos vías— refresca al
instante las gráficas y el panel de IA, sin recargar la página:

- **Banda de presupuesto** con gastado, restante y avance. Al superar el límite
  cambia a rojo y muestra una alerta con cuánto te pasaste; a partir del 85 %
  avisa de que te acercas.
- **Anillo por categoría** que reparte el presupuesto entre los cuatro grupos
  (Alojamiento, Comida, Actividades, Transporte y otros) y el importe sin usar.
  Si se excede el presupuesto, la tarjeta se resalta en rojo con un aviso.
- **Tarjetas de grupo** con el acumulado de cada uno.
- **Evolución del gasto**: acumulado real frente al ritmo planificado, con la
  línea del límite de presupuesto.
- **Listado de gastos** con orden configurable y miniatura del recibo.

### Panel de IA (siempre visible)
A la derecha del presupuesto, y en todo momento:

- Titular de estado con semáforo (*Vas bien* / *Cuidado con el ritmo* /
  *Necesitas frenar el gasto*).
- **Proyección de gasto** al ritmo actual frente al presupuesto total.
- **Señales por grupo**: cuánto se desvía cada categoría de lo esperado.
- **Caja "Impulsado por IA"** con la alerta o felicitación del momento.
- **Ver análisis** abre el informe completo con métricas y recomendaciones
  accionables.

---

## Stack

| Capa | Tecnología | Por qué |
| --- | --- | --- |
| Framework | Next.js 15 (App Router) | Un solo proyecto para UI y API; se levanta con un comando |
| Lenguaje | TypeScript en modo estricto | Contratos verificados entre dominio, API y UI |
| Estilos | Tailwind CSS v4 | Sistema de diseño en tokens, sin CSS suelto |
| Base de datos | SQLite + Prisma | Cero infraestructura para ejecutar y revisar el proyecto |
| Gráficas | Recharts | Componibles y con animación al actualizar |
| Datos en cliente | SWR | Revalidación tras cada mutación y refresco periódico |
| Sesiones | jose (JWT) + bcryptjs | Cookies `httpOnly` sin dependencias de terceros |
| Validación | Zod | Un esquema por operación, compartido con los mensajes de error |
| IA | SDK de Anthropic | Texto y visión, con fallback local si no hay credenciales |

---

## Organización del código

```
prisma/
  schema.prisma          Modelo de datos
  migrations/            Historial de migraciones
  seed.ts                Datos de demostración

tests/
  photos.test.ts         Selección de la foto de destino

scripts/
  setup.mjs              Preparación del entorno en un paso

src/
  app/
    page.tsx             Portada pública
    login, registro      Acceso
    viajes/              Listado, dashboard del viaje y asistente
    nuevo-viaje/         Creación de viaje
    api/                 Endpoints REST

  components/
    landing/             Portada
    shell/               Barra de marca, navegación lateral, pie
    trips/               Listado y creación de viajes
    trip/                Dashboard, gráficas, popup de gasto y panel de IA
    assistant/           Chat, subida de factura y confirmación
    ui/                  Botón, campos, modal, alertas y loader

  lib/
    analytics.ts         Motor de cálculo del viaje
    categories.ts        Taxonomía de gasto y agrupaciones
    ai/
      provider.ts        Cliente de Claude con degradación controlada
      insights.ts        Panel de recomendaciones (Claude + motor local)
      chatbot.ts         Comprensión de gastos (Claude + parser local)
      receipt.ts         Lectura de recibos por visión
    auth.ts              Sesiones y contraseñas
    trips.ts             Acceso a datos de viajes
    validation.ts        Esquemas de entrada
    format.ts            Moneda, fechas y utilidades
    photos.ts            Foto del destino desde Wikimedia
    navigation.ts        Navegación con respaldo ante transiciones perdidas

  hooks/useTrip.ts       Estado del dashboard y revalidación
  middleware.ts          Protección de rutas
```

---

## API

Todos los endpoints privados exigen sesión y comprueban que el viaje pertenece
a quien lo pide.

| Método | Ruta | Descripción |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Crear cuenta |
| `POST` | `/api/auth/login` | Iniciar sesión |
| `POST` | `/api/auth/logout` | Cerrar sesión |
| `GET` | `/api/auth/me` | Sesión actual |
| `GET` `POST` | `/api/trips` | Listar viajes vigentes / crear viaje |
| `GET` `DELETE` | `/api/trips/{id}` | Viaje con su analítica / eliminarlo |
| `GET` `POST` | `/api/trips/{id}/expenses` | Listar / registrar gasto |
| `PATCH` `DELETE` | `/api/trips/{id}/expenses/{gastoId}` | Editar / eliminar gasto |
| `GET` | `/api/trips/{id}/insights` | Análisis y recomendaciones |
| `GET` `POST` `DELETE` | `/api/trips/{id}/chat` | Historial / mensaje / limpiar |
| `POST` | `/api/trips/{id}/chat/confirm` | Confirmar el borrador de un recibo |
| `POST` | `/api/trips/{id}/receipt` | Subir foto de factura y extraer sus datos |
| `POST` | `/api/trips/{id}/photo` | Resolver y guardar la foto del destino |

---

## Cómo se calcula el análisis

Todo el cálculo vive en `src/lib/analytics.ts` y es determinista:

| Métrica | Cómo se obtiene |
| --- | --- |
| Presupuesto diario planificado | `presupuesto / días totales` |
| Promedio real diario | `gastado / días transcurridos` |
| Disponible por día | `restante / días que faltan` |
| Desvío de ritmo | `gastado − (diario planificado × días transcurridos)` |
| Proyección del viaje | `gastado + (promedio diario × días que faltan)` |
| Estado | Excedido si se pasa del límite o si la proyección lo supera en más de un 5 %; atención si el desvío supera el 5 % del presupuesto; en ritmo en el resto de casos |

Las **señales por grupo** del panel comparan lo gastado en cada grupo con un
reparto de referencia de un viaje tipo (Alojamiento 35 %, Comida 30 %,
Actividades 20 %, Transporte y otros 15 %), con una tolerancia de 5 puntos.
Cuando un grupo no tiene gastos se indica *sin registrar* en lugar de un −100 %
que sería engañoso.

---

## Decisiones de diseño

- **Sin API key también funciona.** Cada capa de IA tiene un equivalente local
  determinista. La aplicación nunca se queda sin respuesta por una credencial
  ausente o un fallo de red.
- **Un solo motor de cálculo.** Gráficas, panel de IA y chatbot leen la misma
  analítica, de modo que las cifras no pueden contradecirse entre sí.
- **Ilustraciones generadas en el cliente.** Los banners de destino son SVG
  deterministas creados a partir del nombre: sin CDN, sin claves y sin
  peticiones externas.
- **La foto del recibo se guarda siempre.** Aunque la extracción falle, la
  imagen queda adjunta y solo se pide el monto.

### Alcance

Elementos presentes en el diseño que se han dejado a propósito sin
comportamiento, señalizados en la interfaz:

- Acceso con Facebook, Google y Apple, y recuperación de contraseña (requieren
  proveedores externos).
- Secciones *Mi perfil*, *Notificaciones*, *Ajustes*, *Guías* y *Hoteles*.
- Libreta de *Amigos* y *guías de viaje* en la creación de viaje.
- Vitrina de *Viajes pasados*, ilustrativa por decisión de producto.
