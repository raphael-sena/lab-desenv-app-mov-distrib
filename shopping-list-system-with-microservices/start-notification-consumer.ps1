# Script para iniciar o Notification Consumer
# Autor: Sistema de Lista de Compras
# Data: 2025

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  NOTIFICATION CONSUMER - RABBITMQ" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se o Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js detectado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado! Por favor, instale o Node.js primeiro." -ForegroundColor Red
    exit 1
}

# Verificar se RabbitMQ está rodando
Write-Host "🔍 Verificando RabbitMQ..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:15672" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ RabbitMQ Management está rodando" -ForegroundColor Green
} catch {
    Write-Host "⚠️  RabbitMQ Management não está acessível em http://localhost:15672" -ForegroundColor Yellow
    Write-Host "   Certifique-se de que o RabbitMQ está instalado e rodando!" -ForegroundColor Yellow
    Write-Host ""
}

# Navegar para o diretório do consumer
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Verificar se as dependências estão instaladas
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
    npm install amqplib
}

Write-Host ""
Write-Host "🚀 Iniciando Notification Consumer..." -ForegroundColor Green
Write-Host "   Pressione Ctrl+C para encerrar" -ForegroundColor Gray
Write-Host ""

# Iniciar o consumer
node consumers/notification-consumer.js
