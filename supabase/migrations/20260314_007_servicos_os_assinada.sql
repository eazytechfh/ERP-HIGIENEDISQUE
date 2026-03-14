alter table public.servicos
  add column if not exists os_assinada_nome text,
  add column if not exists os_assinada_mime_type text,
  add column if not exists os_assinada_storage_bucket text,
  add column if not exists os_assinada_storage_path text,
  add column if not exists os_assinada_tamanho bigint;
