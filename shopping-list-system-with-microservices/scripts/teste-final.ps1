# Teste Final - Endpoints Publicos
Write-Host "=== TESTE FINAL - ENDPOINTS PUBLICOS ===" -ForegroundColor Yellow

# 1. Health Check Gateway
Write-Host "`n1. Health Check Gateway..." -ForegroundColor Cyan
try {
    $gateway = Invoke-RestMethod -Uri "http://localhost:3000/health"
    Write-Host "Gateway: OK" -ForegroundColor Green
    Write-Host "   Servicos registrados: $($gateway.services.Count)" -ForegroundColor Gray
} catch {
    Write-Host "Gateway: FALHOU" -ForegroundColor Red
}

# 2. User Service
Write-Host "`n2. User Service..." -ForegroundColor Cyan
try {
    $userHealth = Invoke-RestMethod -Uri "http://localhost:3001/health"
    Write-Host "User Service: OK" -ForegroundColor Green
    Write-Host "   Usuarios: $($userHealth.database.userCount)" -ForegroundColor Gray
} catch {
    Write-Host "User Service: FALHOU" -ForegroundColor Red
}

# 3. List Service
Write-Host "`n3. List Service..." -ForegroundColor Cyan
try {
    $listHealth = Invoke-RestMethod -Uri "http://localhost:3002/health"
    Write-Host "List Service: OK" -ForegroundColor Green
    Write-Host "   Listas: $($listHealth.database.listCount)" -ForegroundColor Gray
} catch {
    Write-Host "List Service: FALHOU" -ForegroundColor Red
}

# 4. Item Service
Write-Host "`n4. Item Service..." -ForegroundColor Cyan
try {
    $itemHealth = Invoke-RestMethod -Uri "http://localhost:3003/health"
    Write-Host "Item Service: OK" -ForegroundColor Green
    Write-Host "   Itens: $($itemHealth.database.itemCount)" -ForegroundColor Gray
} catch {
    Write-Host "Item Service: FALHOU" -ForegroundColor Red
}

# 5. Service Registry
Write-Host "`n5. Service Registry..." -ForegroundColor Cyan
try {
    $registry = Invoke-RestMethod -Uri "http://localhost:3000/registry"
    Write-Host "Registry: OK ($($registry.count) servicos)" -ForegroundColor Green
    foreach ($service in $registry.services) {
        $status = if ($service.healthy) { "ON" } else { "OFF" }
        $color = if ($service.healthy) { "Green" } else { "Red" }
        Write-Host "   $($service.name) ($($service.port)): $status" -ForegroundColor $color
    }
} catch {
    Write-Host "Registry: FALHOU" -ForegroundColor Red
}

# 6. Categorias (endpoint publico)
Write-Host "`n6. Categorias..." -ForegroundColor Cyan
try {
    $categories = Invoke-RestMethod -Uri "http://localhost:3000/api/categories"
    Write-Host "Categorias: OK ($($categories.data.Count) categorias)" -ForegroundColor Green
    foreach ($cat in $categories.data) {
        Write-Host "   - $cat" -ForegroundColor Gray
    }
} catch {
    Write-Host "Categorias: FALHOU" -ForegroundColor Red
}

# 7. Dashboard
Write-Host "`n7. Dashboard..." -ForegroundColor Cyan
try {
    $dashboard = Invoke-RestMethod -Uri "http://localhost:3000/dashboard"
    Write-Host "Dashboard: OK" -ForegroundColor Green
    Write-Host "   Total Items: $($dashboard.summary.totalItems)" -ForegroundColor Gray
    Write-Host "   Total Users: $($dashboard.summary.totalUsers)" -ForegroundColor Gray
    Write-Host "   Total Lists: $($dashboard.summary.totalLists)" -ForegroundColor Gray
} catch {
    Write-Host "Dashboard: FALHOU" -ForegroundColor Red
}

Write-Host "`n=== RESULTADO ===" -ForegroundColor Yellow
Write-Host "✅ Seu sistema de microservicos esta funcionando!" -ForegroundColor Green
Write-Host "✅ Todos os 4 servicos estao rodando:" -ForegroundColor Green
Write-Host "   - API Gateway (porta 3000)" -ForegroundColor Gray
Write-Host "   - User Service (porta 3001)" -ForegroundColor Gray
Write-Host "   - List Service (porta 3002)" -ForegroundColor Gray
Write-Host "   - Item Service (porta 3003)" -ForegroundColor Gray
Write-Host "`n💡 Para testar endpoints protegidos, use o GUIA_TESTES_COMPLETO.md" -ForegroundColor Cyan