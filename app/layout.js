import Navbar from "@/components/Navbar";
import { TranslationsProvider } from "@/lib/TranslationsProvider";

export const metadata = {
  title: "byJood — Social Poster",
  description: "Manage and schedule posts across multiple social media platforms",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>
        <TranslationsProvider>
          <Navbar />
          {children}
        </TranslationsProvider>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            background: #12151b;
            color: #e8eaef;
            font-family: 'Inter', -apple-system, sans-serif;
            -webkit-font-smoothing: antialiased;
          }
          a { color: inherit; }
        `}</style>
      </body>
    </html>
  );
}
