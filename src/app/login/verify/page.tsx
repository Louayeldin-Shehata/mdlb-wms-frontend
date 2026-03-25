export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 space-y-2">
        <h1 className="text-xl font-semibold text-zinc-100">Check your email</h1>
        <p className="text-sm text-zinc-400">
          We sent you a sign-in link. It may take a minute to arrive.
        </p>
      </div>
    </div>
  );
}

