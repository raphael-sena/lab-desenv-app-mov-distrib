# 🎬 Guia de Demonstração - RabbitMQ em Sala de Aula

## ⏱️ Tempo Total: 7 minutos

---

## 📋 Checklist Pré-Demonstração

- [ ] RabbitMQ instalado e rodando
- [ ] Dependências instaladas (`npm install amqplib` nos serviços)
- [ ] User Service rodando (porta 3001)
- [ ] List Service rodando (porta 3002)
- [ ] RabbitMQ Management acessível (http://localhost:15672)

---

## 🎯 Roteiro de Demonstração

### 1️⃣ SETUP INICIAL (2 minutos)

**O que mostrar:**

1. **Abrir RabbitMQ Management** (http://localhost:15672)
   - Login: guest/guest
   - Mostrar que está zerado (sem queues, sem exchanges customizados)
   - Deixar a aba aberta para voltar depois

2. **Iniciar os Consumers**
   ```powershell
   .\start-all-consumers.ps1
   ```
   - Mostrar que 2 janelas são abertas automaticamente
   - **Notification Consumer**: mostra "Aguardando mensagens..."
   - **Analytics Consumer**: mostra "Aguardando mensagens..."
   - Organizar as janelas lado a lado na tela

3. **Posicionar Terminais**
   ```
   ┌─────────────────┬─────────────────┐
   │   Notification  │    Analytics    │
   │    Consumer     │     Consumer    │
   ├─────────────────┴─────────────────┤
   │      Terminal de Teste            │
   └───────────────────────────────────┘
   ```

**Dica:** Use Windows + Setas para organizar as janelas rapidamente

---

### 2️⃣ EXECUTAR TESTE (3 minutos)

**Abrir novo terminal e executar:**

```powershell
.\teste-checkout-rabbitmq.ps1
```

**O que mostrar durante a execução:**

1. **Verificação de Pré-requisitos** (5 segundos)
   - ✅ Node.js OK
   - ✅ RabbitMQ OK
   - ✅ User Service OK
   - ✅ List Service OK

2. **Execução do Checkout** (2 segundos)
   - Mostrar que a API retorna **202 Accepted** IMEDIATAMENTE
   - Tempo de resposta: ~50-100ms (muito rápido!)
   - Destacar: "Processamento assíncrono em andamento"

3. **Observar os Consumers reagindo**
   
   **Notification Consumer (janela 1):**
   ```
   📧 ========================================
   📧 NOVO EVENTO DE CHECKOUT RECEBIDO
   📧 ========================================
   
   📤 Enviando comprovante da lista [ID] para [email]
   
   📋 Detalhes da Compra:
      • Lista: Lista de Teste RabbitMQ
      • Total de itens: 3
      • Valor total: R$ 4450.00
   
   📦 Itens comprados:
      1. Notebook Dell - 1x R$ 3500.00
      2. Mouse Logitech - 2x R$ 250.00
      3. Teclado Mecânico - 1x R$ 450.00
   
   ✅ Notificação enviada com sucesso!
   ```

   **Analytics Consumer (janela 2):**
   ```
   📊 ========================================
   📊 PROCESSANDO ANALYTICS DE CHECKOUT
   📊 ========================================
   
   📈 Dashboard Atualizado:
      • Total de Checkouts: 1
      • Receita Total: R$ 4450.00
      • Total de Itens Vendidos: 3
      • Ticket Médio: R$ 4450.00
   
   🏆 Top 3 Itens Mais Vendidos:
      1. Mouse Logitech - 2 unidades
      2. Notebook Dell - 1 unidade
      3. Teclado Mecânico - 1 unidade
   
   ✅ Analytics processado com sucesso!
   ```

**Enfatizar:**
- As mensagens aparecem INSTANTANEAMENTE após o checkout
- Cada consumer processa a mesma mensagem de forma independente
- O processamento é assíncrono (não bloqueia a API)

---

### 3️⃣ EVIDÊNCIAS NO RABBITMQ (2 minutos)

**Voltar ao RabbitMQ Management (http://localhost:15672)**

1. **Aba "Exchanges"**
   - Mostrar `shopping_events` (tipo: topic)
   - Destacar que foi criado automaticamente
   - Mostrar que tem mensagens publicadas (gráfico)

2. **Aba "Queues"**
   - Mostrar `notification_queue`
   - Mostrar `analytics_queue`
   - Destacar que ambas estão vazias (mensagens já foram consumidas)
   - Mostrar "Ready: 0" e "Unacked: 0"

3. **Aba "Queues" → Clicar em uma queue**
   - Mostrar "Bindings" (vinculadas ao exchange `shopping_events`)
   - Mostrar "Routing key pattern: list.checkout.#"
   - Mostrar gráfico de mensagens (pico no momento do checkout)

4. **Aba "Overview" (opcional)**
   - Mostrar gráfico de mensagens no tempo
   - Mostrar "Message rates" (pico de atividade)

**Destacar:**
- ✅ Mensagens foram publicadas
- ✅ Mensagens foram consumidas
- ✅ ACK foi enviado (confirmação de processamento)
- ✅ Queues estão vazias (tudo processado)

---

### 4️⃣ DEMONSTRAÇÃO BÔNUS (Opcional - se houver tempo)

**Múltiplos Checkouts:**

Execute o teste 3-5 vezes seguidas:
```powershell
# No terminal de teste
node test-checkout-rabbitmq.js
# Aguardar 2s e repetir
node test-checkout-rabbitmq.js
# Repetir mais vezes
```

**O que mostrar:**
- Analytics acumulando estatísticas
- Ticket médio sendo calculado
- Top itens atualizando
- RabbitMQ processando múltiplas mensagens rapidamente

---

## 💡 Pontos-Chave a Enfatizar

### ✅ Requisitos Atendidos

1. **Producer** ✓
   - List Service publica eventos no exchange `shopping_events`
   - Routing key: `list.checkout.completed`

2. **Consumer A (Notification)** ✓
   - Escuta fila vinculada a `list.checkout.#`
   - Loga envio de comprovante ao usuário

3. **Consumer B (Analytics)** ✓
   - Escuta mesma mensagem
   - Calcula estatísticas e atualiza dashboard

4. **Resposta Assíncrona** ✓
   - API retorna `202 Accepted` imediatamente
   - Processamento acontece em background

5. **Exchange Topic** ✓
   - Utiliza exchange do tipo topic
   - Permite roteamento flexível com patterns

### 🎯 Benefícios da Arquitetura

- **Desacoplamento**: Serviços não dependem uns dos outros
- **Escalabilidade**: Pode-se adicionar mais consumers facilmente
- **Resiliência**: Se um consumer falha, outros continuam
- **Performance**: Resposta HTTP instantânea (não bloqueia)
- **Flexibilidade**: Múltiplos consumers processam o mesmo evento

---

## 🔧 Solução de Problemas Durante a Demo

### Problema: RabbitMQ não conecta
**Solução:**
```powershell
# Verificar status
rabbitmqctl status

# Reiniciar serviço
net stop RabbitMQ
net start RabbitMQ
```

### Problema: Consumers não recebem mensagens
**Solução:**
- Verificar se os consumers estão rodando (janelas abertas)
- Verificar no RabbitMQ Management se há consumers conectados
- Restartar os consumers

### Problema: List Service não publica
**Solução:**
- Verificar logs do List Service
- Confirmar que o checkout foi feito com token válido
- Verificar se a lista existe

---

## 📝 Checklist Pós-Demonstração

- [ ] Todos os componentes funcionaram
- [ ] Mensagens foram consumidas
- [ ] RabbitMQ Management mostrou evidências
- [ ] Logs dos consumers estão claros
- [ ] Tempo de resposta foi rápido (< 100ms)

---

## 🎓 Perguntas Esperadas

**Q: Por que usar RabbitMQ em vez de HTTP direto?**
**A:** Desacoplamento, processamento assíncrono, resiliência, e melhor performance (resposta imediata).

**Q: O que acontece se um consumer estiver offline?**
**A:** As mensagens ficam na fila e são processadas quando o consumer voltar (desde que a fila seja durável).

**Q: Pode ter mais de 2 consumers?**
**A:** Sim! Pode adicionar quantos consumers quiser. Cada um processa a mesma mensagem de forma independente.

**Q: Como garantir que a mensagem não foi perdida?**
**A:** Configurando queues e mensagens como `durable: true` e `persistent: true`, além de usar ACK manual.

**Q: Qual a diferença entre exchange direct, topic e fanout?**
**A:** 
- **Direct**: Routing key exata
- **Topic**: Pattern matching com wildcards (#, *)
- **Fanout**: Broadcast para todas as queues

---

**🎉 Boa demonstração! 15 pontos garantidos! 🎉**
