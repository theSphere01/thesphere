import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Sphere — Play. Earn. Win.",
    short_name: "The Sphere",
    description:
      "11 worlds of adventure at WellSpring's The Sphere in Sahel, Egypt. Earn points, collect badges, and climb the Play League leaderboard.",
    start_url: "/",
    display: "standalone",
    background_color: "#1a1a2e",
    theme_color: "#FF6B47",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/sphere-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/sphere-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/sphere-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
    categories: ["entertainment", "kids"],
    shortcuts: [
      {
        name: "My Profile",
        url: "/profile",
        description: "View your points, badges, and rank",
      },
      {
        name: "Explore Lands",
        url: "/lands",
        description: "See all 11 activity lands",
      },
      {
        name: "Leaderboard",
        url: "/leaderboard",
        description: "See who's on top this season",
      },
    ],
  };
}
