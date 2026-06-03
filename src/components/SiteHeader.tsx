import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

export default async function SiteHeader() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  return (
    <header className="border-b border-white/10 bg-zinc-950/90 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/70">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/logo.svg"
            alt="MDLBEAST"
            className="h-9 w-9 rounded-md border border-white/10"
          />
          <div className="leading-tight">
            <div className="text-sm font-semibold text-zinc-100">
              MDLBEAST Inventory
            </div>
            <div className="text-xs text-zinc-400">Stock management</div>
          </div>
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          {session ? (
            <>
              <Link
                className="rounded-lg border border-white/10 bg-zinc-100/10 px-3 py-2 text-zinc-100"
                href={role === "ADMIN" ? "/admin" : "/crew"}
              >
                Dashboard
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-zinc-100/10 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-100/15 hover:border-white/30"
                href="/signout"
              >
                Sign out
              </Link>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}

