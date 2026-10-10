# GATE 0 — Discovery, inventário e segurança prévia

- **Status:** BLOQUEADO POR APROVAÇÃO
- **Data / hora:** 2026-10-10, 03:11–03:20 UTC
- **Repositório / branch / SHA:** `danieliudi/OpenBot` · `claude/laughing-johnson-u1tefh` · base `e16d90b62e49f78cf8299d7556d4d920124c6792`

## Objetivo e escopo realizado

Fase 0 do `MASTER_PLAN_OPENBOT_LAB.md` em modo somente leitura: checkout, branches, regras locais,
`prompt.txt`, documentação, código de autenticação, política, gateway, auditoria, Learning, Compose,
Dockerfiles, CI e varredura de padrões de segredo. Nada foi instalado, iniciado ou autenticado.

## Arquivos criados

- `docs/poc-personal/00-discovery.md`
- `docs/poc-personal/01-architecture.md`
- `docs/poc-personal/02-risk-register.md`
- `docs/poc-personal/GATE-0.md`
- `docs/poc-personal/decisions/ADR-001-standalone.md` (aceito)
- `docs/poc-personal/decisions/ADR-004-single-user-loopback.md` (proposto)
- `docs/poc-personal/decisions/ADR-005-deny-all-enforce.md` (proposto)
- `docs/poc-personal/decisions/ADR-006-learning-paused.md` (proposto)
- `docs/poc-personal/evidence/phase0-inventory.md`
- `docs/poc-personal/evidence/host-inventory.sh`

Nenhum arquivo preexistente foi alterado.

## Comandos efetivamente executados

`pwd`, `git rev-parse`, `git remote -v`, `git branch`, `git status`, `git log`, `git worktree list`,
`git stash list`, `git grep` (padrões de segredo, só arquivo:linha), `uname`, `/etc/os-release`,
`nproc`, `free`, `df`, `--version` de git/docker/bun/node/npm/openssl/curl/lsof/psql,
`docker version` e `docker compose version` (daemon ausente), `lsof -iTCP -sTCP:LISTEN`, leitura de
`/proc/net/tcp*`, `bash -n` e execução do `host-inventory.sh` neste container, leitura de arquivos com
`sed`/`grep`. Leitura no GitHub: lista de branches e de pull requests. Commit e push dos documentos
na branch de trabalho.

## Testes

| Teste | Resultado | Justificativa |
|---|---|---|
| `format:check`, `lint`, `typecheck`, `test`, `build` | NOT RUN | Exigem `bun install`, vetado na Fase 0 |
| SEC-01 a SEC-10 | NOT RUN | Stack não iniciado (Fase 2) |
| `host-inventory.sh` | PASS neste container (sintaxe e execução) | No host-alvo: NOT RUN |
| Varredura de padrões de segredo em arquivos versionados | PASS com 4 ocorrências classificadas como fixtures de teste | Ver evidência |

## Critérios do GATE 0

| Critério | Resultado | Evidência |
|---|---|---|
| Ambiente identificável | **BLOCKED** | Discovery rodou em container de nuvem, não no host-alvo (R-21) |
| Estratégia selecionada | Atendido | ADR-001, caminho B (clone) |
| Nenhum dado/credencial exposto | Atendido | `.env` ausente; nenhum valor de credencial lido, impresso ou commitado |
| Riscos críticos tratados no desenho | Atendido com pendência de decisão | R-01 → ADR-004 (exige escolha); R-03 → ADR-005 |

## Desvios de segurança e risco residual

- **R-01 (crítico, novo em relação ao plano):** API 3001 e App 3010 escutam em todas as interfaces e
  não há variável para mudar o bind. Com `OPENBOT_SINGLE_USER=true`, quem alcança o host é admin.
  A Fase 1 não pode começar sem mitigação.
- **R-03 (crítico):** política de fábrica permite tudo; política salva no banco prevalece sobre o `.env`.
- Demais riscos e controles: `02-risk-register.md`.

## Custos e dados enviados a terceiros

Nenhum custo. Nenhum dado enviado a serviço externo além das leituras de branch e PR no GitHub do
próprio fork.

## Decisões humanas necessárias

1. **Host-alvo.** Rodar `bash docs/poc-personal/evidence/host-inventory.sh` no Ubuntu do WSL2 (ou no
   Linux/macOS do laboratório) e os comandos de PowerShell indicados no cabeçalho do script.
   Informar também se `.wslconfig` usa `networkingMode=mirrored`. Fecha ADR-002 e R-21.
2. **Mitigação de R-01 (ADR-004).** Recomendação: opção A, patch mínimo na branch do laboratório
   tornando o bind configurável com padrão `127.0.0.1`, mais verificação de firewall. Alternativa: D,
   provedor de identidade real.
3. **Aceite de ADR-005 (deny-all) e ADR-006 (Learning pausado).**
4. **Branch da Fase 1.** O plano sugere `poc/openbot-personal-lab`; esta sessão trabalha em
   `claude/laughing-johnson-u1tefh`. Escolher uma.
5. **Proteção da `main` do fork** (R-20): ativar PR obrigatório e bloqueio de force-push no GitHub.
   Alteração de configuração, só com sua autorização.

Para a Fase 1, além das decisões acima:

6. Autorização de instalação no host: Bun 1.3.14 (se ausente), `bun install --frozen-lockfile`,
   `docker compose build` e `up` (o supervisor recebe o socket Docker).
7. Conta CopilotKit e `npx copilotkit@latest login`, executados por você.
8. Termos e retenção do CopilotKit Intelligence gerenciado e do provedor LLM (ADR-007), e teto de
   gasto: [FALTA DADO: valor máximo mensal aprovado para a PoC].
9. Chave LLM exclusiva da PoC (OpenAI ou Anthropic), com limite no painel do provedor.

## Critério formal para iniciar a Fase 1

Itens 1 a 4 respondidos; inventário do host anexado em `evidence/`; mitigação de R-01 escolhida e
prevista no runbook como passo anterior ao primeiro `bash scripts/start.sh`.

## Rollback verificado

Não aplicável: nada foi instalado nem alterado fora de `docs/poc-personal/`. Reverter a Fase 0 é
remover esse diretório da branch de trabalho.
