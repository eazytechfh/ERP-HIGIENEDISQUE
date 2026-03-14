alter table public.notas_fiscais_entrada
  add column if not exists arquivo_nome text,
  add column if not exists arquivo_mime_type text,
  add column if not exists arquivo_storage_bucket text,
  add column if not exists arquivo_storage_path text,
  add column if not exists arquivo_tamanho bigint;

insert into storage.buckets (id, name, public)
values ('notas-fiscais', 'notas-fiscais', false)
on conflict (id) do nothing;

drop policy if exists storage_read_notas_fiscais on storage.objects;
create policy storage_read_notas_fiscais on storage.objects
for select to authenticated
using (
  bucket_id = 'notas-fiscais'
  and public.current_user_role() in ('admin'::public.app_role, 'operacional'::public.app_role, 'financeiro'::public.app_role)
);

drop policy if exists storage_write_notas_fiscais on storage.objects;
create policy storage_write_notas_fiscais on storage.objects
for insert to authenticated
with check (
  bucket_id = 'notas-fiscais'
  and public.current_user_role() in ('admin'::public.app_role, 'operacional'::public.app_role)
);

drop policy if exists storage_update_notas_fiscais on storage.objects;
create policy storage_update_notas_fiscais on storage.objects
for update to authenticated
using (
  bucket_id = 'notas-fiscais'
  and public.current_user_role() in ('admin'::public.app_role, 'operacional'::public.app_role)
)
with check (
  bucket_id = 'notas-fiscais'
  and public.current_user_role() in ('admin'::public.app_role, 'operacional'::public.app_role)
);

drop policy if exists storage_delete_notas_fiscais on storage.objects;
create policy storage_delete_notas_fiscais on storage.objects
for delete to authenticated
using (
  bucket_id = 'notas-fiscais'
  and public.current_user_role() in ('admin'::public.app_role, 'operacional'::public.app_role)
);
