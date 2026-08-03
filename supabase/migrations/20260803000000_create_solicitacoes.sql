create table if not exists public.solicitacoes (
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

create index if not exists solicitacoes_user_id_idx on public.solicitacoes (user_id);
create index if not exists solicitacoes_mes_referencia_idx on public.solicitacoes (mes_referencia);

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

drop trigger if exists solicitacoes_set_atualizado_em on public.solicitacoes;

create trigger solicitacoes_set_atualizado_em
before update on public.solicitacoes
for each row execute function public.set_atualizado_em();

alter table public.solicitacoes enable row level security;

drop policy if exists "Users manage their own solicitacoes" on public.solicitacoes;

create policy "Users manage their own solicitacoes"
on public.solicitacoes
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);