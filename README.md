# ERP Higiene Disque

Sistema de gestão empresarial para controle de serviços, clientes, agendamentos, estoque, financeiro, equipe e veículos.

## Links importantes

| Recurso | URL |
|---|---|
| Repositório GitHub | https://github.com/eazytechfh/ERP-HIGIENEDISQUE |
| Vercel (deploy/produção) | https://vercel.com/eazytechfh-gmailcoms-projects/erp-higienedisque |
| Supabase (banco de dados) | https://supabase.com (projeto vinculado ao e-mail eazytech.ia@gmail.com) |
| Dev local | http://localhost:3000 |

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Radix UI + shadcn/ui + Tailwind CSS 4 |
| Banco de dados | PostgreSQL via Supabase |
| Autenticação | Supabase Auth |
| Storage | Supabase Storage (arquivos de OS, NFs) |
| Deploy | Vercel |
| Gráficos | Recharts |

---

## Estrutura principal

```
app/
  dashboard/
    page.tsx              # Dashboard principal (métricas, alertas, gráfico)
    clientes/page.tsx     # CRUD de clientes (1.837 linhas — ver aviso abaixo)
    servicos/page.tsx     # Ordens de Serviço (3.700+ linhas — ver aviso abaixo)
    financeiro/page.tsx   # Lançamentos financeiros
    produtos/page.tsx     # Estoque e notas fiscais
    equipe/page.tsx       # Membros da equipe
    veiculos/page.tsx     # Frota e manutenções preventivas
    historico/page.tsx    # Histórico de serviços
lib/
  supabase/
    clientes-repo.ts      # Queries de clientes
    servicos-repo.ts      # Queries de serviços/OS
    financeiro-repo.ts    # Queries financeiras
    estoque-repo.ts       # Queries de produtos e notas fiscais
    equipe-repo.ts        # Queries de equipe
    veiculos-repo.ts      # Queries de veículos e manutenções
    contratos-repo.ts     # Queries de contratos
components/
  os-generation/          # Formulários de geração de OS (limpeza, vetores)
  ui/                     # Componentes shadcn/ui
```

---

## Regras para IA ao fazer alterações

### Antes de qualquer mudança

- **O sistema está em produção.** Toda alteração tem risco real de afetar clientes ativos.
- Uma alteração por vez. Aguardar o usuário testar no localhost antes de aplicar a próxima.
- Sempre mostrar o diff antes de aplicar e aguardar confirmação explícita.
- Trabalhar como programador sênior: pensar nos efeitos colaterais, não só no caminho feliz.
- Verificar se a coluna existe no banco antes de referenciar em queries — usar o `mapDbToX` do arquivo repo como fonte de verdade dos nomes reais de colunas.
- Se receber um link da Vercel, GitHub, Supabase ou qualquer recurso útil do projeto, registrar na seção "Links importantes" deste README.

### Ao alterar queries Supabase

- Conferir o `mapDbToX` correspondente para saber os nomes reais das colunas antes de usar `select("col1, col2")` — o nome TypeScript e o nome da coluna no banco podem ser diferentes (ex: `veiculoId` no TS = `veiculo_id` no banco).
- RLS está ativo nas tabelas principais. Funções com `SECURITY DEFINER` bypassam RLS — usar `SECURITY INVOKER` (padrão) sempre que possível.
- Ao criar índices, sempre usar `CREATE INDEX CONCURRENTLY` para não bloquear a tabela em produção.
- Ao paginar uma query que antes carregava tudo, verificar se a página usa os dados para cálculos ou totalizadores — se sim, paginar quebra os totais e exige mover a lógica para o servidor.
- Toda query deve incluir `.is("deleted_at", null)` — o sistema usa soft delete em todas as tabelas principais.

### Ao alterar componentes React

- Todas as páginas de dashboard são `'use client'` — `loading.tsx` e Suspense automático do Next.js não funcionam nelas.
- `clientes/page.tsx` (1.837 linhas) e `servicos/page.tsx` (3.700+ linhas) são componentes monolíticos críticos. Refatoração estrutural neles exige sessão dedicada e testes extensivos — não fazer de forma incremental sem planejamento.
- Ao adicionar estado (`useState`), verificar se não vai causar re-render desnecessário de partes da página.

### Ao finalizar qualquer alteração

- Voltar a este README e registrar o que foi feito na seção "Histórico de alterações".
- Documentar: o problema que existia, o que foi mudado, e qualquer cuidado que futuras alterações naquela área devem ter.
- Fazer commit com mensagem descritiva seguindo o padrão `tipo: descrição` (feat, fix, perf, docs, refactor).

---

## Configurações importantes

### next.config.mjs

```js
typescript: { ignoreBuildErrors: true }   // TypeScript não bloqueia o build
eslint: { ignoreDuringBuilds: true }       // ESLint não bloqueia o build
images: { unoptimized: true }              // next/image sem otimização automática
```

> `ignoreBuildErrors: true` significa que erros de TypeScript não impedem o deploy. Sempre testar no localhost antes de commitar.

### Soft delete

Todas as tabelas usam soft delete via coluna `deleted_at`. Toda query deve filtrar com `.is("deleted_at", null)`.

### Permissões

O sistema usa permissões customizadas em `profiles.permissions` (array de strings). A função `hasPermission()` valida acesso antes de operações sensíveis.

---

## Banco de dados — índices existentes (criados manualmente no Supabase)

| Índice | Tabela | Campos | Finalidade |
|---|---|---|---|
| `idx_clientes_nome_trgm` | clientes | nome (trigram) | Busca textual por nome |
| `idx_clientes_status_deleted` | clientes | status | Filtro de status |
| `idx_clientes_contrato_vencimento` | clientes | possui_contrato, data_fim_contrato, status | Métricas de contratos a vencer |
| `idx_servicos_data_desc` | servicos | data DESC | Listagem de OS por data |
| `idx_servicos_status_data` | servicos | status, data DESC | Filtro + listagem de OS |
| `idx_manutencoes_data_prevista` | manutencoes_preventivas | data_prevista ASC | Dashboard de alertas de frota |
| `idx_financeiro_lancamentos_vencimento` | financeiro_lancamentos | data_vencimento | Listagem financeira |
| `idx_financeiro_lancamentos_cliente` | financeiro_lancamentos | cliente_id | Join com clientes |

### Funções PostgreSQL (RPC)

| Função | O que faz |
|---|---|
| `get_clientes_metricas()` | Retorna total, ativos, a vencer e vencidos em 1 query. Usa `SECURITY INVOKER` (respeita RLS). |

---

## Histórico de alterações

### 2026-11-16 — Financeiro: emissão de NFS-e pelo Asaas (Fases 4 e 5)

**Problema identificado:** a aba Emitir NF só registrava número, chave e série digitados à mão; não havia emissão real, retenções nem acompanhamento da autorização pela prefeitura.

**Alterações realizadas:**

| Arquivo | O que mudou |
|---|---|
| `supabase/migrations/20261116_037_financeiro_nfse_asaas.sql` | `financeiro_nfse_config` (+ histórico; só o aprovador altera via `financeiro_salvar_nfse_config`); campos Asaas/NFS-e em `financeiro_documentos` (`numero` opcional); `financeiro_asaas_clientes`; `financeiro_asaas_eventos` (webhooks, id único) |
| `lib/server/asaas.ts` | Cliente HTTP do Asaas (servidor). Ambiente pelo prefixo da chave; **chave de produção é recusada sem `ASAAS_AMBIENTE=producao`** |
| `lib/server/financeiro-auth.ts`, `lib/server/nfse.ts` | Autenticação das rotas (token + permissão) e regras: cliente no Asaas sem duplicar, reconciliação por `externalReference`, aplicação do status |
| `app/api/financeiro/nfse/emitir` | Grava o documento → procura no Asaas por referência → cria a nota → "Agora" chama `/authorize` |
| `app/api/financeiro/nfse/sincronizar` | Botão "Atualizar status": consulta o Asaas e grava |
| `app/api/financeiro/nfse/webhook` | Webhook (header `asaas-access-token`), grava o evento antes de processar, ignora repetidos, aplica o estado atual consultado no Asaas |
| `lib/nfse-calculos.ts` | Base do ISS (deduções), retenções ISS/INSS/IR, líquido a receber, Agora/Agendar (com testes) |
| `components/financeiro/nfse.tsx` | Telas Emissão de NFS-e (OS ou avulsa) e Config. NFS-e |

**Cuidados para futuras alterações nesta área:**
- Variáveis no servidor (Vercel e `.env.local`): `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN` e, só em produção, `ASAAS_AMBIENTE=producao`. Nunca usar `NEXT_PUBLIC_` para elas.
- Webhook no painel do Asaas: URL `https://<domínio>/api/financeiro/nfse/webhook`, eventos de **Nota fiscal**, token de autenticação = `ASAAS_WEBHOOK_TOKEN`. Localhost não recebe webhook: usar "Atualizar status".
- Nota só é "emitida" com status `AUTHORIZED`. `SCHEDULED` = agendada/processando.
- A referência `erp-nfse-<chave>` identifica a nota nos dois sistemas; reenviar uma nota com falha reaproveita a chave e confere no Asaas antes de criar outra.
- Inscrição municipal, regime, certificado e acesso à prefeitura ficam no painel do Asaas, não no ERP.

### 2026-11-16 — Financeiro: período no dashboard, exportação CSV/PDF e fim do limite de 500 (Fase 3)

**Problema identificado:** a página carregava no máximo 500 lançamentos e calculava indicadores, gráficos e filtros no navegador. Acima disso, os totais ficavam errados sem aviso. O dashboard não tinha filtro de período, e não havia exportação.

**Alterações realizadas:**

| Arquivo | O que mudou |
|---|---|
| `supabase/migrations/20261116_035_financeiro_periodo_consultas.sql` | Colunas geradas `data_referencia` (liquidação se realizado, vencimento se programado) e `valor_caixa` (líquido se realizado); funções `financeiro_lancamentos_filtrados`, `financeiro_totais_filtrados`, `financeiro_resumo_periodo`, `financeiro_resumo_categorias` (todas `SECURITY INVOKER`) |
| `supabase/migrations/20261116_036_financeiro_indice_data_referencia.sql` | Índice `CONCURRENTLY` em `data_referencia` — rodar sozinho |
| `lib/financeiro-periodo.ts` | Intervalos (ano, mês atual, anual, Jan–Dez) e CSV para Excel pt-BR, com testes |
| `lib/supabase/financeiro-repo.ts` | Listagem paginada no servidor, totais agregados, exportação em lotes de 1000, resumo do dashboard; `listFinanceiroLancamentosSupabase` (limite 500) não é mais usada pela página |
| `components/financeiro/dashboard-financeiro.tsx` | Dashboard com seletor de ano e período; KPIs, gráficos e distribuições vindos do banco; cancelados fora |
| `components/financeiro/lancamentos-explorer.tsx` | Filtros + totais + paginação no servidor + exportação CSV/PDF de todas as linhas do filtro |
| `app/dashboard/financeiro/page.tsx` | Fluxo (Movimentações) e Relatórios usam o explorador; a página não guarda mais a lista de lançamentos (`versaoLancamentos` dispara o recarregamento) |

**Cuidados para futuras alterações nesta área:**
- Lista, totais e exportação usam o **mesmo** filtro (`financeiro_lancamentos_filtrados`); um filtro novo deve ser adicionado na função SQL e em `FiltrosLancamentos`.
- Não somar lançamentos no navegador para indicadores: usar as funções de resumo/totais (o navegador só vê uma página).
- Após criar/alterar lançamentos, chamar `atualizarLancamentos()` na página para as telas recarregarem.
- O PDF é gerado pela impressão do navegador (janela com a tabela + totais → "Salvar como PDF"); exige permitir pop-up.

### 2026-11-16 — Financeiro: taxa de cartão, forma de pagamento e parcelas de boleto (Fase 2)

**Problema identificado:** recebimentos no cartão entravam no caixa pelo valor bruto, sem descontar a taxa da maquininha. Não havia como corrigir a forma de pagamento de um lançamento, nem parcelar um boleto.

**Alterações realizadas:**

| Arquivo | O que mudou |
|---|---|
| `supabase/migrations/20261116_031_financeiro_cartao_parcelas.sql` | Tabela `financeiro_taxas_cartao` (histórico; só o aprovador altera via `financeiro_definir_taxa_cartao`); colunas de taxa/líquido e de parcela em `financeiro_lancamentos`; taxa gravada na solicitação e copiada na aprovação; trava ampliada para os campos de taxa |
| `lib/financeiro-calculos.ts` | Rateio de parcelas sem diferença de centavos, vencimentos mensais e cálculo da taxa (com testes) |
| `lib/supabase/financeiro-repo.ts` | `valorCaixa` (líquido quando realizado), criação de parcelas numa única inserção, edição da forma de pagamento, taxas |
| `components/financeiro/taxas-cartao.tsx` | Aba Taxas de cartão e diálogo de forma de pagamento |
| `components/financeiro/aprovacoes-baixa.tsx` | Solicitação mostra bruto, taxa e líquido; envia a taxa vista para o banco conferir |
| `app/dashboard/financeiro/page.tsx` | Parcelas no Fluxo (forma boleto) e na Emissão de Boleto; webhook por parcela com status registrado; totais pelo líquido |

**Cuidados para futuras alterações nesta área:**
- **Parcelas em qualquer forma de pagamento (migration 034):** a OS (Financeiro do Serviço) e o Fluxo de Caixa têm o campo Parcelas para todas as formas. A regra fica em `planejarCobranca` (`lib/financeiro-calculos.ts`): **cartão** = um lançamento com baixa única, as parcelas só escolhem a taxa (`cartao_parcelas`, débito sempre 1x); **demais formas** = um lançamento mensal por parcela, cada um com baixa própria. A quantidade da OS fica em `os_form_data.serviceRequest.billing.installments` (sem coluna nova em `servicos`; OS antigas = 1x). Ao salvar a OS, `upsertReceitaServicoSupabase` sincroniza: mesmo plano → só atualiza textos; plano mudou → cancela as receitas programadas e recria; se alguma parcela já foi baixada ou está em aprovação, a OS não mexe no financeiro.
- Aplicar as migrations 031, 033 e 034 **antes** de publicar o front: a tela chama `financeiro_solicitar_baixa` com os parâmetros novos `p_taxa_esperada` e `p_cartao_parcelas`.
- **Taxa por parcelas (migration 033):** a taxa é por modalidade + parcelas da venda (`financeiro_taxas_cartao.parcelas`; débito sempre 1x, crédito 1x–21x). A venda no cartão continua sendo um lançamento único; as parcelas só escolhem a taxa e ficam em `cartao_parcelas`. Combinação sem taxa cadastrada **bloqueia** a baixa (não vale mais 0%). A migration traz carga inicial com as taxas da maquininha (débito 1,64%; crédito à vista 3,53% até 10x 13,17%) sem sobrescrever taxas já cadastradas.
- `valor` continua sendo o bruto. Para somar o que entrou no caixa use `valorCaixa` (ou `valor_liquido` no banco, preenchido em todo lançamento realizado).
- A regra de arredondamento da taxa existe em dois lugares (`lib/financeiro-calculos.ts` e `financeiro_solicitar_baixa`); se mudar uma, mude a outra. O banco recusa a solicitação se a taxa vigente for diferente da mostrada na tela.
- Cartão nunca é parcelado: parcelas só existem para boleto. Cada parcela é um lançamento com baixa própria, ligado pelo `parcela_grupo_id`.
- O webhook do n8n agora recebe `parcelaGrupoId`, `parcelaNumero`, `parcelaTotal` e `valorTotal`; o fluxo do n8n deve usar `lancamentoId`/`documentoId` para identificar cada cobrança.

### 2026-11-16 — Financeiro: baixa somente com aprovação (Fase 1 do plano de evolução)

**Problema identificado:** qualquer usuário do financeiro marcava receitas e despesas como realizadas direto na tela (botão "Dar Baixa" ou status "Já realizado"), sem conferência. O cancelamento de OS também tentava cancelar receitas já recebidas, e a edição de uma OS podia sobrescrever uma receita já baixada.

**Alterações realizadas:**

| Arquivo | O que mudou |
|---|---|
| `supabase/migrations/20261116_030_financeiro_aprovacao_baixa.sql` | Tabelas `financeiro_aprovadores` e `financeiro_baixa_solicitacoes`; funções `financeiro_solicitar_baixa`, `financeiro_decidir_baixa`, `financeiro_cancelar_solicitacao_baixa`, `is_aprovador_financeiro`; trigger que bloqueia status `realizado` fora da aprovação; colunas `liquidado_por` e `liquidado_em` |
| `lib/supabase/financeiro-repo.ts` | Funções de solicitação/decisão/cancelamento; `upsertReceitaServicoSupabase` não reescreve receita realizada ou com baixa pendente; `cancelLancamentoServicoSupabase` só cancela programados; cliente não envia mais `data_liquidacao` |
| `components/financeiro/aprovacoes-baixa.tsx` | Nova aba Aprovações e diálogo "Solicitar baixa" |
| `app/dashboard/financeiro/page.tsx` | "Dar Baixa" virou "Solicitar baixa"; opção "Já realizado" removida; aba Aprovações com contador; cancelamento usa update dirigido |
| `app/dashboard/servicos/page.tsx` | OS coberta pelo contrato cancela receita adicional ainda programada |

**Cuidados para futuras alterações nesta área:**
- Depois de aplicar a migration, cadastrar o e-mail da aprovadora: `insert into public.financeiro_aprovadores (email) values ('<email>');` (minúsculo). Sem isso ninguém consegue aprovar.
- A trava está no banco: qualquer código novo que tente gravar `status = 'realizado'` ou `data_liquidacao` vai falhar. O caminho correto é `financeiro_solicitar_baixa` → `financeiro_decidir_baixa`.
- Chamadas com service role (sem `auth.uid()`) passam pela trava. Rotas de servidor que usem service role precisam validar o usuário antes.
- Lançamentos já realizados antes da migration foram preservados e ficam imutáveis pela tela.

### 2026-07-08 — Certificado de garantia na geração de OS

**Problema identificado:** Serviços de controle de vetores precisavam emitir certificado de garantia separado da OS, com possibilidade de impressão imediata e registro junto aos serviços agendados.

**Alterações realizadas:**

| Arquivo | O que mudou |
|---|---|
| `components/os-generation/certificado-garantia.tsx` | Novo modelo visual do Certificado de Garantia em A4 paisagem, com logo/QR e dados extraídos do PDF de referência |
| `components/os-generation/pdf-preview-mock.tsx` | Preview da OS agora pode anexar/imprimir certificado como documento adicional |
| `public/images/higiene-disque-certificado-logo-qr.png` | Arte de cabeçalho do certificado com logo e QR Code |
| `app/dashboard/servicos/page.tsx` | Fluxo de geração ganhou botão de certificado, switch para salvar em serviços agendados e cálculo de garantia/vencimento por vetor |

**Cuidados para futuras alterações nesta área:**
- O certificado é salvo junto ao HTML da OS quando a opção de salvar está ativa; não foi criada coluna nova no banco nesta etapa.
- O modelo é aplicado apenas a serviços de controle de vetores (`serviceType === "pragas"`).
- Se o certificado precisar de ciclo próprio de auditoria/arquivo, criar migration nova em vez de editar migrations antigas.

### 2026-06-16 — Auditoria e otimizações de performance (Fase 1 e 2)

**Problema identificado:** Dashboard abria 7 queries paralelas carregando centenas de registros sem limite. Queries sequenciais desnecessárias. Métricas de clientes faziam 4 round-trips ao banco para retornar 4 números.

**Alterações realizadas:**

| Arquivo | O que mudou |
|---|---|
| `lib/supabase/clientes-repo.ts` | `getClientesMetricasSupabase()` substituída por chamada RPC `get_clientes_metricas()` |
| `lib/supabase/veiculos-repo.ts` | `listManutencoesPreventivasSupabase()` agora usa colunas específicas, `limit(30)` e filtra só datas futuras |
| `lib/supabase/estoque-repo.ts` | `listNotasFiscaisSupabase()` agora retorna `{ data, count }` com paginação de 50 registros |
| `lib/supabase/equipe-repo.ts` | `listEquipeMembrosSupabase()` agora busca membros e perfil do usuário em paralelo |
| `app/dashboard/page.tsx` | `useMemo` do dashboard com `new Date()` estável (movido para `useMemo` próprio) |
| `app/dashboard/produtos/page.tsx` | Botão "Carregar mais" na listagem de notas fiscais |
| Supabase SQL Editor | 7 índices PostgreSQL + RPC `get_clientes_metricas()` criados |

**Cuidados para futuras alterações nestas áreas:**
- `listNotasFiscaisSupabase` agora retorna `{ data, count }` — qualquer novo consumidor deve usar `.data` para os registros e `.count` para o total.
- `listManutencoesPreventivasSupabase` só retorna manutenções com `data_prevista >= hoje` — não usar para histórico passado.
- A RPC `get_clientes_metricas()` calcula a janela de "30 dias para vencer" no banco (via `CURRENT_DATE`), sem depender de data do cliente.

---

### Anterior a 2026-06-16 — Otimizações de busca e limpeza de duplicatas

| Descrição |
|---|
| Limpeza de 340 registros duplicados de clientes |
| Busca inteligente por tipo de termo: numérico (telefone/CPF/CNPJ) vs textual (nome) para evitar timeout |
| Índice trigram `idx_clientes_nome_trgm` em `clientes.nome` para busca textual eficiente |
| Debounce de 600ms na busca de clientes + `requestId` para evitar race condition entre requisições |
| Reversão de `count: estimated` para `count: exact` em `listClientesSupabase` |

---

## Pendências de performance (Fase 3 — não fazer sem planejamento prévio)

Melhorias identificadas na auditoria de 2026-06-16 mas **não implementadas** por envolverem alto risco de quebra:

| Item | Descrição | Risco |
|---|---|---|
| Server Components em clientes | Converter `clientes/page.tsx` para Server + Client Component | Alto |
| Dividir servicos/page.tsx | 3.700+ linhas — separar em lista, formulário e modais | Alto |
| React Query | Eliminar queries duplicadas entre páginas com cache client-side automático | Médio |
| react-hook-form no formulário de OS | Eliminar re-renders do formulário inteiro a cada campo digitado | Médio |
| Paginar lançamentos financeiros | Hoje carrega 500 registros com 5 JOINs — exige mover totalizadores para o servidor | Médio |

---

## Como rodar localmente

```bash
npm run dev
# Acesse http://localhost:3000
```

Variáveis de ambiente necessárias estão em `.env.local` — nunca commitar este arquivo.
