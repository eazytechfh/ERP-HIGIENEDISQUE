# Numeracao Atomica de OS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reservar numeros de OS unicos no Supabase e usar o mesmo numero na previa, impressao e registro salvo.

**Architecture:** Uma funcao PostgreSQL `reserve_next_os_number` incrementa um contador anual com `INSERT ... ON CONFLICT DO UPDATE`, eliminando concorrencia entre navegadores. O frontend reserva o numero ao gerar a OS na entrada da etapa 3, guarda-o no estado e o reutiliza ao persistir.

**Tech Stack:** PostgreSQL/Supabase RPC, TypeScript, React, Node test runner.

## Global Constraints

- Formato `OS-AAAA-NNNNNN`.
- Ano obtido dinamicamente da data atual.
- Numeros reservados nao sao reutilizados; falhas podem deixar lacunas.
- Preservar numeros das OS existentes e iniciar acima do maior numero anual, inclusive excluido.
- Nao alterar os layouts de impressao.

---

### Task 1: Validacao do numero reservado

**Files:**
- Create: `lib/os-number.ts`
- Create: `lib/os-number.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `parseReservedOsNumber(value: unknown, year: number): string`.

- [x] **Step 1: Write failing tests** para aceitar `OS-2026-000124` e rejeitar formato ou ano divergente.
- [x] **Step 2: Run the isolated test** com Node test runner e confirmar falha por modulo ausente.
- [x] **Step 3: Implement strict validation** com expressao regular e retorno da string validada.
- [x] **Step 4: Add the test to `npm test`** e confirmar sucesso.

### Task 2: Reserva atomica no Supabase

**Files:**
- Create: `supabase/migrations/20260901_001_atomic_os_number.sql`
- Modify: `lib/supabase/servicos-repo.ts`

**Interfaces:**
- Produces: RPC `reserve_next_os_number(p_year integer) returns text`.
- Produces: `reserveNextOsNumberSupabase(year?: number): Promise<string>`.

- [x] **Step 1: Create the annual counter table** bloqueada para acesso direto.
- [x] **Step 2: Create the security-definer RPC** que semeia pelo maior numero existente e incrementa atomicamente.
- [x] **Step 3: Add the repository wrapper** com verificacao de permissao e validacao da resposta.

### Task 3: Numero unico em todo o fluxo

**Files:**
- Modify: `app/dashboard/servicos/page.tsx`

**Interfaces:**
- Consumes: `reserveNextOsNumberSupabase()`.
- Produces: `osNumber` reservado antes da previa e reutilizado no `novoServico`.

- [x] **Step 1: Replace the fixed state** por estado inicialmente vazio e setter.
- [x] **Step 2: Make `handleGerarOS` reserve once** e tratar falha sem avancar a etapa.
- [x] **Step 3: Await generation before entering step 3**.
- [x] **Step 4: Remove client-side maximum scanning** e salvar `osNumber` reservado.
- [x] **Step 5: Run the full test suite** e revisar o diff.
