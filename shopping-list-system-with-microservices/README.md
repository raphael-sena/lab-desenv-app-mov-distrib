# 🛒 Sistema de Lista de Compras com Microsserviços + RabbitMQ

Sistema de lista de compras implementado com arquitetura de microsserviços e mensageria assíncrona usando RabbitMQ.

**Laboratório:** Desenvolvimento de Aplicações Móveis e Distribuídas  
**Instituição:** PUC Minas - 2025/2

---

## 📁 Estrutura do Projeto

```
shopping-list-system-with-microservices/
├── api-gateway/          # Gateway de API (porta 3000)
├── services/             # Microsserviços
│   ├── user-service/     # Serviço de usuários (porta 3001)
│   ├── list-service/     # Serviço de listas (porta 3002) + Producer RabbitMQ
│   ├── product-service/  # Serviço de produtos (porta 3003)
│   └── item-service/     # Serviço de itens (porta 3004)
├── consumers/            # Consumers RabbitMQ
│   ├── notification-consumer.js  # Consumer A - Notificações
│   └── analytics-consumer.js     # Consumer B - Analytics
├── shared/               # Código compartilhado
│   ├── JsonDatabase.js   # Banco NoSQL customizado
│   └── serviceRegistry.js # Service Discovery
├── scripts/              # Scripts PowerShell de automação
├── tests/                # Scripts de teste e requisições HTTP
├── documentation/        # Documentação completa do projeto
└── docs/                 # Especificações originais dos roteiros
```

---

## 🚀 Início Rápido

### 1. **Instalação de Dependências**

```bash
npm install
cd services/user-service && npm install && cd ../..
cd services/list-service && npm install && cd ../..
```

### 2. **Instalar RabbitMQ**

Ver guia completo: [`documentation/INSTALACAO_RABBITMQ.md`](documentation/INSTALACAO_RABBITMQ.md)

**Opção rápida (Docker):**
```bash
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

### 3. **Executar o Sistema**

```powershell
# Terminal 1: User Service
cd services/user-service
npm start

# Terminal 2: List Service
cd services/list-service
npm start

# Terminal 3: Consumers RabbitMQ
.\scripts\start-all-consumers.ps1

# Terminal 4: Teste automatizado
.\scripts\teste-checkout-rabbitmq.ps1
```

---

## 📖 Documentação

### 🎯 Documentos Principais

| Documento | Descrição |
|-----------|-----------|
| **[INDICE_DOCUMENTACAO.md](documentation/INDICE_DOCUMENTACAO.md)** | 📑 Índice completo de toda documentação |
| **[INSTALACAO_RABBITMQ.md](documentation/INSTALACAO_RABBITMQ.md)** | 🔧 Instalação do RabbitMQ (Windows/Linux/macOS) |
| **[RABBITMQ_SETUP.md](documentation/RABBITMQ_SETUP.md)** | ⚙️ Setup e arquitetura do sistema de mensageria |
| **[GUIA_DEMONSTRACAO_RABBITMQ.md](documentation/GUIA_DEMONSTRACAO_RABBITMQ.md)** | 🎓 Roteiro de demonstração (7 min) |
| **[RESUMO_IMPLEMENTACAO.md](documentation/RESUMO_IMPLEMENTACAO.md)** | ✅ Lista de arquivos criados/modificados |

### 🧪 Testes e Exemplos

| Arquivo | Descrição |
|---------|-----------|
| **[tests/api-requests.http](tests/api-requests.http)** | REST Client (VS Code) - testes interativos |
| **[tests/test-checkout-rabbitmq.js](tests/test-checkout-rabbitmq.js)** | Teste automatizado de checkout |
| **[documentation/EXEMPLOS_REQUISICOES.md](documentation/EXEMPLOS_REQUISICOES.md)** | Exemplos de requisições HTTP e cURL |

---

## 🏗️ Arquitetura RabbitMQ

```
┌─────────────────┐
│  List Service   │ (Producer)
│   Porta 3002    │
└────────┬────────┘
         │ Publica evento: list.checkout.completed
         ▼
┌─────────────────────────┐
│  RabbitMQ Exchange      │
│  shopping_events (topic)│
└────────┬────────────────┘
         │
         ├──────────────────┬──────────────────┐
         ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────┐
│ notification_    │ │ analytics_   │ │  (futuro)    │
│ queue            │ │ queue        │ │              │
└────────┬─────────┘ └──────┬───────┘ └──────────────┘
         │                  │
         ▼                  ▼
┌──────────────────┐ ┌──────────────┐
│ Notification     │ │ Analytics    │
│ Consumer         │ │ Consumer     │
│ (emails)         │ │ (estatísticas│
└──────────────────┘ └──────────────┘
```

**Fluxo:**
1. Cliente faz POST `/lists/:id/checkout` no List Service
2. List Service retorna **202 Accepted** (processamento assíncrono)
3. List Service publica evento no RabbitMQ
4. Consumers processam a mensagem independentemente
5. Notification Consumer simula envio de email
6. Analytics Consumer calcula estatísticas

---

## 🛠️ Scripts Disponíveis

### PowerShell (pasta `scripts/`)

| Script | Descrição |
|--------|-----------|
| `start-all-consumers.ps1` | Inicia ambos consumers em janelas separadas |
| `start-notification-consumer.ps1` | Inicia apenas Notification Consumer |
| `start-analytics-consumer.ps1` | Inicia apenas Analytics Consumer |
| `teste-checkout-rabbitmq.ps1` | Teste completo do sistema com validações |
| `inicializar-itens.ps1` | Inicializa itens de teste (legado) |

### JavaScript (pasta `tests/`)

| Script | Descrição |
|--------|-----------|
| `test-checkout-rabbitmq.js` | Teste automatizado de checkout |
| `client-demo.js` | Cliente demo completo |
| `demo-client-complete.js` | Cliente demo com todas funcionalidades |
| `quick-test.js` | Teste rápido de conectividade |

---

## 🔗 Endpoints Principais

### User Service (porta 3001)
- `POST /auth/register` - Registrar usuário
- `POST /auth/login` - Login (retorna JWT)
- `GET /users/:id` - Buscar usuário
- `GET /health` - Health check

### List Service (porta 3002)
- `POST /lists` - Criar lista
- `GET /lists` - Listar todas
- `GET /lists/:id` - Buscar lista
- `POST /lists/:id/checkout` - **Checkout (RabbitMQ)** 🆕
- `GET /health` - Health check

### Credenciais de Teste
- **Admin:** `admin@microservices.com` / `admin123`

---

## 📊 RabbitMQ Management

Acesse a interface de gerenciamento:
- **URL:** http://localhost:15672
- **Usuário:** guest
- **Senha:** guest

**Visualize:**
- Exchanges criados (`shopping_events`)
- Queues e mensagens (`notification_queue`, `analytics_queue`)
- Mensagens processadas em tempo real

---

## ✅ Requisitos Implementados

- [x] Producer (List Service) publica eventos de checkout
- [x] Consumer A (Notification) - simula envio de emails
- [x] Consumer B (Analytics) - calcula estatísticas
- [x] Topic Exchange (`shopping_events`)
- [x] Queues duráveis com ACK manual
- [x] Processamento assíncrono (202 Accepted)
- [x] Documentação completa
- [x] Scripts de automação
- [x] Testes automatizados
- [x] Tratamento de erros e logs

**Pontuação:** 15 pontos (exercício completo)

---

## 🐛 Troubleshooting

### RabbitMQ não conecta
```bash
# Verificar se RabbitMQ está rodando
rabbitmqctl status

# Ou acessar Management UI
start http://localhost:15672
```

### Credenciais inválidas
Certifique-se de usar:
- **Campo:** `identifier` (não `email`)
- **Valor:** `admin@microservices.com`

### Consumer não recebe mensagens
1. Verifique se RabbitMQ está rodando
2. Reinicie os consumers (`.\scripts\start-all-consumers.ps1`)
3. Verifique logs no terminal dos consumers

---

## 📚 Referências

- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [AMQP Node.js Client](https://amqp-node.github.io/amqplib/)
- [Mensageria.md - Especificação Original](docs/Mensageria.md)

---

## 👨‍💻 Desenvolvimento

**Tecnologias:**
- Node.js 16+
- Express.js
- RabbitMQ (AMQP)
- amqplib
- bcryptjs (autenticação)
- JWT (tokens)
- NoSQL customizado (JSON)

**Padrões:**
- Microsserviços
- Mensageria Assíncrona
- Publisher/Subscriber
- Service Discovery
- API Gateway

---

## 📄 Licença

Projeto acadêmico - PUC Minas 2025/2

---

**🎯 Para começar rapidamente, siga o [INDICE_DOCUMENTACAO.md](documentation/INDICE_DOCUMENTACAO.md)**
