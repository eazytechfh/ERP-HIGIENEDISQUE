# Escala Proporcional do Certificado — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer textos, logo e QR Code crescerem proporcionalmente quando o certificado for impresso em papel maior.

**Architecture:** A moldura continua responsiva ao papel escolhido. Na impressão, o tamanho-base da fonte passa a acompanhar a largura da página, limitado entre 12 e 18 px; medidas tipográficas internas usam `em`, e o cabeçalho usa proporções percentuais em vez de milímetros fixos.

**Tech Stack:** TypeScript, React, CSS de impressão, Node test runner.

## Global Constraints

- O navegador continua escolhendo o papel.
- A5 mantém legibilidade mínima atual.
- A4 amplia conteúdo em aproximadamente 40%, limitado a 18 px.
- A OS A4 não deve ser alterada.

---

### Task 1: Escalar a tipografia na impressão

**Files:**
- Modify: `components/os-generation/print-utils.test.ts`
- Modify: `components/os-generation/print-utils.ts`

- [x] **Step 1: Write failing test for responsive certificate font scale**.
- [x] **Step 2: Verify expected failure**.
- [x] **Step 3: Add print-only responsive font sizing**.

### Task 2: Tornar conteúdo interno proporcional

**Files:**
- Modify: `components/os-generation/certificado-garantia.tsx`

- [x] **Step 1: Convert child font sizes from px to em**.
- [x] **Step 2: Convert header/logo and client grid widths to percentages**.
- [x] **Step 3: Run tests and validate diff**.
