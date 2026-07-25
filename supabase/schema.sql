-- ==========================================================
-- Social Poster: Supabase Schema
-- รันใน Supabase SQL Editor
-- ==========================================================

-- 1. ผู้ใช้เชื่อมเพจ/บัญชีของแพลตฟอร์มใดบ้าง
create table pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  platform text not null check (platform in ('facebook','instagram','tiktok','threads','website')),
  external_page_id text not null,       -- page id / account id ของแพลตฟอร์มนั้นๆ
  display_name text,
  is_active boolean default true,
  created_at timestamptz default now(),
  unique (user_id, platform, external_page_id)
);

-- 2. Token แยกออกจาก pages เพื่อให้ refresh/rotate ได้อิสระ และจำกัดสิทธิ์เข้าถึงเข้มกว่า
create table page_tokens (
  id uuid primary key default gen_random_uuid(),
  page_id uuid references pages(id) on delete cascade not null,
  platform text not null,
  app_id text,                          -- App ID / Client Key ของแพลตฟอร์ม
  app_secret text,                      -- App Secret / Client Secret ของแพลตฟอร์ม
  access_token text not null,           -- Page access token / API key
  refresh_token text,
  webhook_url text,                     -- ใช้เฉพาะ platform = 'website'
  expires_at timestamptz,
  updated_at timestamptz default now(),
  unique (page_id, platform)
);

-- 3. คิวโพสต์ที่ผู้ใช้ตั้งเวลาไว้
create table scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  page_id uuid references pages(id) not null,
  platform text not null,
  content text not null,
  media_urls text[] default '{}',       -- ลิงก์ไฟล์ใน Supabase Storage
  scheduled_at timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending','queued','posted','failed')),
  created_at timestamptz default now()
);

create index idx_scheduled_posts_due
  on scheduled_posts (status, scheduled_at)
  where status = 'pending';

-- 4. Log ผลลัพธ์การโพสต์จริง (1 แถวต่อ 1 ครั้งที่ consumer พยายามโพสต์)
create table post_logs (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references scheduled_posts(id) on delete cascade,
  page_id uuid references pages(id),
  platform text not null,
  success boolean not null,
  external_post_id text,
  error_message text,
  created_at timestamptz default now()
);

-- 5. เก็บ state ชั่วคราวตอนทำ OAuth กัน CSRF (ลบทิ้งทันทีหลัง callback สำเร็จ)
create table oauth_states (
  state text primary key,
  user_id uuid references auth.users(id),
  platform text not null,
  created_at timestamptz default now()
);

-- ควรตั้ง cron ลบ state ที่ค้างเกิน 10 นาที (กันโดนสวมรอยด้วย state เก่า)
-- select cron.schedule('cleanup-oauth-states', '*/10 * * * *',
--   $$ delete from oauth_states where created_at < now() - interval '10 minutes' $$);

-- ==========================================================
-- Row Level Security: ผู้ใช้เห็นเฉพาะข้อมูลของตัวเอง
-- Worker ใช้ service_role key จึงข้าม RLS ได้อัตโนมัติ (ปลอดภัย เพราะรันฝั่ง server เท่านั้น)
-- ==========================================================
alter table pages enable row level security;
alter table page_tokens enable row level security;
alter table scheduled_posts enable row level security;
alter table post_logs enable row level security;

create policy "user reads own pages" on pages
  for select using (auth.uid() = user_id);
create policy "user manages own pages" on pages
  for all using (auth.uid() = user_id);

create policy "user reads own scheduled_posts" on scheduled_posts
  for select using (auth.uid() = user_id);
create policy "user manages own scheduled_posts" on scheduled_posts
  for all using (auth.uid() = user_id);

create policy "user reads own logs" on post_logs
  for select using (
    exists (select 1 from scheduled_posts sp where sp.id = post_logs.post_id and sp.user_id = auth.uid())
  );

-- page_tokens: ไม่เปิด policy ให้ client อ่านเลย (เข้าถึงได้เฉพาะผ่าน service_role ใน Worker เท่านั้น)

alter table oauth_states enable row level security;
create policy "user manages own oauth_states" on oauth_states
  for all using (auth.uid() = user_id);

-- ==========================================================
-- Profiles: sync user metadata from auth.users
-- ==========================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  username text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "users read own profile" on profiles
  for select using (auth.uid() = id);
create policy "users update own profile" on profiles
  for all using (auth.uid() = id);

-- Auto-create profile row on auth.users insert
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, username, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
