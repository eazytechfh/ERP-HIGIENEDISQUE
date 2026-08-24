# Certificado com Papel Automático — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer o certificado se ajustar ao papel escolhido no diálogo nativo e remover o seletor A4/A5 do ERP.

**Architecture:** O CSS de impressão deixará de fixar A4 ou A5, mantendo somente orientação paisagem e margem. O certificado ocupará 100% da área imprimível fornecida pelo navegador e pela impressora.

**Tech Stack:** TypeScript, React, CSS de impressão, Node test runner.

## Global Constraints

- Não fixar A4 ou A5 no certificado.
- Manter orientação paisagem.
- Não alterar a impressão A4 das ordens de serviço.

---

### Task 1: Tornar a impressão responsiva ao papel

**Files:**
- Modify: `components/os-generation/print-utils.test.ts`
- Modify: `components/os-generation/print-utils.ts`
- Modify: `components/os-generation/pdf-preview-mock.tsx`

**Interfaces:**
- Produces: `@page { size: landscape; margin: 5mm; }` e certificado em 100% da área disponível.

- [x] **Step 1: Write failing responsive-paper test**.
- [x] **Step 2: Verify the test fails against fixed A5/A4 behavior**.
- [x] **Step 3: Remove the size option and implement responsive CSS**.
- [x] **Step 4: Remove the selector from the preview**.
- [x] **Step 5: Run all tests and validate the diff**.
