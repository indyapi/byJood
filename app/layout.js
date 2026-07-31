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
                --badge-success-bg: rgba(45,190,127,.12);
                --badge-success-text: #1E9E67;
                --badge-failed-bg: rgba(235,87,87,.12);
                --badge-failed-text: #D64545;
                --badge-pending-bg: rgba(244,183,64,.16);
                --badge-pending-text: #B9850A;
                --badge-queued-bg: rgba(86,49,209,.10);
                --badge-queued-text: #5631D1;

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
                  --badge-success-bg: rgba(45,190,127,.12);
                  --badge-success-text: #1E9E67;
                  --badge-failed-bg: rgba(235,87,87,.12);
                  --badge-failed-text: #D64545;
                  --badge-pending-bg: rgba(244,183,64,.16);
                  --badge-pending-text: #B9850A;
                  --badge-queued-bg: rgba(86,49,209,.10);
                  --badge-queued-text: #5631D1;
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
