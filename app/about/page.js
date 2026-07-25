import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="pg">
      <div className="pg-inner">
        <span className="pg-badge">ABOUT</span>
        <h1 className="pg-title">Social Poster คืออะไร?</h1>

        <p className="pg-body">
          Social Poster เป็นระบบโพสต์อัตโนมัติข้ามแพลตฟอร์ม สำหรับธุรกิจหรือ
          Content Creator ที่ต้องจัดการหลายเพจในหลาย Social Media พร้อมกัน
        </p>

        <div className="cards">
          <div className="card-about">
            <h3>🎯 ปัญหาที่แก้</h3>
            <p>
              เดิมทีการโพสต์ทีละเพจใช้เวลามาก และถ้าใช้ฟังก์ชัน loop
              โพสต์ทุกเพจพร้อมกันจะเจอ timeout ยิ่งเพจมาก ยิ่งพัง
              Social Poster ใช้ Fan-Out Pattern แยก 1 เพจ = 1 Job
              ใน Queue — แต่ละ job อิสระต่อกัน
            </p>
          </div>
          <div className="card-about">
            <h3>⚙️ สถาปัตยกรรม</h3>
            <p>
              Next.js (OpenNext) + Cloudflare Workers + Queues + Supabase
              ทั้งโปรเจคอยู่ใน Cloudflare Ecosystem ทั้งหมด
              Frontend บน Cloudflare Pages, Job Runner เป็น Workers
              + Queues, Database และ Auth ใช้ Supabase
            </p>
          </div>
          <div className="card-about">
            <h3>🔐 ความปลอดภัย</h3>
            <p>
              OAuth ทุกแพลตฟอร์มมี state CSRF protection,
              Worker ใช้ service_role key เฉพาะฝั่ง server,
              หน้า Dashboard ไม่เก็บ token ฝั่ง client,
              มี RLS policy สำหรับ Supabase Auth
            </p>
          </div>
        </div>

        <Link href="/" className="back-link">← กลับหน้าแรก</Link>
      </div>

      <style>{`
        .pg { padding: 120px 28px 60px; min-height: 100vh; }
        .pg-inner { max-width: 700px; margin: 0 auto; }
        .pg-badge {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10.5px; letter-spacing: 0.14em;
          color: #4fd1c5;
        }
        .pg-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 36px; font-weight: 700;
          margin: 8px 0 20px;
        }
        .pg-body {
          color: #8b93a3; font-size: 15px; line-height: 1.7;
          margin-bottom: 40px;
        }
        .cards { display: flex; flex-direction: column; gap: 14px; }
        .card-about {
          background: #1a1e26; border: 1px solid #2a2f3a;
          border-radius: 12px; padding: 22px;
        }
        .card-about h3 { font-size: 16px; margin-bottom: 8px; }
        .card-about p { font-size: 13px; color: #8b93a3; line-height: 1.7; }
        .back-link {
          display: inline-block; margin-top: 32px;
          color: #4fd1c5; text-decoration: none; font-size: 14px;
        }
        .back-link:hover { text-decoration: underline; }
      `}</style>
    </main>
  );
}
