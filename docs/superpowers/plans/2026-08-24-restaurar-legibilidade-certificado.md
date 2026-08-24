# Restaurar Legibilidade do Certificado — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recuperar a legibilidade do certificado, ampliando moderadamente logo e textos sem fixar o papel.

**Architecture:** A impressão mantém o perfil automático em paisagem e ocupa a área do papel escolhida no navegador. O componente aumenta tipografia e cabeçalho em aproximadamente 10–15%, preservando a tabela em uma única página.

**Tech Stack:** TypeScript, React, CSS de impressão, Node test runner.

## Global Constraints

- Uma única página em orientação paisagem.
- Margem de 5 mm.
- Não alterar a impressão A4 da OS.
- Não reintroduzir seletor A4/A5 no ERP.

---

### Task 1: Preservar o perfil automático

**Files:**
- Modify: `components/os-generation/print-utils.test.ts`
- Modify: `components/os-generation/print-utils.ts`

- [x] **Step 1: Write a regression test for automatic landscape paper sizing**.
- [x] **Step 2: Verify the test detects fixed A5 behavior**.
- [x] **Step 3: Preserve automatic landscape CSS while keeping OS A4 unchanged**.

### Task 2: Ampliar o conteúdo visual

**Files:**
- Modify: `components/os-generation/certificado-garantia.tsx`

- [x] **Step 1: Increase logo/QR dimensions and header allocation**.
- [x] **Step 2: Increase body, table, metadata and footer typography**.
- [x] **Step 3: Run all tests and validate diff**.
