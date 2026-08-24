# Publicar Tripflow en la web

Guía para dejar la app accesible con un link público, manteniendo GitHub como
fuente de verdad: Vercel se conecta al repositorio y **vuelve a desplegar solo
con cada push**, así que el link del repo y el link de la app conviven.

**Proveedor:** Vercel (aplicación) + Neon (base de datos Postgres).
Ambos tienen plan gratuito y **no piden tarjeta**. Neon se crea desde el propio
panel de Vercel, así que no hace falta una segunda cuenta.

Tiempo estimado: **unos 10 minutos**.

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

1. Dentro del proyecto en Vercel, pestaña **Storage → Create Database**.
2. Elige **Neon** (Serverless Postgres) y confirma. La región más cercana a tus
   usuarios está bien.
3. Al conectarla al proyecto, Vercel añade sola la variable **`DATABASE_URL`**.
   No hay que copiar nada a mano.

## 3. Variables de entorno

En **Settings → Environment Variables**, añade:

| Variable | Valor | Obligatoria |
| --- | --- | --- |
| `AUTH_SECRET` | Una cadena aleatoria larga (mínimo 32 caracteres) | Sí |
| `DATABASE_URL` | La pone Neon en el paso anterior | Sí |
| `ANTHROPIC_API_KEY` | Tu clave de Anthropic | No |
| `ANTHROPIC_MODEL` | `claude-sonnet-5` | No |

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
| El build falla con `P1001` o `Environment variable not found: DATABASE_URL` | La base de datos no está conectada al proyecto. Repite el paso 2 y vuelve a desplegar. |
| Error al iniciar sesión, o `Falta AUTH_SECRET` | Falta `AUTH_SECRET` o tiene menos de 32 caracteres. |
| El panel dice «motor de análisis local» y esperabas Claude | Falta `ANTHROPIC_API_KEY`, o la clave no es válida. La app sigue funcionando. |
| Los destinos salen con ilustración en vez de foto | La consulta a Wikimedia no encontró una foto adecuada para ese destino. Es el comportamiento previsto. |
| Cambiaste una variable y no se aplica | Las variables se leen en el build: hay que **volver a desplegar** (Deployments → ⋯ → Redeploy). |

## Alternativas

Si prefieres otro proveedor, lo único que cambia es de dónde sale
`DATABASE_URL`: cualquier Postgres gestionado (Supabase, Railway, Render)
funciona con el mismo `npm run build:deploy`.
