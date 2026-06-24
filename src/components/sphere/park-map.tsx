"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LANDS } from "@/lib/constants";

type Land = typeof LANDS[number];
type FilterKey = "all" | "open" | "young" | "older";

const OPEN_TODAY_IDS = LANDS.filter((l) => l.is_active).map((l) => l.id);

// ── Zone layout data ────────────────────────────────────────────────────────
// viewBox: 0 0 1400 900
// Each zone: organic blob path + label anchor + emoji anchor

interface ZoneLayout {
  slug: string;
  path: string;        // SVG d= for the top face
  shadowPath: string;  // slightly offset for 3D depth
  labelX: number;
  labelY: number;
  emojiX: number;
  emojiY: number;
}

const ZONE_LAYOUTS: ZoneLayout[] = [
  {
    slug: "art-land",
    path: "M 120,80 C 80,58 38,98 48,162 C 58,226 100,266 164,274 C 228,282 288,250 306,198 C 324,146 292,88 250,68 C 215,52 158,100 120,80 Z",
    shadowPath: "M 126,88 C 86,66 44,106 54,170 C 64,234 106,274 170,282 C 234,290 294,258 312,206 C 330,154 298,96 256,76 C 221,60 164,108 126,88 Z",
    labelX: 177, labelY: 200,
    emojiX: 177, emojiY: 148,
  },
  {
    slug: "fashion-land",
    path: "M 312,48 C 272,28 218,58 208,122 C 198,186 240,234 302,244 C 364,254 426,212 434,150 C 442,88 400,38 358,33 C 336,30 324,54 312,48 Z",
    shadowPath: "M 318,56 C 278,36 224,66 214,130 C 204,194 246,242 308,252 C 370,262 432,220 440,158 C 448,96 406,46 364,41 C 342,38 330,62 318,56 Z",
    labelX: 321, labelY: 172,
    emojiX: 321, emojiY: 118,
  },
  {
    slug: "cooking-land",
    path: "M 482,38 C 442,18 390,48 380,112 C 370,176 402,224 464,242 C 526,260 594,228 612,168 C 630,108 600,48 554,33 C 520,22 500,44 482,38 Z",
    shadowPath: "M 488,46 C 448,26 396,56 386,120 C 376,184 408,232 470,250 C 532,268 600,236 618,176 C 636,116 606,56 560,41 C 526,30 506,52 488,46 Z",
    labelX: 496, labelY: 168,
    emojiX: 496, emojiY: 112,
  },
  {
    slug: "science-land",
    path: "M 642,28 C 602,8 550,38 544,104 C 538,170 580,222 646,236 C 712,250 772,214 782,152 C 792,90 760,38 714,24 C 684,14 656,34 642,28 Z",
    shadowPath: "M 648,36 C 608,16 556,46 550,112 C 544,178 586,230 652,244 C 718,258 778,222 788,160 C 798,98 766,46 720,32 C 690,22 662,42 648,36 Z",
    labelX: 663, labelY: 162,
    emojiX: 663, emojiY: 106,
  },
  {
    slug: "lego-building",
    path: "M 822,42 C 786,22 744,54 740,120 C 736,186 772,236 838,248 C 904,260 958,218 962,152 C 966,86 930,38 884,28 C 852,20 836,48 822,42 Z",
    shadowPath: "M 828,50 C 792,30 750,62 746,128 C 742,194 778,244 844,256 C 910,268 964,226 968,160 C 972,94 936,46 890,36 C 858,28 842,56 828,50 Z",
    labelX: 851, labelY: 174,
    emojiX: 851, emojiY: 118,
  },
  {
    slug: "vr-land",
    path: "M 992,58 C 952,34 904,64 900,130 C 896,196 936,248 1002,258 C 1068,268 1128,226 1136,162 C 1144,98 1110,46 1062,32 C 1030,22 1006,64 992,58 Z",
    shadowPath: "M 998,66 C 958,42 910,72 906,138 C 902,204 942,256 1008,266 C 1074,276 1134,234 1142,170 C 1150,106 1116,54 1068,40 C 1036,30 1012,72 998,66 Z",
    labelX: 1018, labelY: 190,
    emojiX: 1018, emojiY: 132,
  },
  {
    slug: "sports-land",
    path: "M 1102,298 C 1060,270 1018,282 1000,342 C 982,402 1012,462 1074,482 C 1136,502 1204,464 1222,400 C 1240,336 1210,282 1162,272 C 1130,265 1114,316 1102,298 Z",
    shadowPath: "M 1108,306 C 1066,278 1024,290 1006,350 C 988,410 1018,470 1080,490 C 1142,510 1210,472 1228,408 C 1246,344 1216,290 1168,280 C 1136,273 1120,324 1108,306 Z",
    labelX: 1113, labelY: 400,
    emojiX: 1113, emojiY: 344,
  },
  {
    slug: "gardening-land",
    path: "M 58,318 C 18,298 -12,340 4,412 C 20,484 72,522 144,516 C 216,510 262,460 256,390 C 250,320 210,284 160,284 C 118,284 84,332 58,318 Z",
    shadowPath: "M 64,326 C 24,306 -6,348 10,420 C 26,492 78,530 150,524 C 222,518 268,468 262,398 C 256,328 216,292 166,292 C 124,292 90,340 64,326 Z",
    labelX: 140, labelY: 428,
    emojiX: 140, emojiY: 370,
  },
  {
    slug: "nilco-zone",
    path: "M 132,558 C 90,538 48,570 44,642 C 40,714 86,762 158,766 C 230,770 282,720 280,650 C 278,580 238,538 194,536 C 162,534 150,570 132,558 Z",
    shadowPath: "M 138,566 C 96,546 54,578 50,650 C 46,722 92,770 164,774 C 236,778 288,728 286,658 C 284,588 244,546 200,544 C 168,542 156,578 138,566 Z",
    labelX: 163, labelY: 672,
    emojiX: 163, emojiY: 614,
  },
  {
    slug: "beauty-land",
    path: "M 422,618 C 386,598 354,624 350,692 C 346,760 392,804 458,804 C 524,804 568,756 562,690 C 556,624 520,598 480,598 C 454,596 436,630 422,618 Z",
    shadowPath: "M 428,626 C 392,606 360,632 356,700 C 352,768 398,812 464,812 C 530,812 574,764 568,698 C 562,632 526,606 486,606 C 460,604 442,638 428,626 Z",
    labelX: 457, labelY: 722,
    emojiX: 457, emojiY: 664,
  },
  {
    slug: "handmade-land",
    path: "M 852,622 C 816,602 784,628 780,696 C 776,764 822,808 888,808 C 954,808 998,760 992,694 C 986,628 950,604 910,602 C 880,600 866,634 852,622 Z",
    shadowPath: "M 858,630 C 822,610 790,636 786,704 C 782,772 828,816 894,816 C 960,816 1004,768 998,702 C 992,636 956,612 916,610 C 886,608 872,642 858,630 Z",
    labelX: 887, labelY: 724,
    emojiX: 887, emojiY: 664,
  },
];

// ── Pathway network ─────────────────────────────────────────────────────────
interface PathwayDef {
  id: string;
  d: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
}

const PATHWAYS: PathwayDef[] = [
  { id: "p1", stroke: "#2196F3", strokeWidth: 14, opacity: 0.85,
    d: "M 177,175 C 220,195 278,188 321,172 C 364,156 388,138 496,140" },
  { id: "p2", stroke: "#2196F3", strokeWidth: 14, opacity: 0.85,
    d: "M 496,140 C 570,142 620,138 663,135" },
  { id: "p3", stroke: "#F39C12", strokeWidth: 14, opacity: 0.85,
    d: "M 663,135 C 720,128 782,132 851,148" },
  { id: "p4", stroke: "#F39C12", strokeWidth: 12, opacity: 0.8,
    d: "M 851,148 C 920,164 968,162 1018,158" },
  { id: "p5", stroke: "#E91E63", strokeWidth: 12, opacity: 0.8,
    d: "M 1018,158 C 1065,218 1082,272 1113,368" },
  { id: "p6", stroke: "#4CAF50", strokeWidth: 12, opacity: 0.8,
    d: "M 177,175 C 162,235 148,294 140,392" },
  { id: "p7", stroke: "#4CAF50", strokeWidth: 11, opacity: 0.8,
    d: "M 140,392 C 148,472 150,520 163,620" },
  { id: "p8", stroke: "#FFC107", strokeWidth: 13, opacity: 0.85,
    d: "M 163,620 C 210,668 300,700 422,680 C 432,678 444,670 457,665" },
  { id: "p9", stroke: "#FFC107", strokeWidth: 13, opacity: 0.85,
    d: "M 887,668 C 930,676 988,686 1060,650 C 1100,630 1115,560 1113,450" },
  { id: "p10", stroke: "#E91E63", strokeWidth: 16, opacity: 0.75,
    d: "M 457,665 C 520,730 600,790 700,840" },
  { id: "p11", stroke: "#E91E63", strokeWidth: 16, opacity: 0.75,
    d: "M 887,668 C 830,740 768,796 700,840" },
];

// ── Helpers ─────────────────────────────────────────────────────────────────
function darken(hex: string, amount: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (n >> 16) - amount);
  const g = Math.max(0, ((n >> 8) & 0xff) - amount);
  const b = Math.max(0, (n & 0xff) - amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function hexToRgb(hex: string): string {
  const n = parseInt(hex.replace("#", ""), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

function isVisible(land: Land, filter: FilterKey): boolean {
  if (filter === "open") return OPEN_TODAY_IDS.includes(land.id);
  if (filter === "young") return land.age_min <= 8;
  if (filter === "older") return land.age_max >= 8;
  return true;
}

// ── Props ────────────────────────────────────────────────────────────────────
interface ParkMapProps {
  activeFilter?: FilterKey;
  onFilterChange?: (f: FilterKey) => void;
  className?: string;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function ParkMap({ activeFilter = "all", className = "" }: ParkMapProps) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [pathwaysDrawn, setPathwaysDrawn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const landMap = Object.fromEntries(LANDS.map((l) => [l.slug, l]));
  const hoveredLand = hoveredSlug ? landMap[hoveredSlug] : null;

  function handleHoverStart(zone: ZoneLayout, e: MouseEvent | PointerEvent | TouchEvent) {
    setHoveredSlug(zone.slug);
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;
    const scaleX = svgRect.width / 1400;
    const scaleY = svgRect.height / 900;
    setTooltipPos({
      x: zone.labelX * scaleX + svgRect.left,
      y: zone.labelY * scaleY + svgRect.top - 110,
    });
  }

  if (!mounted) return null;

  return (
    <div className={`relative w-full ${className}`}>
      {/* Scroll wrapper for small screens */}
      <div className="w-full overflow-x-auto rounded-2xl">
        <div style={{ minWidth: "min(480px, 100%)" }}>
          <svg
            ref={svgRef}
            viewBox="0 0 1400 900"
            width="100%"
            preserveAspectRatio="xMidYMid meet"
            style={{ display: "block", borderRadius: "16px" }}
          >
            <defs>
              {/* Aerial ground gradient */}
              <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F5E6C8" />
                <stop offset="50%" stopColor="#EDD9A3" />
                <stop offset="100%" stopColor="#E8D08A" />
              </linearGradient>

              {/* Ground texture dots filter */}
              <filter id="noise" x="0%" y="0%" width="100%" height="100%">
                <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" result="noiseOut" />
                <feColorMatrix type="saturate" values="0" in="noiseOut" result="grayNoise" />
                <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" result="blend" />
                <feComposite in="blend" in2="SourceGraphic" operator="in" />
              </filter>

              {/* Per-land glow filters */}
              {ZONE_LAYOUTS.map((zone) => {
                const land = landMap[zone.slug];
                if (!land) return null;
                return (
                  <filter key={zone.slug} id={`glow-${zone.slug}`} x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="18" result="blur" />
                    <feFlood floodColor={land.theme_color} floodOpacity="0.75" result="color" />
                    <feComposite in="color" in2="blur" operator="in" result="glow" />
                    <feMerge>
                      <feMergeNode in="glow" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                );
              })}

              {/* Per-land radial gradient fills (3D lighting effect) */}
              {ZONE_LAYOUTS.map((zone) => {
                const land = landMap[zone.slug];
                if (!land) return null;
                const rgb = hexToRgb(land.theme_color);
                return (
                  <radialGradient key={zone.slug} id={`fill-${zone.slug}`}
                    cx="42%" cy="35%" r="62%" fx="38%" fy="30%">
                    <stop offset="0%" stopColor={`rgba(${rgb}, 0.95)`} />
                    <stop offset="55%" stopColor={`rgba(${rgb}, 0.82)`} />
                    <stop offset="100%" stopColor={`rgba(${rgb}, 0.55)`} />
                  </radialGradient>
                );
              })}

              {/* Drop shadow filter for 3D depth */}
              <filter id="zone-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="4" dy="8" stdDeviation="10" floodColor="rgba(0,0,0,0.55)" />
              </filter>

              {/* Pathway glow filter */}
              <filter id="path-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* ── Layer 1: Background ── */}
            <rect x="0" y="0" width="1400" height="900" fill="url(#ground)" rx="16" />

            {/* Subtle ground texture circles */}
            {[
              [200, 300, 180], [700, 200, 140], [1100, 400, 160],
              [400, 650, 120], [950, 720, 100], [150, 700, 90],
            ].map(([cx, cy, r], i) => (
              <circle key={i} cx={cx} cy={cy} r={r}
                fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="1.5" />
            ))}

            {/* Aerial "satellite" grid lines */}
            {[150, 350, 550, 750, 950, 1150].map((x, i) => (
              <line key={`vl${i}`} x1={x} y1="0" x2={x} y2="900"
                stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
            ))}
            {[100, 280, 460, 640, 820].map((y, i) => (
              <line key={`hl${i}`} x1="0" y1={y} x2="1400" y2={y}
                stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
            ))}

            {/* ── Layer 2: Pathways ── */}
            {PATHWAYS.map((p, i) => (
              <motion.path
                key={p.id}
                d={p.d}
                fill="none"
                stroke={p.stroke}
                strokeWidth={p.strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={p.opacity}
                filter="url(#path-glow)"
                custom={i}
                variants={{
                  hidden: { pathLength: 0, opacity: 0 },
                  visible: {
                    pathLength: 1,
                    opacity: p.opacity,
                    transition: {
                      pathLength: { delay: i * 0.1, duration: 0.85, ease: "easeInOut" },
                      opacity: { delay: i * 0.1, duration: 0.25 },
                    },
                  },
                }}
                initial="hidden"
                animate="visible"
                onAnimationComplete={i === PATHWAYS.length - 1 ? () => setPathwaysDrawn(true) : undefined}
              />
            ))}

            {/* Pathway center-line highlight (white shimmer strip) */}
            {PATHWAYS.slice(0, 8).map((p, i) => (
              <motion.path
                key={`hi-${p.id}`}
                d={p.d}
                fill="none"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth={p.strokeWidth * 0.35}
                strokeLinecap="round"
                custom={i}
                variants={{
                  hidden: { pathLength: 0, opacity: 0 },
                  visible: {
                    pathLength: 1, opacity: 1,
                    transition: { pathLength: { delay: i * 0.1 + 0.4, duration: 0.6 }, opacity: { delay: i * 0.1 + 0.4, duration: 0.2 } },
                  },
                }}
                initial="hidden"
                animate="visible"
              />
            ))}

            {/* ── Layer 3: Land Zones ── */}
            {ZONE_LAYOUTS.map((zone, i) => {
              const land = landMap[zone.slug];
              if (!land) return null;
              const visible = isVisible(land, activeFilter);
              const isHovered = hoveredSlug === zone.slug;
              const shadowColor = darken(land.theme_color, 60);

              return (
                <motion.g
                  key={zone.slug}
                  custom={i}
                  variants={{
                    hidden: { opacity: 0, scale: 0.55 },
                    visible: {
                      opacity: 1, scale: 1,
                      transition: { delay: i * 0.07, duration: 0.55, ease: [0.34, 1.56, 0.64, 1] },
                    },
                  }}
                  initial="hidden"
                  animate={pathwaysDrawn ? "visible" : "hidden"}
                  style={{ transformOrigin: `${zone.labelX}px ${zone.labelY}px` }}
                >
                  {/* Visibility / filter dimming wrapper */}
                  <motion.g
                    animate={{ opacity: visible ? 1 : 0.15 }}
                    transition={{ duration: 0.35 }}
                    style={{ pointerEvents: visible ? "auto" : "none" }}
                  >
                    {/* 3D shadow/depth layer (rendered first, offset down-right) */}
                    <path
                      d={zone.shadowPath}
                      fill={shadowColor}
                      opacity={0.35}
                      filter="url(#zone-shadow)"
                    />

                    {/* Zone edge highlight (lighter rim on top-left = "lit" side) */}
                    <path
                      d={zone.path}
                      fill="none"
                      stroke="rgba(255,255,255,0.22)"
                      strokeWidth={3}
                    />

                    {/* Main zone face with radial gradient fill */}
                    <motion.path
                      d={zone.path}
                      fill={`url(#fill-${zone.slug})`}
                      stroke={isHovered ? "white" : land.theme_color}
                      strokeWidth={isHovered ? 3.5 : 2}
                      filter={isHovered ? `url(#glow-${zone.slug})` : undefined}
                      whileHover={{ scale: 1.04 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        transformOrigin: `${zone.labelX}px ${zone.labelY}px`,
                        cursor: "pointer",
                      }}
                      onHoverStart={(e) => handleHoverStart(zone, e as unknown as MouseEvent)}
                      onHoverEnd={() => setHoveredSlug(null)}
                      onClick={() => router.push(`/lands/${zone.slug}`)}
                    />

                    {/* Inner highlight gradient (3D "surface" sheen) */}
                    <path
                      d={zone.path}
                      fill="none"
                      stroke="rgba(255,255,255,0.12)"
                      strokeWidth={8}
                      strokeLinecap="round"
                      style={{ pointerEvents: "none" }}
                    />

                    {/* Emoji (foreignObject for cross-browser consistency) */}
                    <foreignObject
                      x={zone.emojiX - 20}
                      y={zone.emojiY - 22}
                      width={42}
                      height={42}
                      style={{ pointerEvents: "none", overflow: "visible" }}
                    >
                      <div
                        style={{
                          fontSize: "28px",
                          textAlign: "center",
                          lineHeight: "42px",
                          filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.5))",
                          userSelect: "none",
                        }}
                      >
                        {land.icon_emoji}
                      </div>
                    </foreignObject>

                    {/* Land name label */}
                    <text
                      x={zone.labelX}
                      y={zone.labelY + 4}
                      textAnchor="middle"
                      fill="white"
                      fontSize="11"
                      fontWeight="800"
                      letterSpacing="0.06em"
                      style={{
                        textTransform: "uppercase",
                        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.8))",
                        pointerEvents: "none",
                        fontFamily: "system-ui, sans-serif",
                      }}
                    >
                      {land.name}
                    </text>

                    {/* Station count sub-label */}
                    <text
                      x={zone.labelX}
                      y={zone.labelY + 18}
                      textAnchor="middle"
                      fill="rgba(255,255,255,0.75)"
                      fontSize="9"
                      fontWeight="600"
                      style={{
                        pointerEvents: "none",
                        fontFamily: "system-ui, sans-serif",
                        filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.7))",
                      }}
                    >
                      {land.stations.length} stations
                    </text>
                  </motion.g>
                </motion.g>
              );
            })}

            {/* ── Layer 4: Central Entrance Hub ── */}
            <motion.g
              initial={{ opacity: 0, scale: 0 }}
              animate={pathwaysDrawn ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
              transition={{ delay: 0.3, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ transformOrigin: "700px 840px" }}
            >
              {/* Outer glow ring */}
              <circle cx="700" cy="840" r="72"
                fill="rgba(255,107,71,0.12)"
                stroke="rgba(255,107,71,0.3)"
                strokeWidth="2" />
              {/* Middle ring (gold metallic) */}
              <circle cx="700" cy="840" r="56"
                fill="rgba(212,168,67,0.15)"
                stroke="#D4A843"
                strokeWidth="2.5" />
              {/* Inner arch circle */}
              <circle cx="700" cy="840" r="40"
                fill="#FF6B47"
                stroke="#E55A38"
                strokeWidth="2" />
              {/* Arch arc */}
              <path d="M 660,840 C 660,804 675,784 700,778 C 725,784 740,804 740,840"
                fill="none" stroke="#D4A843" strokeWidth="3.5" strokeLinecap="round" />
              {/* Arch pillars */}
              <rect x="657" y="826" width="7" height="28" rx="3.5" fill="#D4A843" />
              <rect x="736" y="826" width="7" height="28" rx="3.5" fill="#D4A843" />
              {/* Label */}
              <text x="700" y="845" textAnchor="middle"
                fill="white" fontSize="8.5" fontWeight="900" letterSpacing="0.1em"
                style={{ fontFamily: "system-ui, sans-serif" }}>
                ENTRANCE
              </text>
              {/* Pulsing outer ring animation */}
              <motion.circle
                cx="700" cy="840" r="80"
                fill="none"
                stroke="rgba(255,107,71,0.4)"
                strokeWidth="2"
                animate={{ r: [72, 90, 72], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.g>
          </svg>
        </div>
      </div>

      {/* ── Tooltip (HTML overlay) ── */}
      <AnimatePresence>
        {hoveredSlug && hoveredLand && (
          <motion.div
            key={hoveredSlug}
            initial={{ opacity: 0, y: 10, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.92 }}
            transition={{ duration: 0.15 }}
            className="fixed z-50 pointer-events-none"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y,
              transform: "translateX(-50%)",
            }}
          >
            <div
              style={{
                background: `linear-gradient(135deg, ${hoveredLand.theme_color} 0%, ${darken(hoveredLand.theme_color, 30)} 100%)`,
                border: `2px solid rgba(255,255,255,0.3)`,
                borderRadius: "14px",
                padding: "10px 16px",
                minWidth: "170px",
                boxShadow: `0 16px 48px rgba(0,0,0,0.4), 0 4px 16px ${hoveredLand.theme_color}60`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span style={{ fontSize: "22px" }}>{hoveredLand.icon_emoji}</span>
                <span style={{ color: "white", fontWeight: 800, fontSize: "14px" }}>
                  {hoveredLand.name}
                </span>
              </div>
              <div style={{ color: "rgba(255,255,255,0.88)", fontSize: "11.5px", marginBottom: "3px" }}>
                {hoveredLand.stations.length} stations · Ages {hoveredLand.age_min}–{hoveredLand.age_max}
              </div>
              <div style={{
                color: OPEN_TODAY_IDS.includes(hoveredLand.id) ? "#A8FF78" : "rgba(255,255,255,0.5)",
                fontSize: "11px",
                fontWeight: 600,
                marginBottom: "4px",
              }}>
                {OPEN_TODAY_IDS.includes(hoveredLand.id) ? "● Open Today" : "○ Closed Today"}
              </div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.05em" }}>
                CLICK TO EXPLORE →
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
