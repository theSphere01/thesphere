import type { Metadata, Viewport } from "next";
import PWARegister from "@/components/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Sphere — Play. Earn. Win.",
  description:
    "11 worlds of adventure at WellSpring's The Sphere in Sahel, Egypt. Earn points, collect badges, and climb the Play League leaderboard.",
  keywords: ["The Sphere", "WellSpring", "Sahel", "children", "activity", "gamification", "Egypt"],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "The Sphere",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
    icon: [
      { url: "/icons/sphere-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/sphere-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#FF6B47",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body style={{ background: "var(--color-dark)", color: "var(--color-surface)", minHeight: "100vh", overflowX: "hidden", maxWidth: "100vw" }}>
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
