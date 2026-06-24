"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import FestivalMap from "@/components/lands/festival-map";
import { LANDS } from "@/lib/constants";

function MobileLandGrid() {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "0.75rem",
      padding: "0.25rem",
    }}>
      {LANDS.map((land) => (
        <Link
          key={land.id}
          href={`/lands/${land.slug}`}
          style={{ textDecoration: "none" }}
        >
          <div style={{
            background: `linear-gradient(135deg, ${land.theme_color}22 0%, ${land.theme_color}12 100%)`,
            border: `2px solid ${land.theme_color}50`,
            borderRadius: 20,
            padding: "1rem 0.75rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.4rem",
            textAlign: "center",
            minHeight: 110,
            justifyContent: "center",
            boxShadow: `0 4px 16px ${land.theme_color}20`,
            transition: "transform 0.15s, box-shadow 0.15s",
            WebkitTapHighlightColor: "transparent",
            cursor: "pointer",
          }}
          onTouchStart={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = "scale(0.96)";
          }}
          onTouchEnd={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
          }}
          >
            <div style={{ fontSize: "2rem", lineHeight: 1 }}>{land.icon_emoji}</div>
            <div style={{
              fontWeight: 800,
              fontSize: "0.82rem",
              color: land.theme_color,
              lineHeight: 1.2,
            }}>
              {land.name}
            </div>
            <div style={{
              fontSize: "0.68rem",
              color: "rgba(26,26,46,0.5)",
              fontWeight: 600,
            }}>
              Ages {land.age_min}–{land.age_max} · {land.stations.length} activities
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function LandsOrbit() {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    setMounted(true);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!mounted) return null;

  if (isMobile) return <MobileLandGrid />;

  return (
    <div style={{
      borderRadius: 28, overflow: "hidden",
      border: "2px solid rgba(212,168,67,0.2)",
      boxShadow: "0 12px 48px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)",
    }}>
      <FestivalMap activeFilter="all" compact />
    </div>
  );
}
