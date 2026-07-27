-- Add external_post_id column to store platform's post ID after successful publish
alter table scheduled_posts add column if not exists external_post_id text;
