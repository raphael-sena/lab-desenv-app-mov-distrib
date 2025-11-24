# ===================================================================
# 🧪 Script de Testes Automatizado - Shopping List Microservices
# ===================================================================

Write-Host @"
🚀 INICIANDO TESTES AUTOMATIZADOS
==================================
Sistema: Shopping List Microservices  
Arquitetura: 4 Microservices + API Gateway
"@ -ForegroundColor Cyan

# Variáveis globais
$gateway = "http://localhost:3000"
$token = $null
$headers = @{}
$testResults = @()

# Função para registrar resultado do teste
function Add-TestResult {
    param($TestName, $Status, $Details = "")
    
    $result = @{
        Test = $TestName
        Status = $Status
        Details = $Details
        Timestamp = Get-Date -Format "HH:mm:ss"
    }
    
    $script:testResults += $result
    
    $color = if($Status -eq "✅ PASSOU") { "Green" } else { "Red" }
    Write-Host "$($result.Timestamp) - $TestName`: $Status $Details" -ForegroundColor $color
}

# Função para fazer requisição com tratamento de erro
function Invoke-ApiRequest {
    param($Uri, $Method = "GET", $Body = $null, $Headers = @{}, $ContentType = "application/json")
    
    try {
        if ($Body) {
            return Invoke-RestMethod -Uri $Uri -Method $Method -Body $Body -ContentType $ContentType -Headers $Headers
        } else {
            return Invoke-RestMethod -Uri $Uri -Method $Method -Headers $Headers
        }
    } catch {
        throw $_.Exception.Message
    }
}

Write-Host "`n📋 FASE 1: VERIFICAÇÃO DOS SERVIÇOS" -ForegroundColor Yellow
Write-Host "===================================="

# Teste 1: Health Check do Gateway
try {
    $health = Invoke-ApiRequest -Uri "$gateway/health"
    $serviceCount = $health.services.Count
    Add-TestResult "Health Check Gateway" "✅ PASSOU" "($serviceCount serviços detectados)"
} catch {
    Add-TestResult "Health Check Gateway" "❌ FALHOU" $_.ToString()
    Write-Host "❌ Gateway não está respondendo. Verifique se está rodando na porta 3000" -ForegroundColor Red
    exit 1
}

# Teste 2: Service Registry
try {
    $registry = Invoke-ApiRequest -Uri "$gateway/registry"
    Add-TestResult "Service Registry" "✅ PASSOU" "($($registry.count) serviços registrados)"
} catch {
    Add-TestResult "Service Registry" "❌ FALHOU" $_.ToString()
}

# Teste 3: Health dos Serviços Individuais
$services = @(
    @{Name="User Service"; Port=3001},
    @{Name="List Service"; Port=3002}, 
    @{Name="Item Service"; Port=3003}
)

foreach ($service in $services) {
    try {
        $health = Invoke-ApiRequest -Uri "http://localhost:$($service.Port)/health"
        Add-TestResult "$($service.Name) Health" "✅ PASSOU" "(porta $($service.Port))"
    } catch {
        Add-TestResult "$($service.Name) Health" "❌ FALHOU" $_.ToString()
    }
}

Write-Host "`n🛍️ FASE 2: TESTES DO ITEM SERVICE" -ForegroundColor Yellow
Write-Host "================================="

# Teste 4: Listar Itens
try {
    $items = Invoke-ApiRequest -Uri "$gateway/api/items"
    $itemCount = $items.data.Count
    Add-TestResult "Listar Itens" "✅ PASSOU" "($itemCount itens encontrados)"
    
    # Salvar item para testes posteriores
    $script:sampleItemId = $items.data[0].id
    $script:sampleItem = $items.data[0]
} catch {
    Add-TestResult "Listar Itens" "❌ FALHOU" $_.ToString()
}

# Teste 5: Listar Categorias
try {
    $categories = Invoke-ApiRequest -Uri "$gateway/api/categories"
    $catCount = $categories.data.Count
    Add-TestResult "Listar Categorias" "✅ PASSOU" "($catCount categorias)"
} catch {
    Add-TestResult "Listar Categorias" "❌ FALHOU" $_.ToString()
}

# Teste 6: Buscar Item por ID
try {
    if ($script:sampleItemId) {
        $item = Invoke-ApiRequest -Uri "$gateway/api/items/$($script:sampleItemId)"
        Add-TestResult "Buscar Item por ID" "✅ PASSOU" "($($item.data.name))"
    } else {
        Add-TestResult "Buscar Item por ID" "⚠️ PULADO" "(nenhum item disponível)"
    }
} catch {
    Add-TestResult "Buscar Item por ID" "❌ FALHOU" $_.ToString()
}

# Teste 7: Filtrar Itens por Categoria
try {
    $filteredItems = Invoke-ApiRequest -Uri "$gateway/api/items?category=Alimentos"
    Add-TestResult "Filtrar por Categoria" "✅ PASSOU" "($($filteredItems.data.Count) alimentos)"
} catch {
    Add-TestResult "Filtrar por Categoria" "❌ FALHOU" $_.ToString()
}

# Teste 8: Busca Textual de Itens
try {
    $searchResults = Invoke-ApiRequest -Uri "$gateway/api/search?q=arroz"
    Add-TestResult "Busca Textual" "✅ PASSOU" "(termo: arroz)"
} catch {
    Add-TestResult "Busca Textual" "❌ FALHOU" $_.ToString()
}

Write-Host "`n👤 FASE 3: TESTES DO USER SERVICE" -ForegroundColor Yellow
Write-Host "================================="

# Teste 9: Tentar login com usuário admin
try {
    $loginBody = @{
        identifier = "admin@microservices.com"
        password = "admin123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-ApiRequest -Uri "$gateway/api/users/auth/login" -Method POST -Body $loginBody
    $script:token = $loginResponse.token
    $script:headers = @{ Authorization = "Bearer $($script:token)" }
    $script:currentUser = $loginResponse.user
    
    Add-TestResult "Login Admin" "✅ PASSOU" "(token obtido)"
} catch {
    Add-TestResult "Login Admin" "❌ FALHOU" $_.ToString()
    
    # Tentar criar usuário se login falhou
    Write-Host "Tentando criar usuário de teste..." -ForegroundColor Yellow
    try {
        $registerBody = @{
            email = "teste$(Get-Random)@test.com"
            username = "testuser$(Get-Random)"
            password = "123456"
            firstName = "Test"
            lastName = "User"
        } | ConvertTo-Json
        
        $registerResponse = Invoke-ApiRequest -Uri "$gateway/api/users/auth/register" -Method POST -Body $registerBody
        Add-TestResult "Criar Usuário Teste" "✅ PASSOU" "(usuário criado)"
        
        # Login com usuário criado
        $loginBody = @{
            identifier = ($registerBody | ConvertFrom-Json).email
            password = "123456"
        } | ConvertTo-Json
        
        $loginResponse = Invoke-ApiRequest -Uri "$gateway/api/users/auth/login" -Method POST -Body $loginBody
        $script:token = $loginResponse.token
        $script:headers = @{ Authorization = "Bearer $($script:token)" }
        
        Add-TestResult "Login Usuário Teste" "✅ PASSOU" "(token obtido)"
    } catch {
        Add-TestResult "Criar/Login Usuário" "❌ FALHOU" $_.ToString()
    }
}

# Teste 10: Listar Usuários (requer autenticação)
try {
    if ($script:token) {
        $users = Invoke-ApiRequest -Uri "$gateway/api/users" -Headers $script:headers
        Add-TestResult "Listar Usuários" "✅ PASSOU" "($($users.data.Count) usuários)"
    } else {
        Add-TestResult "Listar Usuários" "⚠️ PULADO" "(sem token)"
    }
} catch {
    Add-TestResult "Listar Usuários" "❌ FALHOU" $_.ToString()
}

Write-Host "`n📝 FASE 4: TESTES DO LIST SERVICE" -ForegroundColor Yellow  
Write-Host "================================="

# Teste 11: Criar Lista (requer autenticação)
try {
    if ($script:token) {
        $listBody = @{
            name = "Lista de Teste Automatizado"
            description = "Criada pelo script de testes"
            budget = 100.0
        } | ConvertTo-Json
        
        $newList = Invoke-ApiRequest -Uri "$gateway/api/lists" -Method POST -Body $listBody -Headers $script:headers
        $script:testListId = $newList.data.id
        
        Add-TestResult "Criar Lista" "✅ PASSOU" "(ID: $($script:testListId))"
    } else {
        Add-TestResult "Criar Lista" "⚠️ PULADO" "(sem token)"
    }
} catch {
    Add-TestResult "Criar Lista" "❌ FALHOU" $_.ToString()
}

# Teste 12: Listar Listas do Usuário
try {
    if ($script:token) {
        $lists = Invoke-ApiRequest -Uri "$gateway/api/lists" -Headers $script:headers
        Add-TestResult "Listar Listas" "✅ PASSOU" "($($lists.data.Count) listas)"
    } else {
        Add-TestResult "Listar Listas" "⚠️ PULADO" "(sem token)"
    }
} catch {
    Add-TestResult "Listar Listas" "❌ FALHOU" $_.ToString()
}

# Teste 13: Adicionar Item à Lista
try {
    if ($script:token -and $script:testListId -and $script:sampleItemId) {
        $addItemBody = @{
            itemId = $script:sampleItemId
            quantity = 2
            notes = "Adicionado pelo teste automatizado"
        } | ConvertTo-Json
        
        $addResult = Invoke-ApiRequest -Uri "$gateway/api/lists/$($script:testListId)/items" -Method POST -Body $addItemBody -Headers $script:headers
        
        Add-TestResult "Adicionar Item à Lista" "✅ PASSOU" "(quantidade: 2)"
    } else {
        Add-TestResult "Adicionar Item à Lista" "⚠️ PULADO" "(dependências não disponíveis)"
    }
} catch {
    Add-TestResult "Adicionar Item à Lista" "❌ FALHOU" $_.ToString()
}

# Teste 14: Buscar Lista com Itens
try {
    if ($script:token -and $script:testListId) {
        $fullList = Invoke-ApiRequest -Uri "$gateway/api/lists/$($script:testListId)" -Headers $script:headers
        $itemCount = $fullList.data.items.Count
        $total = $fullList.data.summary.total
        
        Add-TestResult "Buscar Lista Completa" "✅ PASSOU" "($itemCount itens, total: R$ $total)"
    } else {
        Add-TestResult "Buscar Lista Completa" "⚠️ PULADO" "(sem lista criada)"
    }
} catch {
    Add-TestResult "Buscar Lista Completa" "❌ FALHOU" $_.ToString()
}

Write-Host "`n📊 FASE 5: TESTES DE ENDPOINTS AGREGADOS" -ForegroundColor Yellow
Write-Host "========================================="

# Teste 15: Dashboard
try {
    if ($script:token) {
        $dashboard = Invoke-ApiRequest -Uri "$gateway/api/dashboard" -Headers $script:headers
        Add-TestResult "Dashboard Agregado" "✅ PASSOU" "(dados de múltiplos serviços)"
    } else {
        Add-TestResult "Dashboard Agregado" "⚠️ PULADO" "(sem token)"
    }
} catch {
    Add-TestResult "Dashboard Agregado" "❌ FALHOU" $_.ToString()
}

# Teste 16: Busca Global
try {
    $globalSearch = Invoke-ApiRequest -Uri "$gateway/api/search?q=leite"
    Add-TestResult "Busca Global" "✅ PASSOU" "(termo: leite)"
} catch {
    Add-TestResult "Busca Global" "❌ FALHOU" $_.ToString()
}

Write-Host "`n📊 RESUMO DOS TESTES" -ForegroundColor Cyan
Write-Host "===================="

$passed = ($testResults | Where-Object { $_.Status -eq "✅ PASSOU" }).Count
$failed = ($testResults | Where-Object { $_.Status -eq "❌ FALHOU" }).Count  
$skipped = ($testResults | Where-Object { $_.Status -eq "⚠️ PULADO" }).Count
$total = $testResults.Count

Write-Host "Total de Testes: $total" -ForegroundColor White
Write-Host "✅ Passou: $passed" -ForegroundColor Green
Write-Host "❌ Falhou: $failed" -ForegroundColor Red
Write-Host "⚠️ Pulado: $skipped" -ForegroundColor Yellow

$successRate = [math]::Round(($passed / $total) * 100, 1)
Write-Host "`nTaxa de Sucesso: $successRate%" -ForegroundColor $(if($successRate -ge 80) { "Green" } elseif($successRate -ge 60) { "Yellow" } else { "Red" })

if ($failed -gt 0) {
    Write-Host "`n❌ TESTES QUE FALHARAM:" -ForegroundColor Red
    $testResults | Where-Object { $_.Status -eq "❌ FALHOU" } | ForEach-Object {
        Write-Host "   - $($_.Test): $($_.Details)" -ForegroundColor Red
    }
}

if ($skipped -gt 0) {
    Write-Host "`n⚠️ TESTES PULADOS:" -ForegroundColor Yellow
    $testResults | Where-Object { $_.Status -eq "⚠️ PULADO" } | ForEach-Object {
        Write-Host "   - $($_.Test): $($_.Details)" -ForegroundColor Yellow
    }
}

Write-Host "`n🎯 CONCLUSÃO" -ForegroundColor Cyan
if ($successRate -ge 80) {
    Write-Host "🎉 Sistema funcionando muito bem! ($successRate% de sucesso)" -ForegroundColor Green
} elseif ($successRate -ge 60) {
    Write-Host "⚠️ Sistema funcionando com alguns problemas. ($successRate% de sucesso)" -ForegroundColor Yellow
} else {
    Write-Host "🚨 Sistema com problemas críticos. ($successRate% de sucesso)" -ForegroundColor Red
}

Write-Host "`n📋 Para ver detalhes dos endpoints, consulte: GUIA_TESTES_COMPLETO.md" -ForegroundColor Gray
Write-Host "Teste concluído em $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Gray