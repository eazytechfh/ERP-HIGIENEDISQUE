# Seletor de Papel do Certificado — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir escolher A5 paisagem ou A4 paisagem antes de imprimir o certificado.

**Architecture:** A opção de impressão receberá o tamanho do papel do certificado e gerará CSS `@page` e dimensões físicas correspondentes. A prévia terá um seletor que encaminha a escolha ao trabalho de impressão.

**Tech Stack:** TypeScript, React, CSS de impressão, Node test runner.

## Global Constraints

- A5 paisagem permanece como padrão.
- A impressão da OS continua A4 retrato.
- O tamanho selecionado deve prevalecer sobre os estilos inline do certificado.

---

### Task 1: Suportar A4 e A5 no gerador de impressão

**Files:**
- Modify: `components/os-generation/print-utils.test.ts`
- Modify: `components/os-generation/print-utils.ts`

**Interfaces:**
- Consumes: `certificatePaperSize?: "a5" | "a4"`.
- Produces: CSS físico A5 210 × 148 mm ou A4 297 × 210 mm, ambos em paisagem.

- [x] **Step 1: Write failing A4 test**.
- [x] **Step 2: Run test and verify expected failure**.
- [x] **Step 3: Implement size-aware CSS**.
- [x] **Step 4: Run tests**.

### Task 2: Expor a escolha na interface

**Files:**
- Modify: `components/os-generation/pdf-preview-mock.tsx`

**Interfaces:**
- Consumes: seleção A5/A4 do usuário.
- Produces: chamada `openPrintWindow` com o tamanho selecionado.

- [x] **Step 1: Add paper-size state and selector**.
- [x] **Step 2: Pass selection to print options**.
- [x] **Step 3: Verify all tests and diff**.
