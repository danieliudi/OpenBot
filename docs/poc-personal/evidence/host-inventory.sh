#!/usr/bin/env bash
# Inventário somente leitura do host-alvo do OpenBot Personal Lab (Fase 0).
#
# Rodar DENTRO do Ubuntu do WSL2 (ou no Linux/macOS do laboratório), a partir da raiz do clone:
#   bash docs/poc-personal/evidence/host-inventory.sh > .logs/host-inventory.txt
#
# Não instala nada, não inicia containers, não lê .env nem variáveis de ambiente.
# Revise a saída antes de compartilhar: ela contém versões e portas, não credenciais.
#
# No PowerShell do Windows, rode à parte e anexe a saída:
#   wsl --status
#   wsl --version
#   Get-Content "$env:USERPROFILE\.wslconfig" -ErrorAction SilentlyContinue   # networkingMode=mirrored muda R-01
#   Get-NetTCPConnection -State Listen | Where-Object LocalPort -in 3001,3010,4100,4200,4201,4500,5432

set -u
PORTS="3001 3010 4100 4200 4201 4500 5432"

section() { printf '\n== %s\n' "$1"; }
version() { if command -v "$1" >/dev/null 2>&1; then printf '%-8s %s\n' "$1" "$("$@" 2>&1 | head -n 1)"; else printf '%-8s AUSENTE\n' "$1"; fi; }

section "data"
date -u +%FT%TZ

section "sistema"
uname -srmo
[ -r /etc/os-release ] && grep -E '^(PRETTY_NAME|VERSION_ID)=' /etc/os-release
if grep -qi microsoft /proc/version 2>/dev/null; then echo "WSL: sim"; else echo "WSL: não"; fi

section "recursos"
command -v nproc >/dev/null && echo "cpus: $(nproc)"
command -v free >/dev/null && free -h | awk 'NR<=2'
df -h . | awk 'NR==2 {print "disco (checkout): total " $2 ", livre " $4}'

section "checkout"
git rev-parse --show-toplevel 2>/dev/null
git rev-parse HEAD 2>/dev/null
git branch --show-current 2>/dev/null
git status --short 2>/dev/null | head -n 20
git worktree list 2>/dev/null
[ -e .env ] && echo ".env: presente (conteúdo não lido)" || echo ".env: ausente"

section "ferramentas"
version git --version
version docker --version
version bun --version
version node --version
version npm --version
version openssl version
version curl --version
command -v lsof >/dev/null 2>&1 && printf '%-8s %s\n' lsof "$(lsof -v 2>&1 | sed -n 2p | xargs)" || printf '%-8s AUSENTE\n' lsof
docker compose version 2>&1 | head -n 1

section "docker daemon (somente leitura)"
docker info --format 'server={{.ServerVersion}} os={{.OperatingSystem}} ostype={{.OSType}} cpus={{.NCPU}} mem={{.MemTotal}} security={{.SecurityOptions}}' 2>&1 | head -n 3
docker ps --format '{{.Names}}\t{{.Image}}\t{{.Ports}}' 2>&1 | head -n 30

section "portas do OpenBot em escuta"
if command -v ss >/dev/null 2>&1; then
  ss -ltnH 2>/dev/null | awk -v ports="$PORTS" 'BEGIN{split(ports,p," "); for(i in p) want[p[i]]=1} {n=split($4,a,":"); if (want[a[n]]) print $4}'
elif command -v lsof >/dev/null 2>&1; then
  for p in $PORTS; do lsof -nP -iTCP:"$p" -sTCP:LISTEN 2>/dev/null | awk 'NR>1 {print $1, $9}'; done
else
  echo "nem ss nem lsof disponíveis"
fi
echo "(sem linhas acima = nenhuma das portas $PORTS em uso)"
