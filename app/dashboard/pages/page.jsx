"use client";

import Dashboard from "@/components/Dashboard";
import AuthGuard from "@/components/AuthGuard";

export default function ManagePagesPage() {
  return (
    <div className="dashboard-root">
      <AuthGuard><Dashboard mode="pages" /></AuthGuard>
      <style>{`
        .dashboard-root {
          position: fixed;
          inset: 0;
          z-index: 50;
        }
      `}</style>
    </div>
  );
}
