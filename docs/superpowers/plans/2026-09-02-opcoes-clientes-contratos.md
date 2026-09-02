# Opções de Clientes e Contratos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Incluir laboratório nos ambientes e corrigir a opção de limpeza de reservatórios nos contratos, mantendo ar-condicionado removido.

**Architecture:** Centralizar as opções estáticas de cadastro em um módulo TypeScript puro e consumi-las nas duas telas. Testar diretamente as listas para proteger os nomes e exclusões solicitados.

**Tech Stack:** TypeScript, React 19, Next.js 16, Node test runner.

## Global Constraints

- O tipo de ambiente deve incluir `Laboratório`.
- O serviço deve se chamar `Limpeza de reservatórios de água potável`.
- Higienização de ar-condicionado não deve aparecer nos contratos.

---

### Task 1: Opções centralizadas de cadastro

**Files:**
- Create: `lib/cadastro-options.ts`
- Create: `lib/cadastro-options.test.ts`
- Modify: `app/dashboard/clientes/page.tsx`
- Modify: `app/dashboard/clientes/contratos/page.tsx`
- Modify: `package.json`

**Interfaces:**
- Produces: `TIPOS_AMBIENTE_CLIENTE` e `TIPOS_SERVICO_CONTRATO`.

- [x] Escrever teste que exige Laboratório nos ambientes.
- [x] Escrever teste que exige o nome exato de reservatórios e exclui caixa d'água, cisterna e ar-condicionado.
- [x] Executar e confirmar falha por módulo inexistente.
- [x] Implementar as constantes e substituir as listas locais.
- [x] Executar testes e build de produção.
