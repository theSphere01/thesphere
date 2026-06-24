import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPoints(pts: number): string {
  return pts.toLocaleString();
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function getRankSuffix(rank: number): string {
  if (rank === 1) return "st";
  if (rank === 2) return "nd";
  if (rank === 3) return "rd";
  return "th";
}

export function getRankColor(rank: number): string {
  if (rank === 1) return "var(--color-rank-gold)";
  if (rank === 2) return "var(--color-rank-silver)";
  if (rank === 3) return "var(--color-rank-bronze)";
  return "var(--color-text-muted)";
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function getAgeLabel(min: number, max: number): string {
  return `Ages ${min}–${max}`;
}

export function generateInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export function getRarityColor(rarity: string): string {
  const map: Record<string, string> = {
    common: "var(--color-rarity-common)",
    rare: "var(--color-rarity-rare)",
    epic: "var(--color-rarity-epic)",
    legendary: "var(--color-rarity-legendary)",
  };
  return map[rarity] ?? map.common;
}

export function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + "…" : str;
}
