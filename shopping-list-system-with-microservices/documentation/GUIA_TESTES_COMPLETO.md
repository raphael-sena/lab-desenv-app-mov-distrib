# 🧪 Guia Completo de Testes - Shopping List Microservices

## 📋 Índice
1. [Verificação dos Serviços](#verificação-dos-serviços)
2. [Testes do User Service](#testes-do-user-service)
3. [Testes do Item Service](#testes-do-item-service)
4. [Testes do List Service](#testes-do-list-service)
5. [Testes dos Endpoints Agregados](#testes-dos-endpoints-agregados)
6. [Script Automatizado](#script-automatizado)

---

## 🔍 1. Verificação dos Serviços

### 1.1 Health Check Geral
```bash
# Via PowerShell (substitui curl)
Invoke-RestMethod -Uri http://localhost:3000/health -Method GET

# Ou via browser
http://localhost:3000/health
```

**Resposta Esperada:**
```json
{
  "service": "api-gateway",
  "status": "healthy",
  "architecture": "Microservices with NoSQL",
  "services": {
    "user-service": { "healthy": true },
    "list-service": { "healthy": true },
    "item-service": { "healthy": true }
  }
}
```

### 1.2 Service Registry
```bash
Invoke-RestMethod -Uri http://localhost:3000/registry -Method GET
```

### 1.3 Health Individual dos Serviços
```bash
# User Service
Invoke-RestMethod -Uri http://localhost:3001/health -Method GET

# List Service  
Invoke-RestMethod -Uri http://localhost:3002/health -Method GET

# Item Service
Invoke-RestMethod -Uri http://localhost:3003/health -Method GET
```

---

## 👤 2. Testes do User Service

### 2.1 Cadastro de Usuário
```powershell
# PowerShell
$body = @{
    email = "teste@test.com"
    username = "testuser"
    password = "123456"
    firstName = "Test"
    lastName = "User"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/api/users/auth/register -Method POST -Body $body -ContentType "application/json"
```

**Resposta Esperada:** `{"success": true, "message": "Usuário criado com sucesso"}`

### 2.2 Login
```powershell
$loginBody = @{
    identifier = "teste@test.com"
    password = "123456"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri http://localhost:3000/api/users/auth/login -Method POST -Body $loginBody -ContentType "application/json"

# Salvar token para próximas requisições
$token = $response.token
$headers = @{ Authorization = "Bearer $token" }
```

**Resposta Esperada:** `{"success": true, "token": "jwt_token_aqui", "user": {...}}`

### 2.3 Listar Usuários (requer autenticação)
```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/users -Method GET -Headers $headers
```

### 2.4 Atualizar Preferências (requer autenticação)
```powershell
$prefBody = @{
    theme = "dark"
    notifications = $true
    language = "pt-BR"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/users/$($response.user.id)/preferences" -Method PUT -Body $prefBody -ContentType "application/json" -Headers $headers
```

---

## 🛍️ 3. Testes do Item Service

### 3.1 Listar Todos os Itens
```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/items -Method GET
```

### 3.2 Listar Itens com Filtros
```powershell
# Por categoria
Invoke-RestMethod -Uri "http://localhost:3000/api/items?category=Alimentos" -Method GET

# Com limite
Invoke-RestMethod -Uri "http://localhost:3000/api/items?limit=5" -Method GET

# Por nome
Invoke-RestMethod -Uri "http://localhost:3000/api/items?name=arroz" -Method GET
```

### 3.3 Buscar Item Específico
```powershell
# Primeiro pegar lista para obter um ID
$items = Invoke-RestMethod -Uri http://localhost:3000/api/items -Method GET
$itemId = $items.data[0].id

# Buscar item específico
Invoke-RestMethod -Uri "http://localhost:3000/api/items/$itemId" -Method GET
```

### 3.4 Listar Categorias
```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/categories -Method GET
```

### 3.5 Busca Textual
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/items/search?q=leite" -Method GET
```

### 3.6 Criar Novo Item (requer autenticação)
```powershell
$itemBody = @{
    name = "Produto Teste"
    category = "Alimentos"
    brand = "Marca Teste"
    unit = "un"
    averagePrice = 5.99
    description = "Produto criado via teste"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/api/items -Method POST -Body $itemBody -ContentType "application/json" -Headers $headers
```

---

## 📝 4. Testes do List Service

### 4.1 Criar Lista (requer autenticação)
```powershell
$listBody = @{
    name = "Lista de Teste"
    description = "Lista criada para teste"
    budget = 100.0
} | ConvertTo-Json

$newList = Invoke-RestMethod -Uri http://localhost:3000/api/lists -Method POST -Body $listBody -ContentType "application/json" -Headers $headers
$listId = $newList.data.id
```

### 4.2 Listar Suas Listas (requer autenticação)
```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/lists -Method GET -Headers $headers
```

### 4.3 Buscar Lista Específica (requer autenticação)
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/lists/$listId" -Method GET -Headers $headers
```

### 4.4 Adicionar Item à Lista (requer autenticação)
```powershell
# Primeiro pegar um item para adicionar
$items = Invoke-RestMethod -Uri http://localhost:3000/api/items -Method GET
$itemToAdd = $items.data[0]

$addItemBody = @{
    itemId = $itemToAdd.id
    quantity = 2
    notes = "Adicionado via teste"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/lists/$listId/items" -Method POST -Body $addItemBody -ContentType "application/json" -Headers $headers
```

### 4.5 Atualizar Lista (requer autenticação)
```powershell
$updateBody = @{
    name = "Lista Atualizada"
    description = "Descrição atualizada"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/lists/$listId" -Method PUT -Body $updateBody -ContentType "application/json" -Headers $headers
```

---

## 📊 5. Testes dos Endpoints Agregados

### 5.1 Dashboard Completo (requer autenticação)
```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/dashboard -Method GET -Headers $headers
```

### 5.2 Busca Global
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/search?q=arroz" -Method GET
```

### 5.3 Service Registry
```powershell
Invoke-RestMethod -Uri http://localhost:3000/registry -Method GET
```

---

## 🤖 6. Script Automatizado de Testes

Vou criar um script PowerShell que executa todos os testes automaticamente.

### 6.1 Validação Rápida (apenas leitura)
```powershell
# Teste rápido sem autenticação
Write-Host "=== TESTES RÁPIDOS ===" -ForegroundColor Green

# Health checks
Write-Host "1. Health Check Gateway..." -ForegroundColor Yellow
try { $health = Invoke-RestMethod -Uri http://localhost:3000/health; Write-Host "✅ OK" -ForegroundColor Green } catch { Write-Host "❌ FALHOU" -ForegroundColor Red }

# Itens
Write-Host "2. Listar Itens..." -ForegroundColor Yellow  
try { $items = Invoke-RestMethod -Uri http://localhost:3000/api/items; Write-Host "✅ $($items.data.Count) itens encontrados" -ForegroundColor Green } catch { Write-Host "❌ FALHOU" -ForegroundColor Red }

# Categorias
Write-Host "3. Listar Categorias..." -ForegroundColor Yellow
try { $cats = Invoke-RestMethod -Uri http://localhost:3000/api/categories; Write-Host "✅ $($cats.data.Count) categorias encontradas" -ForegroundColor Green } catch { Write-Host "❌ FALHOU" -ForegroundColor Red }

# Registry
Write-Host "4. Service Registry..." -ForegroundColor Yellow
try { $registry = Invoke-RestMethod -Uri http://localhost:3000/registry; Write-Host "✅ $($registry.count) serviços registrados" -ForegroundColor Green } catch { Write-Host "❌ FALHOU" -ForegroundColor Red }

Write-Host "=== TESTES CONCLUÍDOS ===" -ForegroundColor Green
```

---

## 📋 Checklist de Validação

### ✅ Serviços Base
- [ ] API Gateway respondendo (porta 3000)
- [ ] User Service registrado e saudável
- [ ] List Service registrado e saudável  
- [ ] Item Service registrado e saudável

### ✅ User Service
- [ ] Registro de usuário funcionando
- [ ] Login retornando JWT válido
- [ ] Listagem de usuários (autenticado)
- [ ] Atualização de preferências

### ✅ Item Service  
- [ ] Listagem de itens
- [ ] Filtros por categoria
- [ ] Busca por nome
- [ ] Listagem de categorias
- [ ] Criação de item (autenticado)

### ✅ List Service
- [ ] Criação de lista (autenticado)
- [ ] Listagem de listas (autenticado)
- [ ] Adição de itens à lista
- [ ] Cálculos automáticos corretos

### ✅ Endpoints Agregados
- [ ] Dashboard com dados de todos serviços
- [ ] Busca global funcionando
- [ ] Service registry atualizado

---

## 🚨 Troubleshooting Comum

### Problema: "Serviço não encontrado"
```bash
# Verificar se todos os serviços estão rodando
Get-Process | Where-Object {$_.ProcessName -eq "node"}

# Verificar portas ocupadas
netstat -ano | findstr :3000
netstat -ano | findstr :3001  
netstat -ano | findstr :3002
netstat -ano | findstr :3003
```

### Problema: "Credenciais inválidas"
- Verificar se o usuário foi criado corretamente
- Usar o admin padrão: `admin@microservices.com` / `admin123`
- Campo deve ser `identifier`, não `email`

### Problema: "Token inválido"
- Verificar se o token foi salvo corretamente após login
- Token expira em algumas horas, fazer novo login se necessário

---

**🎯 Use este guia para validar completamente seu sistema shopping list microservices!**