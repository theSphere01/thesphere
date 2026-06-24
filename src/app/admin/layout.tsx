import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  CalendarDays,
  Users,
  Settings,
  Tag,
  Trophy,
  Award,
  ImagePlus,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth/guards";

const NAV_LINKS = [
  { href: "/admin",                icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/lands",          icon: Map,             label: "Lands" },
  { href: "/admin/home-photos",    icon: ImagePlus,       label: "Home Photos" },
  { href: "/admin/schedule",       icon: CalendarDays,    label: "Schedule" },
  { href: "/admin/campers",        icon: Users,           label: "Campers" },
  { href: "/admin/points-config",  icon: Settings,        label: "Points Config" },
  { href: "/admin/discount-config",icon: Tag,             label: "Discount Config" },
  { href: "/admin/ceremonies",     icon: Trophy,          label: "Ceremonies" },
  { href: "/admin/badges",         icon: Award,           label: "Badges" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireAdmin();
  } catch {
    redirect("/staff/login?next=/admin");
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#0f172a" }}>
      {/* Sidebar */}
      <aside
        className="w-64 flex-shrink-0 flex flex-col"
        style={{ background: "var(--color-ws-blue)", minHeight: "100vh" }}
      >
        {/* Logo area */}
        <div className="px-6 py-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
              style={{ background: "rgba(255,255,255,0.2)" }}>
              🌐
            </div>
            <div>
              <div className="font-black text-white text-sm leading-tight">The Sphere</div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>Admin Panel</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_LINKS.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-white/15"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              <Icon size={18} className="flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/20">
          <Link href="/" className="text-xs hover:opacity-80 transition-opacity"
            style={{ color: "rgba(255,255,255,0.5)" }}>
            &larr; View Public Site
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto" style={{ background: "#0f172a" }}>
        {children}
      </main>
    </div>
  );
}
