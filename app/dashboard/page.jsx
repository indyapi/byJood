"use client";

import Dashboard from "@/components/Dashboard";
import AuthGuard from "@/components/AuthGuard";

export default function DashboardPage() {
  return (
    <div className="dashboard-root">
      <AuthGuard><Dashboard /></AuthGuard>
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
