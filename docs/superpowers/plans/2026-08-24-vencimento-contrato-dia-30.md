# Vencimento de Contrato até Dia 30 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir selecionar o dia 29 ou 30 como vencimento de um contrato.

**Architecture:** A lista de dias ficará em uma constante testável, usada diretamente pelo seletor existente. Persistência e documentos continuam recebendo o valor como texto, sem mudança de banco.

**Tech Stack:** TypeScript, React, Node test runner.

## Global Constraints

- O último dia oferecido deve ser o dia 30.
- Não oferecer dia 31.

---

### Task 1: Ampliar as opções de vencimento

**Files:**
- Create: `components/contratos/dias-vencimento.ts`
- Create: `components/contratos/dias-vencimento.test.ts`
- Modify: `app/dashboard/clientes/contratos/page.tsx`
- Modify: `package.json`

**Interfaces:**
- Produces: `DIAS_VENCIMENTO_CONTRATO: number[]` contendo os dias 1 a 30.

- [x] **Step 1: Write the failing test** verificando início, fim, quantidade e ausência do dia 31.
- [x] **Step 2: Run test to verify it fails** por módulo ausente.
- [x] **Step 3: Implement the constant and use it in the selector**.
- [x] **Step 4: Run all tests** com `npm test`.
