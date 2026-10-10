# ADR-001 — OpenBot como aplicação autônoma (fork pessoal)

- **Status:** Aceito para a Fase 0 e Fase 1. Revisão obrigatória no GATE 3.
- **Data:** 2026-10-10
- **Commit de referência:** `e16d90b62e49f78cf8299d7556d4d920124c6792` (`danieliudi/OpenBot`, `main`)
- **Contexto de decisão:** `MASTER_PLAN_OPENBOT_LAB.md` §3 e §16; `prompt.txt` caminho B

## Contexto

O OpenBot se declara template clonável, não biblioteca. `package.json` marca o pacote como
`"private": true`, versão `0.1.2`, com workspaces `app`, `server` e `worker`; `prompt.txt` descreve
dois caminhos de instalação (A: imagem única; B: clone) e afirma que o clone é o caminho para alterar
pacote de tenant, Bots, canais e skills.

A arquitetura (`docs/architecture.md`, seção "Services and ports") depende de PostgreSQL com pgvector,
CopilotKit Intelligence externo, supervisor com acesso ao socket Docker e um container de computador
por Bot. Embutir isso em outro repositório traria junto todas essas dependências de runtime.

Os repositórios candidatos a integração futura (Secretária MIA, Tandem, Trekup, Sanwey-OS) têm
autenticação, multi-tenancy e dados próprios. Nenhum deles foi lido nesta fase.

## Decisão

1. Usar `danieliudi/OpenBot` como aplicação independente, executada pelo caminho **B (clone)**.
2. Não copiar o monorepo, nem partes dele, para dentro de outros repositórios.
3. Não compartilhar credenciais, bancos ou volumes entre o laboratório e qualquer outro projeto.
4. Integração futura, se houver, só por interface explícita (AG-UI, HTTP) e após o gate da fase
   correspondente.
5. O caminho A (imagem `ghcr.io/copilotkit/openbot`) fica fora desta PoC: ele não traz as imagens de
   Bot separadas que o `docker-compose.yml` sobe e usa outra porta de app (3001 em vez de 3010).

## Consequências

- O laboratório pode ser removido sem tocar nenhum outro sistema.
- Atualizações do upstream não entram automaticamente. O fork não tem remote `upstream` configurado
  no checkout atual; qualquer sincronização exige decisão explícita e novo SHA de referência.
- O custo de manter o fork (merges do upstream, CHANGELOG de 318 KB indica cadência alta de mudança)
  entra no scorecard de portabilidade (§11 do plano).

## Alternativas descartadas

| Alternativa | Motivo |
|---|---|
| Imagem única publicada (caminho A) | Não permite alterar código/tenant; sem computadores por Bot via Compose. |
| Copiar módulos (gateway, auditoria) para outro repo agora | Sem evidência de valor (H5 ainda não testada). |
| Não montar laboratório | Mantida como saída válida no GATE 3 se não houver ganho medido. |
