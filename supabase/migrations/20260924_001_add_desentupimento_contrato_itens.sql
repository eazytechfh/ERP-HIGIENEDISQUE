-- Disponibiliza Desentupimento no seletor de itens dos contratos ja cadastrados.
-- O seletor de servicos exibe somente os registros existentes em contrato_itens.
insert into public.contrato_itens (contrato_id, nome)
select contrato.id, 'Desentupimento'
from public.contratos as contrato
where contrato.deleted_at is null
  and not exists (
    select 1
    from public.contrato_itens as item
    where item.contrato_id = contrato.id
      and lower(trim(item.nome)) = lower('Desentupimento')
  );
