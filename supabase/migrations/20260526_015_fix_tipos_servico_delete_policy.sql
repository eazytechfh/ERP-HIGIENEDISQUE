-- Corrige a policy de delete de tipos_servico para usar servicos.edit
-- (consistente com o que o app verifica em assertPermissionSupabase)
-- O soft-delete (update ativo=false) causava "new row violates RLS" pois
-- a policy SELECT exige ativo=true e o RETURNING retornava ativo=false.
-- Mudamos para hard DELETE no app; aqui alinhamos a policy.

drop policy if exists tipos_servico_delete on public.tipos_servico;

create policy tipos_servico_delete on public.tipos_servico
  for delete to authenticated
  using (public.has_permission('servicos.edit') or public.has_permission('servicos.delete'));
