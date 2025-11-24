# 🐇 Sistema de Mensageria com RabbitMQ

## 📋 Visão Geral

Este projeto implementa um sistema de mensageria assíncrona utilizando **RabbitMQ** para processar eventos de checkout de listas de compras. O sistema segue o padrão **Publisher/Subscriber** com exchanges do tipo **topic**.

### 🎯 Cenário de Negócio

Quando um usuário finaliza uma lista de compras através do endpoint `POST /lists/:id/checkout`, o sistema:

1. **Retorna imediatamente** com status `202 Accepted`
2. **Publica um evento** no RabbitMQ
3. **Processa assincronamente** através de consumers dedicados

Isso evita que operações pesadas (envio de email, cálculo de estatísticas, etc.) bloqueiem a resposta HTTP.

---

## 🏗️ Arquitetura

```
┌─────────────────┐
│   List Service  │  (Producer)
│   Port: 3002    │
└────────┬────────┘
         │ POST /lists/:id/checkout
         │ Publica evento
         ▼
┌─────────────────────────────────┐
│   RabbitMQ Exchange (Topic)     │
│   Name: shopping_events         │
│   Routing: list.checkout.*      │
└────┬────────────────────┬───────┘
     │                    │
     │                    │
     ▼                    ▼
┌─────────────┐    ┌──────────────┐
│ Notification│    │  Analytics   │
│  Consumer   │    │   Consumer   │
└─────────────┘    └──────────────┘
```

### 📦 Componentes

#### 1. **Producer (List Service)**
- **Arquivo**: `services/list-service/server.js`
- **Função**: Publica eventos quando uma lista é finalizada
- **Exchange**: `shopping_events` (topic)
- **Routing Key**: `list.checkout.completed`

#### 2. **Consumer A - Notification Service**
- **Arquivo**: `consumers/notification-consumer.js`
- **Função**: Envia notificações e comprovantes ao usuário
- **Queue**: `notification_queue`
- **Routing Pattern**: `list.checkout.#`

#### 3. **Consumer B - Analytics Service**
- **Arquivo**: `consumers/analytics-consumer.js`
- **Função**: Calcula estatísticas e atualiza dashboards
- **Queue**: `analytics_queue`
- **Routing Pattern**: `list.checkout.#`

---

## 🚀 Instalação e Configuração

### 1️⃣ Pré-requisitos

- **Node.js** >= 16.0.0
- **RabbitMQ** instalado e rodando

#### Instalação do RabbitMQ

**Windows (com Chocolatey):**
```powershell
choco install rabbitmq
```

**Windows (manual):**
1. Instale o [Erlang](https://www.erlang.org/downloads)
2. Instale o [RabbitMQ](https://www.rabbitmq.com/install-windows.html)
3. Inicie o serviço RabbitMQ

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install rabbitmq-server
sudo systemctl start rabbitmq-server
sudo systemctl enable rabbitmq-server
```

**macOS:**
```bash
brew install rabbitmq
brew services start rabbitmq
```

#### Habilitar RabbitMQ Management Plugin

```bash
rabbitmq-plugins enable rabbitmq_management
```

Acesse: http://localhost:15672
- **Usuário**: guest
- **Senha**: guest

### 2️⃣ Instalação das Dependências

```powershell
# Instalar dependência no List Service
cd services/list-service
npm install amqplib

# Instalar dependência nos Consumers (raiz do projeto)
cd ../..
npm install amqplib
```

---

## 🎮 Como Executar

### Opção 1: Executar Tudo Automaticamente

```powershell
# Inicia ambos os consumers em janelas separadas
.\start-all-consumers.ps1
```

### Opção 2: Executar Individualmente

**Terminal 1 - Notification Consumer:**
```powershell
.\start-notification-consumer.ps1
```

**Terminal 2 - Analytics Consumer:**
```powershell
.\start-analytics-consumer.ps1
```

**Terminal 3 - List Service:**
```powershell
cd services/list-service
npm start
```

### Opção 3: Executar Manualmente

```powershell
# Consumer de Notificações
node consumers/notification-consumer.js

# Consumer de Analytics (em outro terminal)
node consumers/analytics-consumer.js

# List Service (em outro terminal)
cd services/list-service
node server.js
```

---

## 🧪 Testando o Sistema

### 1. Autenticar e Obter Token

```bash
POST http://localhost:3001/auth/login
Content-Type: application/json

{
  "identifier": "admin@microservices.com",
  "password": "admin123"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "token": "seu-token-aqui"
  }
}
```

### 2. Criar uma Lista (opcional)

```bash
POST http://localhost:3002/lists
Authorization: Bearer seu-token-aqui
Content-Type: application/json

{
  "name": "Lista de Teste RabbitMQ",
  "description": "Teste de mensageria",
  "items": [
    {
      "itemId": "item-001",
      "itemName": "Produto A",
      "quantity": 2,
      "estimatedPrice": 10.50
    },
    {
      "itemId": "item-002",
      "itemName": "Produto B",
      "quantity": 1,
      "estimatedPrice": 25.00
    }
  ]
}
```

### 3. Realizar Checkout (Dispara Evento RabbitMQ)

```bash
POST http://localhost:3002/lists/{list-id}/checkout
Authorization: Bearer seu-token-aqui
```

**Resposta Imediata (202 Accepted):**
```json
{
  "success": true,
  "message": "Checkout iniciado - processamento assíncrono em andamento",
  "data": {
    "listId": "uuid-da-lista",
    "totalAmount": "46.00",
    "status": "processing"
  }
}
```

### 4. Observar os Consumers

**Notification Consumer - Output:**
```
📧 ========================================
📧 NOVO EVENTO DE CHECKOUT RECEBIDO
📧 ========================================

📤 Enviando comprovante da lista [uuid] para o usuário [admin@microservices.com]

📋 Detalhes da Compra:
   • Lista: Lista de Teste RabbitMQ
   • Total de itens: 2
   • Valor total: R$ 46.00
   • Data: 2025-11-23T...

📦 Itens comprados:
   1. Produto A - 2x R$ 10.5
   2. Produto B - 1x R$ 25

✅ Notificação enviada com sucesso!
========================================
```

**Analytics Consumer - Output:**
```
📊 ========================================
📊 PROCESSANDO ANALYTICS DE CHECKOUT
📊 ========================================

📈 Dashboard Atualizado:
   • Total de Checkouts: 1
   • Receita Total: R$ 46.00
   • Total de Itens Vendidos: 2
   • Ticket Médio: R$ 46.00

💰 Checkout Atual:
   • Lista: Lista de Teste RabbitMQ
   • Usuário: admin@microservices.com
   • Valor: R$ 46.00
   • Itens: 2

🏆 Top 3 Itens Mais Vendidos:
   1. Produto A - 2 unidades (1 compras)
   2. Produto B - 1 unidades (1 compras)

✅ Analytics processado com sucesso!
========================================
```

---

## 🔍 Verificação no RabbitMQ Management

1. Acesse: http://localhost:15672
2. Login: **guest** / **guest**
3. Vá em **Exchanges** → Veja `shopping_events`
4. Vá em **Queues** → Veja `notification_queue` e `analytics_queue`
5. Vá em **Connections** → Veja os consumers conectados

### Métricas Importantes

- **Message rate**: Gráfico de mensagens publicadas/consumidas
- **Consumers**: Número de consumers conectados
- **Messages**: Total de mensagens na fila (deve ser 0 após processamento)

---

## 📊 Demonstração em Sala de Aula

### Roteiro de Apresentação

1. **Setup Inicial (2 min)**
   - Mostrar RabbitMQ Management vazio
   - Iniciar consumers e mostrar conexão estabelecida

2. **Execução do Teste (3 min)**
   - Fazer requisição de checkout
   - Mostrar resposta **202 Accepted** instantânea
   - Mostrar logs nos terminais dos consumers

3. **Evidências no RabbitMQ (2 min)**
   - Mostrar exchange `shopping_events`
   - Mostrar filas criadas e bindings
   - Mostrar gráfico de mensagens processadas
   - Mostrar que as mensagens foram consumidas (ack)

4. **Múltiplos Checkouts (opcional)**
   - Fazer 3-5 checkouts seguidos
   - Mostrar processamento em paralelo
   - Mostrar analytics atualizando em tempo real

---

## 🎯 Requisitos Atendidos

✅ **Producer (List Service)**: Publica evento em `shopping_events` com routing key `list.checkout.completed`

✅ **Consumer A (Notification)**: Escuta fila vinculada a `list.checkout.#` e loga notificação

✅ **Consumer B (Analytics)**: Escuta mesma mensagem e calcula estatísticas

✅ **Resposta Assíncrona**: Endpoint retorna `202 Accepted` imediatamente

✅ **Exchange Topic**: Utiliza exchange do tipo `topic` para roteamento flexível

✅ **Mensagens Persistentes**: Configurado `durable: true` e `persistent: true`

---

## 🛠️ Troubleshooting

### RabbitMQ não está rodando
```powershell
# Verificar status
rabbitmqctl status

# Iniciar serviço (Windows)
net start RabbitMQ

# Iniciar serviço (Linux)
sudo systemctl start rabbitmq-server
```

### Consumers não conectam
- Verifique se RabbitMQ está em `localhost:5672`
- Verifique firewall/antivírus
- Confirme que o serviço está rodando

### Mensagens não são consumidas
- Verifique se os consumers estão rodando
- Verifique logs de erro nos terminais
- Veja a fila no RabbitMQ Management

### Porta 15672 não acessível
```bash
# Habilitar management plugin
rabbitmq-plugins enable rabbitmq_management

# Reiniciar RabbitMQ
```

---

## 📚 Referências

- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [AMQP 0-9-1 Model](https://www.rabbitmq.com/tutorials/amqp-concepts.html)
- [Topic Exchange](https://www.rabbitmq.com/tutorials/tutorial-five-javascript.html)
- [Node.js amqplib](https://amqp-node.github.io/amqplib/)

---

## 👨‍💻 Autor

**Sistema de Lista de Compras com Microsserviços**  
Disciplina: Laboratório de Desenvolvimento de Aplicações Móveis e Distribuídas  
PUC Minas - 2025

---

## 📝 Pontuação

Este exercício vale **15 pontos** e implementa:

- ✅ Mensageria assíncrona com RabbitMQ
- ✅ Pattern Publisher/Subscriber
- ✅ Exchange do tipo Topic
- ✅ Múltiplos consumers processando a mesma mensagem
- ✅ Processamento desacoplado e resiliente
- ✅ Documentação completa e scripts de automação

---

**🎉 Pronto para demonstração!**
