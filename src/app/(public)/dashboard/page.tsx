"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, useMotionValue, animate } from "framer-motion";
import {
  Zap, Trophy, MapPin, Flame, Tag, Crown, Medal,
  ChevronDown, ChevronUp, Map, User, LogOut, Copy, CalendarCheck,
} from "lucide-react";
import type { LeaderboardEntry } from "@/lib/types";
import { generateInitials, getRankColor } from "@/lib/utils";

interface DashboardProfile {
  id: string;
  name: string;
  total_points: number;
  season_points: number;
  visit_count: number;
  current_streak: number;
  lands_visited: string[];
}

interface Offer {
  icon: string;
  title: string;
  description: string;
  color: string;
}

interface DiscountCode {
  id: string;
  code: string;
  discount_percent: number;
  discount_type: string;
  valid_until: string;
}

interface DailyOffers {
  discount_codes: DiscountCode[];
  bonuses: Offer[];
  ceremony: { date: string; status: string; label: string } | null;
}

interface LandBooking {
  id: string;
  land_id: string;
  booking_date: string;
  status: "booked" | "started" | "completed" | "cancelled";
  land: {
    id: string;
    name: string;
    slug: string;
    theme_color: string;
    icon_emoji: string;
  } | null;
}

const MILESTONES = [100, 250, 500, 1000, 2500, 5000];
function nextMilestone(pts: number) { return MILESTONES.find(m => m > pts) ?? MILESTONES[MILESTONES.length - 1]; }
function prevMilestone(pts: number) { const i = MILESTONES.findIndex(m => m > pts); return i <= 0 ? 0 : MILESTONES[i - 1]; }

function AnimatedCounter({ value, style }: { value: number; style?: React.CSSProperties }) {
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(0);
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const c = animate(mv, value, { duration: 1.8, ease: "easeOut", onUpdate: v => setDisplay(Math.round(v)) });
    return () => c.stop();
  }, [value, mv]);
  return <span style={style}>{display.toLocaleString()}</span>;
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown size={18} color="var(--color-rank-gold)" />;
  if (rank === 2) return <Medal size={16} color="var(--color-rank-silver)" />;
  if (rank === 3) return <Medal size={16} color="var(--color-rank-bronze)" />;
  return null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [profile, setProfile] = useState<DashboardProfile | null>(null);
  const [offers, setOffers] = useState<DailyOffers | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [bookings, setBookings] = useState<LandBooking[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [lbExpanded, setLbExpanded] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = sessionStorage.getItem("sphere_profile_id");
    if (!stored) {
      router.replace("/login");
      return;
    }
    setProfileId(stored);
  }, [router]);

  useEffect(() => {
    if (!profileId) return;
    async function load() {
      try {
        const [profileRes, offersRes, lbRes, bookingsRes] = await Promise.all([
          fetch(`/api/profiles/${profileId}`),
          fetch(`/api/offers/today?profile_id=${profileId}`),
          fetch("/api/leaderboard?type=season"),
          fetch(`/api/bookings?profile_id=${profileId}`),
        ]);
        const [profileJson, offersJson, lbJson, bookingsJson] = await Promise.all([
          profileRes.json() as Promise<{ data?: { profile: DashboardProfile } }>,
          offersRes.json() as Promise<{ data?: DailyOffers }>,
          lbRes.json() as Promise<{ data?: LeaderboardEntry[] }>,
          bookingsRes.json() as Promise<{ data?: LandBooking[] }>,
        ]);
        if (profileJson.data?.profile) setProfile(profileJson.data.profile);
        if (offersJson.data) setOffers(offersJson.data);
        if (bookingsJson.data) setBookings(bookingsJson.data);
        if (lbJson.data) {
          setLeaderboard(lbJson.data);
          const myEntry = lbJson.data.find(e => e.profile_id === profileId);
          if (myEntry) setMyRank(myEntry.rank);
        }
      } catch {
        // silent — show whatever loaded
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [profileId]);

  function logout() {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("sphere_profile_id");
      sessionStorage.removeItem("sphere_profile_name");
    }
    router.push("/login");
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  if (loading) return <LoadingScreen />;

  const pts = profile?.total_points ?? 0;
  const next = nextMilestone(pts);
  const prev = prevMilestone(pts);
  const pct = Math.min(100, ((pts - prev) / (next - prev)) * 100);
  const landsCount = profile?.lands_visited?.length ?? 0;
  const visibleLb = lbExpanded ? leaderboard : leaderboard.slice(0, 5);
  const myLbEntry = leaderboard.find(e => e.profile_id === profileId);
  const myInTop = myRank !== null && myRank <= 10;
  const bookingLabels: Record<LandBooking["status"], string> = {
    booked: "Booked",
    started: "Playing",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  const bookingColors: Record<LandBooking["status"], string> = {
    booked: "var(--color-sphere-gold)",
    started: "var(--color-ws-blue)",
    completed: "var(--color-ws-green)",
    cancelled: "rgba(148,163,184,0.8)",
  };

  return (
    <div
      className="theme-dark"
      style={{
        minHeight: "100vh",
        background: `radial-gradient(ellipse at top, rgba(255,107,71,0.1) 0%, var(--color-dark) 50%)`,
        paddingBottom: "5rem",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "1.5rem 1.25rem 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: 680,
          margin: "0 auto",
        }}
      >
        <Link href="/" style={{ textDecoration: "none" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--color-sphere-coral)" }}>
            ← The Sphere
          </div>
        </Link>
        <button
          onClick={logout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            color: "rgba(255,255,255,0.72)",
            padding: "0.35rem 0.75rem",
            fontSize: "0.78rem",
            cursor: "pointer",
          }}
        >
          <LogOut size={13} />
          Log out
        </button>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 1.25rem" }}>
        {/* Hero greeting */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", padding: "2.5rem 0 1.5rem" }}
        >
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.1 }}
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--color-sphere-coral), var(--color-sphere-gold))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2.2rem",
              fontWeight: 900,
              color: "#fff",
              margin: "0 auto 1rem",
              boxShadow: "0 0 48px rgba(255,107,71,0.4), 0 0 80px rgba(212,168,67,0.15)",
            }}
          >
            {profile ? generateInitials(profile.name) : "?"}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.72)", marginBottom: "0.25rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Welcome back
            </p>
            <h1 style={{ fontSize: "clamp(1.8rem, 6vw, 2.4rem)", fontWeight: 900, color: "white", margin: "0 0 0.5rem", lineHeight: 1.1 }}>
              {profile?.name ?? "Explorer"}!
            </h1>
            {myRank && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  background: "rgba(212,168,67,0.1)",
                  border: "1.5px solid rgba(212,168,67,0.3)",
                  borderRadius: 999,
                  padding: "0.3rem 0.9rem",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "var(--color-sphere-gold)",
                }}
              >
                <Trophy size={13} />
                You&apos;re #{myRank} this season
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Points hero card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{
            background: "linear-gradient(135deg, rgba(255,107,71,0.15) 0%, rgba(212,168,67,0.1) 100%)",
            border: "1px solid rgba(255,107,71,0.25)",
            borderRadius: 24,
            padding: "1.75rem",
            marginBottom: "1rem",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Glow */}
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse at top center, rgba(255,107,71,0.08) 0%, transparent 60%)",
            pointerEvents: "none",
          }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", marginBottom: "0.25rem" }}>
              <Zap size={16} color="var(--color-sphere-coral)" />
              <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-sphere-coral)" }}>
                Total Points
              </span>
            </div>
            <div style={{ fontSize: "clamp(3rem, 12vw, 5rem)", fontWeight: 900, lineHeight: 1, color: "white", margin: "0.25rem 0" }}>
              <AnimatedCounter value={pts} />
            </div>
            <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "0.82rem" }}>
              {(next - pts).toLocaleString()} more pts to reach {next.toLocaleString()}
            </p>
            {/* Progress bar */}
            <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.08)", marginTop: "1rem", overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ delay: 0.6, duration: 1.2, ease: "easeOut" }}
                style={{
                  height: "100%",
                  borderRadius: 999,
                  background: "linear-gradient(90deg, var(--color-sphere-coral), var(--color-sphere-gold))",
                  boxShadow: "0 0 8px rgba(255,107,71,0.5)",
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.625rem", marginBottom: "1.5rem" }}
        >
          {[
            { label: "Visits",  value: String(profile?.visit_count ?? 0),  icon: <MapPin size={15} />,  color: "var(--color-sphere-gold)" },
            { label: "Lands",   value: `${landsCount}/11`,                   icon: <Map size={15} />,     color: "var(--color-ws-blue)" },
            { label: "Streak",  value: profile?.current_streak ? `${profile.current_streak}🔥` : "—",
              icon: <Flame size={15} />, color: "var(--color-ws-green)" },
          ].map(stat => (
            <div
              key={stat.label}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${stat.color}30`,
                borderRadius: 16,
                padding: "1rem 0.75rem",
                textAlign: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem", color: stat.color, marginBottom: "0.35rem" }}>
                {stat.icon}
                <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>{stat.label}</span>
              </div>
              <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "white" }}>{stat.value}</div>
            </div>
          ))}
        </motion.div>

        {/* Special offers for today */}
        {offers && (offers.bonuses.length > 0 || offers.discount_codes.length > 0 || offers.ceremony) && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
            style={{ marginBottom: "1.5rem" }}
          >
            <SectionLabel icon={<Tag size={13} />} label="Today's Special Offers" />

            {/* Ceremony banner */}
            {offers.ceremony && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  background: "linear-gradient(135deg, rgba(212,168,67,0.18) 0%, rgba(255,107,71,0.1) 100%)",
                  border: "1.5px solid rgba(212,168,67,0.4)",
                  borderRadius: 16,
                  padding: "1rem 1.25rem",
                  marginBottom: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <span style={{ fontSize: "1.75rem" }}>🎪</span>
                <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-sphere-gold)", margin: 0 }}>
                  {offers.ceremony.label}
                </p>
              </motion.div>
            )}

            {/* Discount codes */}
            {offers.discount_codes.map(dc => (
              <div
                key={dc.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  background: "rgba(116,168,50,0.08)",
                  border: "1.5px solid rgba(116,168,50,0.25)",
                  borderRadius: 14,
                  padding: "0.875rem 1rem",
                  marginBottom: "0.625rem",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "monospace", fontSize: "1rem", fontWeight: 800, color: "#4ade80", letterSpacing: "0.07em" }}>
                    {dc.code}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.72)", marginTop: 2 }}>
                    {dc.discount_percent}% off · valid until{" "}
                    {new Date(dc.valid_until).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </div>
                <button
                  onClick={() => copyCode(dc.code)}
                  style={{
                    padding: "0.4rem 0.75rem",
                    borderRadius: 8,
                    background: copiedCode === dc.code ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.07)",
                    border: `1px solid ${copiedCode === dc.code ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.12)"}`,
                    color: copiedCode === dc.code ? "#4ade80" : "rgba(255,255,255,0.82)",
                    cursor: "pointer",
                    fontSize: "0.78rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    flexShrink: 0,
                  }}
                >
                  <Copy size={12} />
                  {copiedCode === dc.code ? "Copied!" : "Copy"}
                </button>
              </div>
            ))}

            {/* Bonus offers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.625rem" }}>
              {offers.bonuses.map((bonus, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  style={{
                    background: `${bonus.color}12`,
                    border: `1px solid ${bonus.color}30`,
                    borderRadius: 14,
                    padding: "0.875rem 1rem",
                    display: "flex",
                    gap: "0.75rem",
                    alignItems: "flex-start",
                  }}
                >
                  <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>{bonus.icon}</span>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: bonus.color, marginBottom: "0.2rem" }}>
                      {bonus.title}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.74)", lineHeight: 1.45 }}>
                      {bonus.description}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {bookings.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.41 }}
            style={{ marginBottom: "1.5rem" }}
          >
            <SectionLabel icon={<CalendarCheck size={13} />} label="Booked Lands Today" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.625rem" }}>
              {bookings.map((booking) => {
                const color = booking.land?.theme_color ?? "var(--color-sphere-coral)";
                return (
                  <Link
                    key={booking.id}
                    href={booking.land ? `/lands/${booking.land.slug}` : "/lands"}
                    style={{
                      textDecoration: "none",
                      background: `${color}12`,
                      border: `1px solid ${color}35`,
                      borderRadius: 14,
                      padding: "0.875rem 1rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                    }}
                  >
                    <span style={{ fontSize: "1.45rem" }}>{booking.land?.icon_emoji ?? ""}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: "white", fontWeight: 800, fontSize: "0.88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {booking.land?.name ?? booking.land_id}
                      </div>
                      <div style={{ color: bookingColors[booking.status], fontSize: "0.72rem", fontWeight: 800, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {bookingLabels[booking.status]}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Leaderboard */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.44 }}
          style={{ marginBottom: "2rem" }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.875rem" }}>
            <SectionLabel icon={<Trophy size={13} />} label="Season Leaderboard" inline />
            <Link href="/leaderboard"
              style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-sphere-coral)", textDecoration: "none" }}>
              Full board →
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <AnimatePresence>
              {visibleLb.map((entry, i) => {
                const isMe = entry.profile_id === profileId;
                return (
                  <motion.div
                    key={entry.profile_id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.03 * i }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.75rem 1rem",
                      borderRadius: 12,
                      background: isMe ? "rgba(255,107,71,0.1)" : "rgba(255,255,255,0.03)",
                      border: isMe ? "1.5px solid rgba(255,107,71,0.3)" : "1px solid rgba(255,255,255,0.06)",
                      transition: "background 0.15s ease",
                    }}
                  >
                    <div style={{ width: 28, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {entry.rank <= 3 ? <RankIcon rank={entry.rank} /> : (
                        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "rgba(255,255,255,0.68)" }}>#{entry.rank}</span>
                      )}
                    </div>
                    <div
                      style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: isMe
                          ? "linear-gradient(135deg, var(--color-sphere-coral), var(--color-sphere-gold))"
                          : `linear-gradient(135deg, ${getRankColor(entry.rank)}, rgba(255,255,255,0.2))`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.8rem", fontWeight: 800, color: "#fff", flexShrink: 0,
                        opacity: isMe ? 1 : 0.75,
                      }}
                    >
                      {generateInitials(entry.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: "0.9rem", fontWeight: isMe ? 800 : 600,
                        color: isMe ? "white" : "var(--color-surface)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {entry.name}{isMe && " (You)"}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.68)", marginTop: 1 }}>
                        {entry.visit_count} visit{entry.visit_count !== 1 ? "s" : ""}
                        {entry.current_streak >= 3 && <span style={{ marginLeft: "0.3rem", color: "#fb923c" }}>🔥{entry.current_streak}</span>}
                      </div>
                    </div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 800, color: isMe ? "var(--color-sphere-coral)" : "rgba(255,255,255,0.7)", flexShrink: 0 }}>
                      {entry.total_points.toLocaleString()}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* My rank if not in visible */}
            {!myInTop && myLbEntry && !lbExpanded && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 1rem",
                  borderRadius: 12,
                  background: "rgba(255,107,71,0.1)",
                  border: "1.5px solid rgba(255,107,71,0.3)",
                }}
              >
                <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.68)", flex: 1 }}>
                  · · ·
                </span>
                <div style={{ width: 28, textAlign: "center", fontSize: "0.8rem", fontWeight: 700, color: "var(--color-sphere-coral)" }}>
                  #{myLbEntry.rank}
                </div>
                <div
                  style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--color-sphere-coral), var(--color-sphere-gold))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.8rem", fontWeight: 800, color: "#fff", flexShrink: 0,
                  }}
                >
                  {generateInitials(myLbEntry.name)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "white" }}>
                    {myLbEntry.name} (You)
                  </div>
                </div>
                <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--color-sphere-coral)" }}>
                  {myLbEntry.total_points.toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {leaderboard.length > 5 && (
            <button
              onClick={() => setLbExpanded(!lbExpanded)}
              style={{
                width: "100%",
                marginTop: "0.625rem",
                padding: "0.65rem",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "transparent",
                color: "rgba(255,255,255,0.72)",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
              }}
            >
              {lbExpanded ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Show all {leaderboard.length} players</>}
            </button>
          )}
        </motion.section>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.625rem" }}
        >
          {[
            { href: `/profile/${profileId}`, icon: <User size={18} />, label: "My Profile", color: "var(--color-sphere-coral)" },
            { href: "/lands",                icon: <Map size={18} />,  label: "All Lands",  color: "var(--color-ws-blue)" },
            { href: "/leaderboard",          icon: <Trophy size={18} />, label: "Leaderboard", color: "var(--color-sphere-gold)" },
          ].map(action => (
            <Link
              key={action.href}
              href={action.href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.5rem",
                padding: "1.1rem 0.5rem",
                borderRadius: 16,
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${action.color}25`,
                textDecoration: "none",
                color: action.color,
                transition: "background 0.15s ease",
              }}
            >
              {action.icon}
              <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {action.label}
              </span>
            </Link>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

function SectionLabel({ icon, label, inline = false }: { icon: React.ReactNode; label: string; inline?: boolean }) {
  const content = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
        fontSize: "0.68rem",
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "var(--color-text-muted)",
        marginBottom: inline ? 0 : "0.75rem",
      }}
    >
      {icon}
      {label}
    </div>
  );
  return content;
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-dark)" }}>
      <div style={{ textAlign: "center" }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          style={{
            width: 56, height: 56, borderRadius: "50%",
            border: "3px solid rgba(255,107,71,0.2)",
            borderTopColor: "var(--color-sphere-coral)",
            margin: "0 auto 1rem",
          }}
        />
        <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "0.9rem" }}>Loading your sphere...</p>
      </div>
    </div>
  );
}
