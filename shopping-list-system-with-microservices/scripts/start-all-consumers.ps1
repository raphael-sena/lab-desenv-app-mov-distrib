# Script para iniciar AMBOS os consumers simultaneamente
# Autor: Sistema de Lista de Compras
# Data: 2025

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INICIANDO TODOS OS CONSUMERS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se o Node.js esta instalado
try {
    $nodeVersion = node --version
    Write-Host "OK Node.js detectado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERRO Node.js nao encontrado! Por favor, instale o Node.js primeiro." -ForegroundColor Red
    exit 1
}

# Verificar se RabbitMQ esta rodando
Write-Host "Verificando RabbitMQ..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:15672" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "OK RabbitMQ Management esta rodando" -ForegroundColor Green
} catch {
    Write-Host "ERRO RabbitMQ Management nao esta acessivel!" -ForegroundColor Red
    Write-Host "   Por favor, inicie o RabbitMQ primeiro:" -ForegroundColor Yellow
    Write-Host "   - Windows: Inicie o servico RabbitMQ pelo painel de servicos" -ForegroundColor Yellow
    Write-Host "   - Ou execute: rabbitmq-server" -ForegroundColor Yellow
    exit 1
}

# Navegar para o diretorio raiz do projeto (um nivel acima de scripts/)
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
Set-Location $projectRoot

# Verificar se as dependencias estao instaladas na pasta consumers
if (-not (Test-Path "consumers/node_modules")) {
    Write-Host "Instalando dependencias dos consumers..." -ForegroundColor Yellow
    Push-Location consumers; npm install; Pop-Location
}

Write-Host ""
Write-Host "Iniciando Consumers em janelas separadas..." -ForegroundColor Green
Write-Host ""

# Iniciar Notification Consumer em nova janela
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot'; node consumers/notification-consumer.js"
Write-Host "OK Notification Consumer iniciado" -ForegroundColor Green

# Aguardar um pouco antes de iniciar o proximo
Start-Sleep -Seconds 1

# Iniciar Analytics Consumer em nova janela
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot'; node consumers/analytics-consumer.js"
Write-Host "OK Analytics Consumer iniciado" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "OK Todos os consumers foram iniciados!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Para testar o sistema:" -ForegroundColor Cyan
Write-Host "   1. Inicie o List Service" -ForegroundColor White
Write-Host "   2. Faca uma requisicao POST para /lists/:id/checkout" -ForegroundColor White
Write-Host "   3. Observe as mensagens nos terminais dos consumers" -ForegroundColor White
Write-Host ""
Write-Host "RabbitMQ Management: http://localhost:15672" -ForegroundColor Cyan
Write-Host "   Usuario: guest | Senha: guest" -ForegroundColor Gray
Write-Host ""
