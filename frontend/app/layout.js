export const metadata = {
  title: "Social Poster",
  description: "Manage and schedule posts across multiple social media platforms",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
