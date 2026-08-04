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
  status text default 'active',         -- 'active' | 'expiring_soon' | 'expired' (เขียนตอนบันทึก token)
  updated_at timestamptz default now(),
  unique (page_id, platform)
);

-- 3. คิวโพสต์ที่ผู้ใช้ตั้งเวลาไว้
create table scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  page_id uuid references pages(id) on delete cascade not null,
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
  page_id uuid references pages(id) on delete cascade,
  platform text not null,
  success boolean not null,
  external_post_id text,
  error_message text,
  created_at timestamptz default now()
);

-- 5a. Post Groups — folders that group scheduled_posts into a single batch
create table post_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  name text not null,
  scheduled_at timestamptz not null,
  created_at timestamptz default now()
);

-- Detailed Meta API error fields written by the consumer (shown in the Logs UI)
alter table post_logs add column if not exists error_code text;
alter table post_logs add column if not exists error_type text;
alter table post_logs add column if not exists error_subcode text;

-- Instagram Business Account ID derived from Meta Graph API
alter table pages add column if not exists ig_business_account_id text;
comment on column pages.ig_business_account_id is 'Instagram Business Account ID derived from Meta Graph API';

-- Deleting a page must not fail because of child rows: cascade to the page's
-- scheduled posts and post logs (recreated idempotently for existing DBs).
alter table scheduled_posts drop constraint if exists scheduled_posts_page_id_fkey;
alter table scheduled_posts add constraint scheduled_posts_page_id_fkey
  foreign key (page_id) references pages(id) on delete cascade;
alter table post_logs drop constraint if exists post_logs_page_id_fkey;
alter table post_logs add constraint post_logs_page_id_fkey
  foreign key (page_id) references pages(id) on delete cascade;

-- Token status column added after initial deploy (idempotent for existing DBs)
alter table page_tokens add column if not exists status text default 'active';

-- Add missing column that the consumer already writes to
alter table scheduled_posts add column if not exists external_post_id text;
-- Store the real Facebook permalink after publish (optional; falls back to constructed URL)
alter table scheduled_posts add column if not exists permalink_url text;
-- Add group_id linking each post to its group folder
alter table scheduled_posts add column if not exists group_id uuid references post_groups(id) on delete set null;
-- Failure details written by the DLQ consumer when a job exhausts retries
alter table scheduled_posts add column if not exists error_message text;
alter table scheduled_posts add column if not exists failed_at timestamptz;
-- Manual retry rate limit (max 3 times / 1 hour) on failed posts
alter table scheduled_posts add column if not exists retry_count integer not null default 0;
alter table scheduled_posts add column if not exists last_retry_at timestamptz;
alter table scheduled_posts add column if not exists retry_window_start timestamptz;

alter table post_groups enable row level security;
create policy "user manages own post_groups" on post_groups
  for all using (auth.uid() = user_id);

create index idx_post_groups_date on post_groups (user_id, scheduled_at);

-- Manual retry rate limit (max 3 times / 1 hour) on failed groups
alter table post_groups add column if not exists retry_count integer not null default 0;
alter table post_groups add column if not exists last_retry_at timestamptz;
alter table post_groups add column if not exists retry_window_start timestamptz;

-- 5b. เก็บ state ชั่วคราวตอนทำ OAuth กัน CSRF (ลบทิ้งทันทีหลัง callback สำเร็จ)
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
-- 6. Folders — File-Explorer organization for pages
-- ==========================================================
create table folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  name text not null,
  parent_id uuid references folders(id) on delete cascade,
  is_favorite boolean not null default false,
  created_at timestamptz default now()
);

-- Organize pages into folders (nullable = root level)
alter table pages add column if not exists folder_id uuid references folders(id) on delete set null;
-- Star pages for the Favorites quick-access section
alter table pages add column if not exists is_favorite boolean not null default false;

create index idx_folders_user_parent on folders (user_id, parent_id);
create index idx_pages_folder on pages (user_id, folder_id);

alter table folders enable row level security;
create policy "user manages own folders" on folders
  for all using (auth.uid() = user_id);

-- ==========================================================
-- 7. AI Content Assistant — provider/api key/model per user
-- ==========================================================
create table if not exists ai_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  provider text not null default 'gemini'
    check (provider in ('gemini','openai','claude','custom')),
  api_key text,
  base_url text,                          -- ใช้เฉพาะ provider='custom' (OpenAI-compatible เช่น Groq, DeepSeek)
  model_name text not null default 'gemini-2.5-flash',
  updated_at timestamptz default now()
);

alter table ai_settings enable row level security;
create policy "users manage own ai_settings" on ai_settings
  for all using (auth.uid() = user_id);

-- ==========================================================
-- 8. Realtime — enable tables for live dashboard updates
--    (Worker/Queue เปลี่ยนข้อมูล → หน้า dashboard อัปเดตเอง)
--    RLS ยังบังคับใช้กับ realtime (ผู้ใช้เห็นเฉพาะแถวของตัวเอง)
-- ==========================================================
do $$
declare tbl text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach tbl in array array['scheduled_posts','post_groups','post_logs','pages','folders']
    loop
      begin
        execute format('alter publication supabase_realtime add table %I', tbl);
      exception when duplicate_object then null;
      end;
    end loop;
  end if;
end $$;

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
