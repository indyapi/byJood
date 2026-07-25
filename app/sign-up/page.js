"use client";

import { useState } from "react";
import Link from "next/link";
import { createClientSupabase } from "@/lib/supabase-client";

export default function SignUpPage() {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleEmailSignUp(e) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }
    if (password.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    setLoading(true);
    const supabase = createClientSupabase();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName, username },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      alert("ตรวจสอบอีเมลของคุณเพื่อยืนยันการสมัคร");
      window.location.href = "/sign-in";
    }
  }

  async function handleGoogleSignUp() {
    setLoading(true);
    setError("");
    const supabase = createClientSupabase();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <main className="pg">
      <div className="auth-card">
        <span className="auth-badge">SIGN UP</span>
        <h1 className="auth-title">สมัครสมาชิก</h1>
        <p className="auth-sub">มีบัญชีแล้ว? <Link href="/sign-in" className="auth-link">เข้าสู่ระบบ</Link></p>

        <button className="btn-social" onClick={handleGoogleSignUp} disabled={loading}>
          <GoogleIcon />
          สมัครสมาชิกด้วย Google
        </button>

        <div className="divider"><span>หรือ</span></div>

        <form className="auth-form" onSubmit={handleEmailSignUp}>
          <div className="field">
            <label className="field-label">ชื่อที่แสดง</label>
            <input className="input" type="text" placeholder="Your Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
          </div>
          <div className="field">
            <label className="field-label">ชื่อผู้ใช้</label>
            <input className="input" type="text" placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="field">
            <label className="field-label">อีเมล</label>
            <input className="input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label className="field-label">รหัสผ่าน</label>
            <input className="input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="field">
            <label className="field-label">ยืนยันรหัสผ่าน</label>
            <input className="input" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
          {error && <span className="auth-error">{error}</span>}
          <button type="submit" className="btn-submit" disabled={loading}>{loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}</button>
        </form>

        <Link href="/" className="back-link-auth">← กลับหน้าแรก</Link>
      </div>

      <style>{`
        .pg { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 100px 28px 60px; }
        .auth-card { width: 100%; max-width: 380px; background: #1a1e26; border: 1px solid #2a2f3a; border-radius: 14px; padding: 32px; }
        .auth-badge { font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: 0.14em; color: #4fd1c5; }
        .auth-title { font-family: 'Space Grotesk', sans-serif; font-size: 24px; font-weight: 700; margin: 6px 0 4px; }
        .auth-sub { font-size: 13px; color: #8b93a3; margin-bottom: 20px; }
        .auth-link { color: #4fd1c5; text-decoration: none; }
        .auth-link:hover { text-decoration: underline; }
        .auth-error { font-size: 12px; color: #f2795c; }

        .btn-social {
          width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;
          padding: 11px; border-radius: 8px; background: #20242e; border: 1px solid #2a2f3a;
          color: #e8eaef; font-size: 13.5px; font-weight: 500; cursor: pointer;
          transition: background 0.15s;
        }
        .btn-social:hover { background: #2a2f3a; }
        .btn-social:disabled { opacity: 0.5; cursor: not-allowed; }

        .divider { display: flex; align-items: center; gap: 12px; margin: 16px 0; color: #5c6270; font-size: 12px; }
        .divider::before, .divider::after { content: ""; flex: 1; height: 1px; background: #2a2f3a; }

        .auth-form { display: flex; flex-direction: column; gap: 14px; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field-label { font-size: 12px; color: #8b93a3; }
        .input { width: 100%; background: #20242e; border: 1px solid #2a2f3a; border-radius: 8px; padding: 10px 12px; color: #e8eaef; font-size: 13.5px; font-family: 'Inter', sans-serif; outline: none; }
        .input:focus { border-color: #4fd1c5; }
        .btn-submit { width: 100%; padding: 11px; border-radius: 8px; background: #4fd1c5; color: #0c1210; font-size: 14px; font-weight: 600; border: none; cursor: pointer; }
        .btn-submit:hover { filter: brightness(1.08); }
        .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        .back-link-auth { display: block; text-align: center; margin-top: 20px; color: #5c6270; text-decoration: none; font-size: 13px; }
        .back-link-auth:hover { color: #8b93a3; }
      `}</style>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
