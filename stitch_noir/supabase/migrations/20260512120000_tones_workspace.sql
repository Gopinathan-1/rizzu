create extension if not exists pgcrypto;

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chat_id uuid references public.chats(id) on delete cascade,
  filename text not null,
  file_type text not null,
  storage_path text not null,
  extracted_text text,
  status text not null default 'uploaded',
  created_at timestamptz not null default now()
);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chat_id uuid references public.chats(id) on delete cascade,
  summary text not null,
  created_at timestamptz not null default now()
);

create index if not exists chats_user_updated_idx on public.chats (user_id, updated_at desc);
create index if not exists chats_user_created_idx on public.chats (user_id, created_at desc);
create index if not exists messages_chat_created_idx on public.messages (chat_id, created_at asc);
create index if not exists messages_user_created_idx on public.messages (user_id, created_at desc);
create index if not exists uploads_user_created_idx on public.uploads (user_id, created_at desc);
create index if not exists uploads_chat_created_idx on public.uploads (chat_id, created_at desc);
create index if not exists memories_user_created_idx on public.memories (user_id, created_at desc);
create index if not exists memories_chat_created_idx on public.memories (chat_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.touch_chat_updated_at()
returns trigger
language plpgsql
as $$
begin
  update public.chats
  set updated_at = now()
  where id = new.chat_id;
  return new;
end;
$$;

create trigger chats_set_updated_at
before update on public.chats
for each row execute function public.set_updated_at();

create trigger messages_touch_chat_after_insert
after insert on public.messages
for each row execute function public.touch_chat_updated_at();

create trigger uploads_touch_chat_after_insert
after insert on public.uploads
for each row execute function public.touch_chat_updated_at();

create trigger memories_touch_chat_after_insert
after insert on public.memories
for each row execute function public.touch_chat_updated_at();

alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.uploads enable row level security;
alter table public.memories enable row level security;

create policy "Chats are user scoped"
on public.chats
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Messages are user scoped"
on public.messages
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Uploads are user scoped"
on public.uploads
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Memories are user scoped"
on public.memories
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('workspace_uploads', 'workspace_uploads', false)
on conflict (id) do nothing;

create policy "Workspace uploads can be inserted by owner"
on storage.objects
for insert
with check (
  bucket_id = 'workspace_uploads'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Workspace uploads can be read by owner"
on storage.objects
for select
using (
  bucket_id = 'workspace_uploads'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Workspace uploads can be updated by owner"
on storage.objects
for update
using (
  bucket_id = 'workspace_uploads'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'workspace_uploads'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Workspace uploads can be deleted by owner"
on storage.objects
for delete
using (
  bucket_id = 'workspace_uploads'
  and auth.uid()::text = (storage.foldername(name))[1]
);
