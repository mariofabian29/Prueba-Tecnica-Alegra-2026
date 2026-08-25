# Tripflow · Control de gastos de viaje

Planifica el presupuesto de un viaje, registra los gastos por **dos vías**
—formulario manual y asistente de IA— y mira en tiempo real cómo evoluciona,
con un panel de recomendaciones económicas siempre visible.

**▶ Pruébalo sin instalar nada: [prueba-tecnica-alegra-2026.vercel.app](https://prueba-tecnica-alegra-2026.vercel.app)**

Puedes registrarte con tu correo o entrar con la cuenta de demostración:

| Correo | Contraseña |
| --- | --- |
| `demo@tripflow.app` | `demo1234` |

---

# Cómo ejecutarlo en tu equipo

## Lo único que necesitas

**Node.js 20 o superior.** Nada más.

No hay que instalar ni configurar ninguna base de datos: el proyecto usa SQLite
en un archivo local que se crea solo.

Para comprobar tu versión:

```bash
node --version
```

> Si no lo tienes o tienes una versión anterior, descárgalo de
> [nodejs.org](https://nodejs.org) (elige la versión **LTS**).

## Tres comandos

Copia y pega esto en una terminal, uno por uno:

### 1. Descargar el proyecto

```bash
git clone https://github.com/mariofabian29/Prueba-Tecnica-Alegra-2026.git
cd Prueba-Tecnica-Alegra-2026
```

> El repositorio tiene una sola rama y es la predeterminada, así que no hay que
> cambiar de rama ni hacer nada más.

### 2. Instalar y preparar

```bash
npm install
npm run setup
```

`npm run setup` hace tres cosas por ti: crea el archivo `.env` con una clave de
sesión aleatoria, crea la base de datos y carga los datos de demostración.

Al terminar verás:

```
✓ Todo listo. Arranca la app con:  npm run dev
  Luego entra en http://localhost:3000 con demo@tripflow.app / demo1234
```

### 3. Arrancar

```bash
npm run dev
```

Espera a que aparezca `✓ Ready` y abre **<http://localhost:3000>** en el
navegador.

## Ya está

Entra con `demo@tripflow.app` / `demo1234` y encontrarás dos viajes cargados:
**Cartagena** (en curso, con gastos) y **Lisboa** (próximo).

### Qué probar en dos minutos

1. **Abre el viaje a Cartagena.** Verás el presupuesto, las gráficas y el panel
   de IA a la derecha.
2. **Pulsa «Añadir gasto»** y registra uno. Fíjate en que las gráficas y el
   panel se actualizan al instante, sin recargar la página.
3. **Pulsa «Asistente IA»** en la barra lateral y escríbele:
   `gasté 85.000 en el almuerzo de hoy`. Lo registrará solo.
4. **Vuelve al presupuesto** y comprueba que el gasto del chat también está ahí.
5. **Registra un gasto enorme** (por ejemplo 3.000.000) y mira cómo la banda se
   pone en rojo y avisa de que te pasaste.

---

## Si algo no funciona

| Qué ves | Qué hacer |
| --- | --- |
| `command not found: npm` | No tienes Node.js instalado. Descárgalo de [nodejs.org](https://nodejs.org) |
| El navegador no carga nada | Comprueba que la terminal siga abierta y muestre `✓ Ready`. El comando `npm run dev` tiene que seguir corriendo |
| `EADDRINUSE` o «puerto 3000 ocupado» | Otra aplicación usa ese puerto. Arranca con `npm run dev -- -p 3001` y entra en <http://localhost:3001> |
| «Falta AUTH_SECRET» | No se llegó a ejecutar `npm run setup`. Ejecútalo y vuelve a arrancar |
| Errores raros de base de datos | Ejecuta `npm run db:reset` para rehacerla desde cero |
| Quieres empezar de nuevo del todo | Borra la carpeta y repite desde el paso 1 |

---

## Otros comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Arranca en modo desarrollo (el que usarás normalmente) |
| `npm run setup` | Prepara el entorno: `.env`, base de datos y datos de demostración |
| `npm run seed` | Recarga solo los datos de demostración |
| `npm run db:reset` | Borra la base de datos, la rehace y la vuelve a poblar |
| `npm run db:studio` | Abre Prisma Studio para inspeccionar los datos |
| `npm test` | Ejecuta las pruebas de la selección de fotos de destino |
| `npm run typecheck` | Comprueba los tipos con TypeScript |
| `npm run build` + `npm start` | Compila y arranca en modo producción |

---

## Activar la IA real (opcional)

**La aplicación funciona al 100 % sin ninguna API key.** Cuando no hay
credenciales, el asistente y el panel de recomendaciones usan un motor
heurístico local determinista.

Si quieres usar Claude de verdad, abre el archivo `.env` que creó `npm run setup`
y rellena la clave:

```bash
ANTHROPIC_API_KEY="sk-ant-..."
```

Guarda, para el servidor (`Ctrl+C`) y arranca de nuevo con `npm run dev`.

| Función | Sin API key | Con API key |
| --- | --- | --- |
| Panel de análisis | Motor heurístico local | Análisis redactado por Claude |
| Chat de gastos | Parser propio de lenguaje natural | Comprensión conversacional de Claude |
| Foto del recibo | Se guarda la imagen y se pide el monto | Claude lee el total, la categoría y la fecha |

El panel indica siempre qué motor generó el análisis, así que la diferencia se
ve a simple vista.

---

## Publicarlo en la web

La aplicación ya está publicada en
[prueba-tecnica-alegra-2026.vercel.app](https://prueba-tecnica-alegra-2026.vercel.app).

Si quieres desplegar tu propia copia, los pasos están en
**[DEPLOY.md](DEPLOY.md)**: Vercel + Postgres, plan gratuito y sin tarjeta.
Vercel se conecta al repositorio y redespliega solo con cada push.

Puedes comprobar el estado de cualquier despliegue en `/api/health`, que informa
de si hay base de datos, si las tablas existen y qué motor de IA está activo.

---
---

# Qué hace la aplicación

## Autenticación
Registro e inicio de sesión con correo y contraseña. Las sesiones son JWT
firmados guardados en una cookie `httpOnly`, y un middleware protege las rutas
privadas.

| Pantalla | Campos |
| --- | --- |
| `/login` | Correo y contraseña |
| `/registro` | Nombre, correo y contraseña |

Ambas validan en el cliente antes de llamar al servidor y marcan en rojo el
campo que falla, que se limpia al corregirlo. Los mensajes de error son
accionables: si el correo no está registrado se ofrece crear la cuenta con ese
mismo correo, y si la contraseña no coincide se dice exactamente eso.

Cada ruta tiene además su pantalla de carga (`loading.tsx`) y su límite de error
(`error.tsx`) con opción de reintentar, más un `global-error` autónomo por si
falla el propio layout.

## Viajes
Se crea un viaje con destino, límite de presupuesto, fechas, moneda y
acompañantes. Las fechas son opcionales: si no se indican, se planifica una
ventana de 7 días desde hoy.

Desde **Mis viajes** se puede eliminar un viaje con la papelera de su tarjeta,
sin necesidad de abrirlo, con confirmación previa.

> **Viajes pasados:** por decisión de producto, los viajes cuya fecha de fin ya
> pasó se ignoran y no aparecen en el listado. La sección «Viajes pasados» del
> diseño se incluye como vitrina ilustrativa: se muestra atenuada y en escala de
> grises, y no es navegable.

## Registro de gastos: dos vías

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

**2. Asistente de IA** — Un chat donde describes el gasto en lenguaje natural y
queda registrado. Entiende, entre otras cosas:

```
gasté 45.500 en la cena de anoche      → 45.500 · Comida     · ayer
pagué 120 euros de hotel ayer          → 120    · Alojamiento · ayer
Laura compró 60.000 en souvenirs       → 60.000 · Compras     · pagado por Laura
un taxi de 25.000                      → 25.000 · Transporte  · hoy
45k en el mercado                      → 45.000 · Comestibles · hoy
```

También responde preguntas sobre el presupuesto (*«¿cuánto me queda?»*,
*«dame una recomendación»*) y permite **subir la foto de una factura**: se
extraen monto, categoría y fecha, y se muestra una tarjeta editable para
confirmar antes de cargar el gasto.

## Visualización en tiempo real
Cada gasto registrado —por cualquiera de las dos vías— refresca al instante las
gráficas y el panel de IA, sin recargar la página:

- **Banda de presupuesto** con gastado, restante y avance. Al superar el límite
  cambia a rojo y muestra cuánto te pasaste; a partir del 85 % avisa de que te
  acercas.
- **Anillo por categoría** que reparte el presupuesto entre los cuatro grupos y
  el importe sin usar. Si se excede, la tarjeta se resalta en rojo.
- **Tarjetas de grupo** con el acumulado de cada uno.
- **Evolución del gasto**: acumulado real frente al ritmo planificado, con la
  línea del límite de presupuesto.
- **Listado de gastos** con orden configurable y miniatura del recibo.

## Panel de IA (siempre visible)
A la derecha del presupuesto, y en todo momento:

- Titular de estado con semáforo (*Vas bien* / *Cuidado con el ritmo* /
  *Necesitas frenar el gasto*).
- **Proyección de gasto** al ritmo actual frente al presupuesto total.
- **Señales por grupo**: cuánto se desvía cada categoría de lo esperado.
- **Caja «Impulsado por IA»** con la alerta o felicitación del momento.
- **Ver análisis** abre el informe completo con métricas y recomendaciones
  accionables.

## Fotos de los destinos
Cada viaje muestra una foto real de su ciudad, tanto en su tarjeta como en el
banner del viaje. Se resuelve contra la API pública de Wikimedia —sin clave ni
registro— y la dirección se guarda para no repetir la consulta.

Si no hay red o el destino no tiene una foto adecuada, se usa una ilustración
generada a partir del nombre, de modo que nunca queda un hueco en blanco.

## Navegación
La barra lateral incluye un desplegable en **Presupuesto** con los viajes
vigentes, para saltar entre ellos sin volver al listado. Se abre solo al entrar
en un viaje y resalta el que estás viendo.

El asistente de IA se abre desde su botón y se cierra con la X o con «Volver al
viaje».

---

# Detalles técnicos

## Stack

| Capa | Tecnología | Por qué |
| --- | --- | --- |
| Framework | Next.js 15 (App Router) | Un solo proyecto para UI y API; se levanta con un comando |
| Lenguaje | TypeScript en modo estricto | Contratos verificados entre dominio, API y UI |
| Estilos | Tailwind CSS v4 | Sistema de diseño en tokens, sin CSS suelto |
| Base de datos | SQLite + Prisma en local, Postgres al desplegar | Cero infraestructura para revisar el proyecto, y un motor real en la web |
| Gráficas | Recharts | Componibles y con animación al actualizar |
| Datos en cliente | SWR | Revalidación tras cada mutación y refresco periódico |
| Sesiones | jose (JWT) + bcryptjs | Cookies `httpOnly` sin dependencias de terceros |
| Validación | Zod | Un esquema por operación, compartido con los mensajes de error |
| IA | SDK de Anthropic | Texto y visión, con fallback local si no hay credenciales |

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
  prepare-postgres.mjs   Genera el esquema Postgres a partir del de SQLite
  deploy.mjs             Build de despliegue de principio a fin

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

## API

Todos los endpoints privados exigen sesión y comprueban que el viaje pertenece a
quien lo pide.

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
| `GET` | `/api/health` | Estado del despliegue |

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

Las **señales por grupo** comparan lo gastado en cada grupo con un reparto de
referencia de un viaje tipo (Alojamiento 35 %, Comida 30 %, Actividades 20 %,
Transporte y otros 15 %), con una tolerancia de 5 puntos. Cuando un grupo no
tiene gastos se indica *sin registrar* en lugar de un −100 % que sería engañoso.

## Decisiones de diseño

- **Sin API key también funciona.** Cada capa de IA tiene un equivalente local
  determinista. La aplicación nunca se queda sin respuesta por una credencial
  ausente o un fallo de red.
- **Un solo motor de cálculo.** Gráficas, panel de IA y chatbot leen la misma
  analítica, de modo que las cifras no pueden contradecirse entre sí.
- **Sin disco escribible.** Los recibos se reducen en el navegador y se guardan
  en la base de datos, así que el mismo código corre en local y en un hosting
  serverless sin depender de un servicio de almacenamiento aparte.
- **Un solo modelo de datos.** El esquema de Postgres se genera a partir del de
  SQLite en el build, en lugar de mantener dos a mano.
- **Ilustraciones generadas en el cliente.** Los banners de respaldo son SVG
  deterministas creados a partir del nombre del destino: sin CDN y sin claves.

### Concesión consciente

El login distingue «no existe esa cuenta» de «contraseña incorrecta» para que el
mensaje sea accionable. Eso permite averiguar qué correos están registrados
(*user enumeration*), algo asumible en una demo pero que en producción conviene
sustituir por un mensaje genérico. Queda anotado en el propio código.

### Alcance

Elementos presentes en el diseño que se han dejado a propósito sin
comportamiento, señalizados en la interfaz:

- Acceso con Facebook, Google y Apple, y recuperación de contraseña (requieren
  proveedores externos).
- Secciones *Mi perfil*, *Notificaciones*, *Ajustes*, *Guías* y *Hoteles*.
- Libreta de *Amigos* y *guías de viaje* en la creación de viaje.
- Vitrina de *Viajes pasados*, ilustrativa por decisión de producto.
