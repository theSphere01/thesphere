"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  CalendarDays,
  Trophy,
  BarChart2,
  UserPlus,
  Activity,
  Coins,
  Map,
  Users,
} from "lucide-react";

interface StatCard {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  sub?: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    activeSessions: 0,
    pointsToday: 0,
    landsOpen: 0,
    totalCampers: 0,
  });

  useEffect(() => {
    // Stub fetch — replace with real API calls
    async function fetchStats() {
      try {
        const [sessRes, campRes] = await Promise.allSettled([
          fetch("/api/admin/stats/sessions-today"),
          fetch("/api/admin/stats/campers"),
        ]);
        if (sessRes.status === "fulfilled" && sessRes.value.ok) {
          const d = await sessRes.value.json();
          setStats(prev => ({
            ...prev,
            activeSessions: d.active ?? 0,
            pointsToday: d.points_today ?? 0,
            landsOpen: d.lands_open ?? 0,
          }));
        }
        if (campRes.status === "fulfilled" && campRes.value.ok) {
          const d = await campRes.value.json();
          setStats(prev => ({ ...prev, totalCampers: d.total ?? 0 }));
        }
      } catch {
        // Stats stay at 0 on error
      }
    }
    fetchStats();
  }, []);

  const statCards: StatCard[] = [
    {
      label: "Active Sessions Today",
      value: stats.activeSessions,
      icon: <Activity size={22} />,
      color: "#1ABC9C",
      sub: "Currently checked in",
    },
    {
      label: "Points Awarded Today",
      value: stats.pointsToday.toLocaleString(),
      icon: <Coins size={22} />,
      color: "var(--color-sphere-gold)",
      sub: "Across all campers",
    },
    {
      label: "Lands Open Today",
      value: stats.landsOpen,
      icon: <Map size={22} />,
      color: "var(--color-sphere-coral)",
      sub: "Out of 11 total",
    },
    {
      label: "Registered Campers",
      value: stats.totalCampers.toLocaleString(),
      icon: <Users size={22} />,
      color: "var(--color-ws-blue)",
      sub: "All time",
    },
  ];

  const quickActions = [
    {
      label: "Open / Close Lands",
      icon: <CalendarDays size={20} />,
      href: "/admin/schedule",
      color: "var(--color-ws-blue)",
      desc: "Set today's schedule",
    },
    {
      label: "Run Ceremony",
      icon: <Trophy size={20} />,
      href: "/admin/ceremonies",
      color: "var(--color-sphere-gold)",
      desc: "Award daily winners",
    },
    {
      label: "View Leaderboard",
      icon: <BarChart2 size={20} />,
      href: "/leaderboard",
      color: "#2ECC71",
      desc: "See top campers",
    },
    {
      label: "Add Camper",
      icon: <UserPlus size={20} />,
      href: "/register",
      color: "var(--color-sphere-coral)",
      desc: "Register new camper",
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-1">Dashboard</h1>
        <p style={{ color: "rgba(255,255,255,0.5)" }}>
          Welcome back — here's today at The Sphere.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="p-6 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 rounded-xl" style={{ background: `${card.color}22`, color: card.color }}>
                {card.icon}
              </div>
            </div>
            <div className="text-3xl font-black text-white mb-1">{card.value}</div>
            <div className="text-sm font-semibold text-white mb-0.5">{card.label}</div>
            {card.sub && (
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{card.sub}</div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-xl font-black text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {quickActions.map((action, i) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.07 }}
              whileHover={{ scale: 1.03, boxShadow: `0 8px 32px rgba(0,0,0,0.4)` }}
              whileTap={{ scale: 0.97 }}
            >
              <Link href={action.href}
                className="block p-5 rounded-2xl transition-colors"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `${action.color}22`, color: action.color }}>
                  {action.icon}
                </div>
                <div className="font-bold text-white text-sm mb-1">{action.label}</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{action.desc}</div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
