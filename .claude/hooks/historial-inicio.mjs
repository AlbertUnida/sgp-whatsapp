// Hook SessionStart: lo que imprime entra al contexto de Claude al abrir la
// sesión. Solo lee docs/HISTORIAL.md; no escribe ni usa la red.
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
let md;
try {
  md = readFileSync(path.join(root, "docs", "HISTORIAL.md"), "utf8");
} catch {
  process.exit(0);
}

function section(title) {
  const start = md.indexOf(`## ${title}`);
  if (start < 0) return "";
  const next = md.indexOf("\n## ", start + 4);
  return md.slice(start, next < 0 ? undefined : next).trim();
}

const sesiones = section("Sesiones");
const ultima = sesiones.split(/\n(?=### )/)[1]?.trim() ?? "";

console.log(
  [
    "HISTORIAL DEL PROYECTO (docs/HISTORIAL.md) — al iniciar, resume al dueño en 2-3 líneas la última sesión y los pendientes 🔴. Al cerrar la sesión (o cuando el dueño diga «cerramos»), agrega la entrada de la sesión y actualiza «Pendientes».",
    "",
    "Última sesión:",
    ultima,
    "",
    section("Pendientes y mejoras para el futuro"),
  ].join("\n")
);
