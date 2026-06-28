"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Award,
  CalendarDays,
  ImagePlus,
  LayoutDashboard,
  Map,
  Menu,
  Settings,
  Tag,
  Trophy,
  Users,
  X,
} from "lucide-react";

const NAV_LINKS = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/lands", icon: Map, label: "Lands" },
  { href: "/admin/home-photos", icon: ImagePlus, label: "Home Photos" },
  { href: "/admin/schedule", icon: CalendarDays, label: "Schedule" },
  { href: "/admin/campers", icon: Users, label: "Campers" },
  { href: "/admin/points-config", icon: Settings, label: "Points Config" },
  { href: "/admin/discount-config", icon: Tag, label: "Discount Config" },
  { href: "/admin/ceremonies", icon: Trophy, label: "Ceremonies" },
  { href: "/admin/badges", icon: Award, label: "Badges" },
];

function isActiveRoute(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <div className="admin-shell">
      <header className="admin-mobile-bar">
        <Link href="/admin" className="admin-brand" aria-label="Admin dashboard">
          <span className="admin-brand-mark">S</span>
          <span>
            <span className="admin-brand-title">The Sphere</span>
            <span className="admin-brand-subtitle">Admin Panel</span>
          </span>
        </Link>
        <button
          type="button"
          className="admin-menu-button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close admin menu" : "Open admin menu"}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {menuOpen && (
        <button
          type="button"
          className="admin-menu-overlay"
          aria-label="Close admin menu"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside className={`admin-sidebar ${menuOpen ? "is-open" : ""}`}>
        <div className="admin-sidebar-brand">
          <Link href="/admin" className="admin-brand" onClick={() => setMenuOpen(false)}>
            <span className="admin-brand-mark">S</span>
            <span>
              <span className="admin-brand-title">The Sphere</span>
              <span className="admin-brand-subtitle">Admin Panel</span>
            </span>
          </Link>
        </div>

        <nav className="admin-nav" aria-label="Admin navigation">
          {NAV_LINKS.map(({ href, icon: Icon, label }) => {
            const active = isActiveRoute(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={`admin-nav-link ${active ? "is-active" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={18} className="admin-nav-icon" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <Link href="/" className="admin-public-link" onClick={() => setMenuOpen(false)}>
            View Public Site
          </Link>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-content">{children}</div>
      </main>

      <style jsx global>{`
        .admin-shell {
          min-height: 100vh;
          display: flex;
          background: #0f172a;
          color: white;
        }

        .admin-sidebar {
          width: 264px;
          flex: 0 0 264px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--color-ws-blue);
          border-right: 1px solid rgba(255, 255, 255, 0.12);
        }

        .admin-sidebar-brand {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.18);
        }

        .admin-brand {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          min-width: 0;
          color: white;
          text-decoration: none;
        }

        .admin-brand-mark {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          background: rgba(255, 255, 255, 0.18);
          font-weight: 900;
          letter-spacing: 0;
        }

        .admin-brand-title,
        .admin-brand-subtitle {
          display: block;
          line-height: 1.05;
        }

        .admin-brand-title {
          font-size: 0.92rem;
          font-weight: 900;
        }

        .admin-brand-subtitle {
          margin-top: 0.18rem;
          font-size: 0.72rem;
          color: rgba(255, 255, 255, 0.62);
        }

        .admin-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          padding: 0.9rem;
          overflow-y: auto;
        }

        .admin-nav-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          min-height: 44px;
          padding: 0.65rem 0.75rem;
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.78);
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 700;
          transition: background 0.18s ease, color 0.18s ease;
        }

        .admin-nav-link:hover,
        .admin-nav-link.is-active {
          color: white;
          background: rgba(255, 255, 255, 0.16);
        }

        .admin-nav-link.is-active {
          box-shadow: inset 3px 0 0 rgba(255, 255, 255, 0.8);
        }

        .admin-nav-icon {
          flex: 0 0 auto;
        }

        .admin-sidebar-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.18);
        }

        .admin-public-link {
          color: rgba(255, 255, 255, 0.62);
          font-size: 0.78rem;
          font-weight: 700;
          text-decoration: none;
        }

        .admin-main {
          flex: 1;
          min-width: 0;
          min-height: 100vh;
          overflow: auto;
          background: #0f172a;
        }

        .admin-content {
          min-width: 0;
        }

        .admin-mobile-bar,
        .admin-menu-overlay {
          display: none;
        }

        @media (max-width: 768px) {
          .admin-shell {
            display: block;
            min-height: 100vh;
            overflow-x: hidden;
          }

          .admin-mobile-bar {
            position: sticky;
            top: 0;
            z-index: 60;
            height: 58px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.75rem;
            padding: 0 0.9rem;
            background: rgba(21, 120, 168, 0.96);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.16);
          }

          .admin-mobile-bar .admin-brand-mark {
            width: 34px;
            height: 34px;
            border-radius: 10px;
          }

          .admin-mobile-bar .admin-brand-title {
            font-size: 0.84rem;
          }

          .admin-mobile-bar .admin-brand-subtitle {
            font-size: 0.66rem;
          }

          .admin-menu-button {
            width: 44px;
            height: 44px;
            border: 1px solid rgba(255, 255, 255, 0.18);
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.12);
            color: white;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
          }

          .admin-menu-overlay {
            position: fixed;
            inset: 0;
            z-index: 50;
            display: block;
            background: rgba(2, 6, 23, 0.62);
            border: 0;
          }

          .admin-sidebar {
            position: fixed;
            top: 0;
            bottom: 0;
            left: 0;
            z-index: 70;
            width: min(82vw, 320px);
            min-height: 100dvh;
            transform: translateX(-105%);
            transition: transform 0.22s ease;
            box-shadow: 20px 0 50px rgba(0, 0, 0, 0.32);
          }

          .admin-sidebar.is-open {
            transform: translateX(0);
          }

          .admin-sidebar-brand {
            padding: 1rem 1.1rem;
          }

          .admin-nav {
            padding: 0.75rem;
          }

          .admin-nav-link {
            min-height: 46px;
            border-radius: 10px;
            font-size: 0.92rem;
          }

          .admin-sidebar-footer {
            padding: 0.9rem 1.1rem 1.2rem;
          }

          .admin-main {
            min-height: calc(100vh - 58px);
            overflow-x: hidden;
          }

          .admin-content {
            overflow-x: hidden;
          }

          .admin-content .p-8,
          .admin-content .p-6 {
            padding: 1rem !important;
          }

          .admin-content table {
            font-size: 0.82rem;
          }
        }
      `}</style>
    </div>
  );
}
