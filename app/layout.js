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

              /* ── Dark & Muted (default) ── */
              :root {
                --glass-bg: rgba(18, 16, 28, 0.82);
                --glass-bg-light: rgba(26, 24, 38, 0.7);
                --glass-bg-dark: rgba(10, 9, 16, 0.94);
                --glass-border: rgba(255,255,255,.04);
                --glass-border-light: rgba(255,255,255,.07);
                --glass-border-accent: rgba(130,120,170,.18);
                --glass-shadow: rgba(0,0,0,.45);
                --glass-blur: 14px;
                --glass-blur-lg: 24px;
                --bokeh-1: #7A6EA8;
                --bokeh-2: #6EA894;
                --bokeh-3: #A86E8A;
                --bokeh-4: #A8946E;
                --bokeh-5: #8E6EA8;
                --text: #E8E3F0;
                --text-heading: #F5F0FF;
                --text-secondary: rgba(232,227,240,.7);
                --text-muted: rgba(232,227,240,.35);
                --accent: #8B7EBD;
                --accent-dim: rgba(139,126,189,.12);
                --accent-hover: #6E5A9E;
                --success: #5a9d63;
                --warning: #c49440;
                --danger: #c96a50;
                --modal-overlay: rgba(0,0,0,.65);
                --overlay: rgba(0,0,0,.5);
                --bg-body: #0c0b12;
                --radius: 16px;
                --radius-sm: 10px;
                --font: 'Inter', -apple-system, sans-serif;
                --font-mono: 'IBM Plex Mono', monospace;
                --font-display: 'Space Grotesk', sans-serif;
              }

              /* ── Light (desktop) ── */
              [data-desktop-theme="light"] {
                --glass-bg: rgba(243,238,248,.72);
                --glass-bg-light: rgba(243,238,248,.82);
                --glass-bg-dark: rgba(243,238,248,.9);
                --glass-border: rgba(0,0,0,.05);
                --glass-border-light: rgba(0,0,0,.09);
                --glass-border-accent: rgba(110,68,255,.18);
                --bokeh-1: #D1C3E3;
                --bokeh-2: #ACA0BA;
                --bokeh-3: #C4B0F0;
                --bokeh-4: #ACA0BA;
                --bokeh-5: #D1C3E3;
                --text: #100D1A;
                --text-heading: #08070D;
                --text-secondary: #4D4855;
                --text-muted: rgba(77,72,85,.45);
                --accent: #6E44FF;
                --accent-dim: rgba(110,68,255,.1);
                --accent-hover: #5631D1;
                --success: #6E44FF;
                --warning: #ACA0BA;
                --danger: #605A69;
                --modal-overlay: rgba(30,25,38,.2);
                --overlay: rgba(255,255,255,.4);
                --bg-body: #FDFBFD;
              }

              /* ── Mobile theme override ── */
              @media (max-width: 720px) {
                [data-mobile-theme="light"] {
                  --glass-bg: rgba(243,238,248,.72);
                  --glass-bg-light: rgba(243,238,248,.82);
                  --glass-bg-dark: rgba(243,238,248,.9);
                  --glass-border: rgba(0,0,0,.05);
                  --glass-border-light: rgba(0,0,0,.09);
                  --glass-border-accent: rgba(110,68,255,.18);
                  --bokeh-1: #D1C3E3;
                  --bokeh-2: #ACA0BA;
                  --bokeh-3: #C4B0F0;
                  --bokeh-4: #ACA0BA;
                  --bokeh-5: #D1C3E3;
                  --text: #100D1A;
                  --text-heading: #08070D;
                  --text-secondary: #4D4855;
                  --text-muted: rgba(77,72,85,.45);
                  --accent: #6E44FF;
                  --accent-dim: rgba(110,68,255,.1);
                  --accent-hover: #5631D1;
                  --success: #6E44FF;
                  --warning: #ACA0BA;
                  --danger: #605A69;
                  --modal-overlay: rgba(30,25,38,.2);
                  --overlay: rgba(255,255,255,.4);
                  --bg-body: #FDFBFD;
                }
                [data-mobile-theme="dark"][data-desktop-theme="light"] {
                  --glass-bg: rgba(18, 16, 28, 0.82);
                  --glass-bg-light: rgba(26, 24, 38, 0.7);
                  --glass-bg-dark: rgba(10, 9, 16, 0.94);
                  --glass-border: rgba(255,255,255,.04);
                  --glass-border-light: rgba(255,255,255,.07);
                  --glass-border-accent: rgba(130,120,170,.18);
                  --bokeh-1: #7A6EA8;
                  --bokeh-2: #6EA894;
                  --bokeh-3: #A86E8A;
                  --bokeh-4: #A8946E;
                  --bokeh-5: #8E6EA8;
                  --text: #E8E3F0;
                  --text-heading: #F5F0FF;
                  --text-secondary: rgba(232,227,240,.7);
                  --text-muted: rgba(232,227,240,.35);
                  --accent: #8B7EBD;
                  --accent-dim: rgba(139,126,189,.12);
                  --accent-hover: #6E5A9E;
                  --success: #5a9d63;
                  --warning: #c49440;
                  --danger: #c96a50;
                  --modal-overlay: rgba(0,0,0,.65);
                  --overlay: rgba(0,0,0,.5);
                  --bg-body: #0c0b12;
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
