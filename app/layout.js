import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Social Poster",
  description: "Manage and schedule posts across multiple social media platforms",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>
        <Navbar />
        {children}
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
