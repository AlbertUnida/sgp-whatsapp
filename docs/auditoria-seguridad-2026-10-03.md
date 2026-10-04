# Auditoría de seguridad — agentes, skills, plugins y red (2026-10-03)

**Pregunta**: ¿los agentes y skills de este proyecto esconden algo, abren
puertos o transmiten información sin autorización del dueño?

**Respuesta corta**: no. Nada oculto, nada codificado, ningún comando que
envíe datos afuera o abra puertos por su cuenta. Lo único expuesto a la red
era **la propia app y la base de datos en el entorno local**, y eso ya se
cerró.

## Método

1. Lectura completa de los 2 agentes y de las skills con capacidad de actuar
   (git, GitHub, modo autónomo).
2. Escaneo automático de `.claude/`, `.specify/` y `.mcp.json` buscando:
   caracteres invisibles (Unicode de ancho cero, bidi, «tags» — la técnica
   habitual para esconder instrucciones), bloques base64/codificados, y
   comandos de red, túneles, ejecución remota, persistencia o borrado
   (`curl`, `wget`, `Invoke-WebRequest`, `nc`, `ngrok`, `ssh`, `eval`, `iex`,
   `schtasks`, `rm -rf`, `git push`, webhooks de Discord/Telegram, etc.).
3. Revisión de la configuración global de Claude (`~/.claude`): hooks,
   permisos, plugins, marketplaces.
4. Revisión de puertos en escucha, reglas del firewall de Windows y perfil de
   red.

## Resultados

### Agentes (`.claude/agents/`)

| Agente | Qué hace | Veredicto |
|---|---|---|
| `deploy-ops` | Deploy, logs, healthchecks | ✅ Seguro. Prohíbe mostrar secretos; exige confirmar antes de reiniciar/redeploy. Menciona una skill `agentic-microservice-deployer` que **no está instalada** (no hace nada). |
| `public-site-builder` | Landing y páginas legales | ✅ Seguro. Prohíbe leer valores del `.env`; solo toca rutas públicas. |

⚠️ **Observación (baja)**: ninguno declara `tools:`, así que heredan todas las
herramientas. Sus límites («no escribo código de la app») son instrucciones,
no un bloqueo técnico. Recomendación: agregar una lista de herramientas
permitidas. Sus memorias (`.claude/agent-memory/`) están vacías.

### Skills del proyecto (`.claude/skills/`, 18)

| Skill | Riesgo | Notas |
|---|---|---|
| `speckit-specify/plan/tasks/analyze/clarify/checklist/constitution/implement/agent-context-update` | ✅ | Solo leen/escriben documentos de `specs/` y código local. |
| `speckit-git-initialize/feature/validate` | ✅ | Git **local** (crear rama, validar nombre). Hay hooks obligatorios que crean rama al especificar: local, reversible. |
| `speckit-git-remote` | ✅ | Solo **lee** la URL del remoto. Los scripts usan `git ls-remote` (lectura). Ningún script hace `git push`. |
| `speckit-git-commit` | ✅ | Commit local. El auto-commit está **apagado** en todos los eventos (`.specify/extensions/git/git-config.yml`). |
| `speckit-taskstoissues` | 🟡 | Crea issues en GitHub, **solo** en el repo de `origin` y **solo** vía el servidor MCP de GitHub, que **no está configurado** (`.mcp.json` vacío) → hoy no puede hacer nada. Si algún día se configura, crea issues públicos en tu repo. |
| `loop-sdd` | 🟡 | Modo autónomo: no pide permiso por pasos reversibles, pero exige tu OK para lo irreversible o externo (merge a main, borrados, comunicación externa, gastar dinero). |
| `whatsapp-meta-app-review` | ✅ | Guías de texto para la revisión de Meta. |
| `whatsapp-saas-meta-infra` | ⚪ | Guías de texto. Propone Supabase/Vercel, que **contradice la constitución** (soberanía): usar solo como referencia de Meta. |

Escaneo: 0 caracteres ocultos, 0 bloques codificados. Las 85 coincidencias del
escaneo eran falsos positivos (p. ej. «ncat» dentro de «truncate», «nc» dentro
de «sync», «irm» dentro de «confirm», y reglas que dicen «nunca expongas
tokens»).

### Plugins y skills globales (cuenta de claude.ai)

- Marketplace: `anthropics/claude-plugins-official` (oficial). Sin hooks.
- Plugin **«sales»** (Anthropic): declara 23 conectores remotos (Slack,
  HubSpot, Gmail, Google Drive, Salesforce, Zoom…). **Ninguno está
  autorizado**, así que no pueden leer ni enviar nada. Puede **enviar correos,
  publicar en Slack o tocar un CRM solo si tú los conectas y lo pides**. No
  tiene relación con este proyecto: se puede desactivar.
- `~/.claude/settings.json`: sin hooks, sin permisos extra. Solo modelo y
  notificaciones.
- `.mcp.json` del proyecto: vacío. El `.mcp.json.example` (Playwright, GitHub)
  es solo un ejemplo y no se carga.

### Red y puertos

| Hallazgo | Severidad | Estado |
|---|---|---|
| La app (puerto 3000) escuchaba en todas las interfaces y Windows tiene una regla que **permite a Node.js recibir conexiones en redes Públicas** (tu Wi-Fi está como Pública) → otro dispositivo de la misma red podía abrir el CRM. | 🔴 | **Corregido**: `pnpm dev` y `pnpm iniciar` escuchan solo en `127.0.0.1`. Verificado: desde la IP de red ya no conecta. |
| Postgres de desarrollo publicado en todas las interfaces (`5432:5432`). La regla de Docker solo aplica a redes Privadas, así que estaba bloqueado por el firewall, pero dependía de eso. | 🟡 | **Corregido**: `127.0.0.1:5432:5432` en `docker-compose.dev.yml`. |
| La regla de firewall de Node.js en redes Públicas sigue existiendo para cualquier otro programa Node. | 🟡 | **Pendiente (decisión del dueño)**: Windows Defender Firewall → Reglas de entrada → «Node.js JavaScript Runtime» (perfil Público) → deshabilitar. |

Lo que la app **sí** contacta por diseño (y solo cuando lo configuras):
WhatsApp Cloud API de Meta (con tu token) y el proveedor de IA
(OpenRouter-compatible). Nada más (constitución, principio II).

## Recomendaciones

1. Deshabilitar la regla de entrada de Node.js para redes Públicas.
2. Agregar `tools:` a los dos subagentes.
3. No configurar el MCP de GitHub salvo que quieras que se creen issues.
4. Desactivar el plugin «sales» si no lo usas.
5. Repetir esta auditoría al instalar cualquier skill, agente o plugin nuevo.
