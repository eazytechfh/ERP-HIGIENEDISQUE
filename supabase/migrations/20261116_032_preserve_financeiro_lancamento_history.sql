-- Preserva o historico de solicitacoes de baixa e lancamentos aprovados.
-- O aplicativo deve usar deleted_at para ocultar lancamentos removidos.
create or replace function public.financeiro_lancamentos_block_hard_delete()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'Lancamentos financeiros nao podem ser excluidos fisicamente. Use deleted_at.'
    using errcode = 'P0001';
end;
$$;

revoke all on function public.financeiro_lancamentos_block_hard_delete() from public, anon, authenticated;

drop trigger if exists trg_financeiro_lancamentos_block_hard_delete on public.financeiro_lancamentos;
create trigger trg_financeiro_lancamentos_block_hard_delete
before delete on public.financeiro_lancamentos
for each row execute function public.financeiro_lancamentos_block_hard_delete();
