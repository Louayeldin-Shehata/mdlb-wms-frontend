import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const safeSession = session as NonNullable<typeof session>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (safeSession as any).user?.role as string | undefined;
  const email = safeSession.user?.email ?? "user";

  if (role === "ADMIN") {
    redirect("/admin");
  }

  if (role === "CREW") {
    redirect("/crew");
  }

  // Fallback: if session exists but role is missing/unknown.
  redirect("/login");

  // Unreachable: redirect() above always returns.
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-zinc-950 p-6 space-y-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">MDLBEAST Merch Inventory</h1>
          <p className="text-sm text-zinc-400">
            Signed in as {email} ({role ?? "CREW"})
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            className="inline-flex items-center justify-center rounded-lg bg-black text-white px-4 py-2 text-sm font-medium"
            href={role === "ADMIN" ? "/admin" : "/crew"}
          >
            Go to dashboard
          </Link>
          <Link
            className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-zinc-100/10 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-100/15 hover:border-white/30"
                href="/signout"
          >
            Sign out
          </Link>
          <Link
            className="inline-flex items-center justify-center rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-zinc-100"
            href="/api/health"
          >
            API health
          </Link>
        </div>
      </div>
    </div>
  );
}
