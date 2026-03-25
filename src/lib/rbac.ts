import type { Session } from "next-auth";

export function requireSession(session: Session | null) {
  if (!session) throw new Error("UNAUTHORIZED");
}

export function requireAdmin(session: Session | null) {
  requireSession(session);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session as any).user?.role as string | undefined;
  if (role !== "ADMIN") throw new Error("FORBIDDEN");
}

