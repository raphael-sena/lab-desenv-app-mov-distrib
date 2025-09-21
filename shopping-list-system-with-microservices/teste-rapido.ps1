# Teste Rápido dos Serviços
Write-Host "🔍 TESTANDO SERVIÇOS..." -ForegroundColor Cyan

# Teste Gateway
try {
    $health = Invoke-RestMethod -Uri http://localhost:3000/health
    Write-Host "✅ API Gateway: OK (porta 3000)" -ForegroundColor Green
    Write-Host "   Serviços detectados: $($health.services.Count)" -ForegroundColor Gray
} catch {
    Write-Host "❌ API Gateway: FALHOU (porta 3000)" -ForegroundColor Red
    Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste Itens
try {
    $items = Invoke-RestMethod -Uri http://localhost:3000/api/items
    Write-Host "✅ Item Service: OK ($($items.data.Count) itens)" -ForegroundColor Green
} catch {
    Write-Host "❌ Item Service: FALHOU" -ForegroundColor Red
}

# Teste Registry
try {
    $registry = Invoke-RestMethod -Uri http://localhost:3000/registry
    Write-Host "✅ Service Registry: OK ($($registry.count) serviços)" -ForegroundColor Green
} catch {
    Write-Host "❌ Service Registry: FALHOU" -ForegroundColor Red
}

# Teste Categorias
try {
    $cats = Invoke-RestMethod -Uri http://localhost:3000/api/categories
    Write-Host "✅ Categorias: OK ($($cats.data.Count) categorias)" -ForegroundColor Green
} catch {
    Write-Host "❌ Categorias: FALHOU" -ForegroundColor Red
}

Write-Host "`n🎯 Se todos estão OK, o sistema está funcionando!" -ForegroundColor Cyan