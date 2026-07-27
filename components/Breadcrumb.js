"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const DEFAULT_LABELS = {
  "": "Home",
  about: "About",
  "sign-in": "Sign In",
  "sign-up": "Sign Up",
  profile: "Profile",
  dashboard: "Dashboard",
  "control-room": "Control Room",
  guide: "Guide",
};

export default function Breadcrumb({ paths, className = "" }) {
  const pathname = usePathname();

  const segments = paths || (() => {
    const parts = pathname.split("/").filter(Boolean);
    return parts.map((part, i) => {
      const href = "/" + parts.slice(0, i + 1).join("/");
      const label = DEFAULT_LABELS[part] || decodeURIComponent(part.replace(/-/g, " "));
      return { label: label.charAt(0).toUpperCase() + label.slice(1), href };
    });
  })();

  if (segments.length === 0) return null;

  return (
    <nav className={`gl-breadcrumb ${className}`}>
      <Link href="/" className="gl-bc-home" aria-label="Home">
        <Home size={13} />
      </Link>
      {segments.map((seg, i) => (
        <span key={seg.href} className="gl-bc-seg">
          <ChevronRight size={11} className="gl-bc-chevron" />
          {i === segments.length - 1 ? (
            <span className="gl-bc-current">{seg.label}</span>
          ) : (
            <Link href={seg.href} className="gl-bc-link">{seg.label}</Link>
          )}
        </span>
      ))}
      <style>{`
        .gl-breadcrumb {
          display: flex;
          align-items: center;
          gap: 2px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .gl-bc-home {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          transition: color .15s;
          padding: 4px;
        }
        .gl-bc-home:hover { color: var(--accent); }
        .gl-bc-seg {
          display: inline-flex;
          align-items: center;
          gap: 2px;
        }
        .gl-bc-chevron {
          color: var(--text-muted);
          opacity: .5;
        }
        .gl-bc-link {
          font-size: 12px;
          color: var(--text-muted);
          text-decoration: none;
          transition: color .15s;
          padding: 4px 4px;
        }
        .gl-bc-link:hover { color: var(--accent); }
        .gl-bc-current {
          font-size: 12px;
          color: var(--text-secondary);
          font-weight: 500;
          padding: 4px 4px;
        }
      `}</style>
    </nav>
  );
}
