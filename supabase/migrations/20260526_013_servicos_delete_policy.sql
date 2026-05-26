-- Adiciona politica RLS de DELETE para a tabela servicos.
-- Sem esta politica o Supabase bloqueava silenciosamente o delete (sem retornar erro).

create policy servicos_delete_permission on public.servicos
for delete to authenticated
using (public.has_permission('servicos.delete'));
