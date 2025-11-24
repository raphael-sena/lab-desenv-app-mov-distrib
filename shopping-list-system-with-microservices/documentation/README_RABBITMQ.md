# 🛒 Sistema de Lista de Compras com Microsserviços

Sistema distribuído de gerenciamento de listas de compras utilizando arquitetura de microsserviços, NoSQL e mensageria assíncrona com RabbitMQ.

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                     API Gateway                         │
│                    (Port: 3000)                         │
└────────┬─────────────────────────────────────┬─────────┘
         │                                      │
         ▼                                      ▼
┌─────────────────┐                   ┌─────────────────┐
│  User Service   │                   │  List Service   │
│  (Port: 3001)   │◄─────Auth─────────│  (Port: 3002)   │
└─────────────────┘                   └────────┬────────┘
                                               │
                                               │ Publica evento
                                               ▼
                              ┌────────────────────────────┐
                              │   RabbitMQ Exchange        │
                              │   (shopping_events)        │
                              └────┬───────────────┬───────┘
                                   │               │
                                   ▼               ▼
                          ┌────────────┐   ┌────────────┐
                          │Notification│   │ Analytics  │
                          │  Consumer  │   │  Consumer  │
                          └────────────┘   └────────────┘
```

## 📦 Componentes

### Microsserviços
- **User Service** (3001): Autenticação e gerenciamento de usuários
- **List Service** (3002): Gerenciamento de listas de compras
- **Product Service** (3003): Catálogo de produtos
- **Item Service** (3004): Gerenciamento de itens

### Infraestrutura
- **API Gateway** (3000): Ponto de entrada único
- **Service Registry**: Descoberta de serviços
- **JSON Database**: Banco NoSQL baseado em arquivos
- **RabbitMQ**: Mensageria assíncrona

### Consumers (RabbitMQ)
- **Notification Consumer**: Envia notificações e comprovantes
- **Analytics Consumer**: Processa estatísticas e métricas

## 🚀 Instalação

### Pré-requisitos
- Node.js >= 16.0.0
- RabbitMQ

### Instalar RabbitMQ

**Windows:**
```powershell
choco install rabbitmq
rabbitmq-plugins enable rabbitmq_management
```

**Linux:**
```bash
sudo apt-get install rabbitmq-server
sudo rabbitmq-plugins enable rabbitmq_management
```

### Instalar Dependências

```bash
# Instalar todas as dependências
npm run install:all
```

## 🎮 Como Executar

### 1. Iniciar RabbitMQ

Verifique se está rodando:
```powershell
# Acessar: http://localhost:15672
# User: guest | Pass: guest
```

### 2. Iniciar Microsserviços

```powershell
# Terminal 1 - User Service
npm run start:user

# Terminal 2 - List Service  
npm run start:list

# Terminal 3 - API Gateway (opcional)
npm run start:gateway
```

### 3. Iniciar Consumers RabbitMQ

**Opção A - Automático (recomendado):**
```powershell
.\start-all-consumers.ps1
```

**Opção B - Manual:**
```powershell
# Terminal 4 - Notification Consumer
npm run consumers:notification

# Terminal 5 - Analytics Consumer
npm run consumers:analytics
```

## 🧪 Testar o Sistema

### Teste Rápido de Checkout

```powershell
.\teste-checkout-rabbitmq.ps1
```

Ou manualmente:
```powershell
npm run test:checkout
```

### Teste Manual com cURL

```bash
# 1. Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@microservices.com","password":"admin123"}'

# 2. Checkout
curl -X POST http://localhost:3002/lists/{list-id}/checkout \
  -H "Authorization: Bearer {token}"
```

### Observar os Consumers

Após o checkout, observe nos terminais:
- **Notification Consumer**: Log de envio de email
- **Analytics Consumer**: Estatísticas atualizadas

## 📚 Documentação Detalhada

- **[RABBITMQ_SETUP.md](RABBITMQ_SETUP.md)** - Guia completo de configuração RabbitMQ
- **[GUIA_DEMONSTRACAO_RABBITMQ.md](GUIA_DEMONSTRACAO_RABBITMQ.md)** - Roteiro para demonstração em sala
- **[docs/Mensageria.md](docs/Mensageria.md)** - Especificação do exercício

## 🔧 Scripts Disponíveis

```json
npm run start:user          # Iniciar User Service
npm run start:list          # Iniciar List Service
npm run consumers           # Iniciar todos os consumers
npm run test:checkout       # Testar checkout com RabbitMQ
npm run install:all         # Instalar todas as dependências
npm run clean               # Limpar node_modules
```

## 🌐 Endpoints Principais

### User Service (3001)
- `POST /auth/login` - Autenticação
- `POST /auth/register` - Registro
- `POST /auth/validate` - Validar token

### List Service (3002)
- `GET /lists` - Listar listas do usuário
- `POST /lists` - Criar nova lista
- `GET /lists/:id` - Buscar lista específica
- `POST /lists/:id/checkout` - **Finalizar compra (RabbitMQ)** ⚡

## 📊 RabbitMQ Management

Acesse: http://localhost:15672

**Visualize:**
- **Exchanges**: `shopping_events`
- **Queues**: `notification_queue`, `analytics_queue`
- **Connections**: Consumers conectados
- **Message rates**: Taxa de mensagens

## 🎯 Funcionalidades RabbitMQ

### Producer (List Service)
- Publica eventos no exchange `shopping_events`
- Routing key: `list.checkout.completed`
- Resposta imediata: `202 Accepted`

### Consumer A (Notification)
- Queue: `notification_queue`
- Pattern: `list.checkout.#`
- Função: Enviar comprovantes e notificações

### Consumer B (Analytics)
- Queue: `analytics_queue`
- Pattern: `list.checkout.#`
- Função: Calcular estatísticas e dashboards

## 🔒 Segurança

- Autenticação via JWT
- Validação de tokens em cada requisição
- Isolamento de dados por usuário

## 🗃️ Banco de Dados

Sistema NoSQL baseado em JSON:
- `services/*/database/*.json` - Dados persistidos
- `services/*/database/*_index.json` - Índices

## 🐛 Troubleshooting

### RabbitMQ não conecta
```powershell
rabbitmqctl status
net start RabbitMQ
```

### Consumers não recebem mensagens
- Verificar se RabbitMQ está rodando
- Verificar se os consumers estão ativos
- Checar logs nos terminais

### Erro de autenticação
```bash
# Fazer login novamente
POST /auth/login
```

## 📝 Exercício Acadêmico

Este projeto implementa o exercício de **Mensageria com RabbitMQ** valendo 15 pontos.

**Critérios atendidos:**
- ✅ Producer publica em exchange topic
- ✅ Consumer A (Notification) processa eventos
- ✅ Consumer B (Analytics) processa eventos
- ✅ Resposta assíncrona (202 Accepted)
- ✅ Demonstração funcional

## 👨‍💻 Desenvolvimento

**Tecnologias:**
- Node.js
- Express.js
- RabbitMQ (AMQP)
- JSON Database (NoSQL)
- JWT Authentication

**Padrões:**
- Microsserviços
- Event-Driven Architecture
- Publisher/Subscriber
- Service Discovery
- API Gateway

## 📄 Licença

MIT License - PUC Minas 2025

---

**🎓 Disciplina:** Laboratório de Desenvolvimento de Aplicações Móveis e Distribuídas  
**🏫 Instituição:** PUC Minas  
**📅 Ano:** 2025
