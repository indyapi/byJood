import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <main className="hero">
        <div className="hero-bg" />
        <div className="hero-content">
          <span className="hero-badge">v0.1 — Cloudflare + Supabase</span>
          <h1 className="hero-title">
            โพสต์ทุกแพลตฟอร์ม<br />
            <span className="hero-accent">จากที่เดียว</span>
          </h1>
          <p className="hero-sub">
            จัดการโพสต์ไปยัง Facebook, Instagram, TikTok, Threads และ Website ของคุณ
            พร้อมกันหลายเพจ โดยไม่เจอ timeout — ขับเคลื่อนด้วย Cloudflare Queue Fan-Out
          </p>
          <div className="hero-actions">
            <Link href="/sign-up" className="btn-primary-lg">เริ่มต้นใช้งาน</Link>
            <Link href="/about" className="btn-ghost-lg">ดูเพิ่มเติม</Link>
          </div>
          <div className="hero-platforms">
            {["FACEBOOK", "INSTAGRAM", "TIKTOK", "THREADS", "WEBSITE"].map((p) => (
              <span key={p} className="platform-tag">{p}</span>
            ))}
          </div>
        </div>
      </main>

      <section className="section">
        <div className="section-inner">
          <h2 className="section-title">ทำงานอย่างไร</h2>
          <div className="steps">
            <div className="step">
              <span className="step-num">01</span>
              <h3>เชื่อมต่อเพจ</h3>
              <p>เพิ่ม Access Token ของแต่ละแพลตฟอร์มผ่าน Dashboard หรือ OAuth</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <span className="step-num">02</span>
              <h3>ตั้งเวลาโพสต์</h3>
              <p>เลือกเพจ เนื้อหา และเวลาที่ต้องการให้ระบบโพสต์อัตโนมัติ</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <span className="step-num">03</span>
              <h3>Fan-Out</h3>
              <p>Cron Trigger ทุก 5 นาทีดึงโพสต์ที่ถึงเวลา ส่งเข้า queue แยกตามเพจ</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <span className="step-num">04</span>
              <h3>โพสต์อัตโนมัติ</h3>
              <p>Consumer โพสต์ทีละเพจแบบอิสระ ถ้าเพจไหนพลาด retry อัตโนมัติ</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="section-inner">
          <div className="split">
            <div>
              <span className="section-badge">FAN-OUT PATTERN</span>
              <h2 className="section-title">ไม่ใช่แค่ scheduler ทั่วไป</h2>
              <p className="section-body">
                โปรเจคนี้แก้ปัญหา real-world ที่ระบบโพสต์ทั่วไปเจอ —
                ยิ่งมีเพจมาก ยิ่ง timeout. Fan-out pattern แยก 1 โพสต์
                เป็น N queue message (1 ต่อเพจ) แต่ละ message มี timeout,
                retry, และ dead-letter queue ของตัวเอง ไม่แชร์กัน.
              </p>
            </div>
            <div className="arch-card">
              <div className="arch-line">
                <span className="arch-dot green" />
                Cron */5 * * * *
              </div>
              <div className="arch-line">
                <span className="arch-dot blue" />
                enqueueDuePosts()
              </div>
              <div className="arch-line">
                <span className="arch-dot yellow" />
                Queue post-jobs
              </div>
              <div className="arch-line">
                <span className="arch-dot purple" />
                Consumer → Platform API
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-inner">
          <span>Social Poster — Built with Next.js + Cloudflare Workers + Supabase</span>
        </div>
      </footer>

      <style>{`
        .hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 100px 28px 80px;
          overflow: hidden;
        }
        .hero-bg {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 600px 400px at 50% 40%, rgba(79,209,197,0.08), transparent);
          pointer-events: none;
        }
        .hero-content {
          position: relative;
          max-width: 700px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }
        .hero-badge {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.12em;
          color: #8b93a3;
          background: #1a1e26;
          border: 1px solid #2a2f3a;
          padding: 6px 14px;
          border-radius: 20px;
        }
        .hero-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: clamp(36px, 6vw, 58px);
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.02em;
        }
        .hero-accent { color: #4fd1c5; }
        .hero-sub {
          font-size: 15px;
          line-height: 1.7;
          color: #8b93a3;
          max-width: 540px;
        }
        .hero-actions {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }
        .btn-primary-lg {
          display: inline-flex;
          align-items: center;
          padding: 12px 28px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          background: #4fd1c5;
          color: #0c1210;
          transition: filter 0.15s;
        }
        .btn-primary-lg:hover { filter: brightness(1.08); }
        .btn-ghost-lg {
          display: inline-flex;
          align-items: center;
          padding: 12px 28px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          background: transparent;
          color: #8b93a3;
          border: 1px solid #2a2f3a;
          transition: color 0.15s, border-color 0.15s;
        }
        .btn-ghost-lg:hover { color: #e8eaef; border-color: #5c6270; }
        .hero-platforms {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
          margin-top: 12px;
        }
        .platform-tag {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.08em;
          color: #5c6270;
          background: #1a1e26;
          border: 1px solid #2a2f3a;
          padding: 5px 12px;
          border-radius: 6px;
        }

        .section {
          padding: 80px 28px;
          border-top: 1px solid #2a2f3a;
        }
        .section-alt { background: #14171d; }
        .section-inner {
          max-width: 1000px;
          margin: 0 auto;
        }
        .section-badge {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10.5px;
          letter-spacing: 0.14em;
          color: #4fd1c5;
        }
        .section-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 28px;
          font-weight: 600;
          margin: 6px 0 16px;
        }
        .section-body {
          color: #8b93a3;
          font-size: 14.5px;
          line-height: 1.7;
          max-width: 520px;
        }

        .steps {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-top: 30px;
        }
        .step {
          flex: 1;
          background: #1a1e26;
          border: 1px solid #2a2f3a;
          border-radius: 12px;
          padding: 22px;
        }
        .step-num {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: #4fd1c5;
          opacity: 0.4;
        }
        .step h3 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 15px;
          margin: 8px 0 6px;
        }
        .step p {
          font-size: 12.5px;
          color: #8b93a3;
          line-height: 1.6;
        }
        .step-arrow {
          color: #5c6270;
          font-size: 20px;
          padding-top: 24px;
        }

        .split {
          display: flex;
          align-items: center;
          gap: 50px;
        }
        .arch-card {
          background: #1a1e26;
          border: 1px solid #2a2f3a;
          border-radius: 12px;
          padding: 22px 26px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          min-width: 240px;
        }
        .arch-line {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #8b93a3;
        }
        .arch-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .arch-dot.green { background: #5fd068; }
        .arch-dot.blue { background: #3d7df6; }
        .arch-dot.yellow { background: #f2b84b; }
        .arch-dot.purple { background: #a78bfa; }

        .footer {
          border-top: 1px solid #2a2f3a;
          padding: 20px 28px;
        }
        .footer-inner {
          max-width: 1000px;
          margin: 0 auto;
          text-align: center;
          font-size: 12px;
          color: #5c6270;
        }

        @media (max-width: 720px) {
          .steps { flex-direction: column; }
          .step-arrow { transform: rotate(90deg); padding: 4px 0; align-self: center; }
          .split { flex-direction: column; gap: 30px; }
        }
      `}</style>
    </>
  );
}
