# ADR-004 — Single-user só com API e App comprovadamente em loopback

- **Status:** Proposto. Requer escolha de mitigação pelo usuário antes da Fase 1.
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
- Não existe variável de ambiente para escolher o bind de nenhum dos dois.

Logo, no caminho B padrão, qualquer dispositivo que alcance o host nas portas 3001 ou 3010 vira
administrador. A premissa "localhost" do plano não se sustenta só pela configuração.

## Opções

| Opção | O que muda | Prós | Contras |
|---|---|---|---|
| **A. Patch mínimo na branch do laboratório** | `hostname` configurável na API (padrão `127.0.0.1`) e `host` configurável no Vite (padrão `127.0.0.1`) | Corrige na origem; testável por `lsof`; reversível por `git revert` | Diverge do upstream; precisa de teste e entrada no CHANGELOG |
| **B. Firewall do host** | Regra de entrada bloqueando 3001/3010 exceto loopback | Sem alteração de código | Alteração no SO do usuário; frágil (troca de rede, perfil de firewall, WSL mirrored) |
| **C. Depender do NAT do WSL2** | Nada | Zero esforço | Comportamento depende do modo de rede do WSL (NAT vs. mirrored); suposição, não controle |
| **D. Provedor de identidade real** | OAuth Google/Microsoft/Okta | Remove o admin anônimo | Cria conta/app OAuth; amplia escopo e superfície na Fase 1 |

## Decisão proposta

**A + verificação de B/C como defesa em profundidade.** Aplicar o patch em branch isolada, provar o
bind com `lsof -nP -iTCP -sTCP:LISTEN` mostrando `127.0.0.1:3001` e `127.0.0.1:3010`, e rodar SEC-01
a partir de outro dispositivo. Se o patch não puder ser feito, a alternativa aceitável é D; C sozinho
não é aceito.

## Critério de aceite

- `lsof` sem listener `*:3001`, `*:3010`, `[::]:3001` ou `[::]:3010`.
- SEC-01 executado de outro dispositivo: conexão recusada nas duas portas.
- Enquanto isso não for verdade, a Fase 1 para antes do primeiro `bash scripts/start.sh`.
