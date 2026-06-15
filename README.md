# HIGIENE DISQUE — Sistema ERP

Sistema de gestão empresarial para controle de serviços, clientes, contratos, equipe, estoque, veículos e financeiro.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/sitios-projects-de87bf7b/v0-erp-online-setup)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/n06sFyTJvGK)

---

## 🔗 Links do Projeto

| Recurso | URL |
|---|---|
| **GitHub** | https://github.com/eazytechfh/ERP-HIGIENEDISQUE |
| **Deploy (Vercel)** | https://vercel.com/sitios-projects-de87bf7b/v0-erp-online-setup |
| **v0.app (editor)** | https://v0.app/chat/n06sFyTJvGK |
| **Supabase Dashboard** | https://supabase.com/dashboard |

> O repositório sincroniza automaticamente com o v0.app. Alterações feitas lá são pusheadas para o GitHub e a Vercel faz deploy automaticamente.

---

## 🏗️ Arquitetura

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | 16.0.10 |
| Runtime | React | 19.2.0 |
| Backend / Auth | Supabase (PostgreSQL + Auth + Storage) | ^2.99.0 |
| UI Base | Radix UI + Tailwind CSS v4 + padrão shadcn/ui | Tailwind ^4.1.9 |
| Gráficos | Recharts | 2.15.4 |
| Formulários | React Hook Form + Zod | ^7 / 3.25 |
| Datas | date-fns | 4.1.0 |
| Notificações | Sonner (toast) | ^1.7.4 |
| Ícones | lucide-react | ^0.454.0 |
| Temas | next-themes | ^0.4.6 |
| Observabilidade | @vercel/analytics + @vercel/speed-insights | — |
| Deploy | Vercel (auto-deploy via GitHub) | — |
| Package Manager | pnpm | — |

---

## 📁 Estrutura de Pastas

```
/app
  /dashboard
    /clientes           → Gestão de clientes
    /clientes/contratos → Contratos por cliente
    /servicos           → Cadastro e agendamento de serviços (OS)
    /servicos/agendados → Visão de serviços agendados
    /historico          → Histórico de serviços executados
    /produtos           → Controle de estoque
    /equipe             → Cadastro da equipe (NR33/NR35/ASO)
    /veiculos           → Frota e manutenções preventivas
    /financeiro         → Lançamentos financeiros
    /logs               → Logs de auditoria do sistema
    /qa                 → Controle de qualidade
  /api
    /auth/bootstrap-profile → Criação de perfil pós-autenticação
    /admin/create-user      → Criação de usuários pelo admin

/components
  /ui                   → Componentes base (shadcn/ui)
    confirm-action-dialog.tsx → Diálogo de confirmação antes de criar registros (evita duplicatas)
  /os-generation        → Geração de OS (Limpeza e Vetores)
    limpeza-form.tsx    → Formulário de OS de Limpeza
    vetores-form.tsx    → Formulário de OS de Controle de Vetores
    os-document-limpeza.tsx  → Documento PDF de OS Limpeza
    os-document-vetores.tsx  → Documento PDF de OS Vetores
    os-header-card.tsx  → Cabeçalho do card de OS
    consumo-estoque-card.tsx → Card de consumo de estoque na OS
    signed-upload.tsx   → Upload de assinatura digital
    pdf-preview-mock.tsx → Preview do PDF antes de salvar
  erp-header.tsx        → Navegação principal com controle de permissões
  access-provider.tsx   → Contexto global de autenticação e permissões
  login-form.tsx        → Tela de login
  theme-provider.tsx    → Provider de tema claro/escuro (next-themes)

/lib
  /supabase             → Repositórios de dados (um arquivo por módulo)
    clientes-repo.ts    → CRUD de clientes
    clientes-view.ts    → View agregada de clientes (join com contratos, etc.)
    contratos-repo.ts   → CRUD de contratos
    servicos-repo.ts    → CRUD de serviços/OS
    estoque-repo.ts     → CRUD de estoque/produtos
    equipe-repo.ts      → CRUD de equipe
    veiculos-repo.ts    → CRUD de veículos
    financeiro-repo.ts  → CRUD de lançamentos financeiros
    audit-log-repo.ts   → Registro de logs de auditoria
    profiles-repo.ts    → Gestão de perfis de usuário
    client.ts           → Instância do cliente Supabase (CRÍTICO)
  access-control.ts     → Papéis, permissões e rotas protegidas (CRÍTICO)
  runtime-config.ts     → Modo de dados: "api" (Supabase) | "local" (testes)
  flow-store.ts         → Estado global de fluxos
  utils.ts              → Utilitários gerais (cn, formatadores)
  with-timeout.ts       → Wrapper de timeout para chamadas async
  local-test-users.ts   → Usuários de teste para modo offline
```

---

## 🔑 Variáveis de Ambiente

Arquivo: `.env.local` (nunca commitar no git)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
NEXT_PUBLIC_DATA_MODE=api   # "api" = Supabase | "local" = modo offline/teste
```

> Se `NEXT_PUBLIC_DATA_MODE` não for definido, o sistema detecta automaticamente pela presença das variáveis do Supabase. As variáveis de produção ficam no painel da Vercel (Settings → Environment Variables).

---

## 👥 Papéis e Permissões

| Papel | Acesso |
|---|---|
| `admin` | Acesso total a todos os módulos |
| `operacional` | Clientes, contratos, serviços, estoque, equipe, veículos |
| `financeiro` | Dashboard, clientes (view), contratos (view), financeiro |
| `tecnico` | Dashboard, serviços (view/edit), estoque (view) |

Permissões granulares por ação (`.view`, `.create`, `.edit`, `.delete`). Definidas em `lib/access-control.ts`. Rotas protegidas automaticamente pelo `DashboardLayout`.

---

## 🚀 Como rodar localmente

```bash
pnpm install
cp .env.example .env.local   # preencher as variáveis do Supabase
pnpm dev
```

Build de produção: `pnpm build && pnpm start`

---

## 📦 Módulos do Sistema

**Dashboard** — Métricas em tempo real: OS do dia/semana/mês, taxa de conclusão, resumo de clientes, contratos a vencer, alertas críticos, gráfico de área semanal.

**Clientes** — Cadastro completo com gestão de contratos. Alerta automático de contratos a vencer em 30 dias.

**Serviços / OS** — Agendamento e execução de serviços. Geração de OS (Limpeza e Controle de Vetores) com upload de assinatura digital. Histórico com filtros.

**Estoque** — Controle de produtos com estoque mínimo. Alerta automático quando estoque ≤ mínimo.

**Equipe** — Cadastro de colaboradores com validade de NR33, NR35 e ASO. Alerta de documentos vencidos.

**Veículos** — Frota com registro de manutenções preventivas e alertas de pendências.

**Financeiro** — Lançamentos de receitas e despesas com visão consolidada.

**Logs** — Auditoria de ações por usuário.

---

## 🤖 PROTOCOLO DE SEGURANÇA PARA IA — LEIA ANTES DE QUALQUER ALTERAÇÃO

> **Este projeto está em produção. Toda alteração deve seguir este protocolo sem exceção.**

### ✅ ANTES de alterar

1. Identifique o escopo exato — quais arquivos serão tocados e por quê.
2. Mapeie dependências — o arquivo é importado por outros? Verifique todos os usos.
3. Preserve os contratos de tipos TypeScript — nunca altere tipos/interfaces sem checar todos os consumidores.
4. Não remova permissões existentes em `lib/access-control.ts` sem confirmação explícita do usuário.
5. Não altere o schema do Supabase (tabelas, colunas, RLS) sem instrução explícita — impacta produção imediatamente.

### ⚠️ ÁREAS DE ALTO RISCO

| Arquivo | Por que é crítico |
|---|---|
| `lib/access-control.ts` | Quebrar autenticação/autorização de todos os usuários |
| `lib/supabase/client.ts` | Quebrar conexão com banco de dados |
| `app/dashboard/layout.tsx` | Quebrar proteção de rotas |
| `components/access-provider.tsx` | Quebrar contexto global de sessão |
| `app/api/auth/bootstrap-profile/route.ts` | Impedir criação de novos usuários |
| `next.config.mjs` | Impedir build/deploy |
| `lib/supabase/*-repo.ts` | Corromper queries de dados em produção |

### 🧪 DURANTE a alteração

- Faça mudanças cirúrgicas — evite refatorações amplas em código que já funciona.
- Se alterar componente de UI, verifique se está sendo usado em múltiplas páginas.
- Mantenha nomes de funções exportadas inalterados.
- Nunca troque `"use client"` por `"use server"` (ou vice-versa) sem entender o impacto.
- Se a mudança envolver env vars, confirme se elas já existem na Vercel.

### 📝 APÓS toda alteração — OBRIGATÓRIO

Adicione uma entrada no **Histórico de Alterações** abaixo com: data, o que foi feito, arquivos modificados, cuidados para o futuro.

### 💡 SE receber algo útil para o futuro

Se o usuário compartilhar link, credencial de ambiente, decisão arquitetural ou qualquer informação relevante, **registre aqui no README** na seção correspondente.

---

## 📋 Histórico de Alterações

### 2026-06-15 — Fix: lista de clientes não mostrava resultados antigos durante digitação

- **Problema**: No seletor de clientes da página de Serviços, ao digitar um nome, a lista OLD (todos os clientes, sem filtro) continuava visível durante os 600ms do debounce. O usuário via resultados sem relação com o que tinha digitado.
- **Causa**: O debounce atrasa o disparo da busca no servidor, mas o estado `clientesSupabase` permanecia inalterado nesse intervalo.
- **Solução**: Ao detectar mudança no `searchTerm`, ativa `isLoadingClientes = true` imediatamente (antes do timer disparar). A UI já exibia o spinner quando `isLoadingClientes` é `true`, então a lista antiga some na hora e o usuário vê "carregando" enquanto aguarda.
- **Arquivos modificados**: `app/dashboard/servicos/page.tsx`

### 2026-06-15 — Refinamento do Gerenciador de Duplicatas + Debounce de Busca

- **O que foi feito**:
  1. **Duplicatas — novo critério**: Detecção mudada para sempre exigir **nome idêntico + pelo menos um de (telefone, CPF, CNPJ ou e-mail) igual**. Antes agrupava só por documento. Agora qualquer campo em comum já classifica como duplicata.
  2. **Duplicatas — sem restrição de exclusão**: Removida a lógica de "original" que impedia excluir o primeiro registro. Agora qualquer cliente do grupo pode ser excluído.
  3. **Debounce de busca**: Aumentado de 400ms para 600ms em Clientes, Serviços e Histórico para reduzir disparos desnecessários durante digitação. O fix definitivo para a lentidão é o índice abaixo.
- **Arquivos modificados**: `app/dashboard/clientes/page.tsx`, `app/dashboard/servicos/page.tsx`, `app/dashboard/historico/page.tsx`, `README.md`
- **Cuidados futuros**: Ver nota sobre índice do Supabase abaixo.

### 2026-06-15 — Performance, Busca e Gerenciador de Duplicatas

- **O que foi feito**:
  1. **Performance (dashboard)**: Criada `listServicosSupabaseDashboard()` em `lib/supabase/servicos-repo.ts` que exclui o campo `os_documento_html` do select. Com 300 registros, esse campo representa dezenas de KB por linha (HTML completo da OS), causando o atraso de ~30s na carga do dashboard. O dashboard agora usa essa função leve. As páginas de Serviços e Histórico continuam usando `listServicosSupabase()` (com `select("*")`) pois precisam renderizar/imprimir a OS.
  2. **Busca na lista de OS (Serviços)**: Adicionado campo de busca textual com filtro em tempo real por cliente, número da OS, tipo de serviço, técnico e local. Antes só havia filtros de status/data/assinatura.
  3. **Busca na Frota (Veículos)**: Adicionado campo de busca por placa, modelo, marca e responsável. A página não tinha nenhum campo de busca.
  4. **Gerenciador de Duplicatas (Clientes)**: Nova aba "Gerenciar Duplicatas" na página de Clientes. Ao clicar em "Verificar Duplicatas", carrega todos os clientes e agrupa por: (a) CNPJ idêntico, (b) CPF idêntico, (c) nome idêntico (para clientes sem documento). Mostra cada grupo em uma tabela com sugestão de qual manter (o primeiro por ID = original). A exclusão usa o soft delete existente (`deleteClienteSupabase`) — seguro, registro vai para lixeira com `deleted_at`.
- **Arquivos modificados**:
  - `lib/supabase/servicos-repo.ts` — nova constante `SERVICO_COLUMNS_SEM_HTML` e função `listServicosSupabaseDashboard()`
  - `app/dashboard/page.tsx` — troca para usar `listServicosSupabaseDashboard()`
  - `app/dashboard/servicos/page.tsx` — estado `filtroTexto`, lógica no `servicosFiltrados`, campo de busca na UI
  - `app/dashboard/veiculos/page.tsx` — import `Search`, estado `searchVeiculo`, `veiculosFiltrados`, campo de busca na UI
  - `app/dashboard/clientes/page.tsx` — tipo `GrupoDuplicata`, estados da aba, funções `verificarDuplicatas` e `handleExcluirDuplicata`, nova aba na UI
- **Cuidados futuros**:
  - **NUNCA** trocar `listServicosSupabase()` por `listServicosSupabaseDashboard()` nas páginas de histórico e serviços — elas precisam do `osDocumentoHtml` para imprimir.
  - O gerenciador de duplicatas sugere o primeiro registro por ID como original, mas isso é uma **sugestão** — o usuário deve revisar antes de excluir.
  - Se o banco crescer muito, a verificação de duplicatas (que carrega 9999 clientes) pode ficar lenta. Nesse caso, criar uma query SQL/RPC no Supabase para detecção server-side.

### 2026-06-15 — Auditoria e expansão do README.md
- **O que foi feito**: README auditado contra o código real. Adicionado: versões exatas de todas as dependências relevantes, mapeamento completo de todos os arquivos em `/components`, `/components/os-generation` e `/lib/supabase` (vários arquivos estavam faltando como `clientes-view.ts`, `profiles-repo.ts`, `confirm-action-dialog.tsx`, `theme-provider.tsx`). Registrado o uso de `@vercel/analytics` e `@vercel/speed-insights` (observabilidade de produção já ativa).
- **Arquivos modificados**: `README.md`
- **Cuidados futuros**: Ao adicionar novo arquivo em `/lib/supabase` ou `/components`, registrar aqui no README.

### 2026-06-15 — Melhorias em múltiplos módulos (Estoque, Veículos, Equipe, Dashboard, Clientes)
- **O que foi feito**: Melhorias funcionais nos módulos de Estoque, Veículos, Equipe, Dashboard e Clientes. Adicionado `confirm-action-dialog.tsx` para prevenir cadastros duplicados antes de salvar. Corrigido parsing de valores monetários no formato brasileiro (ex: `2.000,00`).
- **Arquivos modificados**: Múltiplos arquivos em `app/dashboard/`, `components/ui/confirm-action-dialog.tsx`, lógica de parsing financeiro.
- **Cuidados futuros**: O parsing monetário BR usa vírgula como decimal e ponto como milhar — não usar `parseFloat()` direto. Sempre passar pelo utilitário específico. O diálogo de confirmação deve ser mantido em todos os formulários de criação para evitar duplicatas.

### 2026-06-15 — Criação do README.md completo (sessão anterior)
- **O que foi feito**: README reescrito com mapeamento completo da arquitetura, módulos, permissões, variáveis de ambiente, links do projeto (Vercel, GitHub, v0.app) e protocolo de segurança para IA.
- **Arquivos modificados**: `README.md`
- **Cuidados futuros**: Manter este arquivo atualizado após cada sessão de trabalho.

---

## 🗒️ Notas e Decisões Técnicas

- **`next.config.mjs`** tem `ignoreBuildErrors: true` e `eslint.ignoreDuringBuilds: true` — o build não falha por erros de TS/ESLint. Intencional para agilidade, mas cuidado com erros silenciosos.
- **Imagens não otimizadas** (`images.unoptimized: true`) — compatibilidade com Vercel Free Tier. Manter assim a menos que haja upgrade de plano.
- **OS em dois formatos**: Limpeza (`os-document-limpeza.tsx`) e Controle de Vetores (`os-document-vetores.tsx`).
- **Modo local**: O sistema pode rodar sem Supabase com `NEXT_PUBLIC_DATA_MODE=local` para testes. Dados de teste em `lib/local-test-users.ts`.
- **Sync automático**: Alterações feitas no v0.app são automaticamente pusheadas para o GitHub → Vercel faz deploy. Para edições diretas no código local, é necessário fazer push manual para o GitHub.
- **Parsing monetário BR**: Valores como `2.000,00` devem ser convertidos via utilitário próprio — nunca usar `parseFloat()` diretamente. Correção aplicada em 2026-06-15.
- **Observabilidade em produção**: `@vercel/analytics` e `@vercel/speed-insights` já estão instalados e ativos. Monitorar via painel da Vercel.
- **`clientes-view.ts`** é uma camada de view separada de `clientes-repo.ts` — representa a visão agregada (joins). Ao alterar o schema de clientes, verificar ambos os arquivos.
- **`confirm-action-dialog.tsx`**: Componente de confirmação antes de salvar registros novos. Deve ser usado em todos os formulários de criação para evitar duplicatas. Não remover ou bypassar.
- **Índice Supabase para busca rápida de clientes**: A busca por nome com `ilike` em 12k+ registros é lenta sem índice. Executar no SQL Editor do Supabase para resolver definitivamente:
  ```sql
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  CREATE INDEX IF NOT EXISTS idx_clientes_nome_trgm ON clientes USING GIN (nome gin_trgm_ops);
  CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON clientes (telefone) WHERE deleted_at IS NULL;
  CREATE INDEX IF NOT EXISTS idx_clientes_cpf ON clientes (cpf) WHERE deleted_at IS NULL;
  CREATE INDEX IF NOT EXISTS idx_clientes_cnpj ON clientes (cnpj) WHERE deleted_at IS NULL;
  ```
  Após criar, as buscas `ilike '%termo%'` passam a usar o índice trigram e ficam muito mais rápidas.
