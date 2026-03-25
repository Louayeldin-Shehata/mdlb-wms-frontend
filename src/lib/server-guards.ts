import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";

export async function requireAdminOrRedirect() {
  const session = await getServerSession(authOptions);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session as any)?.user?.role as string | undefined;
  if (!session) redirect("/login");
  if (role !== "ADMIN") redirect("/");
  return session;
}

export async function requireCrewOrRedirect() {
  const session = await getServerSession(authOptions);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session as any)?.user?.role as string | undefined;
  if (!session) redirect("/login");
  if (role !== "CREW" && role !== "ADMIN") redirect("/");
  return session;
}

