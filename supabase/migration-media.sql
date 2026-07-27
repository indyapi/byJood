-- ==========================================================
-- Media Storage: bucket + table สำหรับอัปโหลดรูป/วิดีโอ
-- รันใน Supabase SQL Editor
-- ==========================================================

-- 1. สร้าง Storage bucket สำหรับ media โดยเฉพาะ (ไม่ public — ต้องผ่าน RLS)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  false,
  52428800,  -- 50 MB
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime']
)
on conflict (id) do nothing;

-- 2. สร้าง Storage bucket สำหรับรูปโพสต์ (ใช้ใน AddPostModal)
-- ต้องเป็น public เพราะ Facebook/Instagram/TikTok ต้องเข้าถึง URL รูปได้
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-images',
  'post-images',
  true,
  5242880,  -- 5 MB
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do nothing;

-- 3. สร้าง media table เก็บ metadata ของไฟล์ที่อัปโหลด
create table media (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  filename text not null,
  mime_type text not null,
  size_bytes bigint not null,
  storage_path text not null,         -- path ใน bucket 'media'
  public_url text not null,           -- full public URL ของไฟล์
  created_at timestamptz default now()
);

-- index สำหรับค้นหา media ของ user
create index idx_media_user_id on media (user_id);

-- ==========================================================
-- RLS: media
-- ==========================================================
alter table media enable row level security;

create policy "user reads own media" on media
  for select using (auth.uid() = user_id);

create policy "user uploads own media" on media
  for insert with check (auth.uid() = user_id);

create policy "user deletes own media" on media
  for delete using (auth.uid() = user_id);

-- ==========================================================
-- RLS: storage.objects สำหรับ bucket 'media'
-- ==========================================================
create policy "user reads own media files" on storage.objects
  for select using (
    bucket_id = 'media'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "user upload media files" on storage.objects
  for insert with check (
    bucket_id = 'media'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "user delete own media files" on storage.objects
  for delete using (
    bucket_id = 'media'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ==========================================================
-- RLS: storage.objects สำหรับ bucket 'post-images' (public bucket)
-- ไม่ต้องมี read policy เพราะ public URL bypass RLS
-- ==========================================================
create policy "upload post-images" on storage.objects
  for insert with check (bucket_id = 'post-images' and auth.role() = 'authenticated');

create policy "delete post-images" on storage.objects
  for delete using (bucket_id = 'post-images' and auth.role() = 'authenticated');
