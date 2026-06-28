"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Map, List } from "lucide-react";
import FestivalMap from "@/components/lands/festival-map";
import { LANDS } from "@/lib/constants";
import { getEgyptDateString } from "@/lib/dates";

type FilterKey = "all" | "open" | "young" | "older";
type Land = typeof LANDS[number];

const FILTERS: { key: FilterKey; label: string; icon: string }[] = [
  { key: "all",   label: "All Lands",  icon: "🗺" },
  { key: "open",  label: "Open Today", icon: "✅" },
  { key: "young", label: "Ages 4–8",   icon: "🌱" },
  { key: "older", label: "Ages 8+",    icon: "🚀" },
];

function isOpenToday(land: Land, openLandIds: string[] | null) {
  return openLandIds ? openLandIds.includes(land.id) : land.is_active;
}

function filterLands(filter: FilterKey, openLandIds: string[] | null) {
  return LANDS.filter((l) => {
    if (filter === "open")  return isOpenToday(l, openLandIds);
    if (filter === "young") return l.age_min <= 8;
    if (filter === "older") return l.age_max >= 8;
    return true;
  });
}

function LandListView({ filter, openLandIds }: { filter: FilterKey; openLandIds: string[] | null }) {
  const lands = filterLands(filter, openLandIds);
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
      gap: "0.875rem",
    }}>
      {lands.map((land) => (
        <Link key={land.id} href={`/lands/${land.slug}`} style={{ textDecoration: "none" }}>
          <div
            style={{
              background: `linear-gradient(135deg, ${land.theme_color}28 0%, ${land.theme_color}14 100%)`,
              border: `2px solid ${isOpenToday(land, openLandIds) ? land.theme_color + "55" : "rgba(148,163,184,0.22)"}`,
              borderRadius: 20,
              padding: "1.25rem 1rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.5rem",
              textAlign: "center",
              minHeight: 130,
              justifyContent: "center",
              boxShadow: `0 4px 20px ${land.theme_color}20`,
              cursor: "pointer",
              opacity: isOpenToday(land, openLandIds) ? 1 : 0.55,
              WebkitTapHighlightColor: "transparent",
              transition: "transform 0.15s",
            }}
            onTouchStart={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "scale(0.96)"; }}
            onTouchEnd={(e)   => { (e.currentTarget as HTMLDivElement).style.transform = "scale(1)"; }}
          >
            <div style={{ fontSize: "2.25rem", lineHeight: 1 }}>{land.icon_emoji}</div>
            <div style={{ fontWeight: 800, fontSize: "0.88rem", color: land.theme_color, lineHeight: 1.2 }}>
              {land.name}
            </div>
            <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>
              Ages {land.age_min}–{land.age_max}
            </div>
            <div style={{
              fontSize: "0.68rem",
              background: isOpenToday(land, openLandIds) ? `${land.theme_color}22` : "rgba(148,163,184,0.12)",
              color: isOpenToday(land, openLandIds) ? land.theme_color : "rgba(255,255,255,0.45)",
              padding: "2px 8px",
              borderRadius: 20,
              fontWeight: 700,
              border: `1px solid ${isOpenToday(land, openLandIds) ? land.theme_color + "40" : "rgba(148,163,184,0.16)"}`,
            }}>
              {isOpenToday(land, openLandIds) ? `${land.stations.length} activities` : "Closed today"}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function LandsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [view, setView]   = useState<"list" | "map">("list");
  const [mounted, setMounted] = useState(false);
  const [openLandIds, setOpenLandIds] = useState<string[] | null>(null);

  useEffect(() => {
    // Default to map on desktop, list on mobile
    if (window.innerWidth >= 640) setView("map");
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadSchedule() {
      try {
        const res = await fetch(`/api/schedule?date=${getEgyptDateString()}`);
        const json = await res.json() as { lands?: { land_id: string; is_open: boolean }[] };
        if (res.ok && json.lands) {
          setOpenLandIds(json.lands.filter((item) => item.is_open).map((item) => item.land_id));
        }
      } catch {
        setOpenLandIds(null);
      }
    }
    loadSchedule();
  }, []);

  return (
    <div className="min-h-screen theme-dark" style={{ background: "var(--color-dark)" }}>
      {/* Back nav */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <Link href="/"
          className="inline-flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
          style={{ color: "var(--color-text-muted)" }}>
          <ArrowLeft size={16} />
          Back to The Sphere
        </Link>
      </div>

      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 pt-10 pb-6 text-center">
        <h1
          className="text-4xl sm:text-5xl md:text-6xl font-black mb-3 mx-auto"
          style={{
            color: "var(--color-sphere-coral)",
            animation: "slideUp 0.5s ease forwards",
            lineHeight: 1.02,
            maxWidth: "720px",
          }}
        >
          Explore The Sphere
        </h1>

        <p
          className="text-base sm:text-lg md:text-xl mb-2 mx-auto"
          style={{
            color: "var(--color-sphere-gold)",
            animation: "slideUp 0.5s ease 0.12s forwards",
            maxWidth: "620px",
            lineHeight: 1.45,
          }}
        >
          11 Worlds of Adventure — Where will you go first?
        </p>

        <div
          className="h-1 rounded-full mx-auto mt-4"
          style={{ background: "var(--color-sphere-coral)", width: "120px" }}
        />
      </div>

      {/* Filter bar + view toggle */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <div className="flex flex-wrap justify-center gap-3 mb-3">
          {FILTERS.map((f) => {
            const isActive = activeFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-sm font-semibold transition-all tap-target"
                style={isActive
                  ? {
                      background: "var(--color-sphere-coral)",
                      color: "#fff",
                      boxShadow: "0 4px 20px rgba(255,107,71,0.5)",
                      border: "2px solid rgba(255,255,255,0.25)",
                    }
                  : {
                      background: "rgba(255,255,255,0.07)",
                      color: "var(--color-text-muted)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }
                }
              >
                <span>{f.icon}</span>
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Map / List toggle */}
        {mounted && (
          <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
            <button
              onClick={() => setView("list")}
              className="tap-target"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "0.5rem 1.1rem", borderRadius: 9999,
                border: "none", fontSize: "0.8rem", fontWeight: 700,
                cursor: "pointer",
                background: view === "list" ? "rgba(255,255,255,0.15)" : "transparent",
                color: view === "list" ? "white" : "rgba(255,255,255,0.35)",
                transition: "all 0.2s",
              }}
            >
              <List size={15} /> List
            </button>
            <button
              onClick={() => setView("map")}
              className="tap-target"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "0.5rem 1.1rem", borderRadius: 9999,
                border: "none", fontSize: "0.8rem", fontWeight: 700,
                cursor: "pointer",
                background: view === "map" ? "rgba(255,255,255,0.15)" : "transparent",
                color: view === "map" ? "white" : "rgba(255,255,255,0.35)",
                transition: "all 0.2s",
              }}
            >
              <Map size={15} /> Map
            </button>
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        {!mounted || view === "list" ? (
          <LandListView filter={activeFilter} openLandIds={openLandIds} />
        ) : (
          <>
            <div style={{
              borderRadius: "24px",
              overflow: "hidden",
              boxShadow: "0 24px 80px rgba(0,0,0,0.5), 0 8px 32px rgba(0,0,0,0.3)",
              border: "2px solid rgba(255,255,255,0.08)",
            }}>
              <FestivalMap activeFilter={activeFilter} forceMap showViewToggle={false} openLandIds={openLandIds} />
            </div>
            <p className="text-center mt-4 text-sm" style={{ color: "var(--color-text-muted)" }}>
              Live land map
            </p>
          </>
        )}
      </div>
    </div>
  );
}
