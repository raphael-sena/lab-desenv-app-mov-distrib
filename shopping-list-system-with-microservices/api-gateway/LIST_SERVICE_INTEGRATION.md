# API Gateway - Integração com List Service

## Mudanças Implementadas

### 🔗 **Roteamento do List Service**

#### Novo Endpoint Base
- **`/api/lists/*`** - Roteamento para `list-service`

#### Mapeamento de Rotas
```javascript
// Gateway -> List Service
/api/lists                     -> /lists
/api/lists/123                 -> /lists/123  
/api/lists/123/items           -> /lists/123/items
/api/lists/123/items/456       -> /lists/123/items/456
/api/lists/123/summary         -> /lists/123/summary
```

### 📊 **Dashboard Integrado**

#### Dados Agregados Atualizados
O endpoint `/api/dashboard` agora inclui:

```json
{
  "data": {
    "users": { ... },
    "products": { ... },
    "categories": { ... },
    "lists": {
      "available": true,
      "data": [
        {
          "id": "uuid",
          "name": "Lista de Compras",
          "status": "active",
          "summary": {
            "totalItems": 5,
            "purchasedItems": 2,
            "estimatedTotal": 45.90
          }
        }
      ],
      "error": null
    }
  }
}
```

### 🔍 **Busca Global Expandida**

#### Busca Multi-Serviços
O endpoint `/api/search?q=termo` agora busca em:
- **Produtos** (product-service)
- **Usuários** (user-service) - se autenticado
- **Listas** (list-service) - se autenticado

#### Formato de Resposta
```json
{
  "success": true,
  "data": {
    "query": "compras",
    "products": {
      "available": true,
      "results": [...],
      "error": null
    },
    "users": {
      "available": true,
      "results": [...],
      "error": null
    },
    "lists": {
      "available": true,
      "results": [
        {
          "id": "uuid",
          "name": "Lista de Compras Semanal",
          "description": "Compras para a semana",
          "status": "active"
        }
      ],
      "error": null
    }
  }
}
```

## 🛣️ **Rotas Disponíveis do List Service via Gateway**

### Gerenciamento de Listas
- `GET /api/lists` - Listar listas do usuário
- `GET /api/lists/:id` - Buscar lista específica
- `POST /api/lists` - Criar nova lista
- `PUT /api/lists/:id` - Atualizar lista
- `DELETE /api/lists/:id` - Arquivar lista

### Gerenciamento de Itens
- `POST /api/lists/:id/items` - Adicionar item à lista
- `PUT /api/lists/:id/items/:itemId` - Atualizar item
- `DELETE /api/lists/:id/items/:itemId` - Remover item

### Utilitários
- `GET /api/lists/:id/summary` - Resumo da lista
- `GET /api/search?q=termo` - Busca global incluindo listas

## 🔐 **Autenticação**

### Rotas Protegidas
Todas as rotas do List Service requerem autenticação JWT:
- Header: `Authorization: Bearer <token>`
- O Gateway repassa o token automaticamente
- Permissões validadas no List Service

### Exemplo de Uso
```javascript
// Login no User Service
const loginResponse = await fetch('/api/users/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    identifier: 'user@example.com',
    password: 'password123'
  })
});

const { token } = loginResponse.data;

// Criar lista via Gateway
const listResponse = await fetch('/api/lists', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Minha Lista',
    description: 'Lista de compras'
  })
});
```

## 🔄 **Circuit Breaker**

### Proteção Automática
- Aplica-se automaticamente ao `list-service`
- Aberto após 3 falhas consecutivas
- Meio-aberto após 30 segundos
- Reset automático em caso de sucesso

### Estados do Circuit Breaker
- **Fechado**: Requisições normais
- **Aberto**: Bloqueia requisições (503 Service Unavailable)
- **Meio-aberto**: Teste de recuperação

## 📋 **Service Discovery**

### Registro Automático
- List Service se registra automaticamente
- Gateway descobre via Service Registry
- Health checks a cada 30 segundos
- Remoção automática em caso de falha

### Debug
```bash
GET /registry
GET /debug/services
```

## 🚀 **Inicialização do Gateway**

### Log Atualizado
```
=====================================
API Gateway iniciado na porta 3000
URL: http://localhost:3000
Health: http://localhost:3000/health
Registry: http://localhost:3000/registry
Dashboard: http://localhost:3000/api/dashboard
Architecture: Microservices with NoSQL
=====================================
Rotas disponíveis:
   POST /api/users/auth/register
   POST /api/users/auth/login
   GET  /api/users
   GET  /api/products
   GET  /api/lists
   POST /api/lists
   GET  /api/lists/:id
   POST /api/lists/:id/items
   GET  /api/search?q=termo
   GET  /api/dashboard
=====================================
```

## 🔧 **Configurações Técnicas**

### Proxy Settings
- Timeout: 10 segundos
- IPv4 forçado
- Headers automáticos
- Query parameters preservados
- Body forwarding para POST/PUT/PATCH

### Error Handling
- 404: Endpoint não encontrado
- 503: Serviço indisponível
- 500: Erro interno do gateway
- Circuit breaker: 503 temporário

## 📈 **Benefícios da Integração**

1. **Transparência**: Cliente usa um único endpoint
2. **Agregação**: Dashboard unificado com dados de todos os serviços
3. **Busca Unificada**: Pesquisa em todos os microsserviços
4. **Resiliência**: Circuit breaker e health checks
5. **Autenticação**: Token JWT centralizado
6. **Monitoramento**: Logs e métricas unificados

O API Gateway agora oferece acesso completo ao List Service mantendo a mesma arquitetura e padrões dos demais microsserviços!