"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle, Smartphone, Copy, ArrowRight, Wifi, User, Phone, Hash, CalendarDays } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Step = "form" | "wristband" | "success";

interface FormData {
  child_name: string;
  age: string;
  parent_name: string;
  parent_phone: string;
}

interface FormErrors {
  child_name?: string;
  age?: string;
  parent_name?: string;
  parent_phone?: string;
}

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.child_name.trim()) errors.child_name = "Child's name is required";
  const age = Number(data.age);
  if (!data.age || isNaN(age) || age < 4 || age > 18)
    errors.age = "Age must be between 4 and 18";
  if (!data.parent_name.trim()) errors.parent_name = "Parent's name is required";
  if (!data.parent_phone.trim() || data.parent_phone.length < 8)
    errors.parent_phone = "Valid phone number required";
  return errors;
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState<FormData>({
    child_name: "",
    age: "",
    parent_name: "",
    parent_phone: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [childName, setChildName] = useState<string>("");
  const [nfcStatus, setNFCStatus] = useState<"writing" | "done" | "failed">("writing");
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (step !== "success" || !profileId) return;
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          router.push(`/profile/${profileId}?welcome=1`);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step, profileId, router]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          child_name:   form.child_name.trim(),
          age:          Number(form.age),
          parent_name:  form.parent_name.trim(),
          parent_phone: form.parent_phone.trim(),
        }),
      });
      const json = await res.json() as { data?: { id: string; name: string; token?: string }; error?: string };
      if (!res.ok || json.error) throw new Error(json.error ?? "Registration failed");

      const id = json.data!.id;
      const tk = json.data!.token ?? id;
      setProfileId(id);
      setToken(tk);
      setChildName(json.data!.name ?? form.child_name);
      setStep("wristband");

      // Web NFC (writing the signed token to the tag) only works on Chrome for
      // Android. On any other device go straight to the QR code instead of
      // showing a "writing" attempt that is bound to fail.
      if (typeof window !== "undefined" && "NDEFReader" in window) {
        setNFCStatus("writing");
        try {
          const { writeNFCWristband } = await import("@/lib/nfc/nfc-writer");
          await writeNFCWristband(tk);
          setNFCStatus("done");
          setTimeout(() => setStep("success"), 800);
        } catch {
          setNFCStatus("failed");
        }
      } else {
        setNFCStatus("failed");
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  function copyProfileLink() {
    if (!profileId) return;
    const url = `${window.location.origin}/profile/${profileId}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const profileUrl = profileId ? `${typeof window !== "undefined" ? window.location.origin : ""}/profile/${profileId}` : "";
  // The wristband QR encodes the signed token (same shape the NFC tag carries),
  // so staff scans resolve and verify it — never the raw profile UUID.
  const wristbandQR = token ? JSON.stringify({ v: 1, pid: token }) : profileUrl;

  return (
    <div
      className="theme-dark"
      style={{
        minHeight: "100vh",
        background: "var(--color-dark)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "2rem 1rem 4rem",
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ y: -16 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ textAlign: "center", marginBottom: "2.5rem" }}
      >
        <div
          style={{
            display: "inline-block",
            background: "var(--color-ws-blue)",
            color: "#fff",
            fontSize: "0.65rem",
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            padding: "0.3rem 1rem",
            borderRadius: 999,
            marginBottom: "0.75rem",
          }}
        >
          Staff Portal
        </div>
        <h1
          style={{
            fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
            fontWeight: 900,
            color: "var(--color-surface)",
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          Register New Camper
        </h1>
        <p style={{ color: "var(--color-text-muted)", marginTop: "0.5rem", fontSize: "0.95rem" }}>
          Fill in the details, then we will write the wristband
        </p>
      </motion.div>

      {/* Step indicator */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem" }}>
        {(["form", "wristband", "success"] as Step[]).map((s, i) => (
          <div
            key={s}
            style={{
              width: 32,
              height: 6,
              borderRadius: 3,
              background:
                s === step
                  ? "var(--color-sphere-coral)"
                  : i < (["form", "wristband", "success"] as Step[]).indexOf(step)
                  ? "var(--color-ws-green)"
                  : "rgba(255,255,255,0.12)",
              transition: "background 0.3s ease",
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── STEP 1: FORM ── */}
        {step === "form" && (
          <motion.div
            key="form"
            initial={{ x: 40 }}
            animate={{ x: 0 }}
            exit={{ x: -40 }}
            transition={{ duration: 0.3 }}
            style={{ width: "100%", maxWidth: 480 }}
          >
            <form
              onSubmit={handleSubmit}
              noValidate
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 20,
                padding: "2rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              <FieldGroup
                label="Child's First Name"
                icon={<User size={15} />}
                error={errors.child_name}
              >
                <input
                  name="child_name"
                  value={form.child_name}
                  onChange={handleChange}
                  placeholder="e.g. Yasmine"
                  style={inputStyle(!!errors.child_name)}
                />
              </FieldGroup>

              <FieldGroup label="Age" icon={<CalendarDays size={15} />} error={errors.age}>
                <input
                  name="age"
                  type="number"
                  min={4}
                  max={18}
                  value={form.age}
                  onChange={handleChange}
                  placeholder="4 – 18"
                  style={inputStyle(!!errors.age)}
                />
              </FieldGroup>

              <FieldGroup
                label="Parent's Full Name"
                icon={<User size={15} />}
                error={errors.parent_name}
              >
                <input
                  name="parent_name"
                  value={form.parent_name}
                  onChange={handleChange}
                  placeholder="e.g. Ahmed Khalil"
                  style={inputStyle(!!errors.parent_name)}
                />
              </FieldGroup>

              <FieldGroup
                label="Parent's Phone Number"
                icon={<Phone size={15} />}
                error={errors.parent_phone}
              >
                <input
                  name="parent_phone"
                  type="tel"
                  value={form.parent_phone}
                  onChange={handleChange}
                  placeholder="+20 xxx xxx xxxx"
                  style={inputStyle(!!errors.parent_phone)}
                />
              </FieldGroup>

              {submitError && (
                <div
                  style={{
                    background: "rgba(239,68,68,0.12)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: 10,
                    padding: "0.75rem 1rem",
                    color: "#f87171",
                    fontSize: "0.875rem",
                  }}
                >
                  {submitError}
                </div>
              )}

              <motion.button
                type="submit"
                disabled={submitting}
                whileTap={{ scale: 0.97 }}
                style={{
                  padding: "1rem",
                  borderRadius: 12,
                  background: submitting
                    ? "rgba(255,107,71,0.4)"
                    : "var(--color-sphere-coral)",
                  border: "none",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "1rem",
                  cursor: submitting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  letterSpacing: "0.04em",
                  marginTop: "0.25rem",
                }}
              >
                {submitting ? "Registering..." : (
                  <>
                    Register Camper
                    <ArrowRight size={18} />
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        )}

        {/* ── STEP 2: WRISTBAND ── */}
        {step === "wristband" && (
          <motion.div
            key="wristband"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            transition={{ duration: 0.35 }}
            style={{
              width: "100%",
              maxWidth: 440,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 20,
              padding: "2.5rem 2rem",
              textAlign: "center",
            }}
          >
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "0.5rem" }}>
              {nfcStatus === "writing"
                ? "Writing Wristband..."
                : nfcStatus === "done"
                ? "Wristband Written!"
                : "Your Wristband QR Code"}
            </h2>

            {nfcStatus === "writing" && (
              <>
                {/* Phone + wristband animation */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "1.5rem",
                    margin: "2rem 0",
                  }}
                >
                  <motion.div
                    animate={{ x: [0, 14, 0], rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 12,
                      background: "var(--color-ws-blue)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Smartphone size={28} color="#fff" />
                  </motion.div>
                  <motion.div
                    animate={{ x: [-14, 0, -14] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Wifi size={24} color="var(--color-sphere-coral)" style={{ transform: "rotate(90deg)" }} />
                  </motion.div>
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                    style={{
                      width: 56,
                      height: 20,
                      borderRadius: 10,
                      background: "var(--color-sphere-coral)",
                      boxShadow: "0 0 20px rgba(255,107,71,0.5)",
                    }}
                  />
                </div>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                  Hold the wristband against the back of the device
                </p>
              </>
            )}

            {nfcStatus === "done" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{ fontSize: "4rem", margin: "1.5rem 0" }}
              >
                <CheckCircle size={72} color="#22c55e" style={{ display: "block", margin: "0 auto" }} />
              </motion.div>
            )}

            {nfcStatus === "failed" && (
              <>
                <p style={{ color: "var(--color-text-muted)", margin: "1.5rem 0 1rem" }}>
                  NFC tap needs an Android phone with Chrome. Use this QR code on the
                  wristband instead — print it or screenshot it; staff scan it at the gate.
                </p>
                <div
                  style={{
                    display: "inline-block",
                    background: "#fff",
                    padding: 16,
                    borderRadius: 12,
                    marginBottom: "1rem",
                  }}
                >
                  <QRCodeSVG value={wristbandQR} size={200} />
                </div>
                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                  <button
                    onClick={() => setStep("success")}
                    style={{
                      padding: "0.75rem 1.5rem",
                      borderRadius: 10,
                      background: "var(--color-sphere-coral)",
                      border: "none",
                      color: "#fff",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: "0.9rem",
                    }}
                  >
                    Continue to Success
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ── STEP 3: SUCCESS ── */}
        {step === "success" && (
          <motion.div
            key="success"
            initial={{ y: 30 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 200, damping: 20 }}
            style={{
              width: "100%",
              maxWidth: 480,
              textAlign: "center",
            }}
          >
            {/* Confetti circles */}
            <div style={{ position: "relative", overflow: "hidden", borderRadius: 20 }}>
              {[
                { color: "var(--color-sphere-coral)", top: "10%", left: "5%",  size: 60  },
                { color: "var(--color-sphere-gold)",  top: "5%",  right: "8%", size: 44  },
                { color: "var(--color-ws-green)",     bottom: "15%", left: "10%", size: 36 },
                { color: "var(--color-path-blue)",    bottom: "8%", right: "6%", size: 52 },
              ].map((circle, i) => (
                <div
                  key={i}
                  className="animate-float"
                  style={{
                    position: "absolute",
                    width: circle.size,
                    height: circle.size,
                    borderRadius: "50%",
                    background: circle.color,
                    opacity: 0.15,
                    ...(circle.top    ? { top:    circle.top    } : {}),
                    ...(circle.bottom ? { bottom: circle.bottom } : {}),
                    ...(circle.left   ? { left:   circle.left   } : {}),
                    ...(circle.right  ? { right:  (circle as { right?: string }).right  } : {}),
                    animationDelay: `${i * 0.4}s`,
                  }}
                />
              ))}

              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 20,
                  padding: "2.5rem 2rem",
                }}
              >
                <div style={{ fontSize: "3.5rem", marginBottom: "0.5rem" }}>🎉</div>
                <h2
                  style={{
                    fontSize: "clamp(1.5rem, 5vw, 2rem)",
                    fontWeight: 900,
                    color: "var(--color-sphere-coral)",
                    margin: "0 0 0.4rem",
                  }}
                >
                  Welcome to The Sphere,
                </h2>
                <h3
                  style={{
                    fontSize: "clamp(1.2rem, 4vw, 1.75rem)",
                    fontWeight: 800,
                    color: "var(--color-surface)",
                    margin: "0 0 1.5rem",
                  }}
                >
                  {childName}!
                </h3>

                {/* QR code */}
                <div
                  style={{
                    display: "inline-block",
                    background: "#fff",
                    padding: 12,
                    borderRadius: 12,
                    marginBottom: "1rem",
                  }}
                >
                  <QRCodeSVG value={wristbandQR} size={160} />
                </div>

                <p style={{ color: "var(--color-text-muted)", fontSize: "0.82rem", marginBottom: "1.25rem" }}>
                  This QR code is your backup — show it at the gate if your wristband is unavailable
                </p>

                {/* Profile link with copy */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    padding: "0.6rem 0.75rem",
                    marginBottom: "1.5rem",
                    textAlign: "left",
                  }}
                >
                  <Hash size={14} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
                  <span
                    style={{
                      flex: 1,
                      fontSize: "0.78rem",
                      color: "var(--color-text-muted)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {profileUrl}
                  </span>
                  <button
                    onClick={copyProfileLink}
                    style={{
                      flexShrink: 0,
                      padding: "0.25rem 0.5rem",
                      borderRadius: 6,
                      background: copied ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.08)",
                      border: `1px solid ${copied ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.12)"}`,
                      color: copied ? "#22c55e" : "var(--color-text-light)",
                      cursor: "pointer",
                      fontSize: "0.72rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Copy size={12} />
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>

                {/* Auto-redirect countdown */}
                {countdown !== null && (
                  <p style={{ color: "var(--color-text-muted)", fontSize: "0.82rem", marginBottom: "0.75rem" }}>
                    Taking you to your profile in{" "}
                    <span style={{ color: "var(--color-sphere-coral)", fontWeight: 800 }}>{countdown}</span>…
                  </p>
                )}

                {/* CTA */}
                <Link
                  href={profileId ? `/profile/${profileId}?welcome=1` : "/lands"}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "1rem 2.5rem",
                    borderRadius: 12,
                    background: "linear-gradient(135deg, var(--color-sphere-coral), var(--color-sphere-gold))",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: "1.05rem",
                    textDecoration: "none",
                    letterSpacing: "0.04em",
                  }}
                >
                  Go to My Profile
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "0.75rem 0.875rem",
    borderRadius: 10,
    border: `1.5px solid ${hasError ? "rgba(239,68,68,0.6)" : "rgba(255,255,255,0.12)"}`,
    background: "rgba(255,255,255,0.04)",
    color: "var(--color-surface)",
    fontSize: "0.95rem",
    outline: "none",
    transition: "border-color 0.15s ease",
  };
}

function FieldGroup({
  label,
  icon,
  error,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          fontSize: "0.8rem",
          fontWeight: 600,
          color: "var(--color-text-light)",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        {icon}
        {label}
      </label>
      {children}
      {error && (
        <span style={{ fontSize: "0.78rem", color: "#f87171" }}>{error}</span>
      )}
    </div>
  );
}
