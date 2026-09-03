# Canvas Universal do Certificado — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reproduzir o padrão do certificado com escala uniforme e centralização em qualquer papel paisagem.

**Architecture:** O certificado usa um canvas com proporção fixa de 210:148, dimensionado pelo menor eixo disponível e centralizado por flexbox. Tipografia, cabeçalho e margens usam proporções do canvas para crescerem juntos, tomando o PDF padrão como referência.

**Tech Stack:** TypeScript, React, CSS de impressão, Node test runner.

## Global Constraints

- O navegador continua escolhendo o papel.
- Não distorcer a proporção 210:148.
- Centralizar horizontal e verticalmente.
- Manter todo o certificado em uma página.
- Não alterar a impressão da OS.

---

### Task 1: Criar canvas proporcional e centralizado

**Files:**
- Modify: `components/os-generation/print-utils.test.ts`
- Modify: `components/os-generation/print-utils.ts`

- [x] **Step 1: Write failing test for aspect ratio, fit and centering**.
- [x] **Step 2: Verify expected failure**.
- [x] **Step 3: Implement the universal print canvas**.

### Task 2: Aproximar o conteúdo ao PDF padrão

**Files:**
- Modify: `components/os-generation/certificado-garantia.tsx`

- [x] **Step 1: Match header proportions and logo allocation**.
- [x] **Step 2: Match title, body, metadata, table and footer type ratios**.
- [x] **Step 3: Run all tests and validate diff**.
