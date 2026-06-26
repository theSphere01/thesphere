"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function StaffLoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen theme-dark" style={{ background: "var(--color-dark)" }} />}>
      <StaffLoginForm />
    </Suspense>
  );
}

function StaffLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(searchParams.get("error") === "configuration"
    ? "Staff authentication is not configured yet."
    : "");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    const { data: staffUser, error: staffError } = await supabase
      .from("staff_users")
      .select("role")
      .maybeSingle();

    if (staffError || !staffUser || (staffUser.role !== "admin" && staffUser.role !== "staff")) {
      await supabase.auth.signOut();
      setError("This account does not have staff access.");
      setLoading(false);
      return;
    }

    const next = searchParams.get("next");
    router.replace(next && next.startsWith("/") ? next : staffUser.role === "admin" ? "/admin" : "/checkin");
    router.refresh();
  }

  return (
    <main className="min-h-screen theme-dark flex items-center justify-center px-4" style={{ background: "var(--color-dark)" }}>
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl p-7 space-y-5" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)" }}>
        <div>
          <p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--color-sphere-gold)" }}>The Sphere</p>
          <h1 className="mt-2 text-2xl font-black text-white">Staff sign in</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>Use your assigned staff account.</p>
        </div>

        <label className="block text-sm font-medium text-white">
          Email
          <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-lg px-3 py-2 text-slate-950" />
        </label>
        <label className="block text-sm font-medium text-white">
          Password
          <input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-lg px-3 py-2 text-slate-950" />
        </label>

        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

        <button type="submit" disabled={loading} className="w-full rounded-lg px-4 py-2.5 font-bold text-white disabled:opacity-60" style={{ background: "var(--color-sphere-coral)" }}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
