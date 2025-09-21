# List Service - Schema Implementado

## Visão Geral

O List Service foi completamente transformado de um Product Service para implementar o schema de listas especificado, focado em listas de compras com gerenciamento completo de itens.

## Schema da Lista Implementado

```json
{
  "id": "uuid",
  "userId": "string",
  "name": "string", 
  "description": "string",
  "status": "active|completed|archived",
  "items": [
    {
      "itemId": "string",
      "itemName": "string", // cache do nome
      "quantity": "number",
      "unit": "string", 
      "estimatedPrice": "number",
      "purchased": "boolean",
      "notes": "string",
      "addedAt": "timestamp"
    }
  ],
  "summary": {
    "totalItems": "number",
    "purchasedItems": "number",
    "estimatedTotal": "number" 
  },
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## Endpoints Implementados

### Gerenciamento de Listas
- `GET /lists` - Listar listas do usuário (com filtros por status)
- `GET /lists/:id` - Buscar lista específica
- `POST /lists` - Criar nova lista
- `PUT /lists/:id` - Atualizar lista (nome, descrição, status)
- `DELETE /lists/:id` - Arquivar lista (soft delete)

### Gerenciamento de Itens
- `POST /lists/:id/items` - Adicionar item à lista
- `PUT /lists/:id/items/:itemId` - Atualizar item da lista
- `DELETE /lists/:id/items/:itemId` - Remover item da lista

### Utilitários
- `GET /lists/:id/summary` - Resumo da lista
- `GET /search` - Buscar listas por texto
- `GET /health` - Health check do serviço

## Funcionalidades Implementadas

### 1. **Cálculo Automático de Summary**
```javascript
calculateListSummary(items) {
    const totalItems = items.length;
    const purchasedItems = items.filter(item => item.purchased).length;
    const estimatedTotal = items.reduce((total, item) => {
        return total + (item.estimatedPrice * item.quantity);
    }, 0);

    return {
        totalItems,
        purchasedItems, 
        estimatedTotal: Math.round(estimatedTotal * 100) / 100
    };
}
```

### 2. **Validações e Permissões**
- Usuários só podem acessar suas próprias listas
- Validação de campos obrigatórios na criação de listas e itens
- Validação de status válidos (`active`, `completed`, `archived`)
- Verificação de existência de itens antes de atualizar/remover

### 3. **Status de Lista**
- `active`: Lista ativa em uso
- `completed`: Lista finalizada (todos itens comprados)
- `archived`: Lista arquivada/deletada (soft delete)

### 4. **Dados de Exemplo**
Criadas 3 listas exemplo:
1. **Lista de Compras Semanal** - Lista ativa com itens variados
2. **Lista de Materiais Escritório** - Lista ativa com materiais de trabalho  
3. **Lista de Compras Festa** - Lista completada com todos itens comprados

## Integração com Microsserviços

### Autenticação
- Integrado com **User Service** via `authMiddleware`
- Validação de tokens JWT para todas as rotas protegidas
- Identificação de usuário via `req.user.id`

### Service Registry
- Auto-registro no service registry com endpoints corretos
- Health checks automáticos a cada 30 segundos
- Graceful shutdown com desregistro

## Uso da Flexibilidade NoSQL

### Updates Dinâmicos
- Campos opcionais em atualizações de listas e itens
- Cálculo automático de summary após modificações
- Timestamps automáticos (`createdAt`, `updatedAt`, `addedAt`)

### Busca Full-Text
- Busca por nome e descrição nas listas
- Filtros por usuário automáticos
- Resultados paginados

## Exemplos de Uso

### Criar Lista
```javascript
POST /lists
{
  "name": "Lista do Supermercado",
  "description": "Compras semanais"
}
```

### Adicionar Item
```javascript
POST /lists/{listId}/items
{
  "itemId": "prod_001",
  "itemName": "Leite Integral",
  "quantity": 2,
  "unit": "litro", 
  "estimatedPrice": 4.50,
  "notes": "Marca preferida"
}
```

### Marcar Item como Comprado
```javascript
PUT /lists/{listId}/items/{itemId}
{
  "purchased": true
}
```

### Obter Resumo
```javascript
GET /lists/{listId}/summary
// Retorna: totalItems, purchasedItems, estimatedTotal
```

## Características Técnicas

- **Banco de Dados**: JSON-NoSQL via JsonDatabase
- **Autenticação**: JWT via User Service
- **Validações**: Campos obrigatórios e tipos adequados
- **Paginação**: Suporte completo nas listagens
- **Busca**: Full-text search integrada
- **Error Handling**: Tratamento robusto de erros
- **Logs**: Logs estruturados para debugging

## Próximos Passos Sugeridos

1. **Testes**: Implementar testes unitários e de integração
2. **Cache**: Adicionar cache Redis para performance
3. **Notificações**: Integrar com serviço de notificações
4. **Analytics**: Estatísticas de uso das listas
5. **Compartilhamento**: Permitir listas compartilhadas entre usuários