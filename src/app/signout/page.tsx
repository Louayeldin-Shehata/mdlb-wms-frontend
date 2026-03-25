"use client";

import { useEffect, useMemo, useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

function LogoutIcon({ className }: { className?: string }) {
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
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M21 12a9 9 0 0 0-9-9H9a2 2 0 0 0-2 2v3" />
      <path d="M21 12a9 9 0 0 1-9 9H9a2 2 0 0 1-2-2v-3" />
    </svg>
  );
}

export default function SignoutPage() {
  const router = useRouter();

  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<"idle" | "signing_out" | "redirecting">(
    "idle",
  );
  const [seconds, setSeconds] = useState(2);
  const [error, setError] = useState<string | null>(null);

  const isBusy = phase === "signing_out" || phase === "redirecting";

  useEffect(() => {
    // Entrance animation for the card.
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    if (phase !== "redirecting") return;

    if (seconds <= 0) {
      router.replace("/login");
      return;
    }

    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, router, seconds]);

  const title = useMemo(() => {
    if (phase === "signing_out") return "Signing out…";
    if (phase === "redirecting") return "Signed out";
    return "Sign out";
  }, [phase]);

  async function onConfirmSignOut() {
    setError(null);
    try {
      setPhase("signing_out");
      // Sign out without NextAuth redirect; we handle the timer + route.
      await signOut({ redirect: false });

      setSeconds(2);
      setPhase("redirecting");
    } catch {
      setPhase("idle");
      setError("Sign-out failed. Please try again.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div
        className={[
          "w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 space-y-4 transition-all duration-200 ease-out transform",
          visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2",
        ].join(" ")}
      >
        <div className="flex items-start gap-3">
          <div className="mt-1 rounded-lg border border-white/10 bg-zinc-100/10 p-2 text-zinc-100">
            <LogoutIcon className="h-5 w-5" />
          </div>
          <div className="space-y-1 flex-1">
            <h1 className="text-xl font-semibold text-zinc-100">{title}</h1>
            <p className="text-sm text-zinc-400">
              {phase === "idle" && "Are you sure you want to sign out?"}
              {phase === "signing_out" && "Signing out… please wait."}
              {phase === "redirecting" && `Redirecting to login in ${seconds}s…`}
            </p>
          </div>
        </div>

        {error ? <div className="text-sm text-red-400">{error}</div> : null}

        <button
          type="button"
          onClick={() => void onConfirmSignOut()}
          disabled={isBusy}
          className={[
            "w-full rounded-lg border border-white/10 px-4 py-2 text-sm font-medium",
            "bg-zinc-100/10 text-zinc-100 transition-all duration-200",
            "hover:bg-zinc-100/15 hover:border-white/30 disabled:opacity-60",
            "focus:outline-none focus:ring-2 focus:ring-white/10",
            isBusy ? "cursor-not-allowed" : "",
          ].join(" ")}
        >
          <span className="inline-flex items-center justify-center gap-2">
            {phase === "idle" && "Sign out"}
            {phase === "signing_out" && (
              <>
                <span className="h-4 w-4 rounded-full border border-white/20 border-t-white/70 animate-spin" />
                Signing out
              </>
            )}
            {phase === "redirecting" && "Please wait…"}
          </span>
        </button>
      </div>
    </div>
  );
}

