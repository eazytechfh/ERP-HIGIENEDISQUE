# Responsável Técnica e Reservatórios Opcionais Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fixar Mirela e seu CRMV em todas as OS aplicáveis e permitir que a inspeção dos reservatórios seja deixada em branco até a visita.

**Architecture:** Centralizar a identificação da responsável técnica em um módulo de defaults usado pela tela e pela prévia. Extrair a criação de reservatórios para um helper testável, iniciando volume e todos os campos de inspeção sem seleção.

**Tech Stack:** TypeScript, React 19, Next.js 16, Node test runner.

## Global Constraints

- Responsável técnica: Mirela Lauria Delia.
- Registro automático: CRMV. RJ 17439VP.
- Volume e condições observadas do reservatório devem ser opcionais.

---

### Task 1: Defaults da responsável técnica

**Files:**
- Create: `components/os-generation/responsavel-tecnica.ts`
- Create: `components/os-generation/responsavel-tecnica.test.ts`
- Modify: `app/dashboard/servicos/page.tsx`
- Modify: `components/os-generation/pdf-preview-mock.tsx`
- Modify: `components/os-generation/vetores-form.tsx`
- Modify: `components/os-generation/limpeza-form.tsx`

**Interfaces:**
- Produces: `RESPONSAVEL_TECNICA_NOME` e `RESPONSAVEL_TECNICA_REGISTRO`.

- [x] Escrever teste que exige nome e CRMV informados.
- [x] Executar o teste e confirmar falha por módulo inexistente.
- [x] Criar as constantes e aplicá-las aos defaults de OS.
- [x] Tornar os dois campos somente leitura nos formulários.
- [x] Executar o teste e confirmar aprovação.

### Task 2: Inspeção opcional dos reservatórios

**Files:**
- Create: `components/os-generation/limpeza-defaults.ts`
- Create: `components/os-generation/limpeza-defaults.test.ts`
- Modify: `components/os-generation/limpeza-form.tsx`

**Interfaces:**
- Produces: `criarReservatorio(tipo, numero, id): Reservatorio`.

- [x] Escrever teste que exige volume e todos os campos de inspeção vazios.
- [x] Executar o teste e confirmar falha por helper inexistente.
- [x] Implementar o helper e permitir string vazia nos tipos de inspeção.
- [x] Usar o helper ao adicionar cisternas e caixas d'água.
- [x] Executar testes e build de produção; lint e TypeScript isolado estão limitados pela configuração preexistente do projeto.
