"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const ThemeContext = createContext(null);

const STORAGE_KEY_DESKTOP = "theme-desktop";
const STORAGE_KEY_MOBILE = "theme-mobile";

export function ThemeProvider({ children }) {
  const [desktopTheme, setDesktopThemeState] = useState("dark");
  const [mobileTheme, setMobileThemeState] = useState("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const dt = localStorage.getItem(STORAGE_KEY_DESKTOP);
    const mt = localStorage.getItem(STORAGE_KEY_MOBILE);
    if (dt === "light" || dt === "dark") setDesktopThemeState(dt);
    if (mt === "light" || mt === "dark") setMobileThemeState(mt);
    setReady(true);
  }, []);

  const setDesktopTheme = useCallback((theme) => {
    setDesktopThemeState(theme);
    localStorage.setItem(STORAGE_KEY_DESKTOP, theme);
  }, []);

  const setMobileTheme = useCallback((theme) => {
    setMobileThemeState(theme);
    localStorage.setItem(STORAGE_KEY_MOBILE, theme);
  }, []);

  if (!ready) return <div style={{ background: "#12151b", minHeight: "100vh" }} />;

  return (
    <ThemeContext.Provider value={{ desktopTheme, mobileTheme, setDesktopTheme, setMobileTheme }}>
      <div className="theme-root" data-desktop-theme={desktopTheme} data-mobile-theme={mobileTheme}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { desktopTheme: "dark", mobileTheme: "dark", setDesktopTheme: () => {}, setMobileTheme: () => {} };
  return ctx;
}
