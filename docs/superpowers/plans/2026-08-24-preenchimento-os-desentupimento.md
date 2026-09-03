# Preenchimento Automático da OS de Desentupimento — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preencher automaticamente atendente, vendedor, horário, descrição, valor e condição de pagamento da OS de desentupimento com os dados já informados na solicitação.

**Architecture:** Uma função pura transforma os dados da solicitação em valores padrão da OS e preserva qualquer campo já editado. A página aplica essa função ao estado da OS quando os dados de origem mudam; a apresentação e o documento continuam consumindo o mesmo modelo existente.

**Tech Stack:** TypeScript, React 19, Next.js 16, Node test runner.

## Global Constraints

- Não sobrescrever valores preenchidos manualmente na OS.
- Não inventar preço para serviço incluído em contrato.
- Manter todos os campos editáveis.

---

### Task 1: Derivar os dados automáticos

**Files:**
- Create: `components/os-generation/desentupimento-defaults.ts`
- Create: `components/os-generation/desentupimento-defaults.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: dados atuais da OS, usuário, agenda, serviço e cobrança.
- Produces: `preencherDadosDesentupimento(dados, origem): DadosTecnicosDesentupimento`.

- [x] **Step 1: Write the failing test** cobrindo preenchimento direto, contrato e preservação de edição manual.
- [x] **Step 2: Run test to verify it fails** com `node --test --experimental-strip-types components/os-generation/desentupimento-defaults.test.ts` e confirmar módulo ausente.
- [x] **Step 3: Write minimal implementation** que formata horário/valor/pagamento e preenche somente campos vazios.
- [x] **Step 4: Run test to verify it passes** com `npm test`.

### Task 2: Integrar ao formulário da OS

**Files:**
- Modify: `app/dashboard/servicos/page.tsx`

**Interfaces:**
- Consumes: `profile.nome`, `serviceRequest` e `preencherDadosDesentupimento`.
- Produces: estado `dadosTecnicosDesentupimento` pré-preenchido e ainda editável.

- [x] **Step 1: Add integration** obtendo o perfil do contexto e sincronizando os defaults em um `useEffect`.
- [x] **Step 2: Verify types and regressions** com `npx tsc --noEmit` e `npm test`.
