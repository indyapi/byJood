"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/about", label: "ABOUT" },
  { href: "/control-room", label: "CONTROL ROOM" },
];

export default function Navbar() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");

  if (isDashboard) return null;

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <Link href="/" className="logo">
          <span className="logo-icon">SP</span>
          <span className="logo-text">Social Poster</span>
        </Link>

        <div className="nav-links">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${pathname === item.href ? "active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
          <div className="nav-divider" />
          <Link href="/sign-in" className="nav-link">SIGN IN</Link>
          <Link href="/sign-up" className="btn btn-nav">SIGN UP</Link>
        </div>
      </div>

      <style>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: rgba(18, 21, 27, 0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #2a2f3a;
        }
        .nav-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 28px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .logo-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #4fd1c5;
          color: #0c1210;
          font-family: "Space Grotesk", sans-serif;
          font-weight: 700;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo-text {
          font-family: "Space Grotesk", sans-serif;
          font-weight: 600;
          font-size: 16px;
          color: #e8eaef;
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .nav-link {
          color: #8b93a3;
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          padding: 8px 14px;
          border-radius: 8px;
          transition: color 0.15s, background 0.15s;
        }
        .nav-link:hover {
          color: #e8eaef;
          background: #20242e;
        }
        .nav-link.active {
          color: #4fd1c5;
          background: rgba(79, 209, 197, 0.1);
        }
        .nav-divider {
          width: 1px;
          height: 20px;
          background: #2a2f3a;
          margin: 0 8px;
        }
        .btn-nav {
          display: inline-flex;
          align-items: center;
          padding: 7px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          background: #4fd1c5;
          color: #0c1210;
          margin-left: 4px;
          transition: filter 0.15s;
        }
        .btn-nav:hover {
          filter: brightness(1.1);
        }
        @media (max-width: 640px) {
          .nav-inner { padding: 0 16px; }
          .logo-text { display: none; }
          .nav-link { padding: 6px 10px; font-size: 12px; }
        }
      `}</style>
    </nav>
  );
}
