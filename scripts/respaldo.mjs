// Respaldo del entorno local: base de datos (pg_dump) + archivos de medios.
//
//   pnpm respaldo                        crea respaldos/AAAA-MM-DD_HHMM/
//   pnpm respaldo:restaurar <carpeta>    reemplaza la base y los medios actuales
//
// RESPALDO_DIR en .env cambia el destino (p. ej. una carpeta de Google Drive).
// La copia NO lleva el .env: guárdalo aparte, porque con la ENCRYPTION_KEY y
// la base juntas se descifran las credenciales del negocio.
import { spawn } from "node:child_process";
import { createReadStream, createWriteStream, existsSync } from "node:fs";
import { cp, mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";

const CONTAINER = process.env.RESPALDO_CONTAINER ?? "vocero-dev-postgres-1";
const MEDIA_DIR = path.resolve(process.env.MEDIA_DIR ?? "./.dev-media");
const ROOT = path.resolve(process.env.RESPALDO_DIR ?? "./respaldos");
const DUMP = "vocero.dump";

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function docker(args, { stdin, stdout } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn("docker", args, {
      stdio: [stdin ? "pipe" : "ignore", stdout ? "pipe" : "ignore", "pipe"],
    });
    let err = "";
    child.stderr.on("data", (d) => (err += d));
    if (stdin) stdin.pipe(child.stdin);
    if (stdout) child.stdout.pipe(stdout);
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(err.trim() || `docker salió con ${code}`))
    );
  });
}

async function checkContainer() {
  try {
    await docker(["exec", CONTAINER, "pg_isready", "-U", "postgres", "-d", "vocero"]);
  } catch {
    fail(
      `No hay conexión con el contenedor ${CONTAINER}. Abre Docker Desktop y corre:\n` +
        "  docker compose -f docker-compose.dev.yml up -d"
    );
  }
}

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
}

async function respaldar() {
  await checkContainer();
  const dir = path.join(ROOT, stamp());
  await mkdir(dir, { recursive: true });

  const file = path.join(dir, DUMP);
  const out = createWriteStream(file);
  await docker(["exec", CONTAINER, "pg_dump", "-U", "postgres", "-d", "vocero", "-Fc"], {
    stdout: out,
  });
  await new Promise((r) => out.end(r));
  const { size } = await stat(file);
  if (size === 0) fail("El volcado de la base quedó vacío.");

  if (existsSync(MEDIA_DIR)) await cp(MEDIA_DIR, path.join(dir, "media"), { recursive: true });

  console.log(`✓ Respaldo en ${dir}`);
  console.log(`  base: ${(size / 1024).toFixed(0)} KB · medios: ${existsSync(MEDIA_DIR) ? "copiados" : "no había"}`);
}

async function restaurar(dirArg) {
  if (!dirArg) fail("Indica la carpeta: pnpm respaldo:restaurar respaldos/AAAA-MM-DD_HHMM");
  const dir = path.resolve(dirArg);
  const file = path.join(dir, DUMP);
  if (!existsSync(file)) fail(`No encuentro ${file}`);
  await checkContainer();

  // --clean --if-exists: reemplaza lo que haya sin fallar en una base vacía.
  await docker(
    ["exec", "-i", CONTAINER, "pg_restore", "-U", "postgres", "-d", "vocero", "--clean", "--if-exists", "--no-owner"],
    { stdin: createReadStream(file) }
  );

  const media = path.join(dir, "media");
  if (existsSync(media)) {
    await rm(MEDIA_DIR, { recursive: true, force: true });
    await cp(media, MEDIA_DIR, { recursive: true });
  }
  console.log(`✓ Restaurado desde ${dir}. Reinicia la app (pnpm dev) si estaba abierta.`);
}

const [mode, arg] = process.argv.slice(2);
try {
  if (mode === "restaurar") await restaurar(arg);
  else await respaldar();
} catch (e) {
  fail(e instanceof Error ? e.message : String(e));
}
