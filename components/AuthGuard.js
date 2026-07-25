"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientSupabase } from "@/lib/supabase-client";

export default function AuthGuard({ children }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createClientSupabase();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/sign-in");
      } else {
        setChecking(false);
      }
    });
  }, [router]);

  if (checking) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#12151b",
        color: "#5c6270",
        fontFamily: "'Inter', sans-serif",
        fontSize: "14px",
      }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.08em" }}>LOADING...</span>
      </div>
    );
  }

  return children;
}
