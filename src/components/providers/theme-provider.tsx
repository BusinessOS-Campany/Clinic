"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import {
  THEME_MEDIA_QUERY,
  THEME_STORAGE_KEY,
  THEMES,
  type ResolvedTheme,
  type Theme,
} from "@/lib/theme";

export type { ResolvedTheme, Theme } from "@/lib/theme";

type ThemeContextValue = {
  themes: Theme[];
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

function systemTheme(): ResolvedTheme {
  return window.matchMedia(THEME_MEDIA_QUERY).matches ? "dark" : "light";
}

function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === "system" ? systemTheme() : theme;
}

function readStoredTheme(storageKey: string, fallback: Theme): Theme {
  try {
    const stored = window.localStorage.getItem(storageKey);
    return isTheme(stored) ? stored : fallback;
  } catch {
    return fallback;
  }
}

function applyTheme(theme: Theme) {
  const resolved = resolveTheme(theme);
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

const TRANSITION_BLOCKER_ID = "theme-transition-blocker";

function createTransitionBlocker(): HTMLStyleElement {
  const existing = document.getElementById(TRANSITION_BLOCKER_ID);
  if (existing) return existing as HTMLStyleElement;
  const style = document.createElement("style");
  style.id = TRANSITION_BLOCKER_ID;
  style.textContent =
    "*,::before,::after{transition-property:none!important;animation-duration:0s!important}";
  document.head.appendChild(style);
  return style;
}

export function ThemeProvider({
  children,
  storageKey = THEME_STORAGE_KEY,
  defaultTheme = "system",
  disableTransitionOnChange = false,
}: {
  children: React.ReactNode;
  storageKey?: string;
  defaultTheme?: Theme;
  disableTransitionOnChange?: boolean;
}) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  const sync = useCallback(
    (next: Theme) => {
      setThemeState(next);
      setResolvedTheme(resolveTheme(next));
      applyTheme(next);
    },
    [],
  );

  useLayoutEffect(() => {
    sync(readStoredTheme(storageKey, defaultTheme));
  }, [sync, storageKey, defaultTheme]);

  useEffect(() => {
    const media = window.matchMedia(THEME_MEDIA_QUERY);
    const onSystemChange = () => {
      setThemeState((current) => {
        if (current !== "system") return current;
        const resolved = resolveTheme("system");
        setResolvedTheme(resolved);
        applyTheme("system");
        return current;
      });
    };
    media.addEventListener("change", onSystemChange);
    return () => media.removeEventListener("change", onSystemChange);
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      setThemeState((current) => {
        const next = isTheme(event.newValue) ? event.newValue : defaultTheme;
        setResolvedTheme(resolveTheme(next));
        applyTheme(next);
        return next;
      });
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [storageKey, defaultTheme]);

  const setTheme = useCallback(
    (next: Theme) => {
      try {
        window.localStorage.setItem(storageKey, next);
      } catch {
        // storage unavailable, keep the in-memory value
      }
      const style = disableTransitionOnChange
        ? createTransitionBlocker()
        : null;
      sync(next);
      if (style) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => style.remove());
        });
      }
    },
    [sync, storageKey, disableTransitionOnChange],
  );

  const value = useMemo(
    () => ({ themes: THEMES, theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside <ThemeProvider>");
  }
  return ctx;
}