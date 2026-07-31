"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientSupabase } from "@/lib/supabase-client";
import { useTranslation } from "@/lib/TranslationsProvider";

export default function AuthGuard({ children }) {
  const router = useRouter();
  const { t } = useTranslation();
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
        background: "var(--bg-body)",
        color: "var(--text-muted)",
        fontFamily: "var(--font)",
        fontSize: "14px",
      }}>
        <span style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>{t("common.loading").toUpperCase()}</span>
      </div>
    );
  }

  return children;
}
