"use client";

import { useEffect, useState, useCallback } from "react";
import { flushSync } from "react-dom";

export type Theme = "light" | "dark";

export function useTheme(): { theme: Theme; toggle: (e?: React.MouseEvent) => void } {
  const getSystemTheme = (): Theme =>
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";

  const [systemTheme, setSystemTheme] = useState<Theme>("light");
  const [override, setOverride] = useState<Theme | null>(null);

  useEffect(() => {
    const sys = getSystemTheme();
    setSystemTheme(sys);

    const stored = localStorage.getItem("theme-override") as Theme | null;
    if (stored === "light" || stored === "dark") setOverride(stored);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const theme = override ?? systemTheme;

  const toggle = useCallback((e?: React.MouseEvent) => {
    const next: Theme = theme === "dark" ? "light" : "dark";

    const updateTheme = () => {
      setOverride(next);
      localStorage.setItem("theme-override", next);
    };

    if (!("startViewTransition" in document) || !e) {
      updateTheme();
      return;
    }

    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = (document as any).startViewTransition(() => {
      flushSync(() => {
        updateTheme();
      });
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];

      document.documentElement.animate(
        { clipPath },
        {
          duration: 500,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  }, [theme]);

  return { theme, toggle };
}
