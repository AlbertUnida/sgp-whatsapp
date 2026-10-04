import { cache } from "react";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { resolveMembership } from "@/server/auth/on-signup";

export type SessionContext = {
  userId: string;
  organizationId: string;
  role: string;
};

export class UnauthorizedError extends Error {
  constructor(message = "No autenticado") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

type Lookup =
  | { ok: true; ctx: SessionContext; userName: string }
  | { ok: false; reason: string };

// cache(): layout y página de un mismo render comparten UNA consulta de
// sesión + membresía. En route handlers no memoiza (no hay render) y da igual.
const lookupSession = cache(async (): Promise<Lookup> => {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) return { ok: false, reason: "No autenticado" };
  // La sesión puede crearse antes de que la membresía exista (registro
  // inicial) — la membresía en BD es la fuente de verdad de org + rol.
  const membership = await resolveMembership(session.user.id);
  if (!membership) return { ok: false, reason: "Sesión sin organización activa" };
  return {
    ok: true,
    ctx: {
      userId: session.user.id,
      organizationId: membership.organizationId,
      role: membership.role,
    },
    userName: session.user.name,
  };
});

/**
 * Sesión + organización activa para route handlers y server components.
 * Lanza UnauthorizedError si no hay sesión u organización.
 */
export async function requireSession(): Promise<SessionContext> {
  const r = await lookupSession();
  if (!r.ok) throw new UnauthorizedError(r.reason);
  return r.ctx;
}

/** Igual que requireSession pero devuelve null en vez de lanzar. */
export async function getSessionOrNull(): Promise<SessionContext | null> {
  const r = await lookupSession().catch(() => null);
  return r?.ok ? r.ctx : null;
}

/** Para el layout: la sesión más el nombre a mostrar, sin otra consulta. */
export async function getSessionWithUserName(): Promise<
  (SessionContext & { userName: string }) | null
> {
  const r = await lookupSession().catch(() => null);
  return r?.ok ? { ...r.ctx, userName: r.userName } : null;
}
