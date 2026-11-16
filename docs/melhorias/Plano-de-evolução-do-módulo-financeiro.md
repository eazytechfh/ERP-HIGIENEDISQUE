# Plano de evolução do módulo financeiro

## Resumo

Implementar o fluxo **OS concluída → recebimento informado pelo financeiro → aprovação da Rachel → baixa real no caixa**. Acrescentar filtros mensais ao dashboard, edição da forma de pagamento, taxa de cartão, parcelas de boleto, exportação CSV/PDF e emissão de NFS-e pelo Asaas na aba de NF existente.

## Implementação

1. **Baixa e permissões.** A conclusão operacional mantém a OS como concluída e cria ou atualiza uma receita *programada* somente quando houver cobrança adicional. Uma OS coberta pelo contrato não cria outra receita. Ao confirmar um recebimento, o financeiro solicita a baixa de cada lançamento na nova aba **Aprovações**; Rachel pode aprovar ou rejeitar, inclusive uma solicitação feita por ela. Só a aprovação altera o lançamento para *realizado* e grava data, usuário e histórico. Identificar Rachel pela conta autenticada vinculada ao e-mail informado, com autorização validada no banco; bloquear a mudança direta de status pela tela ou pela API.

2. **Cartão, boleto e fluxo.** Permitir editar a forma de pagamento de lançamentos programados. Criar configurações de taxas percentuais distintas para crédito e débito, editáveis apenas por Rachel. Antes da solicitação de baixa, exibir valor bruto, taxa aplicada e valor líquido; guardar a taxa usada no lançamento para que alterações futuras não mudem o histórico. Cartão permanece em um lançamento único. No fluxo e na aba Emitir Boleto, gerar parcelas mensais separadas a partir do primeiro vencimento, distribuindo centavos sem diferença no total; cada parcela tem solicitação e aprovação próprias. Ajustar a integração de boleto existente para identificar e acompanhar cada parcela.

3. **Dashboard e relatórios.** Adicionar seleção de ano, Jan–Dez, **Mês atual** e **Anual**. Valores realizados usam a data da liquidação; programados usam o vencimento. Aplicar o período aos indicadores e gráficos, excluindo cancelados. Exportar **todas as movimentações que correspondam aos filtros do fluxo**, com totais, em CSV e PDF. Substituir a consulta atual limitada a 500 lançamentos por consultas paginadas e agregações no banco, para que indicadores e arquivos não omitam registros.

4. **NFS-e Asaas.** Atualizar a aba Emitir NF para selecionar uma OS ou criar uma nota avulsa. Usar cliente, descrição, valor, serviço municipal e padrões tributários configuráveis; mostrar os campos das imagens: responsável pelo ISS, retenções opcionais de INSS e IR com valor calculado, deduções, observações e **Agora/Agendar** com data futura. Remover **número, chave e série** como entradas; mostrar número e documentos quando retornarem do Asaas. Deduções afetam a base fiscal, enquanto as retenções ficam discriminadas entre valor bruto da nota e líquido a receber. Uma nota ligada à OS reutiliza sua receita; uma nota avulsa cria uma receita programada uma única vez.

5. **Integração e implantação.** Enviar a NFS-e por rota de servidor com chave Asaas protegida, associando cliente e nota por referências externas. Registrar agendamento como pendente e considerar emissão concluída somente após `INVOICE_AUTHORIZED`; receber também erros e disponibilizar PDF/XML quando existirem. O Asaas exige código de serviço, configuração fiscal da conta e `effectiveDate`; seus webhooks podem repetir eventos, portanto a recepção terá autenticação, idempotência e reconciliação antes de repetir um envio incerto. [Emissão de NFS-e](https://docs.asaas.com/reference/agendar-nota-fiscal), [eventos de notas fiscais](https://docs.asaas.com/docs/webhook-para-notas-fiscais), [idempotência](https://docs.asaas.com/docs/como-implementar-idempotencia-em-webhooks). Homologar com conta e chave **Sandbox**, depois configurar separadamente produção. [Ambientes Asaas](https://docs.asaas.com/reference/comece-por-aqui).

## Interfaces e dados

- Evoluir os lançamentos com valor bruto, valor líquido, taxa e modalidade aplicadas, grupo/número da parcela e vínculo com a OS. Criar solicitações de baixa com solicitante, decisão e datas; criar configurações financeiras com histórico de alteração. Preservar lançamentos já realizados na migração.
- Criar operações transacionais no banco para **solicitar, aprovar e rejeitar** baixa. Expor rotas autenticadas para emitir NFS-e, receber webhook e exportar relatórios. Ampliar os registros de NF com ID/status Asaas, referência externa, motivo de erro, número, código de validação e links PDF/XML.
- Separar a aba de NF do formulário compartilhado com boleto: os campos fiscais e o ciclo de emissão são próprios da NFS-e.

## Testes e aceite

- Usuário do financeiro conclui OS e solicita recebimento, mas não consegue marcar receita ou despesa como realizada; Rachel aprova ou rejeita pela aba própria. Repetição de clique ou chamadas concorrentes não produz dupla baixa.
- Cartão calcula o líquido corretamente com a taxa vigente na solicitação e conserva o cálculo após mudança da configuração. Boleto gera parcelas mensais cuja soma corresponde ao total, inclusive com centavos, e permite baixa individual.
- Filtros de mês/ano mostram valores pela data definida; CSV e PDF contêm todas as linhas filtradas mesmo acima de 500 registros e fecham com os totais.
- No Sandbox, validar NFS-e **Agora** e **Agendar**, retenções, deduções, OS existente e emissão avulsa; verificar autorização, erro, webhook duplicado e recuperação após resposta incerta. A tela não anuncia emissão concluída antes da autorização.

## Premissas

A configuração tributária da conta Asaas e as alíquotas serão fornecidas e conferidas com a contabilidade antes da emissão real. A opção **Agora** usa a data corrente; **Agendar** exige data futura. A integração de notas cobre **NFS-e de serviços avulsa no Asaas**, mesmo quando vinculada internamente a uma OS; não exige criar uma cobrança Asaas.
