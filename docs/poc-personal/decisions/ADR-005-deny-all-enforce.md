# ADR-005 — Política de ações deny-all em `enforce`

- **Status:** Aceito por Daniel Yano em 2026-10-11.
- **Data:** 2026-10-10 · **SHA:** `e16d90b`

## Contexto

- Default de fábrica: `{ mode: "enforce", deny: [], allow: ["true"] }`, ou seja, tudo permitido
  (`server/src/computer/policy-store.ts:52-56`).
- Em `enforce`, `allow: []` não permite nada (`server/src/computer/policy.ts:33`). Regra de deny
  quebrada nega; regra de allow quebrada não permite. `dry-run` registra e **deixa passar** (`policy.ts:360`).
- Precedência real: a política salva pelo admin no banco prevalece sobre `AGENT_COMPUTER_POLICY` no
  boot (`server/src/index.ts:435-441`). O `.env` só é lido quando há `COMPUTER_SUPERVISOR_URL`,
  `AGENT_COMPUTER_URL` ou `COMPUTER_SANDBOX_NAMESPACE` (`config.ts:1053-1058`); `start.sh:345` define o
  primeiro.
- Governados pelo gateway: `computer_navigate`, `computer_click`, `computer_type`, `computer_key`,
  `computer_scroll`, `computer_read_file`, `computer_download_file`, `computer_list_files`,
  `computer_run_command`, `computer_write_file`, e chamadas MCP (`plugins/store.ts:7006`).
- Fora do gateway: screenshot, snapshot e leitura de página (`gateway.ts:389-391`), handovers,
  pedidos de segredo e `humanInput`, este sem linha de auditoria (`gateway.ts:923-990`).
- Comandos de shell são gravados por inteiro em `audit_events` (`gateway.ts:1350-1357`).

## Decisão

1. Perfil 0: `AGENT_COMPUTER_POLICY={"mode":"enforce","deny":[],"allow":[]}` com **banco novo**
   (sem política salva). Nunca `dry-run` como proteção.
2. A política efetiva é a que vale, não o `.env`: verificar a linha `computer.policy_loaded` no boot e
   registrar uma ação recusada (`computer.action_refused`) como evidência de GATE 1.
3. Perfil 1 em diante: deny explícito para `intent == "run_command"` e `intent == "write_file"`,
   allowlist mínima só com os identificadores CEL listados em `policy.ts:45-175`.
4. Testar à parte os caminhos fora do gateway (leitura de tela, `humanInput`) em SEC-07.

## Consequência

Na Fase 1 o Bot conversa, mas não age no computador. É o comportamento esperado; se o app só
funcionar com política permissiva, a fase para e o problema é diagnosticado.
