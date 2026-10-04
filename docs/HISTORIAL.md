# Historial del proyecto — Ñemongeta CRM

Bitácora de esta instancia de Vocero CRM (fork para Paraguay). Se actualiza **al
cierre de cada sesión** de trabajo con Claude y se lee **al inicio** de la
siguiente (lo recuerda el hook `.claude/hooks/historial-inicio.mjs`).

- **Repo propio**: https://github.com/AlbertUnida/sgp-whatsapp (`origin`)
- **Proyecto original**: kevinrivm/vocero-crm (`upstream` — solo para traer
  actualizaciones, nunca se sube nada ahí)
- **Marca**: «Ñemongeta CRM» · moneda PYG (también USD) · acento `#0d5bff`

## Cómo se usa en esta máquina

| Para… | Comando |
|---|---|
| Encender la base de datos (Docker Desktop abierto) | `docker compose -f docker-compose.dev.yml up -d` |
| **Usar el CRM** (rápido, 0,1–0,5 s por click) | `pnpm iniciar` → http://localhost:3000 |
| Programar (recarga al guardar, más lento) | `pnpm dev` |
| Respaldar base + logo | `pnpm respaldo` (destino: `RESPALDO_DIR` del `.env`) |
| Restaurar un respaldo | `pnpm respaldo:restaurar respaldos/AAAA-MM-DD_HHMM` |
| Gate técnico | `pnpm typecheck && pnpm lint && pnpm build && pnpm test` |

Si la app «aparece vacía» o no deja entrar: casi siempre es Docker Desktop
cerrado (la base no responde). Los datos viven en el volumen
`vocero-dev_vocero_dev_pg` y no se pierden al cerrar Docker.

La app y la base escuchan **solo en esta máquina** (`127.0.0.1`): no son
accesibles desde otros dispositivos de la red.

---

## Sesiones

### 2026-10-03 — Rescate, logo, velocidad, respaldo y auditoría

**Contexto**: el dueño creía haber perdido cambios y su usuario («volvió como
lo descargué»).

Hecho:
- **Diagnóstico «se perdió todo»**: nada se perdió. Docker Desktop estaba
  cerrado → Postgres apagado → la app no veía la base. Usuario, organización
  y marca seguían intactos en el volumen.
- **Logo** (`db45fe0`): la imagen subida traía el cuadriculado de
  «transparente» pintado en los píxeles; se limpió (original guardado en
  `.dev-media/…/favicon.original-con-cuadriculado.png`). Además la app dibujaba
  el logo subido sobre un degradado azul que lo tapaba: corregido.
- **Login** (`db45fe0`): «Crear la cuenta inicial» solo aparece si aún no hay
  ninguna cuenta (antes confundía, parecía instalación vacía).
- **Repo propio** creado y subido; el original quedó como `upstream`.
- **Respaldo** (`5fbe132`): `pnpm respaldo` / `pnpm respaldo:restaurar`,
  probado restaurando en una base aparte.
- **Velocidad** (`116c156`): la lentitud era `next dev` (compila cada pantalla
  al abrirla: 2–25 s por click). Nuevo `pnpm iniciar` en modo producción
  (0,1–0,5 s). `pnpm dev` pasa a Turbopack. Esqueletos de carga
  (`loading.tsx`), una sola consulta de sesión por página, y los campos de
  credenciales de WhatsApp ya no reciben el correo/contraseña del login por
  autocompletado del navegador.
- **Auditoría de seguridad** de agentes, skills, plugins, hooks, MCP y puertos:
  ver [auditoria-seguridad-2026-10-03.md](auditoria-seguridad-2026-10-03.md).
  Resultado: nada oculto ni que transmita datos sin autorización. Se cerró la
  exposición de la app (puerto 3000) y de Postgres (5432) a la red local.
- **Historial**: este documento + hook de inicio de sesión.

Verificado: typecheck, lint, 715 tests unitarios, build de producción,
navegación medida con Playwright, login en vivo.

### 2026-10-01 — Primera adaptación

- Clon del proyecto original (v1.4.0), alta de la cuenta del dueño y la
  organización, marca «Ñemongeta CRM».
- `19d5876`: monedas restringidas a PYG/USD (PYG por defecto) y tope del icono
  subido de 256 KB a 512 KB.

---

## Pendientes y mejoras para el futuro

Prioridad: 🔴 alta · 🟡 media · ⚪ baja / idea.

- 🔴 **Conectar el número de WhatsApp** real (Ajustes → WhatsApp): requiere
  app de Meta, token de usuario del sistema y un dominio público con HTTPS para
  el webhook (hoy `APP_BASE_URL` es `http://localhost:3000`).
- 🔴 **Puesta en producción** (servidor/VPS o Coolify) con dominio y HTTPS;
  respaldos automáticos diarios fuera del servidor.
- 🟡 **Regla de firewall de Windows** que permite a Node.js recibir conexiones
  en redes públicas (ver auditoría). La app ya no se expone, pero la regla
  sigue afectando a cualquier otro programa Node.
- 🟡 **Configurar `RESPALDO_DIR`** apuntando a una carpeta de Google Drive /
  OneDrive y guardar el `.env` en otro lugar seguro.
- 🟡 **Logo horizontal**: hoy solo existe el «icono» cuadrado (favicon) que
  también se usa en la barra lateral. Un logo apaisado necesitaría un campo
  propio.
- 🟡 **Validar imágenes al subirlas**: detectar el cuadriculado falso de
  transparencia y avisar, en vez de mostrarlo roto.
- 🟡 Restringir herramientas de los subagentes (`tools:` en
  `.claude/agents/*.md`) — ver auditoría.
- ⚪ La skill `whatsapp-saas-meta-infra` propone Supabase/Vercel, que choca
  con la constitución (soberanía): usarla solo como referencia de Meta.
- ⚪ Desactivar el plugin «sales» de claude.ai para este proyecto si no se usa.
- ⚪ Correr el arnés E2E completo (`pnpm test:e2e` con mocks) tras los cambios
  de esta sesión.
- ⚪ Iniciar Docker Desktop con Windows para que la base esté siempre arriba.

---

## Cómo se actualiza este archivo

Al cerrar la sesión, Claude agrega una entrada arriba de «Sesiones» con: fecha,
qué se hizo (con hash de commit), qué se verificó y qué quedó pendiente; y
mueve/actualiza los ítems de «Pendientes». Los pendientes resueltos se
eliminan de la lista (quedan registrados en la sesión donde se resolvieron).
