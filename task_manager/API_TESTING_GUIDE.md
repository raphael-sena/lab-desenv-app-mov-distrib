# 🧪 Exemplos de Testes da API

## 📋 Configuração Inicial

### MockAPI.io (Recomendado)

1. Acesse: https://mockapi.io/
2. Crie um novo projeto
3. Crie um recurso chamado "tasks"
4. Configure os campos conforme abaixo

### Estrutura do Objeto Task

```json
{
  "id": "1",
  "title": "Exemplo de Tarefa",
  "description": "Descrição detalhada",
  "priority": "medium",
  "completed": false,
  "createdAt": "2025-11-30T10:00:00.000Z",
  "updatedAt": "2025-11-30T10:00:00.000Z",
  "isSynced": true,
  "photoPaths": "[]",
  "completedAt": null,
  "completedBy": null,
  "latitude": null,
  "longitude": null,
  "locationName": null
}
```

---

## 🔧 Endpoints da API

### 1. GET - Listar Todas as Tarefas

```
GET https://SEU_ID.mockapi.io/api/v1/tasks
```

**Response 200 OK:**
```json
[
  {
    "id": "1",
    "title": "Tarefa 1",
    "description": "Descrição",
    "priority": "high",
    "completed": false,
    "createdAt": "2025-11-30T10:00:00.000Z",
    "updatedAt": "2025-11-30T10:00:00.000Z",
    "isSynced": true
  },
  {
    "id": "2",
    "title": "Tarefa 2",
    "description": "Outra descrição",
    "priority": "low",
    "completed": true,
    "createdAt": "2025-11-30T09:00:00.000Z",
    "updatedAt": "2025-11-30T11:00:00.000Z",
    "isSynced": true
  }
]
```

---

### 2. GET - Buscar Uma Tarefa

```
GET https://SEU_ID.mockapi.io/api/v1/tasks/1
```

**Response 200 OK:**
```json
{
  "id": "1",
  "title": "Tarefa 1",
  "description": "Descrição",
  "priority": "high",
  "completed": false,
  "createdAt": "2025-11-30T10:00:00.000Z",
  "updatedAt": "2025-11-30T10:00:00.000Z",
  "isSynced": true
}
```

---

### 3. POST - Criar Nova Tarefa

```
POST https://SEU_ID.mockapi.io/api/v1/tasks
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Nova Tarefa via API",
  "description": "Criada pelo Postman",
  "priority": "urgent",
  "completed": false,
  "createdAt": "2025-11-30T14:30:00.000Z",
  "updatedAt": "2025-11-30T14:30:00.000Z",
  "isSynced": true,
  "photoPaths": "[]",
  "completedAt": null,
  "completedBy": null,
  "latitude": null,
  "longitude": null,
  "locationName": null
}
```

**Response 201 Created:**
```json
{
  "id": "3",
  "title": "Nova Tarefa via API",
  "description": "Criada pelo Postman",
  "priority": "urgent",
  "completed": false,
  "createdAt": "2025-11-30T14:30:00.000Z",
  "updatedAt": "2025-11-30T14:30:00.000Z",
  "isSynced": true,
  "photoPaths": "[]"
}
```

---

### 4. PUT - Atualizar Tarefa (Para Teste de Conflito)

```
PUT https://SEU_ID.mockapi.io/api/v1/tasks/3
Content-Type: application/json
```

**Body (Simulando edição mais recente no servidor):**
```json
{
  "title": "Tarefa EDITADA NO SERVIDOR",
  "description": "Esta versão foi editada no servidor às 14:35",
  "priority": "high",
  "completed": true,
  "createdAt": "2025-11-30T14:30:00.000Z",
  "updatedAt": "2025-11-30T14:35:00.000Z",
  "isSynced": true,
  "completedAt": "2025-11-30T14:35:00.000Z",
  "completedBy": "manual"
}
```

**Response 200 OK:**
```json
{
  "id": "3",
  "title": "Tarefa EDITADA NO SERVIDOR",
  "description": "Esta versão foi editada no servidor às 14:35",
  "priority": "high",
  "completed": true,
  "createdAt": "2025-11-30T14:30:00.000Z",
  "updatedAt": "2025-11-30T14:35:00.000Z",
  "isSynced": true
}
```

---

### 5. DELETE - Deletar Tarefa

```
DELETE https://SEU_ID.mockapi.io/api/v1/tasks/3
```

**Response 200 OK ou 204 No Content**

---

## 🎯 Cenário de Teste: Resolução de Conflito LWW

### Passo 1: Criar tarefa no App (Offline)

```
1. Ativar Modo Avião
2. Criar tarefa no app:
   - Título: "Tarefa Conflito"
   - Descrição: "Versão Original"
   - updatedAt: 2025-11-30T14:30:00.000Z (automático)
3. Tarefa fica com ícone "Pendente"
```

### Passo 2: Editar no App (Ainda Offline)

```
1. Editar a tarefa:
   - Descrição: "Editada no APP às 14:32"
   - updatedAt: 2025-11-30T14:32:00.000Z (automático)
2. Ainda com ícone "Pendente"
```

### Passo 3: Conectar e Deixar Sincronizar

```
1. Desativar Modo Avião
2. App envia para servidor
3. Servidor recebe com updatedAt: 14:32
```

### Passo 4: Editar no Servidor (Postman) - Timestamp MAIS RECENTE

```
PUT https://SEU_ID.mockapi.io/api/v1/tasks/{id}
Content-Type: application/json

{
  "title": "Tarefa Conflito",
  "description": "EDITADA NO SERVIDOR às 14:35",
  "updatedAt": "2025-11-30T14:35:00.000Z",
  "priority": "urgent",
  "completed": false
}
```

### Passo 5: Forçar Sincronização no App

```
1. No app, clicar no botão de sincronizar (⟳)
2. SyncService baixa versões do servidor
3. Compara updatedAt:
   - Local: 14:32
   - Servidor: 14:35
   - Servidor é MAIS RECENTE!
4. Versão do servidor SOBRESCREVE a local
5. Console mostra:
   "Conflito resolvido (LWW): servidor mais recente para task {id}"
```

### Resultado Esperado:
- ✅ Descrição no app muda para "EDITADA NO SERVIDOR às 14:35"
- ✅ Ícone muda para "Sincronizado"
- ✅ Log de conflito aparece no console

---

## 🧪 Cenário Inverso: Local Mais Recente

### Passo 1: Criar tarefa (Online)

```
Criar tarefa normalmente com app online
updatedAt: 2025-11-30T15:00:00.000Z
```

### Passo 2: Editar no Postman - Timestamp ANTIGO

```
PUT https://SEU_ID.mockapi.io/api/v1/tasks/{id}

{
  "title": "Tarefa Conflito 2",
  "description": "Editada no servidor às 15:01",
  "updatedAt": "2025-11-30T15:01:00.000Z"
}
```

### Passo 3: Editar no App (Offline) - Timestamp MAIS RECENTE

```
1. Ativar Modo Avião
2. Editar tarefa:
   - Descrição: "Editada no APP às 15:05"
   - updatedAt: 2025-11-30T15:05:00.000Z
```

### Passo 4: Conectar e Sincronizar

```
1. Desativar Modo Avião
2. SyncService compara:
   - Local: 15:05
   - Servidor: 15:01
   - Local é MAIS RECENTE!
3. Versão local é ENVIADA ao servidor
4. Servidor é atualizado com versão local
```

### Resultado Esperado:
- ✅ Servidor recebe "Editada no APP às 15:05"
- ✅ Log: "Local mais recente para task {id}, mantendo versão local"

---

## 📝 Collection Postman Completa

### Importar no Postman:

```json
{
  "info": {
    "name": "Task Manager API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get All Tasks",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "https://SEU_ID.mockapi.io/api/v1/tasks",
          "protocol": "https",
          "host": ["SEU_ID", "mockapi", "io"],
          "path": ["api", "v1", "tasks"]
        }
      }
    },
    {
      "name": "Get Task by ID",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "https://SEU_ID.mockapi.io/api/v1/tasks/1",
          "protocol": "https",
          "host": ["SEU_ID", "mockapi", "io"],
          "path": ["api", "v1", "tasks", "1"]
        }
      }
    },
    {
      "name": "Create Task",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"title\": \"Nova Tarefa\",\n  \"description\": \"Descrição\",\n  \"priority\": \"medium\",\n  \"completed\": false,\n  \"createdAt\": \"{{$isoTimestamp}}\",\n  \"updatedAt\": \"{{$isoTimestamp}}\",\n  \"isSynced\": true\n}"
        },
        "url": {
          "raw": "https://SEU_ID.mockapi.io/api/v1/tasks",
          "protocol": "https",
          "host": ["SEU_ID", "mockapi", "io"],
          "path": ["api", "v1", "tasks"]
        }
      }
    },
    {
      "name": "Update Task (Conflict Test)",
      "request": {
        "method": "PUT",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"title\": \"Tarefa EDITADA NO SERVIDOR\",\n  \"description\": \"Versão do servidor mais recente\",\n  \"updatedAt\": \"{{$isoTimestamp}}\",\n  \"completed\": true\n}"
        },
        "url": {
          "raw": "https://SEU_ID.mockapi.io/api/v1/tasks/1",
          "protocol": "https",
          "host": ["SEU_ID", "mockapi", "io"],
          "path": ["api", "v1", "tasks", "1"]
        }
      }
    },
    {
      "name": "Delete Task",
      "request": {
        "method": "DELETE",
        "header": [],
        "url": {
          "raw": "https://SEU_ID.mockapi.io/api/v1/tasks/1",
          "protocol": "https",
          "host": ["SEU_ID", "mockapi", "io"],
          "path": ["api", "v1", "tasks", "1"]
        }
      }
    }
  ]
}
```

---

## 🎓 Dicas para Apresentação

1. **Preparar tarefas de exemplo no servidor antes da demo**
2. **Ter Postman aberto e pronto**
3. **Abrir console do Flutter para mostrar logs**
4. **Testar cenário completo antes da apresentação**
5. **Ter backup do banco SQLite para reset rápido**

**Boa apresentação! 🚀**
