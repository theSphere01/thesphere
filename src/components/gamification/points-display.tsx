"use client";
import { motion, useMotionValue, animate, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

interface Props {
  value: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  color?: string;
}

const SIZE_MAP = {
  sm: { number: "2rem",  label: "0.75rem" },
  md: { number: "3rem",  label: "0.875rem" },
  lg: { number: "5rem",  label: "1.125rem" },
};

export default function PointsDisplay({ value, label = "POINTS", size = "md", color }: Props) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => Math.round(v).toLocaleString());
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    const controls = animate(motionValue, value, {
      duration: 1.5,
      ease: "easeOut",
    });
    return () => controls.stop();
  }, [value, motionValue]);

  const fontSize = SIZE_MAP[size];
  const numberColor = color ?? "var(--color-sphere-coral)";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
      <motion.span
        style={{
          fontSize: fontSize.number,
          fontWeight: 900,
          color: numberColor,
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.02em",
          animation: "countUp 0.4s ease-out both",
        }}
      >
        {rounded}
      </motion.span>
      {label && (
        <span
          style={{
            fontSize: fontSize.label,
            fontWeight: 700,
            color: "var(--color-sphere-gold)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
