create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('CREATE', 'UPDATE', 'DELETE')),
  entity text not null,
  entity_id text not null,
  details jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists audit_logs_user_id_idx on public.audit_logs (user_id);
create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);

alter table public.audit_logs enable row level security;

drop policy if exists "Users view their own audit logs" on public.audit_logs;

create policy "Users view their own audit logs"
on public.audit_logs
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users create their own audit logs" on public.audit_logs;

create policy "Users create their own audit logs"
on public.audit_logs
for insert
to authenticated
with check ((select auth.uid()) = user_id);