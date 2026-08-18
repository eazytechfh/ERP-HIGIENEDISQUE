-- Adiciona o tipo de servico "Higienizacao de Reservatorio (Potavel)".
-- Usa a mesma categoria 'reservatorio_potavel' do tipo "Limpeza de Reservatorio (Potavel)"
-- para que a OS gerada siga o mesmo modelo (Comprovante de Execucao de Servicos /
-- Limpeza e Higienizacao de Reservatorios de Agua).

insert into public.tipos_servico (nome, categoria)
select 'Higienização de Reservatório (Potável)', 'reservatorio_potavel'
where not exists (
  select 1 from public.tipos_servico
  where nome = 'Higienização de Reservatório (Potável)'
);
