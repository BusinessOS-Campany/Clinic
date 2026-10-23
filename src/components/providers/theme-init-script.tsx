"use client";

import { useEffect } from "react";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

export function ThemeInitScript() {
  useEffect(() => {
    const script = document.createElement("script");
    script.innerHTML = THEME_INIT_SCRIPT;
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return null;
}