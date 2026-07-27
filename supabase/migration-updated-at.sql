-- Add updated_at column to scheduled_posts for edit tracking
alter table scheduled_posts add column if not exists updated_at timestamptz default now();
