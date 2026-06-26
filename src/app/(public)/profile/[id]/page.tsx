"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { motion, useMotionValue, animate, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Copy, MapPin, Zap, Trophy } from "lucide-react";
import BadgeGrid from "@/components/badges/badge-grid";
import { generateInitials, formatPoints, getRankColor, getRankSuffix } from "@/lib/utils";
import type { Profile, ProfileBadge, DiscountCode } from "@/lib/types";

interface ProfilePageData {
  profile: Profile;
  badges: ProfileBadge[];
  discount_codes: DiscountCode[];
  rank?: number;
}

function AnimatedPointsCounter({ value }: { value: number }) {
  const motionValue = useMotionValue(0);
  const [display, setDisplay] = useState(0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    const controls = animate(motionValue, value, {
      duration: 1.8,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, motionValue]);

  return <span>{display.toLocaleString()}</span>;
}

const POINT_MILESTONES = [100, 250, 500, 1000, 2500, 5000];

function getNextMilestone(pts: number) {
  return POINT_MILESTONES.find((m) => m > pts) ?? POINT_MILESTONES[POINT_MILESTONES.length - 1];
}
function getPrevMilestone(pts: number) {
  const idx = POINT_MILESTONES.findIndex((m) => m > pts);
  return idx <= 0 ? 0 : POINT_MILESTONES[idx - 1];
}

export default function ProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const isWelcome = searchParams?.get("welcome") === "1";
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const [data, setData] = useState<ProfilePageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showWelcome, setShowWelcome] = useState(isWelcome);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const res = await fetch(`/api/profiles/${id}`);
        const json = await res.json() as { data?: ProfilePageData; error?: string };
        if (!res.ok || json.error) throw new Error(json.error ?? "Profile not found");
        setData(json.data!);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    if (!showWelcome) return;
    const timer = setTimeout(() => setShowWelcome(false), 4000);
    return () => clearTimeout(timer);
  }, [showWelcome]);

  function copyLink() {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const profileUrl = typeof window !== "undefined" ? window.location.href : "";

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? "Profile not found"} />;

  const { profile, badges, discount_codes, rank } = data;
  const earnedBadgeIds = badges.map((b) => b.badge_id);
  const initials = generateInitials(profile.name);
  const landsCount = profile.lands_visited?.length ?? 0;
  const activeCodes = discount_codes.filter((dc) => !dc.is_used);

  const nextMilestone = getNextMilestone(profile.total_points);
  const prevMilestone = getPrevMilestone(profile.total_points);
  const progressPct = Math.min(
    100,
    ((profile.total_points - prevMilestone) / (nextMilestone - prevMilestone)) * 100
  );

  return (
    <div
      className="theme-dark"
      style={{
        minHeight: "100vh",
        background: `radial-gradient(ellipse at top center, rgba(255,107,71,0.1) 0%, var(--color-dark) 50%)`,
        paddingBottom: "4rem",
      }}
    >
      {/* Welcome celebration overlay */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            key="welcome-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6 } }}
            onClick={() => setShowWelcome(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "radial-gradient(ellipse at center, rgba(255,107,71,0.92) 0%, rgba(26,26,46,0.97) 70%)",
              backdropFilter: "blur(8px)",
              cursor: "pointer",
              flexDirection: "column",
              textAlign: "center",
              padding: "2rem",
            }}
          >
            {/* Expanding rings (arch effect) */}
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0.6 }}
                animate={{ scale: 4 + i, opacity: 0 }}
                transition={{ duration: 2.5, delay: i * 0.3, ease: "easeOut", repeat: Infinity, repeatDelay: 0.5 }}
                style={{
                  position: "absolute",
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  border: `${4 - i}px solid ${i === 1 ? "#D4A843" : "#FF6B47"}`,
                  pointerEvents: "none",
                }}
              />
            ))}

            {/* Floating confetti dots */}
            {[
              { color: "#FF6B47", x: -140, y: -120, size: 14 },
              { color: "#D4A843", x: 130,  y: -90,  size: 10 },
              { color: "#74a832", x: -100, y: 110,  size: 12 },
              { color: "#4FC3F7", x: 110,  y: 130,  size: 8  },
              { color: "#E91E63", x: -60,  y: 160,  size: 10 },
              { color: "#D4A843", x: 80,   y: -160, size: 8  },
            ].map((dot, i) => (
              <motion.div
                key={i}
                initial={{ y: 0, opacity: 1, scale: 0 }}
                animate={{ y: [0, -40, 0], opacity: [0, 1, 0], scale: [0, 1, 0.5] }}
                transition={{ duration: 2, delay: 0.3 + i * 0.15, repeat: Infinity, repeatDelay: 0.8 }}
                style={{
                  position: "absolute",
                  width: dot.size,
                  height: dot.size,
                  borderRadius: "50%",
                  background: dot.color,
                  left: `calc(50% + ${dot.x}px)`,
                  top: `calc(50% + ${dot.y}px)`,
                  pointerEvents: "none",
                }}
              />
            ))}

            {/* Content */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.2 }}
              style={{ position: "relative", zIndex: 1 }}
            >
              <div style={{ fontSize: "4rem", marginBottom: "0.5rem" }}>🎉</div>
              <h1
                style={{
                  fontSize: "clamp(1.8rem, 6vw, 3rem)",
                  fontWeight: 900,
                  color: "#fff",
                  margin: "0 0 0.25rem",
                  lineHeight: 1.1,
                  textShadow: "0 2px 20px rgba(0,0,0,0.4)",
                }}
              >
                Welcome to The Sphere!
              </h1>
              <p
                style={{
                  fontSize: "clamp(1.1rem, 4vw, 1.6rem)",
                  fontWeight: 800,
                  color: "rgba(255,255,255,0.9)",
                  margin: "0 0 1.5rem",
                }}
              >
                {profile.name} 🌟
              </p>

              {/* First visit info */}
              <div
                style={{
                  background: "rgba(255,255,255,0.12)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  borderRadius: 16,
                  padding: "1rem 1.5rem",
                  marginBottom: "1.5rem",
                  maxWidth: 320,
                }}
              >
                <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.9rem", margin: "0 0 0.5rem" }}>
                  Your adventure starts now ⚡
                </p>
                <p style={{ color: "#FFD700", fontWeight: 700, fontSize: "1rem", margin: 0 }}>
                  Visit a land → earn 50 pts per hour
                </p>
              </div>

              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.8rem" }}>
                Tap anywhere to continue
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Hero */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "3rem 1.5rem 2rem",
          textAlign: "center",
        }}
      >
        {/* Glow backdrop */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 50% 30%, rgba(255,107,71,0.12) 0%, transparent 65%)",
            pointerEvents: "none",
          }}
        />

        {/* Avatar circle */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--color-sphere-coral), var(--color-sphere-gold))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2.2rem",
            fontWeight: 900,
            color: "#fff",
            margin: "0 auto 1rem",
            boxShadow: "0 0 40px rgba(255,107,71,0.4), 0 0 80px rgba(212,168,67,0.2)",
            position: "relative",
            zIndex: 1,
          }}
        >
          {initials}
        </motion.div>

        {/* Name */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          style={{
            fontSize: "clamp(1.6rem, 5vw, 2.2rem)",
            fontWeight: 900,
            color: "var(--color-surface)",
            margin: "0 0 0.4rem",
          }}
        >
          {profile.name}
        </motion.h1>

        {/* Rank badge */}
        {rank && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              background: "rgba(212,168,67,0.12)",
              border: "1.5px solid rgba(212,168,67,0.35)",
              borderRadius: 999,
              padding: "0.3rem 0.9rem",
              fontSize: "0.82rem",
              fontWeight: 700,
              color: "var(--color-sphere-gold)",
              marginBottom: "1rem",
            }}
          >
            <Trophy size={13} />
            Rank #{rank}{getRankSuffix(rank)} this season
          </motion.div>
        )}

        {/* Share button */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <button
            onClick={copyLink}
            style={{
              background: copied ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.07)",
              border: `1px solid ${copied ? "rgba(34,197,94,0.35)" : "rgba(255,255,255,0.12)"}`,
              borderRadius: 8,
              color: copied ? "#4ade80" : "var(--color-text-muted)",
              padding: "0.35rem 0.85rem",
              fontSize: "0.78rem",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              transition: "all 0.15s ease",
            }}
          >
            <Copy size={12} />
            {copied ? "Link copied!" : "Share profile"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 1rem" }}>
        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.45 }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "0.75rem",
            marginBottom: "1.75rem",
          }}
        >
          <StatCard
            label="Total Points"
            value={<AnimatedPointsCounter value={profile.total_points} />}
            icon={<Zap size={18} />}
            color="var(--color-sphere-coral)"
          />
          <StatCard
            label="Total Visits"
            value={String(profile.visit_count)}
            icon={<MapPin size={18} />}
            color="var(--color-sphere-gold)"
          />
          <StatCard
            label="Lands Explored"
            value={`${landsCount} / 11`}
            icon={<span style={{ fontSize: "1.1rem" }}>🗺️</span>}
            color="var(--color-ws-blue)"
          />
          <StatCard
            label="Day Streak"
            value={
              profile.current_streak > 0 ? (
                <span>
                  {Array.from({ length: Math.min(profile.current_streak, 7) }, (_, i) => (
                    <span key={i}>🔥</span>
                  ))}
                  {profile.current_streak > 7 && ` ×${profile.current_streak}`}
                </span>
              ) : (
                "—"
              )
            }
            icon={<span style={{ fontSize: "1.1rem" }}>⚡</span>}
            color="var(--color-ws-green)"
          />
        </motion.div>

        {/* Points progress to next milestone */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.4 }}
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,107,71,0.2)",
            borderRadius: 16,
            padding: "1rem 1.25rem",
            marginBottom: "1.75rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.6rem",
            }}
          >
            <span
              style={{
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-sphere-coral)",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              <Zap size={11} />
              Next milestone
            </span>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--color-surface)" }}>
              {profile.total_points.toLocaleString()} / {nextMilestone.toLocaleString()} pts
            </span>
          </div>
          <div
            style={{
              height: 8,
              borderRadius: 999,
              background: "rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ delay: 0.5, duration: 1.2, ease: "easeOut" }}
              style={{
                height: "100%",
                borderRadius: 999,
                background: "linear-gradient(90deg, var(--color-sphere-coral), var(--color-sphere-gold))",
                boxShadow: "0 0 8px rgba(255,107,71,0.5)",
              }}
            />
          </div>
          <p style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", marginTop: "0.5rem", margin: "0.5rem 0 0" }}>
            {nextMilestone - profile.total_points} more points to reach {nextMilestone.toLocaleString()} — visit a land to earn! 🎯
          </p>
        </motion.div>

        {/* Badges section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ marginBottom: "2rem" }}
        >
          <SectionHeading>Badges</SectionHeading>
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20,
              padding: "1.5rem",
            }}
          >
            <BadgeGrid earnedBadgeIds={earnedBadgeIds} />
          </div>
        </motion.section>

        {/* Discount codes */}
        {activeCodes.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ marginBottom: "2rem" }}
          >
            <SectionHeading>Active Discount Codes</SectionHeading>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {activeCodes.map((dc) => (
                <DiscountCard key={dc.id} code={dc} />
              ))}
            </div>
          </motion.section>
        )}

        {/* QR code */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <SectionHeading>Gate QR Code</SectionHeading>
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20,
              padding: "2rem",
              textAlign: "center",
            }}
          >
            <p
              style={{
                color: "var(--color-text-muted)",
                fontSize: "0.875rem",
                marginBottom: "1.25rem",
              }}
            >
              Show this at the gate if your wristband is unavailable
            </p>
            <div
              style={{
                display: "inline-block",
                background: "#fff",
                padding: 14,
                borderRadius: 14,
                boxShadow: "0 0 30px rgba(255,107,71,0.2)",
              }}
            >
              <QRCodeSVG value={id} size={200} />
            </div>
            <p style={{ color: "rgba(148,163,184,0.5)", fontSize: "0.7rem", marginTop: "0.75rem" }}>
              Profile ID: {id.slice(0, 8)}...
            </p>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${color}30`,
        borderRadius: 16,
        padding: "1.25rem 1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.4rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color }}>
        {icon}
        <span
          style={{
            fontSize: "0.65rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
      </div>
      <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--color-surface)", lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}

function DiscountCard({ code }: { code: DiscountCode }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        background: "rgba(116,168,50,0.07)",
        border: "1.5px solid rgba(116,168,50,0.2)",
        borderRadius: 14,
        padding: "0.875rem 1rem",
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "1rem",
            fontWeight: 800,
            color: "#4ade80",
            letterSpacing: "0.07em",
          }}
        >
          {code.code}
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 2 }}>
          {code.discount_percent}% discount — valid until{" "}
          {new Date(code.valid_until).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      </div>
      <button
        onClick={copy}
        style={{
          padding: "0.4rem 0.75rem",
          borderRadius: 8,
          background: copied ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.07)",
          border: `1px solid ${copied ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.1)"}`,
          color: copied ? "#4ade80" : "var(--color-text-light)",
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
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: "0.72rem",
        fontWeight: 700,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: "var(--color-text-muted)",
        marginBottom: "0.875rem",
        paddingLeft: "0.25rem",
      }}
    >
      {children}
    </h2>
  );
}

function LoadingState() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-dark)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          className="animate-arch-pulse"
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            border: "3px solid var(--color-sphere-coral)",
            margin: "0 auto 1rem",
          }}
        />
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>Loading profile...</p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-dark)",
        padding: "2rem",
      }}
    >
      <div
        style={{
          textAlign: "center",
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.25)",
          borderRadius: 20,
          padding: "2.5rem",
          maxWidth: 360,
        }}
      >
        <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🔍</div>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#f87171", marginBottom: "0.5rem" }}>
          Profile Not Found
        </h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>{message}</p>
      </div>
    </div>
  );
}
