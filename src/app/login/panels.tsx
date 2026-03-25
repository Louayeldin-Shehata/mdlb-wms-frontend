"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";

type Role = "ADMIN" | "CREW";
type ModalState = { open: boolean; role: Role };

function ShieldIcon({ className }: { className?: string }) {
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
      <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4Z" />
      <path d="M9 12l2 2 4-5" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
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
      <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <path d="M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M22 21v-2a3 3 0 0 0-2.2-2.9" />
      <path d="M16.8 3.1a4 4 0 0 1 0 7.8" />
    </svg>
  );
}

function Modal({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      // Next tick so the transition classes apply.
      requestAnimationFrame(() => {
        setMounted(true);
        setVisible(true);
      });
    } else {
      requestAnimationFrame(() => setVisible(false));
      const t = setTimeout(() => setMounted(false), 180);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className={[
          "absolute inset-0 bg-black/60 transition-opacity duration-200",
          visible ? "opacity-100" : "opacity-0",
          visible ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
        onClick={() => onClose()}
      />
      <div className="relative z-10 min-h-full flex items-center justify-center p-6">
        <div
          className={[
            "w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-5 space-y-4 transition-all duration-200 ease-out transform",
            visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2",
            visible ? "pointer-events-auto" : "pointer-events-none",
          ].join(" ")}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
            </div>
            <button
              type="button"
              onClick={() => onClose()}
              className="rounded-lg border border-white/10 px-3 py-1 text-sm text-zinc-200 hover:bg-zinc-100/10"
            >
              Close
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export function LoginPanels() {
  const [modal, setModal] = useState<ModalState>({ open: false, role: "ADMIN" });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(role: Role) {
    setError(null);
    setBusy(true);

    try {
      const callbackUrl = role === "ADMIN" ? "/admin" : "/crew";

      const res = await signIn("credentials", {
        email,
        password,
        role,
        redirect: false,
        callbackUrl,
      });

      if (!res) {
        setError("Sign-in failed.");
        return;
      }

      if (res.error) {
        setError(
          res.error === "CredentialsSignin"
            ? "Invalid email or password."
            : res.error,
        );
        return;
      }

      window.location.href = callbackUrl;
    } finally {
      setBusy(false);
    }
  }

  function openModal(role: Role) {
    setError(null);
    setEmail("");
    setPassword("");
    setModal({ open: true, role });
  }

  return (
    <div className="min-h-screen p-6 flex items-center justify-center">
      <div className="w-full max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 text-center">
            MDLBEAST portal
          </h1>
          <p className="text-sm text-zinc-400 text-center">
            Sign in as Admin/Supervisor or Crew.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-zinc-950 p-5 space-y-4 transition-colors transition-transform hover:border-white/30 hover:bg-zinc-900/50 hover:-translate-y-0.5">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-lg border border-white/10 bg-zinc-100/10 p-2 text-zinc-100">
                <ShieldIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">
                  Admin / Supervisor
                </h2>
                <p className="text-sm text-zinc-400">
                  Manage inventory and acknowledge requests.
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => openModal("ADMIN")}
              className="w-full rounded-lg bg-zinc-100/10 border border-white/10 text-zinc-100 px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              Sign in
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-950 p-5 space-y-4 transition-colors transition-transform hover:border-white/30 hover:bg-zinc-900/50 hover:-translate-y-0.5">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-lg border border-white/10 bg-zinc-100/10 p-2 text-zinc-100">
                <UsersIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">
                  Crew Member
                </h2>
                <p className="text-sm text-zinc-400">
                  Raise merch requests to admin.
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => openModal("CREW")}
              className="w-full rounded-lg bg-zinc-100/10 border border-white/10 text-zinc-100 px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>

      <Modal
        title={
          modal.role === "ADMIN" ? "Admin / Supervisor sign-in" : "Crew sign-in"
        }
        open={modal.open}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Email</label>
            <input
              className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mdlbeast.com"
              type="email"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Password</label>
            <input
              className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              type="password"
            />
          </div>

          {error ? <div className="text-sm text-red-400">{error}</div> : null}

          <button
            type="button"
            disabled={busy}
            onClick={() => void onSubmit(modal.role)}
            className="w-full rounded-lg bg-zinc-100/10 border border-white/10 text-zinc-100 px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            {busy ? "Signing in..." : "Sign in"}
          </button>
          <p className="text-xs text-zinc-500">
            Login is restricted to company emails ending with @mdlbeast.com.
          </p>
        </div>
      </Modal>
    </div>
  );
}

