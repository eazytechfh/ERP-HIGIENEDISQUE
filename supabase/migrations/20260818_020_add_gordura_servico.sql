-- Adiciona o tipo de servico "Limpeza de Caixa de Gordura".
-- Usa categoria 'outro' (mesmo padrao de Desentupimento) para ter valor unico
-- (id do registro) no dropdown de Tipo de Servico. O roteamento para o
-- documento/formulario de Demonstrativo de Pedido (mesmo modelo usado por
-- Desentupimento) continua funcionando via isTipoGordura() em
-- app/dashboard/servicos/page.tsx, que detecta o nome pelo substring "gordura".

insert into public.tipos_servico (nome, categoria)
select 'Limpeza de Caixa de Gordura', 'outro'
where not exists (
  select 1 from public.tipos_servico
  where nome = 'Limpeza de Caixa de Gordura'
);
