# 🐇 RabbitMQ Consumers

Este diretório contém os workers/consumers que processam eventos assíncronos do sistema de listas de compras.

## 📦 Consumers Disponíveis

### 1. Notification Consumer
**Arquivo:** `notification-consumer.js`

**Função:** Processar eventos de checkout e simular envio de notificações/comprovantes

**Queue:** `notification_queue`

**Pattern:** `list.checkout.#`

**Saída Exemplo:**
```
📧 NOVO EVENTO DE CHECKOUT RECEBIDO
📤 Enviando comprovante da lista [ID] para o usuário [email]
✅ Notificação enviada com sucesso!
```

### 2. Analytics Consumer
**Arquivo:** `analytics-consumer.js`

**Função:** Calcular estatísticas e métricas de checkouts

**Queue:** `analytics_queue`

**Pattern:** `list.checkout.#`

**Saída Exemplo:**
```
📊 PROCESSANDO ANALYTICS DE CHECKOUT
📈 Dashboard Atualizado:
   • Total de Checkouts: 5
   • Receita Total: R$ 15000.00
   • Ticket Médio: R$ 3000.00
```

## 🚀 Como Executar

### Opção 1: Scripts PowerShell (Recomendado)
```powershell
# Iniciar ambos os consumers
..\start-all-consumers.ps1

# Ou individualmente
..\start-notification-consumer.ps1
..\start-analytics-consumer.ps1
```

### Opção 2: npm (da raiz do projeto)
```bash
# Notification Consumer
npm run consumers:notification

# Analytics Consumer
npm run consumers:analytics
```

### Opção 3: Manualmente
```bash
# Notification Consumer
node consumers/notification-consumer.js

# Analytics Consumer
node consumers/analytics-consumer.js
```

## 📋 Pré-requisitos

1. **RabbitMQ** instalado e rodando
2. **Dependências** instaladas: `npm install`

## 🔧 Configuração

### Variáveis de Ambiente

```bash
RABBITMQ_URL=amqp://localhost  # URL do RabbitMQ (padrão: localhost)
```

### Exchange e Queues

Os consumers criam automaticamente:

- **Exchange:** `shopping_events` (tipo: topic, durable)
- **Queues:**
  - `notification_queue` (durable)
  - `analytics_queue` (durable)
- **Bindings:** Ambas as queues vinculadas com pattern `list.checkout.#`

## 📊 Fluxo de Mensagens

```
List Service (Producer)
         ↓
    POST /lists/:id/checkout
         ↓
Publica evento no RabbitMQ
         ↓
Exchange: shopping_events
         ↓
    ┌────┴─────┐
    ↓          ↓
notification  analytics
   _queue      _queue
    ↓          ↓
Notification  Analytics
 Consumer      Consumer
```

## 🛠️ Características Técnicas

### Notification Consumer
- ✅ Conexão persistente com RabbitMQ
- ✅ Reconexão automática
- ✅ ACK manual de mensagens
- ✅ Prefetch = 1 (processa uma mensagem por vez)
- ✅ Formatação colorida de logs
- ✅ Tratamento de erros

### Analytics Consumer
- ✅ Mesmas características do Notification
- ✅ Estatísticas em memória
- ✅ Dashboard em tempo real
- ✅ Top 3 itens mais vendidos
- ✅ Relatório periódico (30s)

## 📝 Estrutura de Mensagens

Ambos os consumers recebem mensagens neste formato:

```json
{
  "eventType": "list.checkout.completed",
  "timestamp": "2025-11-23T10:30:00.000Z",
  "data": {
    "listId": "uuid",
    "listName": "Nome da Lista",
    "userId": "uuid",
    "userEmail": "user@example.com",
    "totalItems": 3,
    "totalAmount": "4500.00",
    "items": [
      {
        "itemId": "item-001",
        "itemName": "Produto X",
        "quantity": 2,
        "estimatedPrice": 1500.00
      }
    ]
  }
}
```

## 🔍 Monitoramento

### Ver Logs dos Consumers
Os logs são exibidos automaticamente no terminal onde o consumer está rodando.

### RabbitMQ Management
- URL: http://localhost:15672
- User: guest | Pass: guest

**O que verificar:**
- **Queues:** Ver se as filas existem e estão vazias (mensagens consumidas)
- **Connections:** Ver se os consumers estão conectados
- **Channels:** Verificar canais ativos

## 🐛 Troubleshooting

### Consumer não conecta ao RabbitMQ

**Problema:** `Error: connect ECONNREFUSED`

**Solução:**
```bash
# Verificar se RabbitMQ está rodando
rabbitmqctl status

# Reiniciar RabbitMQ
net stop RabbitMQ; net start RabbitMQ  # Windows
sudo systemctl restart rabbitmq-server  # Linux
```

### Mensagens não são recebidas

**Verificar:**
1. RabbitMQ está rodando?
2. List Service publicou alguma mensagem?
3. Consumer está conectado? (ver no Management)
4. Exchange e queues foram criados?

**Solução:**
```bash
# Listar queues
rabbitmqctl list_queues

# Ver mensagens na fila
rabbitmqctl list_queues name messages consumers
```

### Consumer trava/congela

**Solução:**
- Pressione `Ctrl+C` para encerrar
- Reinicie o consumer
- Verifique os logs de erro

## 📊 Estatísticas do Analytics Consumer

O Analytics Consumer mantém as seguintes estatísticas:

- **totalCheckouts**: Número total de checkouts processados
- **totalRevenue**: Receita total acumulada
- **totalItems**: Total de itens vendidos
- **averageTicket**: Ticket médio por checkout
- **checkoutsByUser**: Estatísticas por usuário
- **popularItems**: Itens mais vendidos

Para ver o relatório completo:
- Aguarde 30 segundos (exibição automática)
- Ou encerre com `Ctrl+C` (exibe relatório final)

## 🔒 Segurança

- Mensagens são **persistentes** (durable: true)
- ACK **manual** (garante processamento)
- Reconexão **automática** em caso de falha
- Queues **duráveis** (sobrevivem a restart)

## 📚 Dependências

```json
{
  "amqplib": "^0.10.3"  // Cliente RabbitMQ para Node.js
}
```

## 🎯 Próximos Passos

1. **Estender funcionalidades:**
   - Adicionar mais consumers (ex: Stock Consumer)
   - Integrar com serviços externos (email real, SMS)
   - Persistir analytics em banco de dados

2. **Melhorias:**
   - Dead Letter Queue (DLQ) para mensagens falhadas
   - Retry policy com backoff exponencial
   - Métricas e monitoramento (Prometheus)

3. **Produção:**
   - Configurar clusters RabbitMQ
   - Usar autenticação específica
   - Logs estruturados (JSON)

---

**🎉 Consumers prontos para processar eventos assíncronos!**
