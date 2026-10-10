# ADR-006 — Automatic Learning pausado durante o piloto

- **Status:** Proposto.
- **Data:** 2026-10-10 · **SHA:** `e16d90b`

## Contexto

- A preferência vem ligada (`docs/automatic-learning.md:3`; `server/src/learning/settings.ts:86-90`).
- Coleta e entrega só acontecem com container de Learning atribuído
  (`server/src/learning/runtime.ts:50-60`).
- `bun scripts/setup-learning.ts` cria ou reutiliza o container `openbot` e grava a atribuição no
  `.env` (`prompt.txt`, seção B). `CPK_INTELLIGENCE_LEARNING_CONTAINER_ID` também atribui.
- O que sai: conversas concluídas de chat, canais, rotinas e handoffs, e respostas de voz delegadas.
- Não existe variável de ambiente que desligue Learning. A pausa é feita em Admin → Automatic
  Learning, e a configuração salva prevalece sobre o ambiente, inclusive `off`.
- O CopilotKit Intelligence é obrigatório para o servidor subir (`server/src/config.ts:894-913`) e
  armazena threads e memória fora do host, com ou sem Learning.

## Decisão proposta

1. Na Fase 1, **não executar `setup-learning.ts`** e não definir `CPK_INTELLIGENCE_LEARNING_CONTAINER_ID`.
2. Antes do primeiro chat, abrir Admin → Automatic Learning, pausar e registrar evidência sem segredo.
3. Reavaliar só depois de ler termos de retenção do Intelligence (ADR-007).

## Limite desta decisão

Pausar Learning não impede o envio das conversas ao Intelligence como armazenamento de threads.
Por isso a regra de dados sintéticos (ADR-003) continua necessária.
