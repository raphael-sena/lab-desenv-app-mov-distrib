# Script de Teste Completo do Sistema RabbitMQ
# Executa checkout e monitora os consumers

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TESTE COMPLETO - RABBITMQ CHECKOUT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar pre-requisitos
Write-Host "Verificando pre-requisitos..." -ForegroundColor Yellow
Write-Host ""

# Verificar Node.js
try {
    $nodeVersion = node --version
    Write-Host "OK Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERRO Node.js nao encontrado!" -ForegroundColor Red
    exit 1
}

# Verificar RabbitMQ
try {
    $response = Invoke-WebRequest -Uri "http://localhost:15672" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "OK RabbitMQ Management: Online" -ForegroundColor Green
} catch {
    Write-Host "ERRO RabbitMQ nao esta rodando!" -ForegroundColor Red
    Write-Host "   Por favor, inicie o RabbitMQ primeiro." -ForegroundColor Yellow
    exit 1
}

# Verificar User Service
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "OK User Service: Online (porta 3001)" -ForegroundColor Green
} catch {
    Write-Host "ERRO User Service nao esta rodando!" -ForegroundColor Red
    Write-Host "   Execute em outro terminal: cd services/user-service; npm start" -ForegroundColor Yellow
    exit 1
}

# Verificar List Service
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002/health" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "OK List Service: Online (porta 3002)" -ForegroundColor Green
} catch {
    Write-Host "ERRO List Service nao esta rodando!" -ForegroundColor Red
    Write-Host "   Execute em outro terminal: cd services/list-service; npm start" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "OK Todos os servicos estao rodando!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Perguntar se os consumers estao rodando
Write-Host "IMPORTANTE: Os consumers estao rodando?" -ForegroundColor Yellow
Write-Host "   Se nao, execute em outro terminal:" -ForegroundColor Gray
Write-Host "   .\start-all-consumers.ps1" -ForegroundColor Cyan
Write-Host ""
$continuar = Read-Host "Pressione ENTER para continuar com o teste ou Ctrl+C para cancelar"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "EXECUTANDO TESTE DE CHECKOUT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navegar para o diretorio do projeto
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Executar o teste
node test-checkout-rabbitmq.js

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PROXIMOS PASSOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Verifique os terminais dos consumers" -ForegroundColor White
Write-Host "   Notification Consumer deve mostrar o email enviado" -ForegroundColor Gray
Write-Host "   Analytics Consumer deve mostrar as estatisticas" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Acesse o RabbitMQ Management" -ForegroundColor White
Write-Host "   URL: http://localhost:15672" -ForegroundColor Cyan
Write-Host "   User: guest | Pass: guest" -ForegroundColor Gray
Write-Host "   Veja Exchanges, Queues e Mensagens processadas" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Execute mais testes" -ForegroundColor White
Write-Host "   Rode este script novamente para ver multiplos checkouts" -ForegroundColor Gray
Write-Host "   Observe as estatisticas acumulando no Analytics Consumer" -ForegroundColor Gray
Write-Host ""
