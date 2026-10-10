# Evidência — inventário da Fase 0

Coleta em 2026-10-10T03:11Z, container de nuvem do Claude Code (não é o host-alvo). Valores de
credenciais e URLs com usuário/senha foram omitidos. Nenhum comando de instalação, start de container
ou autenticação foi executado.

## Git

```text
$ pwd && git rev-parse --show-toplevel
/home/user/OpenBot
/home/user/OpenBot
$ git remote -v
origin  https://github.com/danieliudi/OpenBot (fetch)
origin  https://github.com/danieliudi/OpenBot (push)
$ git branch --show-current
claude/laughing-johnson-u1tefh
$ git status --short
(vazio)
$ git rev-parse HEAD
e16d90b62e49f78cf8299d7556d4d920124c6792
$ git log -1 --format='%h %cs %s'
e16d90b 2026-10-10 Add files via upload
$ git worktree list
/home/user/OpenBot  e16d90b [claude/laughing-johnson-u1tefh]
$ git stash list
(vazio)
$ git rev-parse origin/main main
e16d90b62e49f78cf8299d7556d4d920124c6792
e16d90b62e49f78cf8299d7556d4d920124c6792
```

GitHub (API de leitura): branches = `main` (`protected: false`); pull requests (todos os estados) = 0.

## Host do discovery

```text
$ uname -srmo
Linux 6.18.44-fc-v114 x86_64 GNU/Linux
$ head -1 /etc/os-release
PRETTY_NAME="Ubuntu 24.04.5 LTS"
$ grep -qi microsoft /proc/version && echo WSL || echo "not WSL"
not WSL
$ nproc ; free -h (total) ; df -h (raiz)
4 ; 15Gi ; 252G total, 30G livres
```

## Ferramentas

```text
git      2.43.0
docker   CLI 29.8.2 ; Compose v5.6.0
         daemon: "failed to connect to the docker API at unix:///var/run/docker.sock ... no such file or directory"
bun      1.4.2           (pin do repositório: 1.3.14)
node     v22.22.0 ; npm 10.9.4
openssl  OpenSSL 3.0.13 30 Jan 2024
curl     8.5.0
lsof     4.95.0
psql     16.15
ss, netstat, wsl.exe, podman: ausentes
```

## Portas

```text
$ lsof -nP -iTCP -sTCP:LISTEN
(cabeçalho apenas, nenhum listener)
/proc/net/tcp e tcp6, estado LISTEN, portas 3001 3010 4100 4200 4201 4500 5432: 0 listeners cada
```

## Arquivos de ambiente

```text
.env          ausente
.env.example  presente (30683 bytes)
```

## Varredura de padrões de segredo nos arquivos versionados

Padrões: chaves OpenAI/Anthropic, `cpk-`, `ghp_`, `github_pat_`, AWS `AKIA`, Slack `xox*`, blocos
`PRIVATE KEY`, JWT. Excluídos `bun.lock` e `CHANGELOG.md`.

```text
server/tests/content-governance.test.ts:42    bloco PRIVATE KEY com corpo "redacted"
server/tests/content-governance.test.ts:75    idem
server/tests/enterprise-controls.test.ts:354  token GitHub fictício em teste de redação
server/tests/enterprise-controls.test.ts:374  chave fictícia em teste de redação
```

Classificação: fixtures de teste do upstream. Os valores não foram usados nem validados.

## Verificações de código citadas nos documentos

Leitura direta, confirmando os relatórios dos agentes de inspeção:

```text
server/src/index.ts:3069        serve<SocketData>({ port, ...   (sem hostname)
server/src/index.ts:3280        console.info(`OpenBot server listening on http://127.0.0.1:${port}`)
app/vite.config.ts:84           host: "::",
scripts/start.sh:61-62          "it binds no hostname, so this port is reachable from the network like any other"
server/src/computer/policy-store.ts:52-56   DEFAULT_ACTION_POLICY = { mode: "enforce", deny: [], allow: ["true"] }
server/src/computer/policy.ts:360           forward: mode === "dry-run"
server/src/index.ts:435-441     createPolicyStore(config.computer?.policy ?? DEFAULT_ACTION_POLICY ...); policyStore.load()
server/src/computer/routes.ts:714-716       routes.put("/policy", requireUser, ... requireAdmin(context)
server/src/computer/gateway.ts:1350-1357    "The command, in full, and its output never."
server/src/auth/dev-actor.ts:24-28          DEV_ACTOR = { id: "dev-local-user", email: "dev@openbot.local", role: "admin" }
server/src/db/schema/approvals.ts:25        enabled ... .default(false)
scripts/start.sh:400            if (status !== "valid") { ... process.exit(1)
```
