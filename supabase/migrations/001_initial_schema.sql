-- TurfMate initial schema (PostgreSQL / Supabase)
-- Apply in Supabase SQL Editor. All monetary values are stored as integer paise.
-- This migration creates the data model and baseline RLS. Review before production use.

begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cricket_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.cricket_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'player' check (role in ('player','organiser','admin')),
  membership_status text not null default 'active' check (membership_status in ('invited','active','suspended')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.cricket_groups(id) on delete cascade,
  title text not null default 'Cricket session',
  session_date date not null,
  start_time time,
  venue text not null,
  notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.session_players (
  session_id uuid not null references public.sessions(id) on delete cascade,
  player_id uuid not null references auth.users(id),
  added_at timestamptz not null default now(),
  primary key (session_id, player_id)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  description text not null,
  category text not null default 'turf',
  amount_paise bigint not null check (amount_paise > 0),
  paid_by uuid references auth.users(id),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- A submitted payment is immutable. Its review history is recorded separately
-- in payment_reviews so the audit trail is append-only.
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.cricket_groups(id) on delete cascade,
  payer_id uuid not null references auth.users(id),
  amount_paise bigint not null check (amount_paise > 0),
  payment_method text not null default 'upi' check (payment_method in ('upi','cash','bank_transfer','other')),
  reference text,
  note text,
  submitted_at timestamptz not null default now()
);

-- A contribution can be allocated across one or more sessions.
create table if not exists public.payment_allocations (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  amount_paise bigint not null check (amount_paise > 0),
  created_at timestamptz not null default now(),
  unique (payment_id, session_id)
);

create table if not exists public.payment_reviews (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  reviewed_by uuid not null references auth.users(id),
  decision text not null check (decision in ('verified','rejected')),
  review_note text,
  reviewed_at timestamptz not null default now()
);

create index if not exists idx_group_members_user on public.group_members(user_id);
create index if not exists idx_sessions_group_date on public.sessions(group_id, session_date desc);
create index if not exists idx_session_players_player on public.session_players(player_id);
create index if not exists idx_expenses_session on public.expenses(session_id);
create index if not exists idx_payments_group_payer on public.payments(group_id, payer_id, submitted_at desc);
create index if not exists idx_payment_allocations_session on public.payment_allocations(session_id);
create index if not exists idx_payment_reviews_payment on public.payment_reviews(payment_id, reviewed_at desc);

-- Keep profile rows in sync with Supabase Auth sign-ups.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', ''),
    new.email
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- SECURITY DEFINER helpers avoid recursive RLS lookups on group_members.
create or replace function public.is_active_group_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group_id
      and gm.user_id = (select auth.uid())
      and gm.membership_status = 'active'
  );
$$;

create or replace function public.has_group_role(p_group_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group_id
      and gm.user_id = (select auth.uid())
      and gm.membership_status = 'active'
      and gm.role = any(p_roles)
  );
$$;

create or replace function public.prevent_row_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'This record is append-only and cannot be changed or deleted.';
end;
$$;

drop trigger if exists payments_append_only on public.payments;
create trigger payments_append_only
before update or delete on public.payments
for each row execute procedure public.prevent_row_change();

drop trigger if exists payment_allocations_append_only on public.payment_allocations;
create trigger payment_allocations_append_only
before update or delete on public.payment_allocations
for each row execute procedure public.prevent_row_change();

drop trigger if exists payment_reviews_append_only on public.payment_reviews;
create trigger payment_reviews_append_only
before update or delete on public.payment_reviews
for each row execute procedure public.prevent_row_change();

-- Ensure allocations belong to the same group as the payment and do not
-- exceed the submitted contribution amount.
create or replace function public.validate_payment_allocation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_group_id uuid;
  v_payment_amount bigint;
  v_session_group_id uuid;
  v_allocated bigint;
begin
  select p.group_id, p.amount_paise
    into v_group_id, v_payment_amount
  from public.payments p
  where p.id = new.payment_id
  for update;

  select s.group_id into v_session_group_id
  from public.sessions s
  where s.id = new.session_id;

  if v_group_id is null or v_session_group_id is null or v_group_id <> v_session_group_id then
    raise exception 'Payment and session must belong to the same group.';
  end if;

  select coalesce(sum(pa.amount_paise), 0) into v_allocated
  from public.payment_allocations pa
  where pa.payment_id = new.payment_id
    and pa.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  if v_allocated + new.amount_paise > v_payment_amount then
    raise exception 'Allocated amount cannot exceed the submitted payment amount.';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_payment_allocation_before_insert on public.payment_allocations;
create trigger validate_payment_allocation_before_insert
before insert on public.payment_allocations
for each row execute procedure public.validate_payment_allocation();

-- An organiser/admin can review another member's payment, but cannot verify
-- their own contribution.
create or replace function public.validate_payment_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_group_id uuid;
  v_payer_id uuid;
begin
  select p.group_id, p.payer_id into v_group_id, v_payer_id
  from public.payments p where p.id = new.payment_id;

  if v_group_id is null
     or not public.has_group_role(v_group_id, array['organiser','admin'])
     or new.reviewed_by <> (select auth.uid())
     or new.reviewed_by = v_payer_id then
    raise exception 'Only another organiser/admin may review this payment.';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_payment_review_before_insert on public.payment_reviews;
create trigger validate_payment_review_before_insert
before insert on public.payment_reviews
for each row execute procedure public.validate_payment_review();

-- Enable RLS on every application table.
alter table public.profiles enable row level security;
alter table public.cricket_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.sessions enable row level security;
alter table public.session_players enable row level security;
alter table public.expenses enable row level security;
alter table public.payments enable row level security;
alter table public.payment_allocations enable row level security;
alter table public.payment_reviews enable row level security;

-- Profiles: a user sees their own profile and profiles of active group peers.
drop policy if exists profiles_select_self_or_group on public.profiles;
create policy profiles_select_self_or_group on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or exists (
    select 1
    from public.group_members mine
    join public.group_members peer on peer.group_id = mine.group_id
    where mine.user_id = (select auth.uid())
      and mine.membership_status = 'active'
      and peer.user_id = profiles.id
      and peer.membership_status = 'active'
  )
);
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Groups: creator can create; active members can read; admins can update.
drop policy if exists groups_select_member on public.cricket_groups;
create policy groups_select_member on public.cricket_groups for select to authenticated
using (public.is_active_group_member(id) or created_by = (select auth.uid()));
drop policy if exists groups_insert_creator on public.cricket_groups;
create policy groups_insert_creator on public.cricket_groups for insert to authenticated
with check (created_by = (select auth.uid()));
drop policy if exists groups_update_admin on public.cricket_groups;
create policy groups_update_admin on public.cricket_groups for update to authenticated
using (public.has_group_role(id, array['admin']))
with check (public.has_group_role(id, array['admin']));

-- Membership: members can view their group roster. Admins manage roles/members.
drop policy if exists members_select_group on public.group_members;
create policy members_select_group on public.group_members for select to authenticated
using (public.is_active_group_member(group_id) or user_id = (select auth.uid()));
drop policy if exists members_insert_admin_or_creator on public.group_members;
create policy members_insert_admin_or_creator on public.group_members for insert to authenticated
with check (
  public.has_group_role(group_id, array['admin'])
  or (
    user_id = (select auth.uid())
    and exists (select 1 from public.cricket_groups g where g.id = group_id and g.created_by = (select auth.uid()))
    and role = 'admin'
  )
);
drop policy if exists members_update_admin on public.group_members;
create policy members_update_admin on public.group_members for update to authenticated
using (public.has_group_role(group_id, array['admin']))
with check (public.has_group_role(group_id, array['admin']));
drop policy if exists members_delete_admin on public.group_members;
create policy members_delete_admin on public.group_members for delete to authenticated
using (public.has_group_role(group_id, array['admin']));

-- Sessions and their participants.
drop policy if exists sessions_select_member on public.sessions;
create policy sessions_select_member on public.sessions for select to authenticated
using (public.is_active_group_member(group_id));
drop policy if exists sessions_manage_organiser on public.sessions;
create policy sessions_manage_organiser on public.sessions for all to authenticated
using (public.has_group_role(group_id, array['organiser','admin']))
with check (public.has_group_role(group_id, array['organiser','admin']) and created_by = (select auth.uid()));

drop policy if exists session_players_select_member on public.session_players;
create policy session_players_select_member on public.session_players for select to authenticated
using (exists (select 1 from public.sessions s where s.id = session_id and public.is_active_group_member(s.group_id)));
drop policy if exists session_players_manage_organiser on public.session_players;
create policy session_players_manage_organiser on public.session_players for all to authenticated
using (exists (select 1 from public.sessions s where s.id = session_id and public.has_group_role(s.group_id, array['organiser','admin'])))
with check (exists (select 1 from public.sessions s where s.id = session_id and public.has_group_role(s.group_id, array['organiser','admin'])));

-- Expenses: all group members can read; organisers/admins manage.
drop policy if exists expenses_select_member on public.expenses;
create policy expenses_select_member on public.expenses for select to authenticated
using (exists (select 1 from public.sessions s where s.id = session_id and public.is_active_group_member(s.group_id)));
drop policy if exists expenses_manage_organiser on public.expenses;
create policy expenses_manage_organiser on public.expenses for all to authenticated
using (exists (select 1 from public.sessions s where s.id = session_id and public.has_group_role(s.group_id, array['organiser','admin'])))
with check (
  created_by = (select auth.uid())
  and exists (select 1 from public.sessions s where s.id = session_id and public.has_group_role(s.group_id, array['organiser','admin']))
);

-- Payments: payer submits their own contribution; organiser/admin can view group payments.
drop policy if exists payments_select_payer_or_organiser on public.payments;
create policy payments_select_payer_or_organiser on public.payments for select to authenticated
using (payer_id = (select auth.uid()) or public.has_group_role(group_id, array['organiser','admin']));
drop policy if exists payments_insert_self on public.payments;
create policy payments_insert_self on public.payments for insert to authenticated
with check (
  payer_id = (select auth.uid())
  and public.is_active_group_member(group_id)
);

-- Payment allocations are visible to payer and organisers; payer allocates own payment.
drop policy if exists allocations_select_payer_or_organiser on public.payment_allocations;
create policy allocations_select_payer_or_organiser on public.payment_allocations for select to authenticated
using (
  exists (
    select 1 from public.payments p
    where p.id = payment_id
      and (p.payer_id = (select auth.uid()) or public.has_group_role(p.group_id, array['organiser','admin']))
  )
);
drop policy if exists allocations_insert_payment_owner on public.payment_allocations;
create policy allocations_insert_payment_owner on public.payment_allocations for insert to authenticated
with check (
  exists (
    select 1 from public.payments p
    where p.id = payment_id and p.payer_id = (select auth.uid())
  )
);

-- Review history is visible to payer and organisers; only organiser/admin can append.
drop policy if exists reviews_select_payer_or_organiser on public.payment_reviews;
create policy reviews_select_payer_or_organiser on public.payment_reviews for select to authenticated
using (
  exists (
    select 1 from public.payments p
    where p.id = payment_id
      and (p.payer_id = (select auth.uid()) or public.has_group_role(p.group_id, array['organiser','admin']))
  )
);
drop policy if exists reviews_insert_organiser on public.payment_reviews;
create policy reviews_insert_organiser on public.payment_reviews for insert to authenticated
with check (
  reviewed_by = (select auth.uid())
  and exists (
    select 1 from public.payments p
    where p.id = payment_id
      and public.has_group_role(p.group_id, array['organiser','admin'])
      and p.payer_id <> (select auth.uid())
  )
);

commit;
