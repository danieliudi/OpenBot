# Evidência — patch de bind (R-01, ADR-004 variante A1)

- **Data:** 2026-10-11
- **Onde:** container de nuvem do Claude Code (Ubuntu 24.04, sem IPv6, sem daemon Docker). Não é o
  host-alvo.
- **Autorização:** `bun install --frozen-lockfile` e checks neste container, aprovados em 2026-10-11.
- **Bun:** 1.4.2 (pin do repositório: 1.3.14). Divergência registrada em R-22.

## Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `shared/listen-host.ts` | `listenHost` (valida IP literal ou `localhost`) e `dialHost` (endereço para discar) |
| `shared/listen-host.test.ts` | 5 testes |
| `server/src/config.ts` | `SERVER_HOST` → `config.host`, recusado no boot se inválido |
| `server/src/index.ts` | `hostname` passado ao `Bun.serve` só quando definido; log com o endereço real |
| `app/vite.config.ts` | `APP_HOST` (padrão `::` mantido); proxy `/api` disca `SERVER_HOST` quando definido |
| `scripts/start.sh` | lê `APP_HOST`/`SERVER_HOST` do ambiente ou `.env` e exporta |
| `server/tests/config.test.ts` | 2 testes |
| `.env.example`, `docs/configuration.md`, `CHANGELOG.md` | documentação, incluindo o limite do callback `host.docker.internal` |

## Instalação

```text
$ sha256sum bun.lock > lock.before
$ bun install --frozen-lockfile
1176 packages installed [7.71s]
$ sha256sum -c lock.before
bun.lock: OK
$ git status --short
(vazio)
```

## Checks: linha de base (código intocado) vs. com patch

| Check | Linha de base | Com patch |
|---|---|---|
| `bun run format:check` | PASS | PASS |
| `bun run lint` | PASS | PASS |
| `bun run typecheck` | PASS (app, server, worker) | PASS (app, server, worker) |
| `bun run test` | 4782 pass · 56 skip · 105 fail · 87 errors · 4943 testes | 4789 pass · 56 skip · 105 fail · 87 errors · 4950 testes |
| Conjunto de testes com `(fail)` | 18 nomes | **idêntico** (`diff` vazio) |
| Testes do patch (`listen-host`, `config`, `listen-port`, `vite-listen-port`) | — | 143 pass · 0 fail |
| `scripts/start-restart-guard.test.ts` | — | 12 pass · 0 fail |

As 105 falhas da linha de base são do ambiente, não do código: dependências de sub-pacotes que o
`bun install` da raiz não instala (`@mastra/core`, `@ag-ui/encoder`, `@langchain/anthropic`,
`react/jsx-dev-runtime`, `@tauri-apps/api`), ausência de PostgreSQL de teste (171 linhas do log
citam `TEST_DATABASE_URL` ou `ECONNREFUSED`) e Bun 1.4.2. Não foram investigadas uma a uma. O que importa
aqui é que o patch não acrescentou nem removeu nenhuma.

## Bind comprovado com processos descartáveis

API (`Bun.serve`, mesma chamada do servidor):

```text
sem hostname          -> *:3901          (todas as interfaces; server.hostname reporta "localhost")
hostname=127.0.0.1    -> 127.0.0.1:3902
```

App (Vite do repositório, `bun --bun node_modules/vite/bin/vite.js`):

```text
APP_HOST=127.0.0.1    -> 127.0.0.1:3911
APP_HOST vazio (::)   -> EAFNOSUPPORT: address family not supported
```

A falha com `::` é do container (`/proc/net/if_inet6` ausente, sem IPv6) e vale igualmente para o
código original. No host-alvo, com IPv6, `::` escuta em todas as interfaces.

Após os testes, nenhum listener dos processos de teste permaneceu (`lsof` só mostra processos do
próprio ambiente de execução).

## NOT RUN / BLOCKED

| Item | Status | Motivo |
|---|---|---|
| Servidor OpenBot completo com `SERVER_HOST=127.0.0.1` | NOT RUN | Exige Postgres, Intelligence e `.env` (Fase 1) |
| Callback do Bot LangGraph via `host.docker.internal` | BLOCKED | Exige Docker no host-alvo; critério de aceite do ADR-004 |
| SEC-01 (outro dispositivo) | BLOCKED | Exige host-alvo e segundo dispositivo |
| `bun run build` | NOT RUN | Não pedido para esta validação; fica para a Fase 1 |
