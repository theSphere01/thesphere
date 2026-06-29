"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import FestivalMap from "@/components/lands/festival-map";
import { LANDS } from "@/lib/constants";
import { getEgyptDateString } from "@/lib/dates";

function isOpenToday(landId: string, openLandIds: string[] | null) {
  return openLandIds ? openLandIds.includes(landId) : true;
}

function MobileLandGrid({ openLandIds }: { openLandIds: string[] | null }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "0.75rem",
        padding: "0.25rem",
      }}
    >
      {LANDS.map((land) => {
        const open = isOpenToday(land.id, openLandIds);

        return (
          <Link
            key={land.id}
            href={`/lands/${land.slug}`}
            style={{ textDecoration: "none" }}
          >
            <div
              style={{
                background: open
                  ? `linear-gradient(135deg, ${land.theme_color}22 0%, ${land.theme_color}12 100%)`
                  : "linear-gradient(135deg, rgba(100,116,139,0.14) 0%, rgba(15,23,42,0.08) 100%)",
                border: `2px solid ${open ? land.theme_color + "50" : "rgba(100,116,139,0.28)"}`,
                borderRadius: 20,
                padding: "1rem 0.75rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.4rem",
                textAlign: "center",
                minHeight: 122,
                justifyContent: "center",
                boxShadow: open ? `0 4px 16px ${land.theme_color}20` : "none",
                opacity: open ? 1 : 0.68,
                transition: "transform 0.15s, box-shadow 0.15s",
                WebkitTapHighlightColor: "transparent",
                cursor: "pointer",
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.transform = "scale(0.96)";
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <div
                style={{
                  fontSize: "2rem",
                  lineHeight: 1,
                  filter: open ? undefined : "grayscale(1)",
                }}
              >
                {land.icon_emoji}
              </div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: "0.82rem",
                  color: open ? land.theme_color : "rgba(26,26,46,0.55)",
                  lineHeight: 1.2,
                }}
              >
                {land.name}
              </div>
              <div
                style={{
                  fontSize: "0.68rem",
                  color: "rgba(26,26,46,0.5)",
                  fontWeight: 600,
                }}
              >
                Ages {land.age_min}-{land.age_max} - {land.stations.length} activities
              </div>
              <div
                style={{
                  marginTop: "0.1rem",
                  padding: "0.16rem 0.55rem",
                  borderRadius: 999,
                  fontSize: "0.58rem",
                  fontWeight: 900,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  background: open ? `${land.theme_color}22` : "rgba(100,116,139,0.16)",
                  color: open ? land.theme_color : "rgba(26,26,46,0.48)",
                  border: `1px solid ${open ? land.theme_color + "35" : "rgba(100,116,139,0.22)"}`,
                }}
              >
                {open ? "Open today" : "Closed today"}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default function LandsOrbit() {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [openLandIds, setOpenLandIds] = useState<string[] | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    setMounted(true);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/schedule?date=${getEgyptDateString()}`)
      .then((res) => res.json())
      .then((json: { lands?: { land_id: string; is_open: boolean }[] }) => {
        if (!cancelled && json.lands) {
          setOpenLandIds(json.lands.filter((item) => item.is_open).map((item) => item.land_id));
        }
      })
      .catch(() => {
        if (!cancelled) setOpenLandIds(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!mounted) return null;

  if (isMobile) return <MobileLandGrid openLandIds={openLandIds} />;

  return (
    <div
      style={{
        borderRadius: 28,
        overflow: "hidden",
        border: "2px solid rgba(212,168,67,0.2)",
        boxShadow: "0 12px 48px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)",
      }}
    >
      <FestivalMap activeFilter="all" compact openLandIds={openLandIds} />
    </div>
  );
}
