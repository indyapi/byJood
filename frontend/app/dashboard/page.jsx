// app/dashboard/page.jsx
// Server component เปล่าๆ ที่ทำหน้าที่แค่ render ตัว Client Component
// (ในเวอร์ชันจริง ควรดึง pages/posts/logs จาก Supabase ที่นี่ ผ่าน server component
// แล้วส่งเป็น props เข้า <Dashboard initialPages={...} /> แทนการ hardcode mock data ในตัว component)

import Dashboard from "@/components/Dashboard";

export default function DashboardPage() {
  return <Dashboard />;
}
