"use client";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, LogIn, LogOut } from "lucide-react";
import { AUTH_CHANGE_EVENT, clearActiveProfileSession, getActiveProfileSession } from "@/lib/profile-session";

// Camper / parent facing only. Staff & Admin live discreetly in the footer.
const NAV_LINKS = [
  { label: "Lands", href: "/lands" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Register", href: "/register" },
];

function useLoggedInProfile() {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    function readSession() {
      const activeProfile = getActiveProfileSession();
      setProfileId(activeProfile?.id ?? null);
      setProfileName(activeProfile?.name ?? null);
    }

    readSession();
    window.addEventListener("storage", readSession);
    window.addEventListener(AUTH_CHANGE_EVENT, readSession);
    return () => {
      window.removeEventListener("storage", readSession);
      window.removeEventListener(AUTH_CHANGE_EVENT, readSession);
    };
  }, [pathname]);

  return { profileId, profileName };
}

// Clears the parent session and returns home. Hard navigation so every
// auth-aware piece of UI re-reads the (now empty) session storage.
function logout() {
  clearActiveProfileSession();
  window.location.href = "/";
}

export default function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { profileId, profileName } = useLoggedInProfile();
  const firstName = profileName ? profileName.split(" ")[0] : null;

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "3px solid transparent",
          borderImage: "linear-gradient(90deg, #FF1A75, #FF7B00, #FFE500, #3EE000, #00C8FF, #C84DFF) 1",
        }}
      >
        <div className="public-header-inner" style={{ maxWidth: 1200, width: "100%", margin: "0 auto", padding: "0 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, gap: "0.5rem" }}>
          {/* Logo */}
          <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} transition={{ type: "spring", stiffness: 400, damping: 20 }} style={{ flexShrink: 1, minWidth: 0 }}>
            <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <img
                className="public-header-logo-mark"
                src="/images/sphere-logo-yellow.png"
                alt="The Sphere by WellSpring"
                style={{ height: 38, width: 38, objectFit: "contain", flexShrink: 0, filter: "drop-shadow(0 2px 8px rgba(245,196,0,0.4))", pointerEvents: "none" }}
              />
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1, pointerEvents: "none", minWidth: 0 }}>
                <span className="public-header-brand-title" style={{ fontWeight: 900, fontSize: "0.95rem", color: "var(--color-sphere-coral)", letterSpacing: 0, whiteSpace: "nowrap" }}>
                  THE SPHERE
                </span>
                <span className="public-header-brand-subtitle" style={{ fontSize: "0.55rem", color: "var(--color-ws-blue)", letterSpacing: "0.05em", fontWeight: 600, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                  Fun · Growth · Memories
                </span>
              </div>
            </Link>
          </motion.div>

          {/* Desktop nav — hidden on mobile */}
          <nav className="public-header-desktop-nav" style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
            {NAV_LINKS.map((link) => (
              <motion.div key={link.href} whileHover={{ scale: 1.05 }}>
                <Link
                  href={link.href}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "9999px",
                    color: "rgba(26,26,46,0.8)",
                    textDecoration: "none",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--color-sphere-coral)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,107,71,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "rgba(26,26,46,0.8)";
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}

            {profileId ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={logout}
                style={{
                  marginLeft: "0.25rem",
                  padding: "0.5rem 0.95rem",
                  background: "rgba(231,76,60,0.08)",
                  border: "1.5px solid rgba(231,76,60,0.35)",
                  color: "#E74C3C",
                  borderRadius: "9999px",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                <LogOut size={14} />
                Logout{firstName ? `, ${firstName}` : ""}
              </motion.button>
            ) : (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/login"
                  style={{
                    marginLeft: "0.25rem",
                    padding: "0.5rem 1.1rem",
                    background: "rgba(255,107,71,0.1)",
                    border: "1.5px solid rgba(255,107,71,0.35)",
                    color: "var(--color-sphere-coral)",
                    borderRadius: "9999px",
                    textDecoration: "none",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  <LogIn size={14} />
                  My Profile
                </Link>
              </motion.div>
            )}
          </nav>

          {/* Mobile nav — just the hamburger. All links + profile/logout live in the
              menu, and the bottom nav covers quick navigation. Keeps the bar uncluttered. */}
          <div className="public-header-mobile-trigger" style={{ display: "none", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                background: menuOpen ? "var(--color-sphere-coral)" : "rgba(26,26,46,0.08)",
                border: "none",
                color: menuOpen ? "white" : "var(--color-dark)",
                cursor: "pointer",
                padding: "0.5rem",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
                minWidth: 44,
                minHeight: 44,
              }}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="public-mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              position: "fixed",
              top: 64,
              left: 0,
              right: 0,
              zIndex: 49,
              background: "rgba(255,255,255,0.98)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              borderBottom: "2px solid rgba(255,107,71,0.3)",
              overflow: "hidden",
            }}
          >
            <nav style={{ padding: "1rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    padding: "0.75rem 1rem",
                    paddingLeft: "1.25rem",
                    color: "var(--color-dark)",
                    textDecoration: "none",
                    borderRadius: "12px",
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    borderLeft: "3px solid var(--color-sphere-coral)",
                    display: "block",
                    touchAction: "manipulation",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  {link.label}
                </Link>
              ))}

              {profileId ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      padding: "0.75rem 1rem",
                      paddingLeft: "1.25rem",
                      color: "white",
                      background: "linear-gradient(135deg, var(--color-sphere-coral), var(--color-sphere-gold))",
                      textDecoration: "none",
                      borderRadius: "12px",
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      touchAction: "manipulation",
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    My Dashboard{firstName ? ` (${firstName})` : ""}
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    style={{
                      padding: "0.75rem 1rem",
                      paddingLeft: "1.25rem",
                      color: "#E74C3C",
                      background: "rgba(231,76,60,0.08)",
                      border: "1.5px solid rgba(231,76,60,0.3)",
                      borderRadius: "12px",
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      cursor: "pointer",
                      width: "100%",
                      textAlign: "left",
                      touchAction: "manipulation",
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    padding: "0.75rem 1rem",
                    paddingLeft: "1.25rem",
                    color: "var(--color-sphere-coral)",
                    background: "rgba(255,107,71,0.08)",
                    border: "1.5px solid rgba(255,107,71,0.3)",
                    textDecoration: "none",
                    borderRadius: "12px",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    touchAction: "manipulation",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <LogIn size={18} />
                  Login / My Profile
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .public-header-desktop-nav { display: flex !important; }
        .public-header-mobile-trigger { display: none !important; }
        @media (max-width: 768px) {
          .public-header-inner {
            height: 58px !important;
            padding: 0 0.75rem !important;
            max-width: 100vw !important;
          }
          .public-header-desktop-nav { display: none !important; }
          .public-header-mobile-trigger { display: flex !important; }
          .public-header-logo-mark {
            width: 34px !important;
            height: 34px !important;
          }
          .public-header-brand-title {
            font-size: 0.82rem !important;
          }
          .public-header-brand-subtitle {
            font-size: 0.48rem !important;
            letter-spacing: 0.04em !important;
          }
          .public-mobile-menu {
            top: 58px !important;
          }
        }
        @media (min-width: 769px) {
          .public-header-mobile-trigger { display: none !important; }
        }
      `}</style>
    </>
  );
}
