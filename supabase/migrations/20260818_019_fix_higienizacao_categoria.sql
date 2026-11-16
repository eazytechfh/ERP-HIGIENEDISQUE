-- Corrige a categoria da Higienizacao para nao colidir com Limpeza de Reservatorio.
-- Ambas usavam 'reservatorio_potavel', o que faz o dropdown de "Tipo de Servico"
-- exibir os dois itens marcados ao mesmo tempo (mesmo value) e o rotulo aparecer
-- concatenado. Move Higienizacao para 'outro', mesmo padrao usado por Desentupimento,
-- que ja tem valor unico (outro_<id>) no dropdown. O roteamento para o documento/
-- formulario de Limpeza continua funcionando via isTipoHigienizacao() em
-- app/dashboard/servicos/page.tsx, que detecta o nome pelo substring "higien".
update public.tipos_servico
set categoria = 'outro'
where nome = 'Higienização de Reservatório (Potável)';
