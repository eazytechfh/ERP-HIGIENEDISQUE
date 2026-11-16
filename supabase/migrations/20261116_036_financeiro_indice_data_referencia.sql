-- Indice para filtros por periodo (data_referencia, criada na migration 035).
-- Rodar SOZINHO no SQL Editor: CREATE INDEX CONCURRENTLY nao roda dentro de transacao.
create index concurrently if not exists idx_financeiro_lancamentos_data_referencia
  on public.financeiro_lancamentos (data_referencia, status, tipo)
  where deleted_at is null;
