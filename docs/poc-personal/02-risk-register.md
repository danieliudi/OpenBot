# 02 — Risk register e threat model inicial

- **Data:** 2026-10-10 · **SHA:** `e16d90b`
- **Escala:** Probabilidade e Impacto em Baixo / Médio / Alto. Severidade = combinação, com
  **Crítico** reservado a risco que bloqueia a fase seguinte.
- **Responsável:** "Daniel" quando exige decisão ou ação na máquina/contas; "Executor" quando é
  trabalho do agente na branch do laboratório.
- **Teste:** referência aos IDs SEC do master plan (§6.5) ou teste novo proposto.

## 1. Ativos

Host Windows/WSL2 (a confirmar), daemon e socket Docker, volumes `agent-workspace` e
`agent-profiles`, navegador do Bot, `.env` (chaves de LLM, Intelligence, `KEY_ENCRYPTION_KEY`),
sessões, banco local (`audit_events`, `plugin_grants`, credenciais cifradas), conversas no
Intelligence, acesso GitHub, demais repositórios do usuário, conta do provedor de LLM.

## 2. Registro

| ID | Risco | Evidência | P | I | Sev. | Controle proposto | Teste | Resp. |
|---|---|---|---|---|---|---|---|---|
| R-01 | API (3001) e App (3010) escutam em todas as interfaces; com single-user, quem alcança o host vira admin | `server/src/index.ts:3069`; `app/vite.config.ts:84`; `scripts/start.sh:61-62`; `auth/dev-actor.ts:24-28` | A | A | **Crítico** | ADR-004 (A1): `SERVER_HOST`/`APP_HOST` implementados na branch do lab, `127.0.0.1` no `.env`; callback do Bot testado no host-alvo | SEC-01 + `lsof` sem `*:3001/3010` + tool call auditado | Daniel (aprovar) / Executor |
| R-02 | Guarda de single-user só avalia URLs configuradas; LAN privada gera só aviso | `server/src/config.ts:468-500` | A | A | Alto | Mesmo de R-01; não definir `OPENBOT_PUBLIC_URL`/`TRUSTED_ORIGINS` com IP de LAN | SEC-01 | Executor |
| R-03 | Política de fábrica permite tudo (`allow: ["true"]`) | `computer/policy-store.ts:52-56` | A | A | **Crítico** | ADR-005: deny-all em `enforce` | SEC-02 | Executor |
| R-04 | Política salva no banco prevalece sobre `.env`; qualquer admin (todos, em single-user) altera via `PUT /policy` | `server/src/index.ts:435-441`; `computer/routes.ts:714-718` | M | A | Alto | Banco novo; validar política efetiva por `computer.policy_loaded`; R-01 resolvido antes | SEC-08 (reinício não volta permissivo) | Executor |
| R-05 | `dry-run` deixa a ação passar | `computer/policy.ts:360` | B | A | Médio | Nunca usar `dry-run` como proteção | Revisão do `.env` | Executor |
| R-06 | Bot tem shell (`computer_run_command` → `/exec`) | `computer/gateway.ts:1170-1193`; `docs/architecture.md` (Computers) | M | A | Alto | Deny `intent == "run_command"` em todos os perfis iniciais | SEC-03 | Executor |
| R-07 | Comando de shell gravado inteiro e sem redação na auditoria | `computer/gateway.ts:1350-1357`; `scrubCommand` só em OTel (`telemetry/otel.ts:88-96`) | M | M | Médio | Shell negado; varrer `audit_events` após testes | SEC-06 | Executor |
| R-08 | Caminhos fora do gateway: screenshot/snapshot/read, handovers, segredos, `humanInput` sem auditoria | `computer/gateway.ts:389-391, 744-752, 923-990` | M | M | Médio | Mapear e testar explicitamente; não tratar ausência de linha de auditoria como "nada aconteceu" | SEC-07, SEC-09 | Executor |
| R-09 | Supervisor detém o socket Docker (root-equivalente no host) e tem token de dev fixo e público | `docker-compose.yml:200, 236-246`; `scripts/start.sh:59-60` | M | A | Alto | Bind loopback (já existe); `SUPERVISOR_TOKEN` aleatório no `.env`; não expor 4500 | `lsof`; tentativa sem token → 401 | Daniel (`.env`) / Executor |
| R-10 | Tokens de dev fixos para computador e worker | `scripts/start.sh:59-69` | M | M | Médio | `COMPUTER_TOKEN` e `WORKER_SHARED_SECRET` aleatórios | Revisão do `.env` sem imprimir valores | Daniel |
| R-11 | `spire-agent` usa `pid: host` e socket Docker; `agent-harness` monta `./.langchain` com escrita | `docker-compose.yml:164, 175, 341` | B | A | Médio | Não subir perfis `spire` e `harness`; `start.sh` já não sobe | `docker compose ps` lista só os serviços esperados | Executor |
| R-12 | Prompt injection em página ou documento leva o Bot a agir | Modelo de ameaça; Bot navega a web | A | A | Alto | Deny-all (Perfil 0); fixtures com injeção inofensiva; nenhuma credencial no Bot | SEC-05 | Executor |
| R-13 | SSRF / acesso a rede interna pelo navegador do Bot | `computer/target.ts:269-282` (checagem por string, sem DNS no servidor); egress proxy DNS-aware no computador | M | A | Alto | Nunca `AGENT_COMPUTER_ALLOW_PRIVATE_HOSTS=true`; testar host público que resolve para IP privado | SEC-04 | Executor |
| R-14 | Processo no computador que ignora o proxy abre socket bruto | `docs/architecture.md` (Computers): "not stopped by this" | B | A | Médio | Shell negado; sem Kubernetes, aceitar como residual documentado | SEC-03 | Executor |
| R-15 | Conversas saem do host para o CopilotKit Intelligence (obrigatório) | `server/src/config.ts:894-913` | A | M | Alto | Só dados sintéticos (ADR-003); ler termos/retenção (ADR-007) | SEC-10 parcial | Daniel |
| R-16 | Automatic Learning coleta se houver container atribuído; `setup-learning.ts` atribui sozinho | `learning/settings.ts:86-90`; `learning/runtime.ts:50-60` | M | M | Médio | ADR-006: não rodar `setup-learning.ts`; pausar no Admin | SEC-10 | Daniel / Executor |
| R-17 | UI generativa ligada por padrão, carrega recursos de CDN | `config.ts:1175-1177`; `.env.example:31-35` | M | B | Baixo | `OPENBOT_GENERATIVE_UI=false` | Revisão do `.env` + `/api/capabilities` | Executor |
| R-18 | Custo de LLM e Intelligence sem teto | Sem limite no código | M | M | Médio | Chave exclusiva da PoC com limite de gasto no painel; rotinas desligadas | Painel do provedor | Daniel |
| R-19 | Imagens com tag flutuante; `agent-computer` e `supervisor` rodam como root | `docker-compose.yml:12`; Dockerfiles de `agent-bot`, `agent-langgraph`, `agent-computer`, `supervisor` | M | M | Médio | Registrar digests das imagens construídas/baixadas na Fase 1; não atualizar durante benchmark | Evidência de `docker image inspect` | Executor |
| R-20 | `main` do fork sem proteção; uploads vão direto para `main` | GitHub: `protected: false`; commit `e16d90b` | M | M | Médio | Ativar proteção de `main` (PR obrigatório, sem force-push) | Configuração no GitHub | Daniel |
| R-21 | Ambiente de discovery ≠ host-alvo | Container de nuvem Ubuntu, sem WSL nem daemon Docker | A | M | Alto | Rodar `evidence/host-inventory.sh` no host-alvo antes do GATE 0 final | Saída anexada em `evidence/` | Daniel |
| R-22 | Bun 1.4.2 no ambiente observado vs. pin 1.3.14 | `package.json`; CI | M | B | Baixo | Usar 1.3.14 no host-alvo; registrar | `bun --version` | Executor |
| R-23 | Teste smoke exige cookie de sessão real | `docs/development.md` (Quality checks) | M | M | Médio | Cookie só em variável de ambiente da execução; nunca em arquivo, log ou PR | SEC-06 | Daniel / Executor |
| R-24 | Aprovação humana "antes de mudanças" desligada por padrão | `db/schema/approvals.ts:25-32` | M | M | Médio | Avaliar ligar na Fase 2 como camada extra, nunca como substituto de deny | Teste na Fase 2 | Executor |
| R-25 | Mistura de frentes ou dados reais no laboratório | Proibição global nº 8 do plano | B | A | Médio | Bots e fixtures sem nome de empresa, cliente ou credencial | Revisão de `examples/personal-lab/` | Executor |
| R-26 | `publish-release.yml:110` com `uses: $/...` inválido | Introduzido upstream em `f65526f` | B | B | Baixo | Fora do escopo; não acionar releases no fork | — | — |

## 3. Riscos críticos e tratamento no desenho

| Risco | Tratado no desenho? | Onde |
|---|---|---|
| R-01 | Sim, como pré-condição bloqueante da Fase 1 | ADR-004 |
| R-03 | Sim | ADR-005 |

Nenhum dos dois está tratado no ambiente, porque nada foi instalado. O GATE 0 só aceita o desenho.
