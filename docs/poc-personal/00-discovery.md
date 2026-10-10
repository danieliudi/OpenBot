# 00 — Discovery (Fase 0)

- **Data:** 2026-10-10 (UTC 03:11)
- **Modo:** somente leitura. Nada instalado, nenhum container iniciado, nenhuma conta conectada.
- **Evidência bruta:** [`evidence/phase0-inventory.md`](evidence/phase0-inventory.md)

## 1. Onde este discovery rodou

O discovery rodou em um **container de nuvem efêmero do Claude Code** (Ubuntu 24.04.5, kernel
`6.18.44-fc-v114`, 4 vCPU, 15 GiB RAM), com o repositório clonado na hora. **Não é o computador
onde o laboratório vai rodar.** O plano presume Windows + WSL2 + Docker Desktop (ADR-002), e nada
desse ambiente foi observado aqui.

Consequência: tudo que depende do host real (WSL2, Docker Desktop, firewall do Windows, portas em
uso, encaminhamento WSL → LAN, recursos) está **BLOCKED** até o inventário rodar na máquina-alvo.
O script [`evidence/host-inventory.sh`](evidence/host-inventory.sh) faz essa coleta em modo leitura.

## 2. Checkout

| Item | Valor |
|---|---|
| Remote | `origin https://github.com/danieliudi/OpenBot` (sem remote `upstream`) |
| Branch de trabalho | `claude/laughing-johnson-u1tefh` |
| SHA de referência | `e16d90b62e49f78cf8299d7556d4d920124c6792` |
| Último commit | `e16d90b 2026-10-10 Add files via upload` (adicionou o master plan e o prompt inicial) |
| `main` local / `origin/main` | mesmo SHA `e16d90b` |
| Branches remotas (GitHub) | apenas `main`, **sem proteção** (`protected: false`) |
| Pull requests | nenhum (abertos ou fechados) |
| Worktrees | um só, o checkout principal |
| `git status` | limpo antes da Fase 0; stash vazio |
| Versão do pacote | `openbot@0.1.2`, MIT, `"private": true` |
| `.env` | ausente (só `.env.example`) |

Arquivos de regra local procurados e **não encontrados**: `CLAUDE.md`, `AGENTS.md`, `.cursorrules`,
`.cursor/`. Existem duas skills de projeto em `.claude/skills/` (`openbot-data-access`,
`openbot-screen-layout`), ambas sobre código de UI, sem efeito na Fase 0. O `.gitignore` ignora
`docs/plans/` (linha 10), confirmando a orientação do plano de usar `docs/poc-personal/`.

## 3. Stack declarada vs. observada

| Componente | Declarado no repositório | Observado neste container |
|---|---|---|
| Bun | `packageManager: bun@1.3.14`; CI fixa `1.3.14` | **1.4.2** (diverge do pin) |
| Node / npx | necessário só para o CLI do CopilotKit | v22.22.0 / npm 10.9.4 |
| Docker CLI / Compose | obrigatório para `scripts/start.sh` | CLI 29.8.2, Compose v5.6.0; **sem daemon** (`/var/run/docker.sock` inexistente) |
| openssl, curl, lsof | usados por `start.sh` | OpenSSL 3.0.13, curl 8.5.0, lsof 4.95.0 |
| PostgreSQL | `pgvector/pgvector:pg17` via Compose | `psql` 16.15 presente (não usado) |
| `ss` / `netstat` | citados no plano | **ausentes**; portas verificadas por `lsof` e `/proc/net/tcp*` |
| WSL | premissa do plano | não é WSL |

Portas 3001, 3010, 4100, 4200, 4201, 4500 e 5432: **nenhum listener** neste container. O resultado
não vale para a máquina-alvo.

## 4. Arquitetura real (código no SHA fixado)

| Porta | Serviço | Onde roda | Bind real | Evidência |
|---|---|---|---|---|
| 3001 | API (Hono sobre `Bun.serve`) | host, `bun src/production-entry.ts` | **todas as interfaces** | `server/src/index.ts:3069` chama `serve({ port, ... })` sem `hostname`; `scripts/start.sh:61-62` admite: "it binds no hostname, so this port is reachable from the network" |
| 3010 | App (Vite dev) | host | **todas as interfaces** | `app/vite.config.ts:84` `host: "::"` (o comentário diz "Both loopbacks", mas `::` é curinga) |
| 4100 | agent-computer | Compose | `127.0.0.1` e `[::1]` | `docker-compose.yml:84-85` |
| 4200 | agent-bot (só OpenAI) | Compose | loopback | `docker-compose.yml:270-271` |
| 4201 | agent-langgraph | Compose | loopback | `docker-compose.yml:353-354` |
| 4202 | agent-harness (profile `harness`) | Compose, não iniciado por `start.sh` | loopback | `docker-compose.yml:309-310` |
| 4500→4300 | supervisor (detém o socket Docker) | Compose | loopback | `docker-compose.yml:233-234, 246` |
| efêmera | computador por Bot | criado pelo supervisor | `127.0.0.1` | `supervisor/src/docker.ts:441-442` |
| 5432 | PostgreSQL + pgvector | Compose, rede `data` isolada | loopback | `docker-compose.yml:34-35, 43-44` |
| — | CopilotKit Intelligence | **externo** (gerenciado) | — | obrigatório: `server/src/config.ts:894-913` |

O log de boot imprime `listening on http://127.0.0.1:${port}` (`server/src/index.ts:3280`). A
mensagem é enganosa: o socket não está restrito a loopback.

## 5. Divergências entre o master plan e o código

| # | O plano diz | O código mostra | Efeito no plano |
|---|---|---|---|
| D1 | "verificar UI 3010, API 3001 e PostgreSQL 5432" | Postgres em loopback; **API e UI em todas as interfaces** | ADR-004 não se sustenta sem mitigação. Ver R-01. |
| D2 | Política padrão permissiva `deny: [] / allow: ["true"]` | Confirmado (`server/src/computer/policy-store.ts:52-56`) | Sem mudança. |
| D3 | `AGENT_COMPUTER_POLICY` em `.env` define a política | Política **salva pelo admin no banco prevalece** sobre o `.env` no boot (`server/src/index.ts:435-441`); o `.env` só é lido se houver `COMPUTER_SUPERVISOR_URL`, `AGENT_COMPUTER_URL` ou `COMPUTER_SANDBOX_NAMESPACE` (`config.ts:1053-1058`) | Deny-all precisa ser verificado pela política efetiva (linha `computer.policy_loaded` na auditoria), não pelo `.env`. |
| D4 | `dry-run` não bloqueia | Confirmado: `forward: mode === "dry-run"` (`computer/policy.ts:360`) | Sem mudança. |
| D5 | Gateway governa ações de computador | Governa `computer_navigate/click/type/key/scroll/read_file/download_file/list_files/run_command/write_file` e **também MCP** (`plugins/store.ts:7006`). **Não governa**: screenshot/snapshot/read, handovers, fluxos de segredo e `humanInput` (este sem linha de auditoria) (`computer/gateway.ts:389-391, 744-752, 923-990`) | SEC-02/03/07 devem cobrir os caminhos fora do gateway. |
| D6 | Auditoria sem segredos | Comando de shell é gravado **inteiro e sem redação** em `audit_events` (`computer/gateway.ts:1350-1357`); a redação `scrubCommand` só vale para export OTel e Action Recording | Shell negado nos perfis 0 e 1 também por esse motivo. |
| D7 | Learning pode estar ativo por padrão | Preferência ativa por padrão (`learning/settings.ts:86-90`), mas **só coleta com container atribuído** (`learning/runtime.ts:50-60`); `bun scripts/setup-learning.ts` atribui automaticamente. Não existe variável para desligar | Não rodar `setup-learning.ts` antes de pausar Learning no Admin. |
| D8 | `OPENBOT_GENERATIVE_UI=false` reduz superfície | Padrão é **ligado** (`config.ts:1175-1177`), e a UI gerada pode carregar recursos de CDN (`.env.example:31-35`) | Manter `false` no `.env` da PoC. |
| D9 | Shadow Mode (MIA) ≠ governança do OpenBot | Não há Shadow Mode no OpenBot; únicas menções estão no próprio master plan | Confirma a proibição global nº 7. |
| D10 | `start.sh` sobe o stack | Também **escreve no `.env`** (`MANAGED_AGENT_TOKEN`, `AGENT_TOOL_TOKEN`, `start.sh:93-136`) e **aborta se a licença do Intelligence não for `valid`** (`start.sh:400-405`) | Runbook da Fase 1 precisa prever as duas coisas. |
| D11 | Bun 1.3.14 | Container de discovery tem 1.4.2 | Fase 1 usa 1.3.14 no host-alvo; registrar versão real. |
| D12 | Aprovação humana | Existe (`server/src/approvals/`), mas "pedir antes de mudanças" vem **desligado** (`db/schema/approvals.ts:25-32`); sempre ligado só para credenciais, segurança e pagamentos | Avaliar ligar na Fase 2. |

## 6. Achados de supply chain e repositório

- Imagens com tag flutuante: `pgvector/pgvector:pg17`, `oven/bun:1.3-alpine` (agent-bot, agent-langgraph), `ubuntu:24.04`. Só `oven/bun:1.3.14` no `Dockerfile` raiz está fixada por digest.
- `agent-computer/Dockerfile` e `supervisor/Dockerfile` rodam como root. Os computadores criados pelo supervisor recebem `CapDrop: ALL` e `no-new-privileges`; o serviço `agent-computer` do Compose, não.
- `Dockerfile` raiz (caminho A, fora da PoC) baixa o s6-overlay sem checksum e dá sudo sem senha para `apt-get` a `pwuser`.
- Tokens de desenvolvimento fixos e públicos quando o `.env` não os define: `openbot-dev-supervisor-token`, `openbot-dev-computer-token`, `openbot-dev-worker-secret` (`start.sh:59-69`).
- CI: ações fixadas por SHA, `permissions: contents: read`, zizmor semanal. Sem CodeQL, Dependabot, Trivy ou gitleaks.
- `.github/workflows/publish-release.yml:110` contém `uses: $/.github/workflows/ci.yml`, referência inválida introduzida upstream em `f65526f` (2026-10-02). Afeta só releases; fora do escopo da PoC.
- `renovate.json` estende `local>CopilotKit/renovate`, preset que não resolve no fork.
- `CODEOWNERS` lista mantenedores do upstream; sem efeito prático no fork, cuja `main` não tem proteção.
- Varredura de padrões de segredo nos arquivos versionados: 4 ocorrências, todas fixtures de teste de redação (`server/tests/content-governance.test.ts:42,75`, `server/tests/enterprise-controls.test.ts:354,374`), com valores truncados ou fictícios. Nenhum `.env` versionado. A chave `KEY_ENCRYPTION_KEY` do `.env.example` é pública por declaração do próprio arquivo e recusada com `NODE_ENV=production`.

## 7. Lacunas (BLOCKED / NOT RUN)

| Item | Status | Motivo |
|---|---|---|
| SO, WSL2, Docker Desktop da máquina-alvo | BLOCKED | Discovery rodou em container de nuvem. Requer `host-inventory.sh` no host. |
| Portas em uso na máquina-alvo | BLOCKED | Idem. |
| Encaminhamento WSL2 → Windows → LAN (modo NAT ou mirrored) | BLOCKED | Idem; decisivo para R-01. |
| `docker info` / daemon | NOT RUN no alvo; daemon ausente aqui | Diagnóstico só no host-alvo. |
| `bun install`, `format:check`, `lint`, `typecheck`, `test`, `build` | NOT RUN | Proibido na Fase 0 (instalação). Baseline de testes fica para a Fase 1. |
| Alertas de dependência no GitHub | NOT RUN | Dependabot não configurado; nenhuma ferramenta de leitura de alertas foi usada. |
| Termos/retenção do CopilotKit Intelligence e do provedor LLM | NOT RUN | Exige leitura de termos externos e decisão do usuário (ADR-007). |
| Repos MIA, Tandem, Trekup, Sanwey-OS | NOT RUN | Fora do escopo da Fase 0 (ADR-008). |
