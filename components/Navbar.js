"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/TranslationsProvider";
import { useTheme } from "@/lib/ThemeProvider";
import LangSwitcher from "./LangSwitcher";
import { Home, Info, LayoutDashboard, User, Sun, Moon, Monitor, Smartphone } from "lucide-react";

const NAV_ITEMS_DESKTOP = [
  { href: "/about", label: "about" },
  { href: "/control-room", label: "controlRoom" },
];

const DOCK_ITEMS = [
  { href: "/", icon: Home, label: "home" },
  { href: "/about", icon: Info, label: "about" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { desktopTheme, mobileTheme, setDesktopTheme, setMobileTheme } = useTheme();
  const [authed, setAuthed] = useState(false);
  const [showDesktopTheme, setShowDesktopTheme] = useState(false);

  useEffect(() => {
    import("@/lib/supabase-client").then(({ createClientSupabase }) => {
      createClientSupabase().auth.getSession().then(({ data: { session } }) => {
        setAuthed(!!session);
      });
    });
  }, []);

  const isDashboard = pathname?.startsWith("/dashboard");
  if (isDashboard) return null;

  const toggleDesktopTheme = () => setDesktopTheme(desktopTheme === "dark" ? "light" : "dark");
  const toggleMobileTheme = () => setMobileTheme(mobileTheme === "dark" ? "light" : "dark");

  return (
    <>
      <nav className="navbar">
        <div className="nav-inner">
          <Link href="/" className="logo">
            <span className="logo-icon">bJ</span>
            <div className="logo-titles">
              <span className="logo-text">{t("common.appName")}</span>
              <span className="logo-sub">{t("common.appTagline")}</span>
            </div>
          </Link>

          <div className="nav-links">
            {NAV_ITEMS_DESKTOP.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${pathname === item.href ? "active" : ""}`}
              >
                {t(`nav.${item.label}`)}
              </Link>
            ))}
            <div className="nav-divider" />
            {authed ? (
              <Link href="/dashboard" className="btn btn-nav">{t("nav.controlRoom")}</Link>
            ) : (
              <>
                <Link href="/sign-in" className="nav-link">{t("nav.signIn")}</Link>
                <Link href="/sign-up" className="btn btn-nav">{t("nav.signUp")}</Link>
              </>
            )}

            <div className="theme-group">
              <button
                className="theme-toggle"
                onClick={() => setShowDesktopTheme((p) => !p)}
                aria-label="Theme settings"
              >
                {desktopTheme === "dark" ? <Moon size={15} /> : <Sun size={15} />}
              </button>
              {showDesktopTheme && (
                <div className="theme-popover">
                  <div className="theme-pop-item">
                    <Monitor size={14} />
                    <span>Desktop</span>
                    <button className="theme-chip" onClick={toggleDesktopTheme}>
                      {desktopTheme === "dark" ? <Moon size={12} /> : <Sun size={12} />}
                      {desktopTheme === "dark" ? "Dark" : "Light"}
                    </button>
                  </div>
                  <div className="theme-pop-item">
                    <Smartphone size={14} />
                    <span>Mobile</span>
                    <button className="theme-chip" onClick={toggleMobileTheme}>
                      {mobileTheme === "dark" ? <Moon size={12} /> : <Sun size={12} />}
                      {mobileTheme === "dark" ? "Dark" : "Light"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <LangSwitcher />
          </div>
        </div>
      </nav>

      <nav className="dock">
        {DOCK_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`dock-item ${isActive ? "active" : ""}`}
            >
              <div className="dock-icon-wrap">
                <Icon size={20} />
              </div>
              <span className="dock-label">{t(`nav.${item.label}`)}</span>
            </Link>
          );
        })}

        {authed ? (
          <Link href="/dashboard" className={`dock-item ${pathname === "/dashboard" ? "active" : ""}`}>
            <div className="dock-icon-wrap">
              <LayoutDashboard size={20} />
            </div>
            <span className="dock-label">{t("nav.controlRoom")}</span>
          </Link>
        ) : (
          <Link href="/sign-in" className="dock-item">
            <div className="dock-icon-wrap">
              <User size={20} />
            </div>
            <span className="dock-label">{t("nav.signIn")}</span>
          </Link>
        )}

        <div className="dock-divider" />

        <button className="dock-item dock-theme" onClick={toggleDesktopTheme} aria-label="Toggle desktop theme">
          <div className="dock-icon-wrap">
            {desktopTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </div>
          <span className="dock-label">D</span>
        </button>

        <button className="dock-item dock-theme" onClick={toggleMobileTheme} aria-label="Toggle mobile theme">
          <div className="dock-icon-wrap">
            {mobileTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </div>
          <span className="dock-label">M</span>
        </button>

        <div className="dock-divider" />
        <LangSwitcher />
      </nav>

      <style>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: rgba(14,16,22,.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border);
        }
        .nav-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 28px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .logo-icon {
          width: 30px;
          height: 30px;
          border-radius: var(--radius-sm);
          background: var(--accent);
          color: #0c1210;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo-titles { display: flex; flex-direction: column; line-height: 1.15; }
        .logo-text {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 15px;
          color: var(--text);
        }
        .logo-sub {
          font-family: var(--font-mono);
          font-size: 8.5px;
          letter-spacing: .08em;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .nav-link {
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 500;
          padding: 7px 12px;
          border-radius: var(--radius-sm);
          transition: color .15s, background .15s;
        }
        .nav-link:hover { color: var(--text); background: var(--surface-hover); }
        .nav-link.active { color: var(--accent); background: var(--accent-dim); }
        .nav-divider {
          width: 1px; height: 18px;
          background: var(--border);
          margin: 0 6px;
        }
        .btn-nav {
          display: inline-flex;
          align-items: center;
          padding: 7px 14px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 600;
          background: var(--accent);
          color: #0c1210;
          margin-left: 2px;
          transition: filter .15s;
        }
        .btn-nav:hover { filter: brightness(1.1); }

        .theme-group { position: relative; margin-left: 6px; }
        .theme-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px; height: 32px;
          border-radius: var(--radius-sm);
          border: none;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          transition: color .15s, background .15s;
        }
        .theme-toggle:hover { color: var(--text); background: var(--surface-hover); }
        .theme-popover {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 170px;
          z-index: 50;
          box-shadow: 0 8px 24px rgba(0,0,0,.4);
        }
        .theme-pop-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--text-secondary);
        }
        .theme-pop-item span:first-of-type { flex: 1; }
        .theme-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 20px;
          border: 1px solid var(--border);
          background: var(--surface-hover);
          color: var(--text);
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
        }
        .theme-chip:hover { border-color: var(--accent); }

        .dock { display: none; }

        @media (max-width: 720px) {
          .navbar { display: none; }

          .dock {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 2px;
            position: fixed;
            bottom: 12px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 100;
            background: rgba(26,30,38,.88);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 6px 10px;
            box-shadow: 0 4px 24px rgba(0,0,0,.5);
          }
          .dock-item {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 2px;
            padding: 8px 12px;
            border-radius: 14px;
            color: var(--text-muted);
            text-decoration: none;
            transition: color .15s, background .15s;
            background: none;
            border: none;
            cursor: pointer;
            font-family: inherit;
            min-width: 48px;
          }
          .dock-item:hover { color: var(--text); background: var(--surface-hover); }
          .dock-item.active { color: var(--accent); }
          .dock-item.active .dock-icon-wrap { background: var(--accent-dim); }
          .dock-icon-wrap {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background .15s;
          }
          .dock-label {
            font-size: 9px;
            font-weight: 500;
            letter-spacing: .02em;
          }
          .dock-divider {
            width: 1px;
            height: 28px;
            background: var(--border);
            margin: 0 2px;
          }
          .dock .lang-switcher {
            margin: 0;
            padding: 0 4px;
            border: none;
          }
          .dock .lang-btn {
            font-size: 10px;
            padding: 4px 5px;
          }
        }
      `}</style>
    </>
  );
}
