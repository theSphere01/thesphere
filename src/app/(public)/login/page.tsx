"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ArrowRight, ChevronLeft, User, Zap } from "lucide-react";
import Link from "next/link";

type Step = "phone" | "confirm";

interface FoundProfile {
  id: string;
  name: string;
  total_points: number;
  avatar_url?: string;
  current_streak: number;
  visit_count: number;
  lands_count: number;
}

function generateInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Concentric arch rings decorative component
function ArchRings({ size = 320 }: { size?: number }) {
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
              position: "absolute",
              bottom: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: r * 2,
              height: r,
              borderRadius: `${r}px ${r}px 0 0`,
              border: `${4 - i * 0.5}px solid ${i % 2 === 0 ? "rgba(212,168,67,0.35)" : "rgba(255,107,71,0.25)"}`,
              pointerEvents: "none",
            }}
          />
        );
      })}
      {/* Inner fill */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: (size / 2) * 0.5,
          height: (size / 2) * 0.25,
          borderRadius: `${(size / 2) * 0.25}px ${(size / 2) * 0.25}px 0 0`,
          background: "radial-gradient(ellipse at center bottom, rgba(255,107,71,0.3) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [prefix, setPrefix] = useState("+20");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<FoundProfile | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("sphere_profile_id");
      if (stored) router.replace("/dashboard");
    }
  }, [router]);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) { setError("Please enter your phone number"); return; }
    setLoading(true);
    setError("");
    try {
      const fullPhone = `${prefix}${phone.trim().replace(/^0/, "")}`;
      const res = await fetch("/api/auth/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone }),
      });
      const json = await res.json() as { data?: FoundProfile; error?: string };
      if (!res.ok || json.error) {
        // Try without prefix too
        const res2 = await fetch("/api/auth/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phone.trim() }),
        });
        const json2 = await res2.json() as { data?: FoundProfile; error?: string };
        if (!res2.ok || json2.error) {
          setError("No profile found for this number. Check the number or register below.");
          return;
        }
        setProfile(json2.data!);
      } else {
        setProfile(json.data!);
      }
      setStep("confirm");
    } catch {
      setError("Connection error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleConfirm() {
    if (!profile) return;
    if (typeof window !== "undefined") {
      sessionStorage.setItem("sphere_profile_id", profile.id);
      sessionStorage.setItem("sphere_profile_name", profile.name);
    }
    router.push("/dashboard");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at top center, rgba(255,107,71,0.12) 0%, var(--color-dark) 55%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "2.5rem 1.25rem 4rem",
        overflowX: "hidden",
      }}
    >
      {/* Floating background orbs */}
      {[
        { color: "rgba(255,107,71,0.06)", size: 300, x: -100, y: 100 },
        { color: "rgba(212,168,67,0.05)", size: 200, x: 120,  y: 300 },
      ].map((orb, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 5 + i * 2, repeat: Infinity, ease: "easeInOut", delay: i * 1.5 }}
          style={{
            position: "fixed",
            width: orb.size,
            height: orb.size,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            left: `calc(50% + ${orb.x}px)`,
            top: orb.y,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      ))}

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 440 }}>
        {/* Arch hero */}
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          style={{ textAlign: "center", marginBottom: "1.5rem" }}
        >
          <ArchRings size={280} />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35, type: "spring", stiffness: 200, damping: 18 }}
            style={{ marginTop: "-1rem" }}
          >
            <div
              style={{
                display: "inline-block",
                background: "rgba(255,107,71,0.12)",
                border: "1px solid rgba(255,107,71,0.3)",
                borderRadius: 999,
                padding: "0.3rem 1rem",
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--color-sphere-coral)",
                marginBottom: "0.75rem",
              }}
            >
              The Sphere
            </div>
            <h1
              style={{
                fontSize: "clamp(2rem, 7vw, 2.8rem)",
                fontWeight: 900,
                lineHeight: 1.05,
                background: "linear-gradient(135deg, var(--color-sphere-coral) 0%, var(--color-sphere-gold) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                margin: "0 0 0.4rem",
              }}
            >
              Welcome Back!
            </h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.95rem" }}>
              Enter your parent's phone to access your profile
            </p>
          </motion.div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Step 1: Phone input */}
          {step === "phone" && (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              <form onSubmit={handleLookup}>
                <div
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 24,
                    padding: "2rem",
                    marginBottom: "1.25rem",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.55)",
                      marginBottom: "0.875rem",
                    }}
                  >
                    <Phone size={13} />
                    Parent Phone Number
                  </label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <select
                      value={prefix}
                      onChange={e => setPrefix(e.target.value)}
                      style={{
                        background: "rgba(255,255,255,0.07)",
                        border: "1.5px solid rgba(255,255,255,0.12)",
                        borderRadius: 12,
                        color: "white",
                        padding: "0.875rem 0.75rem",
                        fontSize: "0.95rem",
                        outline: "none",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      <option value="+20">+20</option>
                      <option value="+1">+1</option>
                      <option value="+44">+44</option>
                      <option value="+971">+971</option>
                      <option value="+966">+966</option>
                    </select>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => { setPhone(e.target.value); setError(""); }}
                      placeholder="1XX XXX XXXX"
                      autoFocus
                      style={{
                        flex: 1,
                        padding: "0.875rem 1rem",
                        borderRadius: 12,
                        border: `1.5px solid ${error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.12)"}`,
                        background: "rgba(255,255,255,0.05)",
                        color: "white",
                        fontSize: "1.05rem",
                        outline: "none",
                        letterSpacing: "0.05em",
                      }}
                    />
                  </div>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ color: "#f87171", fontSize: "0.82rem", marginTop: "0.6rem" }}
                    >
                      {error}
                    </motion.p>
                  )}
                </div>

                <motion.button
                  type="submit"
                  disabled={loading || !phone.trim()}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    width: "100%",
                    padding: "1.1rem",
                    borderRadius: 16,
                    border: "none",
                    background: loading || !phone.trim()
                      ? "rgba(255,107,71,0.35)"
                      : "linear-gradient(135deg, var(--color-sphere-coral), var(--color-sphere-coral-dark))",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: "1.05rem",
                    cursor: loading || !phone.trim() ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    boxShadow: "0 4px 24px rgba(255,107,71,0.3)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }}
                      />
                      Finding your profile...
                    </>
                  ) : (
                    <>
                      Find My Profile
                      <ArrowRight size={20} />
                    </>
                  )}
                </motion.button>
              </form>

              <div style={{ textAlign: "center", marginTop: "1.75rem" }}>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                  First time here?
                </p>
                <Link
                  href="/register"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.75rem 1.75rem",
                    borderRadius: 12,
                    border: "1.5px solid rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.7)",
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    transition: "all 0.15s ease",
                  }}
                >
                  Register as a New Camper
                  <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
          )}

          {/* Step 2: Confirm profile */}
          {step === "confirm" && profile && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35, type: "spring", stiffness: 250, damping: 24 }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,107,71,0.25)",
                  borderRadius: 24,
                  padding: "2rem",
                  textAlign: "center",
                  marginBottom: "1rem",
                }}
              >
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.8rem", marginBottom: "1.25rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Is this you?
                </p>

                {/* Avatar */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 280, damping: 22, delay: 0.1 }}
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--color-sphere-coral), var(--color-sphere-gold))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "2rem",
                    fontWeight: 900,
                    color: "#fff",
                    margin: "0 auto 1rem",
                    boxShadow: "0 0 40px rgba(255,107,71,0.4)",
                  }}
                >
                  {generateInitials(profile.name)}
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 }}
                  style={{ fontSize: "1.6rem", fontWeight: 900, color: "white", margin: "0 0 0.25rem" }}
                >
                  {profile.name}
                </motion.h2>

                {/* Stats row */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  style={{ display: "flex", justifyContent: "center", gap: "1.5rem", marginTop: "1rem", marginBottom: "0.5rem" }}
                >
                  {[
                    { label: "Points", value: profile.total_points.toLocaleString(), icon: "⚡" },
                    { label: "Visits",  value: String(profile.visit_count),           icon: "📍" },
                    { label: "Lands",   value: `${profile.lands_count}/11`,           icon: "🗺️" },
                  ].map(stat => (
                    <div key={stat.label} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "0.8rem" }}>{stat.icon}</div>
                      <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--color-sphere-coral)" }}>
                        {stat.value}
                      </div>
                      <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleConfirm}
                style={{
                  width: "100%",
                  padding: "1.1rem",
                  borderRadius: 16,
                  border: "none",
                  background: "linear-gradient(135deg, var(--color-sphere-coral), var(--color-sphere-gold))",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "1.05rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  boxShadow: "0 4px 30px rgba(255,107,71,0.35)",
                  marginBottom: "0.75rem",
                  letterSpacing: "0.04em",
                }}
              >
                <Zap size={18} />
                Yes, that&apos;s me — Enter The Sphere!
              </motion.button>

              <button
                onClick={() => { setStep("phone"); setProfile(null); setError(""); }}
                style={{
                  width: "100%",
                  padding: "0.8rem",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "transparent",
                  color: "rgba(255,255,255,0.45)",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem",
                }}
              >
                <ChevronLeft size={16} />
                That&apos;s not me — try again
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back to home */}
        <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
          <Link
            href="/"
            style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.8rem", textDecoration: "none" }}
          >
            ← Back to The Sphere home
          </Link>
        </div>
      </div>
    </div>
  );
}
