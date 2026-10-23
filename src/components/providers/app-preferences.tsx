"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Accent = "teal" | "ocean" | "sage" | "plum" | "gold";
export type Density = "comfortable" | "compact";

export type AppPreferences = {
  accent: Accent;
  density: Density;
  sidebarCollapsed: boolean;
};

const STORAGE_KEY = "clinicos-preferences";
const DEFAULTS: AppPreferences = {
  accent: "teal",
  density: "comfortable",
  sidebarCollapsed: false,
};

type PreferencesContextValue = AppPreferences & {
  setAccent: (accent: Accent) => void;
  setDensity: (density: Density) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function loadPreferences(): AppPreferences {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<AppPreferences>;
    return {
      accent: parsed.accent ?? DEFAULTS.accent,
      density: parsed.density ?? DEFAULTS.density,
      sidebarCollapsed: parsed.sidebarCollapsed ?? DEFAULTS.sidebarCollapsed,
    };
  } catch {
    return DEFAULTS;
  }
}

export function AppPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [prefs, setPrefs] = useState<AppPreferences>(loadPreferences);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.accent = prefs.accent;
    root.dataset.density = prefs.density;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs]);

  const setAccent = useCallback((accent: Accent) => {
    setPrefs((p) => ({ ...p, accent }));
  }, []);

  const setDensity = useCallback((density: Density) => {
    setPrefs((p) => ({ ...p, density }));
  }, []);

  const setSidebarCollapsed = useCallback((sidebarCollapsed: boolean) => {
    setPrefs((p) => ({ ...p, sidebarCollapsed }));
  }, []);

  const value = useMemo(
    () => ({ ...prefs, setAccent, setDensity, setSidebarCollapsed }),
    [prefs, setAccent, setDensity, setSidebarCollapsed],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function useAppPreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error(
      "useAppPreferences must be used inside <AppPreferencesProvider>",
    );
  }
  return ctx;
}