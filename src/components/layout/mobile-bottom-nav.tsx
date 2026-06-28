"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Map, Trophy, Ticket, Zap } from "lucide-react";
import { AUTH_CHANGE_EVENT, getActiveProfileSession } from "@/lib/profile-session";

export function MobileBottomNav() {
  const pathname = usePathname();
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    function readSession() {
      setProfileId(getActiveProfileSession()?.id ?? null);
    }

    readSession();
    window.addEventListener("storage", readSession);
    window.addEventListener(AUTH_CHANGE_EVENT, readSession);
    return () => {
      window.removeEventListener("storage", readSession);
      window.removeEventListener(AUTH_CHANGE_EVENT, readSession);
    };
  }, [pathname]);

  const NAV_ITEMS = [
    { href: "/",            label: "Home",    Icon: Home,   color: "#FF6B47" },
    { href: "/lands",       label: "Lands",   Icon: Map,    color: "#74a832" },
    { href: "/leaderboard", label: "Scores",  Icon: Trophy, color: "#D4A843" },
    { href: "/register",    label: "Join",    Icon: Ticket, color: "#1578a8" },
    { href: profileId ? "/dashboard" : "/login", label: profileId ? "My Stats" : "Profile", Icon: Zap, color: "#9B59B6" },
  ];

  return (
    <>
      {/* Spacer prevents page content from sitting under the nav */}
      <div style={{ height: "calc(64px + env(safe-area-inset-bottom, 0px))" }} className="md:hidden" />

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "2px solid transparent",
          borderImage: "linear-gradient(90deg, #FF6B47, #F5C400, #52D68A, #4CC9F0) 1",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "stretch", height: 64 }}>
          {NAV_ITEMS.map(({ href, label, Icon, color }, index) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={label}
                href={href}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  textDecoration: "none",
                  color: active ? color : "rgba(26,26,46,0.38)",
                  transition: "color 0.2s",
                  paddingTop: 6,
                  position: "relative",
                  WebkitTapHighlightColor: "transparent",
                  touchAction: "manipulation",
                  minHeight: 44,
                  cursor: "pointer",
                }}
              >
                {/* Active indicator — sliding pill at top */}
                <AnimatePresence>
                  {active && (
                    <motion.div
                      layoutId="bottom-nav-pill"
                      style={{
                        position: "absolute",
                        top: 0, left: "50%",
                        transform: "translateX(-50%)",
                        height: 3, width: 32,
                        borderRadius: 9999,
                        background: color,
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </AnimatePresence>

                <motion.div whileTap={{ scale: 0.82 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                  <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                </motion.div>

                <span style={{ fontSize: "0.62rem", fontWeight: active ? 700 : 500, letterSpacing: "0.01em" }}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
