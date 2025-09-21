# User Preferences - Documentação

## Visão Geral

O User Service agora suporta um sistema completo de preferências do usuário utilizando a flexibilidade do NoSQL. As preferências são organizadas em duas categorias:

### 1. Preferências de Aplicação (`preferences`)
- `defaultStore`: Loja padrão do usuário (ID da loja ou null)
- `currency`: Moeda preferida (padrão: 'BRL')

### 2. Preferências de Interface (`profile.preferences`)
- `theme`: Tema da interface ('light' ou 'dark', padrão: 'light')
- `language`: Idioma da aplicação (padrão: 'pt-BR')

## Estrutura NoSQL do Usuário

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "username",
  "firstName": "Nome",
  "lastName": "Sobrenome",
  "role": "user",
  "status": "active",
  "profile": {
    "bio": null,
    "avatar": null,
    "preferences": {
      "theme": "light",
      "language": "pt-BR"
    }
  },
  "metadata": {
    "registrationDate": "2025-09-21T...",
    "lastLogin": null,
    "loginCount": 0
  },
  "preferences": {
    "defaultStore": null,
    "currency": "BRL"
  }
}
```

## Endpoints Disponíveis

### 1. Buscar Preferências do Usuário
```http
GET /users/:id/preferences
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "preferences": {
      "application": {
        "defaultStore": null,
        "currency": "BRL"
      },
      "interface": {
        "theme": "light",
        "language": "pt-BR"
      }
    }
  }
}
```

### 2. Atualizar Preferências do Usuário
```http
PUT /users/:id/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "defaultStore": "store_123",
  "currency": "USD",
  "theme": "dark",
  "language": "en-US"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Preferências atualizadas com sucesso",
  "data": {
    "user": { /* objeto usuário completo sem password */ },
    "updatedPreferences": {
      "defaultStore": "store_123",
      "currency": "USD",
      "theme": "dark",
      "language": "en-US"
    }
  }
}
```

### 3. Atualizar Usuário Completo (inclui preferências)
```http
PUT /users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Novo Nome",
  "defaultStore": "store_456",
  "currency": "EUR",
  "theme": "light"
}
```

## Exemplos de Uso

### Definir Loja Padrão
```javascript
const response = await fetch('/users/123/preferences', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    defaultStore: 'loja_centro_sp',
    currency: 'BRL'
  })
});
```

### Alterar Tema da Interface
```javascript
const response = await fetch('/users/123/preferences', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    theme: 'dark',
    language: 'en-US'
  })
});
```

### Buscar Preferências Atuais
```javascript
const response = await fetch('/users/123/preferences', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log(data.data.preferences);
```

## Validações e Regras

1. **Permissões**: Usuários só podem alterar suas próprias preferências, exceto admins
2. **Campos Opcionais**: Todos os campos de preferências são opcionais
3. **Valores Padrão**: 
   - `currency`: 'BRL'
   - `theme`: 'light'
   - `language`: 'pt-BR'
   - `defaultStore`: null
4. **Flexibilidade NoSQL**: Campos aninhados podem ser atualizados independentemente

## Integração com Outros Microsserviços

As preferências podem ser utilizadas por outros serviços:

- **Product Service**: Usar `defaultStore` para filtrar produtos por loja
- **Order Service**: Usar `currency` para cálculos de preço
- **Notification Service**: Usar `language` para localização de mensagens
- **Frontend**: Usar `theme` para personalização visual

## Casos de Uso Comuns

1. **E-commerce Multi-loja**: `defaultStore` define loja preferida do usuário
2. **Aplicação Internacional**: `currency` e `language` para localização
3. **Personalização de Interface**: `theme` para modo escuro/claro
4. **Experiência Contextual**: Combinar preferências para UX personalizada

## Observações Técnicas

- Utiliza dot notation para atualizações aninhadas (`preferences.currency`)
- Aproveitamento total da flexibilidade do JSON-NoSQL
- Retrocompatibilidade mantida com estruturas existentes
- Performance otimizada com atualizações parciais