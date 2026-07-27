-- Add auth_provider column to profiles
alter table profiles add column if not exists auth_provider text;

-- Update auto-create function to capture auth_provider
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, username, avatar_url, auth_provider)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_app_meta_data->>'provider'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;
