import Link from "next/link";

import { requireCrewOrRedirect } from "@/lib/server-guards";

function RequestsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M22 12h-8" />
      <path d="M16 6l6 6-6 6" />
      <path d="M2 5h14" />
      <path d="M2 19h14" />
      <path d="M2 12h10" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

export default async function CrewDashboardPage() {
  await requireCrewOrRedirect();

  return (
    <div className="min-h-screen p-6 space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Crew Dashboard</h1>
        <p className="text-sm text-zinc-400">
          Create and track merch requests.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
        <Link
          className="group rounded-2xl border border-white/10 bg-zinc-100/10 p-5 transition-all duration-200 hover:border-white/30 hover:bg-zinc-100/15 hover:-translate-y-0.5 hover:shadow-sm"
          href="/crew/requests/new"
        >
          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-lg border border-white/10 bg-zinc-100/10 p-2 text-zinc-100">
              <RequestsIcon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="text-lg font-semibold text-zinc-100">New request</div>
              <div className="mt-1 text-sm text-zinc-400">
                Submit merch items and sizes to admin.
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-zinc-100/10 p-2 text-zinc-100 transition-colors group-hover:bg-zinc-100/15">
              <ArrowRightIcon className="h-4 w-4" />
            </div>
          </div>
        </Link>

        <Link
          className="group rounded-2xl border border-white/10 bg-zinc-100/10 p-5 transition-all duration-200 hover:border-white/30 hover:bg-zinc-100/15 hover:-translate-y-0.5 hover:shadow-sm"
          href="/crew/requests"
        >
          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-lg border border-white/10 bg-zinc-100/10 p-2 text-zinc-100">
              <RequestsIcon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="text-lg font-semibold text-zinc-100">My requests</div>
              <div className="mt-1 text-sm text-zinc-400">
                Track acknowledgements and fulfillment status.
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-zinc-100/10 p-2 text-zinc-100 transition-colors group-hover:bg-zinc-100/15">
              <ArrowRightIcon className="h-4 w-4" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

