-- Google Calendar integration
-- Rodar no Supabase SQL Editor

-- Colunas de token na tabela profiles (uma por usuário)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS google_access_token  TEXT,
  ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS google_token_expiry  BIGINT;

-- ID do evento criado no Google Calendar (para editar/deletar depois)
ALTER TABLE servicos
  ADD COLUMN IF NOT EXISTS google_event_id TEXT;
