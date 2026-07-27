import Navbar from "@/components/Navbar";
import { TranslationsProvider } from "@/lib/TranslationsProvider";
import { ThemeProvider } from "@/lib/ThemeProvider";

export const metadata = {
  title: "byJood — Social Poster",
  description: "Manage and schedule posts across multiple social media platforms",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>
        <TranslationsProvider>
          <ThemeProvider>
            <Navbar />
            <main className="main-content">
              {children}
            </main>
            <style>{`
              * { box-sizing: border-box; margin: 0; padding: 0; }
              :root {
                --bg: #0e1016;
                --bg-alt: #14171d;
                --surface: #1a1e26;
                --surface-hover: #20242e;
                --border: #2a2f3a;
                --text: #e8eaef;
                --text-secondary: #8b93a3;
                --text-muted: #5c6270;
                --accent: #4fd1c5;
                --accent-dim: rgba(79,209,197,.1);
                --radius: 12px;
                --radius-sm: 8px;
                --font: 'Inter', -apple-system, sans-serif;
                --font-mono: 'IBM Plex Mono', monospace;
                --font-display: 'Space Grotesk', sans-serif;
              }
              html, body { height: 100%; }
              body {
                background: var(--bg);
                color: var(--text);
                font-family: var(--font);
                -webkit-font-smoothing: antialiased;
              }
              a { color: inherit; text-decoration: none; }
              .main-content { padding-bottom: 0; }
              @media (max-width: 720px) {
                .main-content { padding-bottom: 72px; }
              }
            `}</style>
          </ThemeProvider>
        </TranslationsProvider>
      </body>
    </html>
  );
}
