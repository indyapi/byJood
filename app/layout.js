import Navbar from "@/components/Navbar";
import { TranslationsProvider } from "@/lib/TranslationsProvider";
import { ThemeProvider } from "@/lib/ThemeProvider";

export const metadata = {
  title: "byJood — Social Poster",
  description: "Manage and schedule posts across multiple social media platforms",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>
        <TranslationsProvider>
          <ThemeProvider>
            <div className="bokeh-bg">
              <div className="bokeh bokeh-1" />
              <div className="bokeh bokeh-2" />
              <div className="bokeh bokeh-3" />
              <div className="bokeh bokeh-4" />
              <div className="bokeh bokeh-5" />
            </div>
            <Navbar />
            <main className="main-content">
              {children}
            </main>
            <style>{`
              * { box-sizing: border-box; margin: 0; padding: 0; }

              /* ────────────────────────────────────────────────
                 Semantic Color System — Purple Glassmorphism
                 Primary 60% (bg) · Secondary 30% (surface) · Accent 10% (#5631D1)
                 Dark is the default theme (see ThemeProvider).
                 ──────────────────────────────────────────────── */

              /* ── Dark (default) ── */
              :root {
                /* Background */
                --bg: #0F0E18;
                --bg-secondary: #171626;
                /* Glass */
                --glass: rgba(32,30,54,.45);
                --glass-border: rgba(255,255,255,.10);
                /* Surface */
                --surface: #1E1B33;
                --surface-hover: #292541;
                /* Primary */
                --primary: #7A5AF8;
                --primary-hover: #8B70FF;
                --primary-active: #6846F4;
                /* Text */
                --text: #F7F6FF;
                --text-secondary: #CAC4E8;
                --text-muted: #9C96BE;
                /* Border / State */
                --border: rgba(255,255,255,.08);
                --success: #3ECF8E;
                --warning: #F8C34A;
                --error: #FF6B81;
                --info: #6AA8FF;
                /* Shadow */
                --shadow: 0 12px 40px rgba(0,0,0,.45);

                /* Badges (soft bg + readable text) */
                --hover-bg: rgba(255,255,255,.07);
                --badge-success-bg: rgba(62,207,142,.15);
                --badge-success-text: #3ECF8E;
                --badge-failed-bg: rgba(255,107,129,.15);
                --badge-failed-text: #FF6B81;
                --badge-pending-bg: rgba(248,195,74,.15);
                --badge-pending-text: #F8C34A;
                --badge-queued-bg: rgba(106,168,255,.15);
                --badge-queued-text: #6AA8FF;

                /* Table (Post History) */
                --table-bg: #17162A;
                --table-row-alt: #1F1D38;
                --table-hover: #262345;
                --table-border: rgba(255,255,255,.08);
                --table-text: #F7F6FF;
                --table-muted: #9C96BE;

                /* Gradients & glow (brand tokens) */
                --gradient-hero: linear-gradient(135deg, #5631D1 0%, #7A5AF8 50%, #A58CFF 100%);
                --gradient-btn: linear-gradient(180deg, #6E49E7, #5631D1);
                --glow-accent: radial-gradient(circle, rgba(122,90,248,.35), transparent 70%);

                /* ── Legacy aliases (consumed by components) ── */
                --glass-bg: var(--glass);
                --glass-bg-light: rgba(32,30,54,.30);
                --glass-bg-dark: rgba(20,18,36,.85);
                --glass-border-light: rgba(255,255,255,.16);
                --glass-border-accent: rgba(122,90,248,.30);
                --glass-shadow: var(--shadow);
                --glass-blur: 20px;
                --glass-blur-lg: 24px;
                --bokeh-1: #7A5AF8;
                --bokeh-2: #5631D1;
                --bokeh-3: #A58CFF;
                --bokeh-4: #67E8F9;
                --bokeh-5: #FF79C6;
                --text-heading: #FFFFFF;
                --text-dim: var(--text-muted);
                --accent: var(--primary);
                --accent-dim: rgba(122,90,248,.14);
                --accent-hover: var(--primary-hover);
                --danger: var(--error);
                --modal-overlay: rgba(0,0,0,.60);
                --overlay: rgba(0,0,0,.45);
                --bg-body: var(--bg);
                --radius: 16px;
                --radius-sm: 10px;
                --font: 'Inter', -apple-system, sans-serif;
                --font-mono: 'IBM Plex Mono', monospace;
                --font-display: 'Space Grotesk', sans-serif;
              }

              /* ── Light (desktop) ── */
              [data-desktop-theme="light"] {
                /* Background — true white */
                --bg: #FFFFFF;
                --bg-secondary: #FAFAFC;
                /* Glass — clean white glass */
                --glass: rgba(255,255,255,.72);
                --glass-hover: rgba(255,255,255,.82);
                --glass-border: rgba(255,255,255,.65);
                /* Surface */
                --surface: #FFFFFF;
                --surface-hover: #F7F7F9;
                /* Primary — purple as accent only */
                --primary: #5631D1;
                --primary-hover: #6845E2;
                --primary-active: #4325B5;
                /* Text — warm-neutral, Linear-like */
                --text: #171717;
                --text-secondary: #5F5F6B;
                --text-muted: #8F8F99;
                /* Border / State */
                --border: #ECECF3;
                --success: #2DBE7F;
                --warning: #F4B740;
                --error: #EB5757;
                --info: #3B82F6;
                /* Shadow — soft, diffused */
                --shadow: 0 10px 35px rgba(20,20,20,.08);

                /* Badges (soft tint + saturated text) */
                --hover-bg: #F7F7F9;
                --badge-success-bg: #DCFCE7;
                --badge-success-text: #15803D;
                --badge-failed-bg: #FEE2E2;
                --badge-failed-text: #B91C1C;
                --badge-pending-bg: #FEF9C3;
                --badge-pending-text: #A16207;
                --badge-queued-bg: #EFF6FF;
                --badge-queued-text: #1D4ED8;

                /* Table (Post History) */
                --table-bg: #FFFFFF;
                --table-row-alt: #E7E5FE;
                --table-hover: #F8FAFC;
                --table-border: #E2E8F0;
                --table-text: #0F172A;
                --table-muted: #64748B;

                /* Legacy aliases */
                --glass-bg: var(--glass);
                --glass-bg-light: rgba(255,255,255,.72);
                --glass-bg-dark: rgba(255,255,255,.92);
                --glass-border-light: rgba(255,255,255,.65);
                --glass-border-accent: rgba(86,49,209,.18);
                --glass-shadow: var(--shadow);
                --bokeh-1: #C9BDFF;
                --bokeh-2: #A58CFF;
                --bokeh-3: #E4DCFE;
                --bokeh-4: #67E8F9;
                --bokeh-5: #FFC9EC;
                --text-heading: #171717;
                --text-dim: #8F8F99;
                --accent: var(--primary);
                --accent-dim: rgba(86,49,209,.08);
                --accent-hover: var(--primary-hover);
                --danger: var(--error);
                --modal-overlay: rgba(23,23,23,.22);
                --overlay: rgba(255,255,255,.50);
                --bg-body: var(--bg);
              }

              /* ── Mobile theme override ── */
              @media (max-width: 720px) {
                [data-mobile-theme="light"] {
                  --bg: #FFFFFF;
                  --bg-secondary: #FAFAFC;
                  --glass: rgba(255,255,255,.72);
                  --glass-hover: rgba(255,255,255,.82);
                  --glass-border: rgba(255,255,255,.65);
                  --surface: #FFFFFF;
                  --surface-hover: #F7F7F9;
                  --primary: #5631D1;
                  --primary-hover: #6845E2;
                  --primary-active: #4325B5;
                  --text: #171717;
                  --text-secondary: #5F5F6B;
                  --text-muted: #8F8F99;
                  --border: #ECECF3;
                  --success: #2DBE7F;
                  --warning: #F4B740;
                  --error: #EB5757;
                  --info: #3B82F6;
                  --shadow: 0 10px 35px rgba(20,20,20,.08);
                  --hover-bg: #F7F7F9;
                  --badge-success-bg: #DCFCE7;
                  --badge-success-text: #15803D;
                  --badge-failed-bg: #FEE2E2;
                  --badge-failed-text: #B91C1C;
                  --badge-pending-bg: #FEF9C3;
                  --badge-pending-text: #A16207;
                  --badge-queued-bg: #EFF6FF;
                  --badge-queued-text: #1D4ED8;
                  --table-bg: #FFFFFF;
                  --table-row-alt: #E7E5FE;
                  --table-hover: #F8FAFC;
                  --table-border: #E2E8F0;
                  --table-text: #0F172A;
                  --table-muted: #64748B;
                  --glass-bg: var(--glass);
                  --glass-bg-light: rgba(255,255,255,.72);
                  --glass-bg-dark: rgba(255,255,255,.92);
                  --glass-border-light: rgba(255,255,255,.65);
                  --glass-border-accent: rgba(86,49,209,.18);
                  --glass-shadow: var(--shadow);
                  --bokeh-1: #C9BDFF;
                  --bokeh-2: #A58CFF;
                  --bokeh-3: #E4DCFE;
                  --bokeh-4: #67E8F9;
                  --bokeh-5: #FFC9EC;
                  --text-heading: #171717;
                  --text-dim: #8F8F99;
                  --accent: var(--primary);
                  --accent-dim: rgba(86,49,209,.08);
                  --accent-hover: var(--primary-hover);
                  --danger: var(--error);
                  --modal-overlay: rgba(23,23,23,.22);
                  --overlay: rgba(255,255,255,.50);
                  --bg-body: var(--bg);
                }
                [data-mobile-theme="dark"][data-desktop-theme="light"] {
                  --bg: #0F0E18;
                  --bg-secondary: #171626;
                  --glass: rgba(32,30,54,.45);
                  --glass-border: rgba(255,255,255,.10);
                  --surface: #1E1B33;
                  --surface-hover: #292541;
                  --primary: #7A5AF8;
                  --primary-hover: #8B70FF;
                  --primary-active: #6846F4;
                  --text: #F7F6FF;
                  --text-secondary: #CAC4E8;
                  --text-muted: #9C96BE;
                  --border: rgba(255,255,255,.08);
                  --success: #3ECF8E;
                  --warning: #F8C34A;
                  --error: #FF6B81;
                  --info: #6AA8FF;
                  --shadow: 0 12px 40px rgba(0,0,0,.45);
                  --hover-bg: rgba(255,255,255,.07);
                  --badge-success-bg: rgba(62,207,142,.15);
                  --badge-success-text: #3ECF8E;
                  --badge-failed-bg: rgba(255,107,129,.15);
                  --badge-failed-text: #FF6B81;
                  --badge-pending-bg: rgba(248,195,74,.15);
                  --badge-pending-text: #F8C34A;
                  --badge-queued-bg: rgba(106,168,255,.15);
                  --badge-queued-text: #6AA8FF;
                  --table-bg: #17162A;
                  --table-row-alt: #1F1D38;
                  --table-hover: #262345;
                  --table-border: rgba(255,255,255,.08);
                  --table-text: #F7F6FF;
                  --table-muted: #9C96BE;
                  --glass-bg: var(--glass);
                  --glass-bg-light: rgba(32,30,54,.30);
                  --glass-bg-dark: rgba(20,18,36,.85);
                  --glass-border-light: rgba(255,255,255,.16);
                  --glass-border-accent: rgba(122,90,248,.30);
                  --glass-shadow: var(--shadow);
                  --bokeh-1: #7A5AF8;
                  --bokeh-2: #5631D1;
                  --bokeh-3: #A58CFF;
                  --bokeh-4: #67E8F9;
                  --bokeh-5: #FF79C6;
                  --text-heading: #FFFFFF;
                  --text-dim: var(--text-muted);
                  --accent: var(--primary);
                  --accent-dim: rgba(122,90,248,.14);
                  --accent-hover: var(--primary-hover);
                  --danger: var(--error);
                  --modal-overlay: rgba(0,0,0,.60);
                  --overlay: rgba(0,0,0,.45);
                  --bg-body: var(--bg);
                }
              }

              html, body { height: 100%; }
              body {
                background: var(--bg-body);
                color: var(--text);
                font-family: var(--font);
                -webkit-font-smoothing: antialiased;
                position: relative;
                transition: background .25s, color .25s;
              }
              h1, h2, h3, h4, h5, h6 { color: var(--text-heading); font-weight: 600; }
              a { color: inherit; text-decoration: none; }
              .bokeh-bg {
                position: fixed;
                inset: 0;
                z-index: 0;
                pointer-events: none;
                overflow: hidden;
              }
              .bokeh {
                position: absolute;
                border-radius: 50%;
                filter: blur(80px);
                opacity: .5;
              }
              .bokeh-1 { width: 400px; height: 400px; background: var(--bokeh-1); top: -8%; left: -5%; }
              .bokeh-2 { width: 320px; height: 320px; background: var(--bokeh-2); bottom: 10%; right: -3%; }
              .bokeh-3 { width: 260px; height: 260px; background: var(--bokeh-3); top: 40%; left: 55%; }
              .bokeh-4 { width: 200px; height: 200px; background: var(--bokeh-4); top: 15%; right: 25%; }
              .bokeh-5 { width: 280px; height: 280px; background: var(--bokeh-5); bottom: 30%; left: 10%; }
              .main-content {
                position: relative;
                z-index: 1;
                padding-bottom: 0;
              }
              .theme-root { transition: background .25s; }

              /* ── Light Pastel (non-dashboard pages) — desktop ── */
              @media (min-width: 721px) {
                [data-desktop-theme="light"] :is(.gl-nav, .gl-mobile-top, .gl-mob-drawer, .gl-mob-overlay, .gl-hero, .gl-section, .gl-section-alt, .gl-footer, .gl-about, .gl-guide-wrap, .gl-auth-page, .gl-cr) {
                  --bg: #F8FAFC;
                  --bg-secondary: #F1F5F9;
                  --glass: #FFFFFF;
                  --glass-border: #E2E8F0;
                  --surface: #FFFFFF;
                  --surface-hover: #F1F5F9;
                  --primary: #4F46E5;
                  --primary-hover: #6366F1;
                  --primary-active: #4338CA;
                  --text: #0F172A;
                  --text-secondary: #334155;
                  --text-muted: #64748B;
                  --border: #E2E8F0;
                  --success: #16A34A;
                  --warning: #F59E0B;
                  --error: #DC2626;
                  --info: #2563EB;
                  --shadow: 0 1px 3px rgba(0,0,0,.05);
                  --glass-bg: #FFFFFF;
                  --glass-bg-light: #F1F5F9;
                  --glass-bg-dark: #FFFFFF;
                  --glass-border-light: #E2E8F0;
                  --glass-border-accent: rgba(79,70,229,.20);
                  --glass-shadow: var(--shadow);
                  --bokeh-1: #C7D2FE;
                  --bokeh-2: #A5B4FC;
                  --bokeh-3: #DDD6FE;
                  --bokeh-4: #BFDBFE;
                  --bokeh-5: #FBCFE8;
                  --text-heading: #0F172A;
                  --text-dim: #64748B;
                  --accent: #4F46E5;
                  --accent-dim: rgba(79,70,229,.08);
                  --accent-hover: #6366F1;
                  --danger: #DC2626;
                  --glow-accent: radial-gradient(circle, rgba(79,70,229,.16), transparent 70%);
                  --modal-overlay: rgba(15,23,42,.25);
                  --overlay: rgba(255,255,255,.60);
                  --bg-body: #F8FAFC;
                  --gradient-btn: linear-gradient(180deg, #6366F1, #4F46E5);
                }
                [data-desktop-theme="light"] .gl-nav,
                [data-desktop-theme="light"] .gl-mobile-top,
                [data-desktop-theme="light"] .gl-mob-drawer {
                  background: #FFFFFF;
                  border-color: #E2E8F0;
                }
                [data-desktop-theme="light"] .gl-footer {
                  background: #F1F5F9;
                  border-top-color: #E2E8F0;
                }
                [data-desktop-theme="light"] .gl-hero::after {
                  background:
                    radial-gradient(circle at 50% 30%, rgba(79,70,229,.12), transparent 70%),
                    linear-gradient(135deg, #F8FAFC, #F1F5F9, #F8FAFC, #C7D2FE);
                }
              }

              /* ── Light Pastel (non-dashboard pages) — mobile ── */
              @media (max-width: 720px) {
                [data-mobile-theme="light"] :is(.gl-nav, .gl-mobile-top, .gl-mob-drawer, .gl-mob-overlay, .gl-hero, .gl-section, .gl-section-alt, .gl-footer, .gl-about, .gl-guide-wrap, .gl-auth-page, .gl-cr) {
                  --bg: #F8FAFC;
                  --bg-secondary: #F1F5F9;
                  --glass: #FFFFFF;
                  --glass-border: #E2E8F0;
                  --surface: #FFFFFF;
                  --surface-hover: #F1F5F9;
                  --primary: #4F46E5;
                  --primary-hover: #6366F1;
                  --primary-active: #4338CA;
                  --text: #0F172A;
                  --text-secondary: #334155;
                  --text-muted: #64748B;
                  --border: #E2E8F0;
                  --success: #16A34A;
                  --warning: #F59E0B;
                  --error: #DC2626;
                  --info: #2563EB;
                  --shadow: 0 1px 3px rgba(0,0,0,.05);
                  --glass-bg: #FFFFFF;
                  --glass-bg-light: #F1F5F9;
                  --glass-bg-dark: #FFFFFF;
                  --glass-border-light: #E2E8F0;
                  --glass-border-accent: rgba(79,70,229,.20);
                  --glass-shadow: var(--shadow);
                  --bokeh-1: #C7D2FE;
                  --bokeh-2: #A5B4FC;
                  --bokeh-3: #DDD6FE;
                  --bokeh-4: #BFDBFE;
                  --bokeh-5: #FBCFE8;
                  --text-heading: #0F172A;
                  --text-dim: #64748B;
                  --accent: #4F46E5;
                  --accent-dim: rgba(79,70,229,.08);
                  --accent-hover: #6366F1;
                  --danger: #DC2626;
                  --glow-accent: radial-gradient(circle, rgba(79,70,229,.16), transparent 70%);
                  --modal-overlay: rgba(15,23,42,.25);
                  --overlay: rgba(255,255,255,.60);
                  --bg-body: #F8FAFC;
                  --gradient-btn: linear-gradient(180deg, #6366F1, #4F46E5);
                }
                [data-mobile-theme="light"] .gl-nav,
                [data-mobile-theme="light"] .gl-mobile-top,
                [data-mobile-theme="light"] .gl-mob-drawer {
                  background: #FFFFFF;
                  border-color: #E2E8F0;
                }
                [data-mobile-theme="light"] .gl-footer {
                  background: #F1F5F9;
                  border-top-color: #E2E8F0;
                }
                [data-mobile-theme="light"] .gl-hero::after {
                  background:
                    radial-gradient(circle at 50% 30%, rgba(79,70,229,.12), transparent 70%),
                    linear-gradient(135deg, #F8FAFC, #F1F5F9, #F8FAFC, #C7D2FE);
                }
              }
              @media (max-width: 720px) {
                .main-content { padding: 52px 0 0; }
              }
            `}</style>
          </ThemeProvider>
        </TranslationsProvider>
      </body>
    </html>
  );
}
