// Se pinta al instante al cambiar de sección mientras el servidor arma la
// página: sin esto el click no responde hasta que llega todo.
export default function Loading() {
  return (
    <div className="flex h-full flex-col" aria-busy="true" aria-label="Cargando">
      <div className="border-b px-4 py-3 sm:px-6 sm:py-4">
        <div className="h-5 w-40 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="space-y-3 p-4 sm:p-6">
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
        <div className="h-24 animate-pulse rounded-xl bg-muted opacity-70" />
        <div className="h-24 animate-pulse rounded-xl bg-muted opacity-40" />
      </div>
    </div>
  );
}
