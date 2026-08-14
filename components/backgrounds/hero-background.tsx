"use client";

import { useReducedMotion } from "motion/react";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

const LiquidEther = dynamic(() => import("./liquid-ether"), {
  ssr: false,
});

const liquidPalettes: Record<"light" | "dark", string[]> = {
  light: ["#0ea5e9", "#8b5cf6", "#ec4899"],
  dark: ["#22d3ee", "#8b5cf6", "#f472b6"],
};

const subscribeToMount = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function HeroBackground() {
  const { resolvedTheme } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const mounted = useSyncExternalStore(
    subscribeToMount,
    getClientSnapshot,
    getServerSnapshot
  );
  const theme = resolvedTheme === "dark" ? "dark" : "light";
  const canRenderCanvas = mounted && !prefersReducedMotion;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-background"
    >
      <div className="hero-liquid-fallback absolute inset-0" />
      {canRenderCanvas ? (
        <LiquidEther
          colors={liquidPalettes[theme]}
          mouseForce={14}
          cursorSize={90}
          iterationsPoisson={20}
          resolution={0.4}
          isViscous={false}
          autoDemo
          autoSpeed={0.35}
          autoIntensity={1.4}
          autoResumeDelay={1600}
        />
      ) : null}
      <div className="hero-liquid-overlay absolute inset-0" />
    </div>
  );
}
