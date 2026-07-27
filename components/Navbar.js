"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/TranslationsProvider";
import { useTheme } from "@/lib/ThemeProvider";
import LangSwitcher from "./LangSwitcher";
import { Home, LayoutDashboard, User, Monitor, Smartphone, Sun, Moon } from "lucide-react";

const NAV_ITEMS_DESKTOP = [
  { href: "/about", label: "about" },
  { href: "/control-room", label: "controlRoom" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { desktopTheme, mobileTheme, setDesktopTheme, setMobileTheme } = useTheme();
  const [authed, setAuthed] = useState(false);
  const [showDesktopTheme, setShowDesktopTheme] = useState(false);
  const [showMobileMore, setShowMobileMore] = useState(false);
  const moreRef = useRef(null);

  useEffect(() => {
    import("@/lib/supabase-client").then(({ createClientSupabase }) => {
      createClientSupabase().auth.getSession().then(({ data: { session } }) => {
        setAuthed(!!session);
      });
    });
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (showMobileMore && moreRef.current && !moreRef.current.contains(e.target)) {
        setShowMobileMore(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMobileMore]);

  const isDashboard = pathname?.startsWith("/dashboard");
  if (isDashboard) return null;

  const toggleDesktopTheme = () => setDesktopTheme(desktopTheme === "dark" ? "light" : "dark");
  const toggleMobileTheme = () => setMobileTheme(mobileTheme === "dark" ? "light" : "dark");

  const isActive = (href) => pathname === href;
  const dtIcon = desktopTheme === "dark" ? Moon : Sun;
  const mtIcon = mobileTheme === "dark" ? Moon : Sun;

  return (
    <>
      <nav className="gl-nav">
        <div className="gl-nav-inner">
          <Link href="/" className="gl-logo">
            <span className="gl-logo-glass">bJ</span>
            <div className="gl-logo-text">
              <span className="gl-logo-title">byJood</span>
              <span className="gl-logo-sub">Social Poster</span>
            </div>
          </Link>

          <div className="gl-nav-links">
            {NAV_ITEMS_DESKTOP.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`gl-nav-link ${isActive(item.href) ? "active" : ""}`}
              >
                {t(`nav.${item.label}`)}
              </Link>
            ))}
            <div className="gl-nav-divider" />
            {authed ? (
              <Link href="/dashboard" className="gl-btn">{t("nav.controlRoom")}</Link>
            ) : (
              <>
                <Link href="/sign-in" className="gl-nav-link">{t("nav.signIn")}</Link>
                <Link href="/sign-up" className="gl-btn gl-btn-primary">{t("nav.signUp")}</Link>
              </>
            )}

            <div className="gl-theme-group">
              <button
                className="gl-icon-btn"
                onClick={() => setShowDesktopTheme((p) => !p)}
                aria-label="Theme settings"
              >
                {desktopTheme === "dark" ? <Moon size={13} /> : <Sun size={13} />}
              </button>
              {showDesktopTheme && (
                <div className="gl-theme-pop">
                  <div className="gl-theme-row">
                    <Monitor size={13} />
                    <span>Desktop</span>
                    <button className="gl-theme-chip" onClick={toggleDesktopTheme}>
                      {desktopTheme === "dark" ? "Dark Pastel" : "Light Pastel"}
                    </button>
                  </div>
                  <div className="gl-theme-row">
                    <Smartphone size={13} />
                    <span>Mobile</span>
                    <button className="gl-theme-chip" onClick={toggleMobileTheme}>
                      {mobileTheme === "dark" ? "Dark Pastel" : "Light Pastel"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="gl-nav-divider" />
            <LangSwitcher />
          </div>
        </div>
      </nav>

      <nav className="gl-mobile-top">
        <Link href="/" className="gl-mob-logo">
          <span className="gl-logo-glass">bJ</span>
        </Link>
        <div className="gl-mob-top-right">
          <button
            className="gl-icon-btn"
            onClick={toggleMobileTheme}
            aria-label="Toggle theme"
          >
            {mobileTheme === "dark" ? <Moon size={14} /> : <Sun size={14} />}
          </button>
          <button
            className="gl-hamburger"
            onClick={() => setShowMobileMore((p) => !p)}
            aria-label="Menu"
          >
            <span className={`gl-ham-line ${showMobileMore ? "open" : ""}`} />
          </button>
        </div>
      </nav>

      {showMobileMore && <div className="gl-mob-overlay" onClick={() => setShowMobileMore(false)} />}

      <div className={`gl-mob-drawer ${showMobileMore ? "open" : ""}`} ref={moreRef}>
        <div className="gl-mob-drawer-head">
          <Link href="/" className="gl-logo" onClick={() => setShowMobileMore(false)}>
            <span className="gl-logo-glass">bJ</span>
            <div className="gl-logo-text">
              <span className="gl-logo-title">byJood</span>
              <span className="gl-logo-sub">Social Poster</span>
            </div>
          </Link>
        </div>
        <div className="gl-mob-drawer-body">
          <Link href="/" className={`gl-mob-drawer-item ${isActive("/") ? "active" : ""}`} onClick={() => setShowMobileMore(false)}>
            <Home size={18} /> <span>{t("nav.home")}</span>
          </Link>
          <Link href="/about" className={`gl-mob-drawer-item ${isActive("/about") ? "active" : ""}`} onClick={() => setShowMobileMore(false)}>
            <span className="gl-mob-letter">i</span> <span>{t("nav.about")}</span>
          </Link>
          {authed ? (
            <Link href="/dashboard" className={`gl-mob-drawer-item ${isActive("/dashboard") ? "active" : ""}`} onClick={() => setShowMobileMore(false)}>
              <LayoutDashboard size={18} /> <span>{t("nav.controlRoom")}</span>
            </Link>
          ) : (
            <Link href="/sign-in" className="gl-mob-drawer-item" onClick={() => setShowMobileMore(false)}>
              <User size={18} /> <span>{t("nav.signIn")}</span>
            </Link>
          )}
          <Link href="/control-room" className={`gl-mob-drawer-item ${isActive("/control-room") ? "active" : ""}`} onClick={() => setShowMobileMore(false)}>
            <Monitor size={18} /> <span>{t("nav.controlRoom")}</span>
          </Link>
        </div>
        <div className="gl-mob-drawer-foot">
          <div className="gl-mob-drawer-label">Theme</div>
          <div className="gl-mob-drawer-row">
            <span>Desktop</span>
            <button className="gl-theme-chip" onClick={toggleDesktopTheme}>
              {desktopTheme === "dark" ? "Dark Pastel" : "Light Pastel"}
            </button>
          </div>
          <div className="gl-mob-drawer-row">
            <span>Mobile</span>
            <button className="gl-theme-chip" onClick={toggleMobileTheme}>
              {mobileTheme === "dark" ? "Dark Pastel" : "Light Pastel"}
            </button>
          </div>
          <div className="gl-mob-drawer-div" />
          <LangSwitcher />
        </div>
      </div>



      <style>{`
        .gl-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: var(--glass-bg-dark);
          backdrop-filter: blur(var(--glass-blur));
          -webkit-backdrop-filter: blur(var(--glass-blur));
          border-bottom: 1px solid var(--glass-border);
        }
        .gl-nav-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 24px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .gl-logo { display: flex; align-items: center; gap: 10px; }
        .gl-logo-glass {
          width: 32px; height: 32px;
          border-radius: var(--radius-sm);
          background: var(--glass-bg);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid var(--glass-border-accent);
          color: var(--accent);
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .gl-logo-text { display: flex; flex-direction: column; line-height: 1.15; }
        .gl-logo-title {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 15px;
          color: var(--text-heading);
        }
        .gl-logo-sub {
          font-family: var(--font-mono);
          font-size: 7.5px;
          letter-spacing: .12em;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .gl-nav-links { display: flex; align-items: center; gap: 4px; }
        .gl-nav-link {
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 500;
          padding: 7px 14px;
          border-radius: var(--radius-sm);
          transition: color .15s;
        }
        .gl-nav-link:hover { color: var(--text); }
        .gl-nav-link.active {
          color: var(--accent);
          background: var(--glass-bg);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid var(--glass-border-accent);
        }
        .gl-nav-divider {
          width: 1px;
          height: 18px;
          background: var(--glass-border);
          margin: 0 6px;
        }

        .gl-btn {
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 500;
          background: var(--glass-bg);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid var(--glass-border);
          transition: border-color .2s;
        }
        .gl-btn:hover { border-color: var(--glass-border-light); }
        .gl-btn-primary {
          background: var(--accent);
          color: #fff;
          border-color: var(--accent);
          margin-left: 4px;
        }
        .gl-btn-primary:hover { background: var(--accent-hover); border-color: var(--accent-hover); }

        .gl-theme-group { position: relative; margin-left: 6px; }
        .gl-icon-btn {
          width: 32px; height: 32px;
          border-radius: var(--radius-sm);
          background: var(--glass-bg);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid var(--glass-border);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color .2s;
          color: var(--text-secondary);
        }
        .gl-icon-btn:hover { border-color: var(--glass-border-light); color: var(--text); }
        .gl-theme-pop {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          background: var(--glass-bg-dark);
          backdrop-filter: blur(var(--glass-blur-lg));
          -webkit-backdrop-filter: blur(var(--glass-blur-lg));
          border: 1px solid var(--glass-border);
          border-radius: var(--radius);
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-width: 180px;
          z-index: 50;
        }
        .gl-theme-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--text-secondary);
        }
        .gl-theme-row span:first-of-type { flex: 1; }
        .gl-theme-chip {
          background: var(--glass-bg);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-sm);
          color: var(--text);
          font-family: var(--font);
          font-size: 11px;
          font-weight: 500;
          padding: 5px 12px;
          cursor: pointer;
          transition: border-color .15s;
        }
        .gl-theme-chip:hover { border-color: var(--accent); }

        .gl-mobile-top,
        .gl-mob-drawer,
        .gl-mob-overlay { display: none; }

        @media (max-width: 720px) {
          .gl-nav { display: none; }

          /* ── Top bar ── */
          .gl-mobile-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: fixed;
            top: 0; left: 0; right: 0;
            z-index: 100;
            height: 52px;
            padding: 0 16px;
            background: var(--glass-bg-dark);
            backdrop-filter: blur(var(--glass-blur));
            -webkit-backdrop-filter: blur(var(--glass-blur));
            border-bottom: 1px solid var(--glass-border);
          }
          .gl-mob-logo { display: flex; align-items: center; }
          .gl-mob-top-right { display: flex; align-items: center; gap: 6px; }
          .gl-hamburger {
            width: 38px; height: 38px;
            border-radius: var(--radius-sm);
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            transition: border-color .2s;
          }
          .gl-hamburger:hover { border-color: var(--glass-border-light); }
          .gl-ham-line,
          .gl-ham-line::before,
          .gl-ham-line::after {
            display: block;
            width: 16px;
            height: 2px;
            background: var(--text);
            border-radius: 1px;
            transition: transform .25s, opacity .25s;
          }
          .gl-ham-line::before,
          .gl-ham-line::after {
            content: '';
            position: absolute;
            left: 50%;
            margin-left: -8px;
          }
          .gl-ham-line::before { transform: translateY(-5px); }
          .gl-ham-line::after  { transform: translateY(5px); }
          .gl-ham-line.open { background: transparent; }
          .gl-ham-line.open::before { transform: rotate(45deg); }
          .gl-ham-line.open::after  { transform: rotate(-45deg); }

          /* ── Overlay ── */
          .gl-mob-overlay {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 90;
            background: var(--modal-overlay);
          }

          /* ── Drawer ── */
          .gl-mob-drawer {
            display: flex;
            flex-direction: column;
            position: fixed;
            top: 0; right: 0; bottom: 0;
            width: 280px;
            z-index: 110;
            background: var(--glass-bg-dark);
            backdrop-filter: blur(var(--glass-blur-lg));
            -webkit-backdrop-filter: blur(var(--glass-blur-lg));
            border-left: 1px solid var(--glass-border);
            padding: 20px 16px;
            transform: translateX(100%);
            transition: transform .25s ease;
          }
          .gl-mob-drawer.open { transform: translateX(0); }
          .gl-mob-drawer-head { margin-bottom: 20px; }
          .gl-mob-drawer-body { flex: 1; display: flex; flex-direction: column; gap: 2px; }
          .gl-mob-drawer-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 14px;
            border-radius: var(--radius-sm);
            color: var(--text-secondary);
            font-size: 14px;
            font-weight: 500;
            text-decoration: none;
            transition: background .1s, color .1s;
          }
          .gl-mob-drawer-item:hover { background: var(--glass-bg); color: var(--text); }
          .gl-mob-drawer-item.active { color: var(--accent); background: var(--glass-bg); }

          .gl-mob-drawer-foot { padding-top: 12px; display: flex; flex-direction: column; gap: 8px; }
          .gl-mob-drawer-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: .08em;
            color: var(--text-muted);
            font-family: var(--font-mono);
          }
          .gl-mob-drawer-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 13px;
            color: var(--text-secondary);
          }
          .gl-mob-drawer-chip-label { color: var(--text-secondary); font-size: 12px; }
          .gl-mob-drawer-div { height: 1px; background: var(--glass-border); margin: 4px 0; }
          .gl-mob-letter {
            font-family: var(--font-display);
            font-weight: 600;
            font-size: 16px;
            width: 18px;
            text-align: center;
          }
          .gl-mob-drawer .lang-switcher { margin: 0; padding: 0; border: none; }
          .gl-mob-drawer .lang-btn { font-size: 11px; padding: 4px 8px; }


        }
      `}</style>
    </>
  );
}
