# Teste Completo com Autenticacao
Write-Host "=== TESTE COMPLETO DO SISTEMA ===" -ForegroundColor Yellow

# 1. Verificar servicos
Write-Host "`n1. Verificando servicos..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3000/health"
    Write-Host "Gateway: OK - $($health.services.Count) servicos" -ForegroundColor Green
} catch {
    Write-Host "Gateway: FALHOU" -ForegroundColor Red
    exit
}

# 2. Criar usuario
Write-Host "`n2. Criando usuario de teste..." -ForegroundColor Cyan
$newUser = @{
    username = "testuser"
    password = "123456"
    name = "Usuario Teste"
    email = "test@email.com"
} | ConvertTo-Json

try {
    $userResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/users/register" -Method POST -Body $newUser -ContentType "application/json"
    Write-Host "Usuario criado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "Usuario ja existe ou erro na criacao" -ForegroundColor Yellow
}

# 3. Fazer login
Write-Host "`n3. Fazendo login..." -ForegroundColor Cyan
$loginData = @{
    username = "testuser"
    password = "123456"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/users/login" -Method POST -Body $loginData -ContentType "application/json"
    $token = $loginResponse.data.token
    Write-Host "Login realizado com sucesso!" -ForegroundColor Green
    Write-Host "Token obtido: $($token.Substring(0,20))..." -ForegroundColor Gray
} catch {
    Write-Host "Erro no login: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# 4. Testar Item Service com autenticacao
Write-Host "`n4. Testando Item Service..." -ForegroundColor Cyan
$headers = @{
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
}

# Criar item de teste
$itemData = @{
    name = "Produto Teste"
    category = "Alimentos"
    brand = "Marca Teste"
    unit = "un"
    averagePrice = 5.99
    description = "Item criado via teste"
    active = $true
} | ConvertTo-Json

try {
    $itemResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/items" -Method POST -Body $itemData -Headers $headers
    Write-Host "Item criado: $($itemResponse.data.name)" -ForegroundColor Green
    $createdItemId = $itemResponse.data.id
} catch {
    Write-Host "Erro ao criar item: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Testar List Service
Write-Host "`n5. Testando List Service..." -ForegroundColor Cyan

# Criar lista
$listData = @{
    name = "Lista de Teste"
    description = "Lista criada via teste automatico"
} | ConvertTo-Json

try {
    $listResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/lists" -Method POST -Body $listData -Headers $headers
    Write-Host "Lista criada: $($listResponse.data.name)" -ForegroundColor Green
    $createdListId = $listResponse.data.id
} catch {
    Write-Host "Erro ao criar lista: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Verificar dados finais
Write-Host "`n6. Verificando dados finais..." -ForegroundColor Cyan

try {
    $allItems = Invoke-RestMethod -Uri "http://localhost:3000/api/items" -Headers $headers
    Write-Host "Total de itens: $($allItems.data.Count)" -ForegroundColor Green
    
    $allLists = Invoke-RestMethod -Uri "http://localhost:3000/api/lists" -Headers $headers
    Write-Host "Total de listas: $($allLists.data.Count)" -ForegroundColor Green
    
    $categories = Invoke-RestMethod -Uri "http://localhost:3000/api/categories"
    Write-Host "Total de categorias: $($categories.data.Count)" -ForegroundColor Green
} catch {
    Write-Host "Erro ao verificar dados: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== TESTE CONCLUIDO ===" -ForegroundColor Yellow
Write-Host "Se todos os testes passaram, o sistema esta funcionando perfeitamente!" -ForegroundColor Green