# ERP Higiene Disque

Sistema de gestão empresarial para controle de serviços, clientes, agendamentos, estoque, financeiro, equipe e veículos.

## Links importantes

| Recurso | URL |
|---|---|
| Repositório GitHub | https://github.com/eazytechfh/ERP-HIGIENEDISQUE |
| Supabase (banco de dados) | https://supabase.com (projeto vinculado ao e-mail eazytech.ia@gmail.com) |
| Dev local | http://localhost:3000 |

> Se a URL da Vercel for configurada futuramente, adicionar aqui.

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
