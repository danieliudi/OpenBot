# ADR-004 — Single-user só com API e App comprovadamente em loopback

- **Status:** Aceito por Daniel Yano em 2026-10-11, variante A1.
- **Data:** 2026-10-10 · **SHA:** `e16d90b`

## Contexto

- `OPENBOT_SINGLE_USER=true` vem ligado no `.env.example` (linha 50). Com ele e sem provedor de
  identidade, todo request é o administrador fixo `dev-local-user` (`server/src/auth/dev-actor.ts:24-28, 91-93`).
- A guarda `singleUserAllowed` (`server/src/config.ts:468-500`) recusa só quando
  `OPENBOT_PUBLIC_URL`, `OPENBOT_APP_URL` ou `TRUSTED_ORIGINS` apontam para endereço público.
  Endereço privado gera apenas aviso. Ela **não lê o endereço de bind**.
- A API chama `serve({ port, ... })` sem `hostname` (`server/src/index.ts:3069-3070`); o padrão do
  Bun é `0.0.0.0`. O próprio `scripts/start.sh:61-62` confirma que a porta é alcançável pela rede.
- O App usa `host: "::"` (`app/vite.config.ts:84`), endereço curinga, e faz proxy de `/api` para a API.
- No SHA de referência não existe variável de ambiente para escolher o bind de nenhum dos dois.
- O Bot LangGraph (padrão do clone) e o perfil `harness` chamam a API de volta em
  `http://host.docker.internal:3001/api/agent-tools/call` (`docker-compose.yml:315, 378-382`). Em
  Docker Engine no Linux esse nome é o gateway da bridge, que um bind só em `127.0.0.1` não atende.

Logo, no caminho B padrão, qualquer dispositivo que alcance o host nas portas 3001 ou 3010 vira
administrador. A premissa "localhost" do plano não se sustenta só pela configuração.

## Opções

| Opção | O que muda | Prós | Contras |
|---|---|---|---|
| **A. Patch mínimo na branch do laboratório** | Endereço de escuta configurável na API e no Vite, ajustado para `127.0.0.1` no laboratório | Corrige na origem; testável por `lsof`; reversível por `git revert` | Diverge do upstream; precisa de teste e entrada no CHANGELOG |
| **B. Firewall do host** | Regra de entrada bloqueando 3001/3010 exceto loopback | Sem alteração de código | Alteração no SO do usuário; frágil (troca de rede, perfil de firewall, WSL mirrored) |
| **C. Depender do NAT do WSL2** | Nada | Zero esforço | Comportamento depende do modo de rede do WSL (NAT vs. mirrored); suposição, não controle |
| **D. Provedor de identidade real** | OAuth Google/Microsoft/Okta | Remove o admin anônimo | Cria conta/app OAuth; amplia escopo e superfície na Fase 1 |

## Decisão: variante A1

1. **Código** (branch do laboratório): variáveis `SERVER_HOST` e `APP_HOST`, validadas no boot
   (só IP literal ou `localhost`). Sem valor, o comportamento continua o do upstream (todas as
   interfaces), para não quebrar a imagem de container nem o Helm. Com `SERVER_HOST` definido, o
   proxy `/api` do Vite disca esse endereço. O log de boot passa a dizer o endereço real.
2. **Laboratório**: `.env` com `SERVER_HOST=127.0.0.1` e `APP_HOST=127.0.0.1`.
3. **Teste no host-alvo** antes de qualquer outro passo da Fase 1: um tool call do Bot LangGraph
   precisa chegar ao servidor e gerar linha de auditoria (recusa, sob ADR-005). Se não chegar, o
   laboratório passa para a variante A2 (API em loopback + IP da bridge Docker) ou mantém
   `SERVER_HOST` vazio com regra de firewall restrita a loopback e rede Docker. A2 exige nova
   aprovação, por ser mudança maior no servidor.

Variantes consideradas e não escolhidas: A2 (dois listeners na API, mais código) e A3 (só o App em
loopback, API protegida por firewall do SO).

## Critério de aceite

- `lsof -nP -iTCP -sTCP:LISTEN` sem listener `*:3001`, `*:3010`, `[::]:3001` ou `[::]:3010`.
- SEC-01 executado de outro dispositivo: conexão recusada nas duas portas.
- Tool call do Bot LangGraph registrado no servidor (item 3 acima).
- Enquanto os três não forem verdade, a Fase 1 para antes de qualquer chat.

## Evidência de implementação

[`../evidence/r01-bind-patch-validation.md`](../evidence/r01-bind-patch-validation.md)
