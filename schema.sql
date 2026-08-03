-- Run this entire file in the Supabase SQL Editor for a new project.

create table public.solicitacoes (
  id uuid primary key default gen_random_uuid(),
  mes_referencia date not null,
  empreendimento text not null,
  bloco_quadra text,
  unidade_lote text,
  cliente text not null,
  documento text not null,
  data_envio date,
  prazo_envio date,
  situacao text not null default 'PENDENTE' check (
    situacao in (
      'PENDENTE', 'AGUARDANDO_FINANCEIRO', 'ENVIADO', 'ASSINADO',
      'AGUARDANDO_SIENGE', 'FINALIZADO', 'CANCELADO'
    )
  ),
  user_id uuid not null references auth.users(id) on delete cascade,
  criado_em timestamptz not null default timezone('utc'::text, now()),
  atualizado_em timestamptz not null default timezone('utc'::text, now())
);

create index solicitacoes_user_id_idx on public.solicitacoes (user_id);
create index solicitacoes_mes_referencia_idx on public.solicitacoes (mes_referencia);

create or replace function public.set_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em = timezone('utc'::text, now());
  return new;
end;
$$;

create trigger solicitacoes_set_atualizado_em
before update on public.solicitacoes
for each row execute function public.set_atualizado_em();

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('CREATE', 'UPDATE', 'DELETE')),
  entity text not null,
  entity_id text not null,
  details jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index audit_logs_user_id_idx on public.audit_logs (user_id);
create index audit_logs_created_at_idx on public.audit_logs (created_at desc);

alter table public.solicitacoes enable row level security;
alter table public.audit_logs enable row level security;

create policy "Users manage their own solicitacoes"
on public.solicitacoes
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users view their own audit logs"
on public.audit_logs
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users create their own audit logs"
on public.audit_logs
for insert
to authenticated
with check ((select auth.uid()) = user_id);