# Publicar Tripflow en la web

Guía para dejar la app accesible con un link público, manteniendo GitHub como
fuente de verdad: Vercel se conecta al repositorio y **vuelve a desplegar solo
con cada push**, así que el link del repo y el link de la app conviven.

**Proveedor:** Vercel (aplicación) + Neon (base de datos Postgres).
Ambos tienen plan gratuito y **no piden tarjeta**. Neon se crea desde el propio
panel de Vercel, así que no hace falta una segunda cuenta.

Tiempo estimado: **unos 10 minutos**.

> El flujo de despliegue está verificado de extremo a extremo contra un
> PostgreSQL real: genera el esquema, crea las tablas, siembra la demo,
> compila, y la aplicación pasa sus 70 comprobaciones funcionando sobre
> Postgres. Lo único que hace falta es la cadena de conexión.

---

## 1. Conectar el repositorio

1. Entra en [vercel.com](https://vercel.com) e inicia sesión **con GitHub**.
2. **Add New… → Project** y elige el repositorio `Prueba-Tecnica-Alegra-2026`.
3. En *Configure Project*:
   - **Framework Preset:** Next.js (lo detecta solo).
   - Despliega la sección **Build and Output Settings** y sustituye el comando
     de build por:

     ```
     npm run build:deploy
     ```

     Es el mismo build de siempre, pero antes genera el esquema de Postgres,
     crea las tablas y siembra la cuenta de demostración.
4. **No pulses Deploy todavía**: primero hay que crear la base de datos y las
   variables (pasos 2 y 3). Si ya lo pulsaste, no pasa nada: fallará por falta
   de `DATABASE_URL` y bastará con volver a desplegar al terminar.

## 2. Crear la base de datos

Hay dos caminos. **Si el primero no te aparece o te da problemas, usa el
segundo**, que funciona siempre y no depende del panel de Vercel.

### Opción A — desde Vercel

1. Dentro del proyecto, pestaña **Storage → Create Database**.
2. Elige **Neon** (Serverless Postgres) y confirma.
3. Al conectarla, Vercel añade sola la variable `DATABASE_URL`.

**Comprueba siempre que llegó**: ve a *Settings → Environment Variables* y busca
`DATABASE_URL`. Si está, te falta únicamente **volver a desplegar** (las
variables se leen durante el build, así que un despliegue anterior no las ve).
Si no está, cógela a mano con la opción B.

### Opción B — copiar la cadena desde Neon

Sirve tanto si creaste la base desde Vercel como si la creaste directamente en
**[neon.tech](https://neon.tech)** (gratis, sin tarjeta, se entra con GitHub).

1. Abre tu proyecto en Neon.
2. Pulsa **Connect**, el botón de arriba a la derecha del *Project dashboard*
   (al lado de *Import data*). Las cadenas de conexión están ahí, no sueltas en
   el panel.
3. En la ventana que se abre, comprueba que la base y el rol son los correctos
   y copia la cadena. Tiene esta forma:

   ```
   postgresql://usuario:contraseña@ep-algo-pooler.region.aws.neon.tech/neondb?sslmode=require
   ```

   El host lleva **`-pooler`**: esa es la cadena *pooled*, la que va en
   `DATABASE_URL`.
4. En esa misma ventana hay una opción para cambiar el tipo de conexión
   (*pooled* / *direct*, según la versión aparece como casilla o desplegable).
   Elige la **directa** y copia esa segunda cadena: es igual pero **sin**
   `-pooler`. Va en `DIRECT_DATABASE_URL`.
5. Pégalas en Vercel como variables de entorno en el paso 3.

> Si no encuentras la opción de conexión directa, basta con coger la cadena
> *pooled* y borrarle a mano el `-pooler` del host. Es exactamente la misma
> diferencia.

> **Por qué dos cadenas:** la *pooled* está pensada para que la app abra muchas
> conexiones cortas, que es lo que necesita en producción. La *directa* es la
> que admite cambios de esquema. El despliegue usa cada una donde toca.

## 3. Variables de entorno

En **Settings → Environment Variables**, añade:

| Variable | Valor | Obligatoria |
| --- | --- | --- |
| `AUTH_SECRET` | Una cadena aleatoria larga (mínimo 32 caracteres) | Sí |
| `DATABASE_URL` | La cadena **pooled** de Neon (la pone sola si usaste la opción A) | Sí |
| `DIRECT_DATABASE_URL` | La cadena **directa** de Neon | No: si no está, se deduce sola quitando `-pooler` del host |
| `ANTHROPIC_API_KEY` | Tu clave de Anthropic | No |
| `ANTHROPIC_MODEL` | `claude-sonnet-5` | No |

Marca las tres primeras para los entornos **Production**, **Preview** y
**Development**.

Para generar el secreto:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> Sin `ANTHROPIC_API_KEY` la app funciona igual: el asistente y el panel de
> recomendaciones usan el motor local. Con la clave, pasan a usar Claude y el
> asistente puede leer facturas por foto.

## 4. Desplegar

Pulsa **Deploy**. Al terminar tendrás el link público, del tipo
`https://tripflow.vercel.app`.

### Comprobar el estado

Abre **`/api/health`** en tu despliegue:

```
https://tu-app.vercel.app/api/health
```

Responde en claro si hay base de datos, si las tablas existen, si el secreto de
sesión está puesto y qué motor usa el asistente. Es la forma más rápida de ver
qué falta, sin buscar en los registros del build.

> El despliegue **no falla** aunque no haya base de datos: la aplicación se
> publica igualmente y `/api/health` explica lo que falta. Así siempre queda
> una URL donde mirar.

Quien entre puede **registrarse** o probar con la cuenta de demostración:

| Correo | Contraseña |
| --- | --- |
| `demo@tripflow.app` | `demo1234` |

A partir de aquí, cada `git push` a la rama desplegada publica los cambios
automáticamente.

---

## Qué cambia respecto a ejecutarlo en local

El repositorio sigue funcionando igual en local (`npm run setup && npm run dev`,
con SQLite y sin instalar nada). Estas dos diferencias son las que permiten que
el mismo código funcione también en un servidor sin disco:

**Base de datos.** Prisma no admite elegir el motor con una variable de entorno,
así que hacen falta dos esquemas. Para que no se separen, el de producción **se
genera** a partir del de desarrollo cambiando solo el bloque `datasource`
(`scripts/prepare-postgres.mjs`). El modelo se edita en un único sitio:
`prisma/schema.prisma`.

**Fotos de recibos.** No se escriben en disco: se reducen en el navegador
(una foto de móvil de 4 MB baja a unos 200 KB) y se guardan en la base de datos
como data URI. Así la app no necesita un sistema de archivos escribible ni un
servicio de almacenamiento aparte.

---

## Si algo falla

| Síntoma | Causa habitual |
| --- | --- |
| El build para con **«No hay ninguna cadena de conexión»** | La base de datos no está conectada. El propio log lista qué variables sí llegan, para ver si el proveedor la publicó con otro nombre. |
| El build falla con `P1001` (no alcanza el servidor) | La cadena de conexión es incorrecta o le falta `?sslmode=require`. |
| Falla al crear las tablas y `DATABASE_URL` lleva `-pooler` | Falta `DIRECT_DATABASE_URL` con la cadena directa: los cambios de esquema no pueden ir por el pool. |
| Avisos de `npm warn allow-scripts` | Son informativos. Los paquetes que de verdad necesitan sus scripts (Prisma, esbuild, sharp) están autorizados en `package.json`. |
| Error al iniciar sesión, o `Falta AUTH_SECRET` | Falta `AUTH_SECRET` o tiene menos de 32 caracteres. |
| El panel dice «motor de análisis local» y esperabas Claude | Falta `ANTHROPIC_API_KEY`, o la clave no es válida. La app sigue funcionando. |
| Los destinos salen con ilustración en vez de foto | La consulta a Wikimedia no encontró una foto adecuada para ese destino. Es el comportamiento previsto. |
| Cambiaste una variable y no se aplica | Las variables se leen en el build: hay que **volver a desplegar** (Deployments → ⋯ → Redeploy). |

## Alternativas

Si prefieres otro proveedor, lo único que cambia es de dónde sale
`DATABASE_URL`: cualquier Postgres gestionado (Supabase, Railway, Render)
funciona con el mismo `npm run build:deploy`.
