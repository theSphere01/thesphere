import Link from "next/link";

export default function Footer() {
  return (
    <footer
      style={{
        position: "relative",
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        borderTop: "3px solid rgba(245,196,0,0.3)",
        padding: "4rem 1.5rem 2.5rem",
        textAlign: "center",
        overflow: "hidden",
      }}
    >
      <style>{`
        .footer-link { color: rgba(255,255,255,0.7); text-decoration: none; font-size: 0.9rem; font-weight: 600; transition: all 0.2s; }
        .footer-link:hover { color: #F5C400; text-shadow: 0 0 12px rgba(245,196,0,0.5); }
      `}</style>

      {/* Background: real arch photo at low opacity */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "url(/photos/sphere-arch-hero.jpeg)",
        backgroundSize: "cover", backgroundPosition: "center top",
        opacity: 0.08, pointerEvents: "none",
      }} />
      {/* Brand pattern overlay */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "url(/images/sphere-pattern-gold.jpeg)",
        backgroundSize: "cover", backgroundPosition: "center",
        opacity: 0.04, pointerEvents: "none",
      }} />
      {/* Top gold accent line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: 3,
        background: "linear-gradient(90deg, transparent, #F5C400, #FF6B47, #F5C400, transparent)",
      }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
        {/* Sphere logo badge — large */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
          <img
            src="/images/sphere-logo-yellow.png"
            alt="The Sphere by WellSpring"
            style={{
              width: 96, height: 96, objectFit: "contain",
              filter: "drop-shadow(0 4px 20px rgba(245,196,0,0.5))",
            }}
          />
        </div>

        {/* WellSpring brand logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.5rem" }}>
          <img
            src="/images/ws-logo-brand.png"
            alt="WellSpring"
            style={{
              height: 28, width: "auto", objectFit: "contain",
              filter: "brightness(10) opacity(0.75)",
            }}
          />
        </div>

        <div style={{ fontSize: "0.8rem", color: "rgba(245,196,0,0.7)", letterSpacing: "0.15em", marginBottom: "2.5rem", textTransform: "uppercase", fontWeight: 600 }}>
          Live — from the Inside Out
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "2rem", flexWrap: "wrap", marginBottom: "2.5rem" }}>
          <Link href="/lands" className="footer-link">Explore Lands</Link>
          <Link href="/leaderboard" className="footer-link">Leaderboard</Link>
          <Link href="/register" className="footer-link">Register</Link>
          <Link href="/checkin" className="footer-link">Staff Check-In</Link>
          <Link href="/admin" className="footer-link">Admin</Link>
        </div>

        {/* Bottom divider */}
        <div style={{ borderTop: "1px solid rgba(245,196,0,0.15)", paddingTop: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <img src="/images/sphere-logo-yellow.png" alt="" style={{ height: 18, width: 18, objectFit: "contain", opacity: 0.5 }} />
          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.78rem" }}>
            © 2025 WellSpring Camps — Sahel, Egypt. All adventures reserved.
          </span>
          <img src="/images/sphere-logo-yellow.png" alt="" style={{ height: 18, width: 18, objectFit: "contain", opacity: 0.5 }} />
        </div>
      </div>
    </footer>
  );
}
