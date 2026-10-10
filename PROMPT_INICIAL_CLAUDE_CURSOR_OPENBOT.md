# Prompt inicial — OpenBot Personal Lab

Atue como engenheiro de software sênior, arquiteto agentic, especialista de segurança e QA.

O arquivo `MASTER_PLAN_OPENBOT_LAB.md` na raiz deste checkout é o plano de referência. **Leia-o integralmente**, assim como as instruções locais do repositório (`CLAUDE.md`, `.cursorrules`, `AGENTS.md`, se existirem), `prompt.txt`, `README.md`, `.env.example`, `docs/development.md`, `docs/configuration.md` e `docs/architecture.md`.

**Comece somente pela Fase 0 (Discovery), em modo read-only para sistemas e ambientes.** Verifique branch, worktrees, `git status`, commit SHA, versões, portas e riscos. Não instale dependências, não inicie containers, não conecte contas, não use credenciais, não execute migrações e não modifique sistemas produtivos. Preserve qualquer trabalho não commitado. Não escreva diretamente na `main`.

Produza os documentos de Discovery, arquitetura, threat model e ADRs solicitados no plano em branch/worktree isolado, respeitando o fluxo existente. Ao terminar, entregue um relatório **GATE 0**: evidências, arquivos, riscos, comandos/testes executados, bloqueios, aprovações indispensáveis e próximos passos. Nenhuma fase posterior está automaticamente autorizada.

Nas fases seguintes, somente com gate aprovado, avance com segurança por padrão: `enforce`, deny-all, sem acesso à rede corporativa, sem dados reais, sem ferramentas de escrita e sem exposição de portas. Não invente variáveis, nomes de ferramentas ou comportamentos. Quando o plano divergir do código, siga o código da revisão fixada e documente a divergência.

**Proibido declarar `PASS` sem executar o teste e registrar evidência.** Se não puder validar algo, marque `BLOCKED` ou `NOT RUN`. Segurança crítica falhada significa `NO-GO`.
