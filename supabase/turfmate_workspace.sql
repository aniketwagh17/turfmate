-- TurfMate shared workspace (single Manhattan Cricket workspace)
-- Run once in Supabase Dashboard > SQL Editor > New query.
create table if not exists public.turfmate_workspace (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.turfmate_workspace enable row level security;

grant select, insert, update on public.turfmate_workspace to authenticated;

drop policy if exists "Authenticated users can read TurfMate workspace" on public.turfmate_workspace;
create policy "Authenticated users can read TurfMate workspace"
  on public.turfmate_workspace for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can create TurfMate workspace" on public.turfmate_workspace;
create policy "Authenticated users can create TurfMate workspace"
  on public.turfmate_workspace for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated users can update TurfMate workspace" on public.turfmate_workspace;
create policy "Authenticated users can update TurfMate workspace"
  on public.turfmate_workspace for update
  to authenticated
  using (true)
  with check (true);
