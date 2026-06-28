"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, Search, UserPlus } from "lucide-react";
import { getActiveProfileSession } from "@/lib/profile-session";

export default function ProfileLandingPage() {
  const router = useRouter();
  const [profileId, setProfileId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const activeProfile = getActiveProfileSession();
    if (activeProfile) router.replace("/dashboard");
  }, [router]);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const id = profileId.trim();
    if (!id) {
      setError("Please enter a profile ID");
      return;
    }
    router.push(`/profile/${id}`);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-dark)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>Profile</div>

      <h1 style={{ color: "var(--color-sphere-coral)", fontWeight: 900, fontSize: "clamp(1.75rem, 6vw, 2.5rem)", marginBottom: "0.5rem" }}>
        Your Profile
      </h1>
      <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "1rem", marginBottom: "1.5rem", maxWidth: 360 }}>
        Open your profile with the parent phone number used during registration.
      </p>

      <Link
        href="/login"
        className="tap-target"
        style={{
          width: "100%",
          maxWidth: 360,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "0.9rem",
          borderRadius: 14,
          background: "linear-gradient(135deg, #FF6B47, #E55A38)",
          color: "white",
          textDecoration: "none",
          fontWeight: 800,
          fontSize: "1rem",
          marginBottom: "1rem",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <LogIn size={18} /> Open With Phone
      </Link>

      <div style={{ margin: "0.75rem 0 1rem", color: "rgba(255,255,255,0.28)", fontSize: "0.82rem" }}>
        Have a direct profile ID?
      </div>

      <form onSubmit={handleLookup} style={{ width: "100%", maxWidth: 360 }}>
        <input
          type="text"
          value={profileId}
          onChange={(e) => {
            setProfileId(e.target.value);
            setError("");
          }}
          placeholder="Enter your profile ID..."
          style={{
            width: "100%",
            padding: "0.9rem 1.25rem",
            borderRadius: 14,
            border: "2px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.07)",
            color: "white",
            fontSize: 16,
            marginBottom: "0.75rem",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        {error && <p style={{ color: "var(--color-sphere-coral)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>{error}</p>}
        <button
          type="submit"
          className="tap-target"
          style={{
            width: "100%",
            padding: "0.9rem",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.16)",
            background: "rgba(255,255,255,0.07)",
            color: "rgba(255,255,255,0.88)",
            fontWeight: 700,
            fontSize: "1rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <Search size={18} /> View Profile ID
        </button>
      </form>

      <div style={{ margin: "2rem 0", color: "rgba(255,255,255,0.2)", fontSize: "0.85rem" }}>or</div>

      <Link
        href="/register"
        className="tap-target"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "0.9rem 2rem",
          borderRadius: 14,
          border: "2px solid rgba(255,255,255,0.15)",
          color: "rgba(255,255,255,0.8)",
          textDecoration: "none",
          fontWeight: 600,
          fontSize: "0.95rem",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <UserPlus size={18} /> Register as a New Camper
      </Link>
    </div>
  );
}
