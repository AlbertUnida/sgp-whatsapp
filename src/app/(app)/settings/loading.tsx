// Dentro de Ajustes la cabecera y las pestañas ya están en pantalla (layout):
// solo el panel de la derecha espera.
export default function Loading() {
  return (
    <div className="max-w-3xl space-y-3" aria-busy="true" aria-label="Cargando">
      <div className="h-40 animate-pulse rounded-xl bg-muted" />
      <div className="h-24 animate-pulse rounded-xl bg-muted opacity-60" />
    </div>
  );
}
