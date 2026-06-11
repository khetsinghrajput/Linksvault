-- ============================================================
-- LinkVault Database Schema
-- Run this entire file in the Supabase SQL editor
-- ============================================================

-- Enable uuid extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- Tables
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now() not null
);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  parent_id uuid references public.collections(id) on delete set null,
  name text not null,
  description text,
  icon text,
  color text,
  view_mode text default 'list' not null,
  sort_order int default 0 not null,
  is_public boolean default false not null,
  public_slug text unique,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  collection_id uuid references public.collections(id) on delete set null,
  url text not null,
  canonical_url text,
  normalized_url text,
  title text not null,
  description text,
  note text,
  site_name text,
  domain text,
  favicon_url text,
  image_url text,
  type text default 'link' not null,
  storage_path text,
  mime_type text,
  file_size bigint,
  is_favorite boolean default false not null,
  is_archived boolean default false not null,
  is_deleted boolean default false not null,
  is_broken boolean default false not null,
  reminder_at timestamptz,
  last_checked_at timestamptz,
  deleted_at timestamptz,
  sort_order int default 0 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now() not null,
  unique(user_id, name)
);

create table if not exists public.bookmark_tags (
  bookmark_id uuid references public.bookmarks(id) on delete cascade not null,
  tag_id uuid references public.tags(id) on delete cascade not null,
  primary key(bookmark_id, tag_id)
);

create table if not exists public.highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  bookmark_id uuid references public.bookmarks(id) on delete cascade not null,
  text text not null,
  color text default 'yellow' not null,
  note text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.collection_members (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid references public.collections(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade,
  email text,
  role text check (role in ('owner','editor','viewer')) not null,
  status text default 'active' not null,
  created_at timestamptz default now() not null
);

-- ============================================================
-- Indexes
-- ============================================================

create index if not exists bookmarks_user_id_idx on public.bookmarks(user_id);
create index if not exists bookmarks_collection_id_idx on public.bookmarks(collection_id);
create index if not exists bookmarks_normalized_url_idx on public.bookmarks(normalized_url);
create index if not exists bookmarks_created_at_idx on public.bookmarks(created_at desc);
create index if not exists bookmarks_is_deleted_idx on public.bookmarks(is_deleted);
create index if not exists bookmarks_is_favorite_idx on public.bookmarks(is_favorite);
create index if not exists bookmarks_is_archived_idx on public.bookmarks(is_archived);
create index if not exists bookmarks_domain_idx on public.bookmarks(domain);
create index if not exists bookmarks_reminder_at_idx on public.bookmarks(reminder_at) where reminder_at is not null;
create index if not exists tags_user_id_idx on public.tags(user_id);
create index if not exists bookmark_tags_tag_id_idx on public.bookmark_tags(tag_id);
create index if not exists highlights_bookmark_id_idx on public.highlights(bookmark_id);
create index if not exists collections_user_id_idx on public.collections(user_id);
create index if not exists collections_parent_id_idx on public.collections(parent_id);
create index if not exists collections_public_slug_idx on public.collections(public_slug) where is_public = true;

-- Full-text search index
create index if not exists bookmarks_fts_idx on public.bookmarks
  using gin(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(note,'') || ' ' || coalesce(domain,'')));

-- ============================================================
-- Triggers
-- ============================================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger bookmarks_updated_at
  before update on public.bookmarks
  for each row execute function public.handle_updated_at();

create trigger collections_updated_at
  before update on public.collections
  for each row execute function public.handle_updated_at();

create trigger highlights_updated_at
  before update on public.highlights
  for each row execute function public.handle_updated_at();

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.collections enable row level security;
alter table public.bookmarks enable row level security;
alter table public.tags enable row level security;
alter table public.bookmark_tags enable row level security;
alter table public.highlights enable row level security;
alter table public.collection_members enable row level security;

-- Profiles
create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Collections
create policy "Users can read own collections" on public.collections
  for select using (
    auth.uid() = user_id
    or is_public = true
    or exists (
      select 1 from public.collection_members cm
      where cm.collection_id = id and cm.user_id = auth.uid() and cm.status = 'active'
    )
  );
create policy "Users can insert own collections" on public.collections
  for insert with check (auth.uid() = user_id);
create policy "Users can update own collections" on public.collections
  for update using (auth.uid() = user_id);
create policy "Users can delete own collections" on public.collections
  for delete using (auth.uid() = user_id);

-- Bookmarks
create policy "Users can read own bookmarks" on public.bookmarks
  for select using (
    auth.uid() = user_id
    or (
      collection_id is not null
      and exists (
        select 1 from public.collections c
        where c.id = collection_id and (c.is_public = true or exists (
          select 1 from public.collection_members cm where cm.collection_id = c.id and cm.user_id = auth.uid() and cm.status = 'active'
        ))
      )
    )
  );
create policy "Users can insert own bookmarks" on public.bookmarks
  for insert with check (auth.uid() = user_id);
create policy "Users can update own bookmarks" on public.bookmarks
  for update using (auth.uid() = user_id);
create policy "Users can delete own bookmarks" on public.bookmarks
  for delete using (auth.uid() = user_id);

-- Tags
create policy "Users can manage own tags" on public.tags
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Bookmark tags
create policy "Users can manage own bookmark tags" on public.bookmark_tags
  for all using (
    exists (select 1 from public.bookmarks b where b.id = bookmark_id and b.user_id = auth.uid())
  );

-- Highlights
create policy "Users can manage own highlights" on public.highlights
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Collection members
create policy "Users can read collection memberships" on public.collection_members
  for select using (
    auth.uid() = user_id
    or exists (
      select 1 from public.collections c where c.id = collection_id and c.user_id = auth.uid()
    )
  );
create policy "Collection owners can manage members" on public.collection_members
  for all using (
    exists (
      select 1 from public.collections c where c.id = collection_id and c.user_id = auth.uid()
    )
  );

-- ============================================================
-- Storage bucket (run in Supabase dashboard Storage tab)
-- ============================================================
-- create bucket 'linkvault-files' with public = false
-- Add policy: allow authenticated users to upload to their own folder (user_id/*)

-- ============================================================
-- Seed demo data (optional - remove in production)
-- ============================================================
-- insert into public.collections (user_id, name, icon) values (auth.uid(), 'Reading List', 'book-open');
