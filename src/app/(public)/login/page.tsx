"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ArrowRight, ChevronLeft, ShieldCheck, Zap, Mail } from "lucide-react";
import Link from "next/link";
import { normalizePhone } from "@/lib/phone";
import { getActiveProfileSession, setActiveProfileSession } from "@/lib/profile-session";

type Step = "phone" | "code" | "confirm";

interface FoundProfile {
  id: string;
  name: string;
  total_points: number;
  avatar_url?: string;
  current_streak: number;
  visit_count: number;
  lands_count: number;
}

type OtpRequestData =
  | { mode: "email"; sent: true; destination: string };

type OtpVerifyData = {
  mode: "verified";
  profile: FoundProfile;
  profiles?: FoundProfile[];
};

function generateInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function ArchRings({ size = 280 }: { size?: number }) {
  const rings = [1, 2, 3, 4, 5];
  return (
    <div style={{ position: "relative", width: size, height: size / 2, overflow: "hidden", margin: "0 auto" }}>
      {rings.map((i) => {
        const r = (size / 2) * (i / rings.length);
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08, duration: 0.6, type: "spring", stiffness: 180, damping: 22 }}
            style={{
              position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
              width: r * 2, height: r, borderRadius: `${r}px ${r}px 0 0`,
              border: `${4 - i * 0.5}px solid ${i % 2 === 0 ? "rgba(212,168,67,0.35)" : "rgba(255,107,71,0.25)"}`,
              pointerEvents: "none",
            }}
          />
        );
      })}
    </div>
  );
}

const inputStyle = (error?: boolean): React.CSSProperties => ({
  flex: 1, padding: "0.875rem 1rem", borderRadius: 12,
  border: `1.5px solid ${error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.12)"}`,
  background: "rgba(255,255,255,0.05)", color: "white", fontSize: "1.05rem",
  outline: "none", letterSpacing: "0.05em", minWidth: 0, width: "100%",
});

const primaryBtn = (disabled: boolean): React.CSSProperties => ({
  width: "100%", padding: "1.1rem", borderRadius: 16, border: "none",
  background: disabled ? "rgba(255,107,71,0.35)" : "linear-gradient(135deg, var(--color-sphere-coral), var(--color-sphere-coral-dark))",
  color: "#fff", fontWeight: 800, fontSize: "1.05rem", cursor: disabled ? "not-allowed" : "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
  boxShadow: "0 4px 24px rgba(255,107,71,0.3)", letterSpacing: "0.04em",
});

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [prefix, setPrefix] = useState("+20");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [profile, setProfile] = useState<FoundProfile | null>(null);
  const [profiles, setProfiles] = useState<FoundProfile[]>([]);
  const fullPhoneRef = useRef("");

  useEffect(() => {
    if (getActiveProfileSession()) {
      router.replace("/dashboard");
    }
  }, [router]);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) { setError("Please enter your phone number"); return; }
    setLoading(true); setError(""); setInfo("");
    setCode("");
    setProfile(null);
    setProfiles([]);
    const fullPhone = normalizePhone(phone, prefix);
    if (!fullPhone) {
      setError("Please enter a valid phone number");
      setLoading(false);
      return;
    }
    fullPhoneRef.current = fullPhone;
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone }),
      });
      const json = await res.json() as { data?: OtpRequestData; error?: string };
      if (!res.ok) { setError(json.error ?? "Something went wrong. Please try again."); return; }
      if (json.data?.mode === "email") {
        setInfo(`We sent a 6-digit code to ${json.data.destination}.`);
        setStep("code");
        return;
      }
      setError("Could not send the verification code. Please try again.");
    } catch {
      setError("Connection error — please try again.");
    } finally { setLoading(false); }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) { setError("Enter the 6-digit code"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhoneRef.current, code }),
      });
      const json = await res.json() as { data?: OtpVerifyData; error?: string };
      if (!res.ok || !json.data?.profile) { setError(json.error ?? "Incorrect or expired code."); return; }
      const foundProfiles = json.data.profiles?.length ? json.data.profiles : [json.data.profile];
      setProfiles(foundProfiles);
      setProfile(foundProfiles[0] ?? null);
      setInfo(foundProfiles.length > 1 ? "Code verified. Choose the camper profile to open." : "Code verified.");
      setStep("confirm");
    } catch {
      setError("Connection error — please try again.");
    } finally { setLoading(false); }
  }

  function handleConfirm() {
    if (!profile) return;
    setActiveProfileSession({ id: profile.id, name: profile.name });
    router.push("/dashboard");
  }

  return (
    <div className="theme-dark" style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at top center, rgba(255,107,71,0.12) 0%, var(--color-dark) 55%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "2.5rem 1.25rem 4rem", overflowX: "hidden",
    }}>
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 440 }}>
        <motion.div initial={{ y: -24 }} animate={{ y: 0 }} transition={{ duration: 0.55 }} style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <ArchRings size={260} />
          <div style={{ marginTop: "-0.5rem" }}>
            <div style={{ display: "inline-block", background: "rgba(255,107,71,0.12)", border: "1px solid rgba(255,107,71,0.3)", borderRadius: 999, padding: "0.3rem 1rem", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--color-sphere-coral)", marginBottom: "0.75rem" }}>The Sphere</div>
            <h1 style={{ fontSize: "clamp(1.8rem, 7vw, 2.6rem)", fontWeight: 900, lineHeight: 1.05, background: "linear-gradient(135deg, var(--color-sphere-coral) 0%, var(--color-sphere-gold) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", margin: "0 0 0.4rem" }}>Welcome Back!</h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.95rem" }}>
              {step === "code" ? "Enter the code we sent to the linked email" : "Enter your registered phone to open your profile"}
            </p>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === "phone" && (
            <motion.div key="phone" initial={{ x: 40 }} animate={{ x: 0 }} exit={{ x: -40 }} transition={{ duration: 0.3 }}>
              <form onSubmit={requestCode}>
                <div className="login-panel" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: "2rem", marginBottom: "1.25rem", overflow: "hidden" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)", marginBottom: "0.875rem" }}>
                    <Phone size={13} /> Parent Phone Number
                  </label>
                  <div className="phone-row" style={{ display: "flex", gap: "0.5rem", minWidth: 0 }}>
                    <select value={prefix} onChange={e => setPrefix(e.target.value)} style={{ background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(255,255,255,0.12)", borderRadius: 12, color: "white", padding: "0.875rem 0.75rem", fontSize: "0.95rem", outline: "none", cursor: "pointer", flex: "0 0 5.5rem", minWidth: 0 }}>
                      <option value="+20">+20</option><option value="+1">+1</option><option value="+44">+44</option><option value="+971">+971</option><option value="+966">+966</option>
                    </select>
                    <input type="tel" value={phone} onChange={e => { setPhone(e.target.value); setError(""); }} placeholder="1XX XXX XXXX" autoFocus style={inputStyle(!!error)} />
                  </div>
                  {error && <p style={{ color: "#f87171", fontSize: "0.82rem", marginTop: "0.6rem" }}>{error}</p>}
                </div>
                <motion.button className="login-submit-button" type="submit" disabled={loading || !phone.trim()} whileTap={{ scale: 0.97 }} style={primaryBtn(loading || !phone.trim())}>
                  {loading ? "Sending code..." : (<><Mail size={18} /> Send Email Code <ArrowRight size={20} /></>)}
                </motion.button>
              </form>
              <div style={{ textAlign: "center", marginTop: "1.5rem", color: "rgba(255,255,255,0.4)", fontSize: "0.82rem", lineHeight: 1.6 }}>
                Use the parent phone number from registration. The code will be sent to the linked email.
                <br />
                <Link href="/register" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "underline", textUnderlineOffset: 3 }}>First time here? Register</Link>
              </div>
            </motion.div>
          )}

          {step === "code" && (
            <motion.div key="code" initial={{ x: 40 }} animate={{ x: 0 }} exit={{ x: -40 }} transition={{ duration: 0.3 }}>
              <form onSubmit={verifyCode}>
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: "2rem", marginBottom: "1.25rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)", marginBottom: "0.875rem" }}>
                    <ShieldCheck size={13} /> 6-Digit Code
                  </label>
                  <input inputMode="numeric" maxLength={6} value={code} onChange={e => { setCode(e.target.value.replace(/\D/g, "")); setError(""); }} placeholder="••••••" autoFocus style={{ ...inputStyle(!!error), width: "100%", textAlign: "center", fontSize: "1.6rem", letterSpacing: "0.5rem", fontWeight: 800 }} />
                  {info && !error && <p style={{ color: "rgba(116,168,50,0.9)", fontSize: "0.8rem", marginTop: "0.6rem" }}>{info}</p>}
                  {error && <p style={{ color: "#f87171", fontSize: "0.82rem", marginTop: "0.6rem" }}>{error}</p>}
                </div>
                <motion.button type="submit" disabled={loading || code.length !== 6} whileTap={{ scale: 0.97 }} style={primaryBtn(loading || code.length !== 6)}>
                  {loading ? "Verifying…" : (<><Zap size={18} /> Verify &amp; Enter</>)}
                </motion.button>
              </form>
              <button onClick={() => { setStep("phone"); setCode(""); setError(""); setInfo(""); }} style={{ width: "100%", marginTop: "0.75rem", padding: "0.8rem", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.45)", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                <ChevronLeft size={16} /> Change number / resend
              </button>
            </motion.div>
          )}

          {step === "confirm" && profile && (
            <motion.div key="confirm" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ x: -40 }} transition={{ duration: 0.35, type: "spring", stiffness: 250, damping: 24 }}>
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,107,71,0.25)", borderRadius: 24, padding: "2rem", textAlign: "center", marginBottom: "1rem" }}>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.8rem", marginBottom: "1.25rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>Profile found - is this you?</p>
                {info && (
                  <p style={{ color: "rgba(116,168,50,0.92)", fontSize: "0.8rem", margin: "-0.6rem 0 1.25rem", lineHeight: 1.5 }}>
                    {info}
                  </p>
                )}
                <div style={{ width: 88, height: 88, borderRadius: "50%", background: "linear-gradient(135deg, var(--color-sphere-coral), var(--color-sphere-gold))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: 900, color: "#fff", margin: "0 auto 1rem", boxShadow: "0 0 40px rgba(255,107,71,0.4)" }}>{generateInitials(profile.name)}</div>
                <h2 style={{ fontSize: "1.6rem", fontWeight: 900, color: "white", margin: "0 0 0.5rem" }}>{profile.name}</h2>
                {profiles.length > 1 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", margin: "0.75rem 0 1rem" }}>
                    {profiles.map((item) => {
                      const selected = item.id === profile.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setProfile(item)}
                          style={{
                            width: "100%",
                            borderRadius: 12,
                            border: selected ? "1.5px solid var(--color-sphere-coral)" : "1px solid rgba(255,255,255,0.12)",
                            background: selected ? "rgba(255,107,71,0.12)" : "rgba(255,255,255,0.04)",
                            color: selected ? "white" : "rgba(255,255,255,0.78)",
                            padding: "0.65rem 0.8rem",
                            cursor: "pointer",
                            fontWeight: 800,
                            textAlign: "left",
                          }}
                        >
                          {item.name}
                        </button>
                      );
                    })}
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", marginTop: "0.75rem" }}>
                  {[{ label: "Points", value: profile.total_points.toLocaleString(), icon: "⚡" }, { label: "Visits", value: String(profile.visit_count), icon: "📍" }, { label: "Lands", value: `${profile.lands_count}/11`, icon: "🗺️" }].map(s => (
                    <div key={s.label} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "0.8rem" }}>{s.icon}</div>
                      <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--color-sphere-coral)" }}>{s.value}</div>
                      <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleConfirm} style={{ ...primaryBtn(false), background: "linear-gradient(135deg, var(--color-sphere-coral), var(--color-sphere-gold))" }}>
                <Zap size={18} /> Enter The Sphere!
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
          <Link href="/" style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.8rem", textDecoration: "none" }}>← Back to The Sphere home</Link>
        </div>
      </div>

      <style>{`
        @media (max-width: 480px) {
          .login-panel {
            padding: 1.25rem !important;
            border-radius: 18px !important;
          }

          .phone-row {
            gap: 0.4rem !important;
          }

          .phone-row select {
            flex-basis: 4.8rem !important;
            padding-left: 0.55rem !important;
            padding-right: 0.45rem !important;
          }

          .login-submit-button {
            font-size: 0.92rem !important;
            padding: 0.95rem 0.75rem !important;
            gap: 0.35rem !important;
          }

          .login-submit-button svg {
            width: 18px !important;
            height: 18px !important;
            flex-shrink: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
