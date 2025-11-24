# Exemplos de Requisições HTTP - Sistema RabbitMQ

## 📋 Arquivo para REST Client (VS Code Extension)

### 1. Login (Obter Token)

```http
POST http://localhost:3001/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Resposta esperada:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "name": "Administrador"
    }
  }
}
```

---

### 2. Criar Lista de Compras

```http
POST http://localhost:3002/lists
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json

{
  "name": "Lista para Teste RabbitMQ",
  "description": "Lista criada para testar o sistema de mensageria",
  "items": [
    {
      "itemId": "item-notebook",
      "itemName": "Notebook Dell Inspiron 15",
      "quantity": 1,
      "unit": "unidade",
      "estimatedPrice": 3500.00,
      "purchased": false,
      "notes": "i5, 8GB RAM, 256GB SSD"
    },
    {
      "itemId": "item-mouse",
      "itemName": "Mouse Logitech MX Master 3",
      "quantity": 2,
      "unit": "unidade",
      "estimatedPrice": 450.00,
      "purchased": false,
      "notes": "Wireless"
    },
    {
      "itemId": "item-teclado",
      "itemName": "Teclado Mecânico Keychron K2",
      "quantity": 1,
      "unit": "unidade",
      "estimatedPrice": 650.00,
      "purchased": false,
      "notes": "Switch Brown, RGB"
    }
  ]
}
```

**Resposta esperada:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-da-lista",
    "name": "Lista para Teste RabbitMQ",
    "userId": "uuid-do-usuario",
    "status": "active",
    "items": [...],
    "summary": {
      "totalItems": 3,
      "purchasedItems": 0,
      "estimatedTotal": 4600.00
    }
  }
}
```

---

### 3. **CHECKOUT - Dispara Evento RabbitMQ** 🚀

```http
POST http://localhost:3002/lists/COLE_O_ID_DA_LISTA_AQUI/checkout
Authorization: Bearer SEU_TOKEN_AQUI
```

**Resposta esperada (202 Accepted):**
```json
{
  "success": true,
  "message": "Checkout iniciado - processamento assíncrono em andamento",
  "data": {
    "listId": "uuid-da-lista",
    "totalAmount": "4600.00",
    "status": "processing"
  }
}
```

**⚡ IMPORTANTE:** 
- A resposta é IMEDIATA (< 100ms)
- O processamento acontece em background
- Observe os terminais dos consumers!

---

### 4. Listar Minhas Listas

```http
GET http://localhost:3002/lists
Authorization: Bearer SEU_TOKEN_AQUI
```

---

### 5. Buscar Lista Específica

```http
GET http://localhost:3002/lists/ID_DA_LISTA
Authorization: Bearer SEU_TOKEN_AQUI
```

---

### 6. Health Check - List Service

```http
GET http://localhost:3002/health
```

---

### 7. Health Check - User Service

```http
GET http://localhost:3001/health
```

---

## 🔧 Usando com cURL (PowerShell)

### Login
```powershell
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"identifier":"admin@microservices.com","password":"admin123"}'

$token = $loginResponse.data.token
Write-Host "Token: $token"
```

### Criar Lista
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$listBody = @{
    name = "Lista PowerShell"
    description = "Criada via PowerShell"
    items = @(
        @{
            itemId = "ps-001"
            itemName = "Produto Teste"
            quantity = 1
            estimatedPrice = 100.00
        }
    )
} | ConvertTo-Json -Depth 10

$listResponse = Invoke-RestMethod -Uri "http://localhost:3002/lists" `
  -Method POST `
  -Headers $headers `
  -Body $listBody

$listId = $listResponse.data.id
Write-Host "Lista criada: $listId"
```

### Checkout
```powershell
$checkoutResponse = Invoke-RestMethod -Uri "http://localhost:3002/lists/$listId/checkout" `
  -Method POST `
  -Headers $headers

Write-Host "Status: $($checkoutResponse.data.status)"
Write-Host "Total: R$ $($checkoutResponse.data.totalAmount)"
```

---

## 🧪 Fluxo Completo de Teste

1. **Faça login** → Copie o token
2. **Crie uma lista** → Copie o ID da lista
3. **Inicie os consumers** (se ainda não estiverem rodando)
4. **Faça o checkout** → Observe os terminais
5. **Veja no RabbitMQ Management** → http://localhost:15672

---

## 📊 O que Observar

### Terminal do Notification Consumer
```
📧 ========================================
📧 NOVO EVENTO DE CHECKOUT RECEBIDO
📧 ========================================

📤 Enviando comprovante da lista [ID] para o usuário [EMAIL]

📋 Detalhes da Compra:
   • Lista: Lista para Teste RabbitMQ
   • Total de itens: 3
   • Valor total: R$ 4600.00

📦 Itens comprados:
   1. Notebook Dell - 1x R$ 3500.00
   2. Mouse Logitech - 2x R$ 450.00
   3. Teclado Mecânico - 1x R$ 650.00

✅ Notificação enviada com sucesso!
```

### Terminal do Analytics Consumer
```
📊 ========================================
📊 PROCESSANDO ANALYTICS DE CHECKOUT
📊 ========================================

📈 Dashboard Atualizado:
   • Total de Checkouts: 1
   • Receita Total: R$ 4600.00
   • Total de Itens Vendidos: 3
   • Ticket Médio: R$ 4600.00

🏆 Top 3 Itens Mais Vendidos:
   1. Mouse Logitech - 2 unidades
   2. Notebook Dell - 1 unidade
   3. Teclado Mecânico - 1 unidade

✅ Analytics processado com sucesso!
```

---

## 🎯 Dicas

- Use variáveis de ambiente para o token
- Teste múltiplos checkouts para ver as estatísticas acumulando
- Monitore o RabbitMQ Management em paralelo
- Observe o tempo de resposta rápido (< 100ms)

---

**🚀 Pronto para testar o sistema completo!**
