"use client";
import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, LogIn, LogOut, Timer, Copy, Star, RefreshCw,
} from "lucide-react";
import dynamic from "next/dynamic";
import NFCScanner from "@/components/nfc/nfc-scanner";
import PointsDisplay from "@/components/gamification/points-display";
import BadgeDisplay from "@/components/badges/badge-display";
import { LANDS } from "@/lib/constants";
import { generateInitials, formatPoints } from "@/lib/utils";
import type { Profile, BadgeDefinition, DiscountCode } from "@/lib/types";

const QrScanner = dynamic(() => import("@/components/qr/qr-scanner"), { ssr: false });

type Mode = "checkin" | "checkout";
type CheckInPhase = "scan" | "profile" | "confirmed";
type CheckOutPhase = "scan" | "profile" | "lands" | "celebration";

interface LandSelection {
  landId: string;
  hours: number;
}

interface CheckoutResult {
  points_earned: number;
  new_badges: BadgeDefinition[];
  discount_codes: DiscountCode[];
  session_id: string;
}

export default function CheckInPage() {
  const [mode, setMode] = useState<Mode>("checkin");
  const [showQR, setShowQR] = useState(false);

  // Check-in state
  const [ciPhase, setCIPhase] = useState<CheckInPhase>("scan");
  const [ciProfile, setCIProfile] = useState<Profile | null>(null);
  const [ciSessionId, setCISessionId] = useState<string | null>(null);
  const [ciLoading, setCILoading] = useState(false);
  const [ciError, setCIError] = useState<string | null>(null);

  // Check-out state
  const [coPhase, setCOPhase] = useState<CheckOutPhase>("scan");
  const [coProfile, setCOProfile] = useState<Profile | null>(null);
  const [coSessionId, setCOSessionId] = useState<string | null>(null);
  const [coLoading, setCOLoading] = useState(false);
  const [coError, setCOError] = useState<string | null>(null);
  const [selectedLands, setSelectedLands] = useState<LandSelection[]>([]);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // ── scan handlers ────────────────────────────────────────────
  const handleCheckinScan = useCallback(async (profileId: string) => {
    setCILoading(true);
    setCIError(null);
    try {
      const res = await fetch(`/api/wristbands/lookup?qr=${encodeURIComponent(profileId)}`);
      const json = await res.json() as { data?: Profile; error?: string };
      if (!res.ok || json.error) throw new Error(json.error ?? "Profile not found");
      setCIProfile(json.data!);
      setCIPhase("profile");
    } catch (err) {
      setCIError(err instanceof Error ? err.message : "Could not load profile");
    } finally {
      setCILoading(false);
    }
  }, []);

  const handleCheckoutScan = useCallback(async (profileId: string) => {
    setCOLoading(true);
    setCOError(null);
    try {
      const res = await fetch(`/api/wristbands/lookup?qr=${encodeURIComponent(profileId)}`);
      const json = await res.json() as { data?: Profile & { active_session_id?: string }; error?: string };
      if (!res.ok || json.error) throw new Error(json.error ?? "Profile not found");
      setCOProfile(json.data!);
      setCOSessionId(json.data?.active_session_id ?? null);
      setCOPhase("profile");
    } catch (err) {
      setCOError(err instanceof Error ? err.message : "Could not load profile");
    } finally {
      setCOLoading(false);
    }
  }, []);

  // ── check-in confirm ─────────────────────────────────────────
  async function confirmCheckIn() {
    if (!ciProfile) return;
    setCILoading(true);
    setCIError(null);
    try {
      const res = await fetch("/api/sessions/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: ciProfile.id }),
      });
      const json = await res.json() as { data?: { session_id: string }; error?: string };
      if (!res.ok || json.error) throw new Error(json.error ?? "Check-in failed");
      setCISessionId(json.data?.session_id ?? null);
      setCIPhase("confirmed");
    } catch (err) {
      setCIError(err instanceof Error ? err.message : "Check-in failed");
    } finally {
      setCILoading(false);
    }
  }

  // ── land selection ───────────────────────────────────────────
  function toggleLand(landId: string) {
    setSelectedLands((prev) => {
      const exists = prev.find((l) => l.landId === landId);
      if (exists) return prev.filter((l) => l.landId !== landId);
      return [...prev, { landId, hours: 1 }];
    });
  }

  function setHours(landId: string, hours: number) {
    setSelectedLands((prev) =>
      prev.map((l) => (l.landId === landId ? { ...l, hours } : l))
    );
  }

  // ── check-out confirm ─────────────────────────────────────────
  async function confirmCheckOut() {
    if (!coProfile) return;
    setCOLoading(true);
    setCOError(null);
    try {
      const res = await fetch("/api/sessions/check-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id:  coSessionId,
          profile_id:  coProfile.id,
          land_hours:  selectedLands,
        }),
      });
      const json = await res.json() as { data?: CheckoutResult; error?: string };
      if (!res.ok || json.error) throw new Error(json.error ?? "Check-out failed");
      setCheckoutResult(json.data!);
      setCOPhase("celebration");
    } catch (err) {
      setCOError(err instanceof Error ? err.message : "Check-out failed");
    } finally {
      setCOLoading(false);
    }
  }

  function resetAll() {
    setMode("checkin");
    setShowQR(false);
    setCIPhase("scan");
    setCIProfile(null);
    setCISessionId(null);
    setCIError(null);
    setCOPhase("scan");
    setCOProfile(null);
    setCOSessionId(null);
    setCOError(null);
    setSelectedLands([]);
    setCheckoutResult(null);
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  // ── UI ──────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-dark)", paddingBottom: "4rem" }}>
      {/* Top bar */}
      <div
        style={{
          background: "var(--color-ws-blue)",
          padding: "1rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "0.65rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.65)",
            }}
          >
            Staff Portal
          </div>
          <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>
            The Sphere — Check In / Check Out
          </div>
        </div>
        <button
          onClick={resetAll}
          style={{
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 8,
            color: "#fff",
            padding: "0.4rem 0.8rem",
            cursor: "pointer",
            fontSize: "0.8rem",
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
          }}
        >
          <RefreshCw size={13} />
          Reset
        </button>
      </div>

      {/* Mode tabs */}
      <div
        style={{
          display: "flex",
          padding: "1.25rem 1.5rem 0",
          gap: "0.75rem",
          maxWidth: 600,
          margin: "0 auto",
        }}
      >
        {(["checkin", "checkout"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setShowQR(false); }}
            style={{
              flex: 1,
              padding: "0.75rem",
              borderRadius: 12,
              border: `2px solid ${mode === m ? "var(--color-sphere-coral)" : "rgba(255,255,255,0.1)"}`,
              background: mode === m ? "rgba(255,107,71,0.15)" : "transparent",
              color: mode === m ? "var(--color-sphere-coral)" : "var(--color-text-muted)",
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: "pointer",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.4rem",
              transition: "all 0.18s ease",
            }}
          >
            {m === "checkin" ? <LogIn size={16} /> : <LogOut size={16} />}
            {m === "checkin" ? "Check In" : "Check Out"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "1.25rem 1rem 0" }}>
        <AnimatePresence mode="wait">
          {mode === "checkin" && (
            <motion.div
              key="checkin"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {ciPhase === "scan" && (
                <ScanCard
                  mode="checkin"
                  showQR={showQR}
                  onToggleQR={() => setShowQR(!showQR)}
                  onNFCScan={handleCheckinScan}
                  onQRScan={handleCheckinScan}
                  loading={ciLoading}
                  error={ciError}
                />
              )}
              {ciPhase === "profile" && ciProfile && (
                <div>
                  <ProfileCard profile={ciProfile} />
                  {ciError && <ErrorBanner message={ciError} />}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={confirmCheckIn}
                    disabled={ciLoading}
                    style={{
                      ...primaryBtnStyle,
                      background: ciLoading ? "rgba(255,107,71,0.4)" : "var(--color-sphere-coral)",
                      marginTop: "1.25rem",
                      width: "100%",
                    }}
                  >
                    <LogIn size={18} />
                    {ciLoading ? "Checking In..." : "Confirm Check In"}
                  </motion.button>
                </div>
              )}
              {ciPhase === "confirmed" && ciProfile && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 250, damping: 22 }}
                  style={{
                    textAlign: "center",
                    background: "rgba(34,197,94,0.08)",
                    border: "1.5px solid rgba(34,197,94,0.3)",
                    borderRadius: 20,
                    padding: "2.5rem 2rem",
                  }}
                >
                  <CheckCircle size={56} color="#22c55e" style={{ marginBottom: "0.75rem" }} />
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#4ade80", margin: "0 0 0.25rem" }}>
                    Session Started!
                  </h2>
                  <p style={{ color: "var(--color-text-muted)", margin: "0 0 0.75rem" }}>
                    Welcome back, <strong style={{ color: "var(--color-surface)" }}>{ciProfile.name}</strong>
                  </p>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      background: "rgba(255,255,255,0.06)",
                      borderRadius: 8,
                      padding: "0.4rem 0.9rem",
                      fontSize: "0.85rem",
                      color: "var(--color-text-light)",
                    }}
                  >
                    <Timer size={14} />
                    Timer running
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {mode === "checkout" && (
            <motion.div
              key="checkout"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {coPhase === "scan" && (
                <ScanCard
                  mode="checkout"
                  showQR={showQR}
                  onToggleQR={() => setShowQR(!showQR)}
                  onNFCScan={handleCheckoutScan}
                  onQRScan={handleCheckoutScan}
                  loading={coLoading}
                  error={coError}
                />
              )}

              {coPhase === "profile" && coProfile && (
                <div>
                  <ProfileCard profile={coProfile} />
                  {coError && <ErrorBanner message={coError} />}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setCOPhase("lands")}
                    style={{ ...primaryBtnStyle, marginTop: "1.25rem", width: "100%" }}
                  >
                    <LogOut size={18} />
                    Select Lands Visited
                  </motion.button>
                </div>
              )}

              {coPhase === "lands" && coProfile && (
                <div>
                  <h3
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: "var(--color-text-light)",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      marginBottom: "1rem",
                    }}
                  >
                    Which lands did they visit?
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                    {LANDS.map((land) => {
                      const sel = selectedLands.find((l) => l.landId === land.id);
                      return (
                        <div
                          key={land.id}
                          style={{
                            borderRadius: 12,
                            border: `1.5px solid ${sel ? land.theme_color + "80" : "rgba(255,255,255,0.08)"}`,
                            background: sel ? land.theme_color + "12" : "rgba(255,255,255,0.03)",
                            padding: "0.75rem 1rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={!!sel}
                            onChange={() => toggleLand(land.id)}
                            style={{ width: 18, height: 18, cursor: "pointer", accentColor: land.theme_color }}
                          />
                          <span style={{ fontSize: "1.2rem" }}>{land.icon_emoji}</span>
                          <span
                            style={{
                              flex: 1,
                              fontSize: "0.9rem",
                              fontWeight: 600,
                              color: sel ? "var(--color-surface)" : "var(--color-text-muted)",
                            }}
                          >
                            {land.name}
                          </span>
                          {sel && (
                            <select
                              value={sel.hours}
                              onChange={(e) => setHours(land.id, Number(e.target.value))}
                              style={{
                                background: "rgba(255,255,255,0.08)",
                                border: "1px solid rgba(255,255,255,0.15)",
                                borderRadius: 8,
                                color: "var(--color-surface)",
                                padding: "0.3rem 0.5rem",
                                fontSize: "0.85rem",
                                cursor: "pointer",
                              }}
                            >
                              {[1, 2, 3, 4, 5].map((h) => (
                                <option key={h} value={h}>
                                  {h}h
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {coError && <ErrorBanner message={coError} />}

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={confirmCheckOut}
                    disabled={coLoading || selectedLands.length === 0}
                    style={{
                      ...primaryBtnStyle,
                      background:
                        coLoading || selectedLands.length === 0
                          ? "rgba(212,168,67,0.3)"
                          : "linear-gradient(135deg, var(--color-sphere-gold), var(--color-sphere-coral))",
                      marginTop: "1.5rem",
                      width: "100%",
                    }}
                  >
                    <Star size={18} />
                    {coLoading
                      ? "Calculating Points..."
                      : `Check Out & Calculate Points${selectedLands.length > 0 ? ` (${selectedLands.length} land${selectedLands.length > 1 ? "s" : ""})` : ""}`}
                  </motion.button>
                </div>
              )}

              {coPhase === "celebration" && checkoutResult && coProfile && (
                <CelebrationScreen
                  profile={coProfile}
                  result={checkoutResult}
                  copied={copied}
                  onCopy={copyCode}
                  onReset={resetAll}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function ScanCard({
  mode, showQR, onToggleQR, onNFCScan, onQRScan, loading, error,
}: {
  mode: Mode;
  showQR: boolean;
  onToggleQR: () => void;
  onNFCScan: (id: string) => void;
  onQRScan: (id: string) => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        overflow: "hidden",
      }}
    >
      {!showQR ? (
        <NFCScanner
          mode={mode}
          onScan={onNFCScan}
          onQRFallback={onToggleQR}
        />
      ) : (
        <div style={{ padding: "1.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "1rem" }}>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", margin: 0 }}>
              Point the camera at the QR code on the wristband
            </p>
          </div>
          <QrScanner onScan={onQRScan} />
          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <button
              onClick={onToggleQR}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-text-muted)",
                fontSize: "0.82rem",
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              }}
            >
              Use NFC instead
            </button>
          </div>
        </div>
      )}
      {loading && (
        <div
          style={{
            textAlign: "center",
            padding: "0.75rem",
            color: "var(--color-sphere-coral)",
            fontSize: "0.875rem",
          }}
        >
          Loading profile...
        </div>
      )}
      {error && <ErrorBanner message={error} />}
    </div>
  );
}

function ProfileCard({ profile }: { profile: Profile }) {
  const initials = generateInitials(profile.name);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1.5px solid rgba(255,107,71,0.3)",
        borderRadius: 20,
        padding: "1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "1.25rem",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "linear-gradient(135deg, var(--color-sphere-coral), var(--color-sphere-gold))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.4rem",
          fontWeight: 800,
          color: "#fff",
          flexShrink: 0,
        }}
      >
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "1.2rem",
            fontWeight: 800,
            color: "var(--color-surface)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {profile.name}
        </div>
        <div
          style={{
            display: "flex",
            gap: "1rem",
            marginTop: "0.35rem",
            flexWrap: "wrap",
          }}
        >
          <Stat label="Points" value={formatPoints(profile.total_points)} color="var(--color-sphere-coral)" />
          <Stat label="Visits" value={String(profile.visit_count)} color="var(--color-sphere-gold)" />
          <Stat
            label="Streak"
            value={profile.current_streak > 0 ? `${profile.current_streak} day${profile.current_streak > 1 ? "s" : ""}` : "—"}
            color="var(--color-ws-green)"
          />
        </div>
      </div>
    </motion.div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div style={{ fontSize: "0.9rem", fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: "0.65rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        background: "rgba(239,68,68,0.1)",
        border: "1px solid rgba(239,68,68,0.3)",
        borderRadius: 10,
        padding: "0.7rem 1rem",
        color: "#f87171",
        fontSize: "0.875rem",
        marginTop: "0.75rem",
      }}
    >
      {message}
    </div>
  );
}

function CelebrationScreen({
  profile,
  result,
  copied,
  onCopy,
  onReset,
}: {
  profile: Profile;
  result: CheckoutResult;
  copied: string | null;
  onCopy: (code: string) => void;
  onReset: () => void;
}) {
  // Floating orb colors
  const orbs = [
    { color: "#FF6B47", top: "8%",  left: "4%",  size: 80,  delay: "0s"    },
    { color: "#D4A843", top: "6%",  right: "6%", size: 56,  delay: "0.5s"  },
    { color: "#74a832", top: "40%", left: "2%",  size: 44,  delay: "0.8s"  },
    { color: "#4FC3F7", top: "50%", right: "3%", size: 64,  delay: "0.3s"  },
    { color: "#9B59B6", bottom: "15%", left: "8%", size: 48, delay: "1.1s" },
    { color: "#E91E63", bottom: "10%", right: "5%", size: 40, delay: "0.7s"},
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        position: "relative",
        background: "var(--color-dark)",
        borderRadius: 20,
        overflow: "hidden",
        padding: "2.5rem 1.75rem",
        textAlign: "center",
        border: "1.5px solid rgba(212,168,67,0.25)",
      }}
    >
      {/* Floating orbs */}
      {orbs.map((orb, i) => (
        <div
          key={i}
          className="animate-float"
          style={{
            position: "absolute",
            width: orb.size,
            height: orb.size,
            borderRadius: "50%",
            background: orb.color,
            opacity: 0.12,
            top: orb.top,
            bottom: (orb as { bottom?: string }).bottom,
            left: (orb as { left?: string }).left,
            right: (orb as { right?: string }).right,
            animationDelay: orb.delay,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      ))}

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Heading */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "0.25rem" }}>🎉</div>
          <h2
            style={{
              fontSize: "clamp(1.6rem, 5vw, 2.2rem)",
              fontWeight: 900,
              background: "linear-gradient(135deg, var(--color-sphere-coral), var(--color-sphere-gold))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              margin: "0 0 0.25rem",
            }}
          >
            Session Complete!
          </h2>
          <p style={{ color: "var(--color-text-muted)", margin: "0 0 2rem", fontSize: "0.95rem" }}>
            Great session, {profile.name}
          </p>
        </motion.div>

        {/* Points display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{
            background: "rgba(255,107,71,0.08)",
            border: "1.5px solid rgba(255,107,71,0.25)",
            borderRadius: 16,
            padding: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <PointsDisplay value={result.points_earned} label="Points Earned" size="lg" />
        </motion.div>

        {/* New badges */}
        {result.new_badges && result.new_badges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{ marginBottom: "1.5rem" }}
          >
            <h3
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--color-sphere-gold)",
                marginBottom: "0.875rem",
              }}
            >
              {result.new_badges.length === 1 ? "New Badge Unlocked!" : `${result.new_badges.length} Badges Unlocked!`}
            </h3>
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              {result.new_badges.map((badge) => (
                <BadgeDisplay
                  key={badge.id}
                  badge={badge}
                  earned
                  animated
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Discount codes */}
        {result.discount_codes && result.discount_codes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            style={{ marginBottom: "1.75rem" }}
          >
            <h3
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--color-ws-green)",
                marginBottom: "0.875rem",
              }}
            >
              Discount Codes Earned
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {result.discount_codes.map((dc) => (
                <div
                  key={dc.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    background: "rgba(116,168,50,0.08)",
                    border: "1.5px solid rgba(116,168,50,0.25)",
                    borderRadius: 12,
                    padding: "0.75rem 1rem",
                  }}
                >
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "1rem",
                        fontWeight: 800,
                        color: "#4ade80",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {dc.code}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 2 }}>
                      {dc.discount_percent}% off — expires{" "}
                      {new Date(dc.valid_until).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                  <button
                    onClick={() => onCopy(dc.code)}
                    style={{
                      padding: "0.4rem 0.75rem",
                      borderRadius: 8,
                      background:
                        copied === dc.code ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.07)",
                      border: `1px solid ${copied === dc.code ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.12)"}`,
                      color: copied === dc.code ? "#4ade80" : "var(--color-text-light)",
                      cursor: "pointer",
                      fontSize: "0.78rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      transition: "all 0.15s ease",
                      flexShrink: 0,
                    }}
                  >
                    <Copy size={12} />
                    {copied === dc.code ? "Copied!" : "Copy"}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Reset button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onReset}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{
            ...primaryBtnStyle,
            background: "transparent",
            border: "1.5px solid rgba(255,107,71,0.4)",
            color: "var(--color-sphere-coral)",
            width: "100%",
          }}
        >
          <RefreshCw size={16} />
          Start New Session
        </motion.button>
      </div>
    </motion.div>
  );
}

const primaryBtnStyle: React.CSSProperties = {
  padding: "0.9rem 1.5rem",
  borderRadius: 12,
  background: "var(--color-sphere-coral)",
  border: "none",
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.95rem",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.5rem",
  letterSpacing: "0.04em",
  transition: "opacity 0.15s ease",
};
