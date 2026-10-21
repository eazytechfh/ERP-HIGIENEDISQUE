# Edição de Contrato do Cliente Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir abrir o contrato atual de um cliente, editar seus dados disponíveis e atualizar o mesmo registro sem gerar uma nova numeração.

**Architecture:** A listagem de clientes enviará `clienteId` e `contratoId` para a tela já existente de contratos. A tela consultará o contrato diretamente, converterá seus dados para o estado do formulário e preservará número e identidade do registro. Uma migração adicionará os campos ausentes e uma RPC transacional atualizará contrato, itens e resumo do cliente com controle de concorrência por `updated_at`.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase, Node test runner.

## Global Constraints

- Manter o cadastro atual de novos contratos funcionando.
- Reutilizar a rota `/dashboard/clientes/contratos` com query string.
- Adicionar campos opcionais ao esquema para manter compatibilidade com contratos antigos.
- Contratos antigos mostrarão vazios apenas nos campos que nunca foram persistidos; após a primeira atualização, esses dados serão recuperáveis.

---

### Task 1: Regressão automatizada do fluxo de edição

**Files:**
- Create: `tests/contratos-edit.test.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: fontes da tela de clientes, formulário de contratos e repositório Supabase.
- Produces: cobertura para navegação, carregamento direto e upsert com identidade preservada.

- [x] **Step 1: Write the failing test**

Criar testes que exijam `contratoId` na navegação, `getContratoSupabase`, preenchimento do formulário e inclusão de `id`/número original no payload.

- [x] **Step 2: Run test to verify it fails**

Run: `node --test tests/contratos-edit.test.js`
Expected: FAIL porque a tela ainda não oferece edição.

- [x] **Step 3: Add the test to the project suite**

Adicionar `tests/contratos-edit.test.js` ao script `test` do `package.json`.

### Task 2: Consulta e preenchimento do contrato existente

**Files:**
- Modify: `lib/supabase/contratos-repo.ts`
- Modify: `app/dashboard/clientes/contratos/page.tsx`
- Create: `supabase/migrations/20261021_001_expand_contratos_editable_fields.sql`

**Interfaces:**
- Consumes: `contratoId` da query string.
- Produces: `getContratoSupabase(id)` e formulário preenchido com cliente, tipo, status, datas, financeiro, regras, observações e serviços.

- [x] **Step 1: Persist every editable field**

Adicionar colunas opcionais em `contratos` e `contrato_itens`, incluindo seu mapeamento de leitura e escrita no repositório.

- [x] **Step 2: Implement the minimal repository lookup**

Consultar um contrato não excluído por `id`, incluindo `contrato_itens`, e reutilizar o mapeamento existente.

- [x] **Step 3: Implement edit-mode hydration**

Ler `contratoId`, carregar o contrato e seu cliente, preencher os estados persistidos e mostrar erro se o carregamento falhar.

- [x] **Step 4: Preserve record identity on save**

Enviar `id` e o número original no payload do upsert quando a tela estiver em modo de edição; ajustar títulos, confirmação, alertas e botão para “Atualizar”.

- [x] **Step 5: Run test to verify it passes**

Run: `node --test tests/contratos-edit.test.js`
Expected: PASS.

### Task 3: Ação de editar na listagem de clientes

**Files:**
- Modify: `app/dashboard/clientes/page.tsx`

**Interfaces:**
- Consumes: contrato atual de `contratosPorCliente`.
- Produces: botão “Editar contrato” que abre `/dashboard/clientes/contratos?clienteId=...&contratoId=...`.

- [x] **Step 1: Add the action button**

Exibir o botão somente quando existir contrato atual para o cliente e navegar com ambos os identificadores codificados.

- [x] **Step 2: Run focused and full validation**

Run: `node --test tests/contratos-edit.test.js`, `npm test`, `npm run lint`, and `npm run build`.
Expected: testes e build aprovados; tratar somente problemas introduzidos pela alteração.

- [x] **Step 3: Review the diff**

Confirmar que novos contratos continuam sem `id`, contratos editados preservam número/registro e nenhuma mudança não relacionada foi incluída.
