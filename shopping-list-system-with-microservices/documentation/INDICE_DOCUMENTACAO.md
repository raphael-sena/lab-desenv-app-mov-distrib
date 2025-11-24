# 📖 Índice da Documentação - Sistema RabbitMQ

## 🎯 Início Rápido

Para começar rapidamente, siga esta ordem:

1. **[INSTALACAO_RABBITMQ.md](INSTALACAO_RABBITMQ.md)** - Instalar RabbitMQ
2. **[RABBITMQ_SETUP.md](RABBITMQ_SETUP.md)** - Configurar e executar o sistema
3. **[GUIA_DEMONSTRACAO_RABBITMQ.md](GUIA_DEMONSTRACAO_RABBITMQ.md)** - Roteiro de apresentação

---

## 📚 Documentação Completa

### 🚀 Instalação e Configuração

| Documento | Descrição | Quando Usar |
|-----------|-----------|-------------|
| **[INSTALACAO_RABBITMQ.md](INSTALACAO_RABBITMQ.md)** | Guia de instalação do RabbitMQ (Windows/Linux/macOS) | Primeira vez instalando RabbitMQ |
| **[RABBITMQ_SETUP.md](RABBITMQ_SETUP.md)** | Configuração completa do sistema de mensageria | Entender a arquitetura e executar |
| **[README_RABBITMQ.md](README_RABBITMQ.md)** | README geral do projeto atualizado | Visão geral do projeto completo |

### 🎓 Demonstração e Testes

| Documento | Descrição | Quando Usar |
|-----------|-----------|-------------|
| **[GUIA_DEMONSTRACAO_RABBITMQ.md](GUIA_DEMONSTRACAO_RABBITMQ.md)** | Roteiro detalhado para apresentação (7 min) | Antes da demonstração em sala |
| **[EXEMPLOS_REQUISICOES.md](EXEMPLOS_REQUISICOES.md)** | Exemplos de requisições HTTP e cURL | Testar manualmente o sistema |
| **[api-requests.http](api-requests.http)** | Arquivo REST Client (VS Code) | Testar com a extensão REST Client |

### 📋 Resumo e Referência

| Documento | Descrição | Quando Usar |
|-----------|-----------|-------------|
| **[RESUMO_IMPLEMENTACAO.md](RESUMO_IMPLEMENTACAO.md)** | Lista de todos os arquivos criados/modificados | Verificar o que foi implementado |
| **[docs/Mensageria.md](docs/Mensageria.md)** | Especificação original do exercício | Ver os requisitos originais |

---

## 🗂️ Estrutura de Arquivos

### Arquivos de Código

```
├── consumers/
│   ├── notification-consumer.js    # Consumer A - Notificações
│   ├── analytics-consumer.js       # Consumer B - Analytics
│   └── package.json                # Dependências
│
├── services/
│   └── list-service/
│       ├── server.js                # ✅ Modificado - Producer RabbitMQ
│       └── package.json             # ✅ Modificado - Dependência amqplib
│
└── test-checkout-rabbitmq.js       # Script de teste automatizado
```

### Scripts PowerShell

```
├── start-notification-consumer.ps1  # Inicia Notification Consumer
├── start-analytics-consumer.ps1     # Inicia Analytics Consumer
├── start-all-consumers.ps1          # Inicia ambos os consumers
└── teste-checkout-rabbitmq.ps1      # Teste completo do sistema
```

### Documentação

```
├── INSTALACAO_RABBITMQ.md           # Instalação do RabbitMQ
├── RABBITMQ_SETUP.md                # Setup e configuração
├── GUIA_DEMONSTRACAO_RABBITMQ.md    # Roteiro de demonstração
├── README_RABBITMQ.md               # README principal
├── EXEMPLOS_REQUISICOES.md          # Exemplos de requisições
├── RESUMO_IMPLEMENTACAO.md          # Resumo da implementação
├── INDICE_DOCUMENTACAO.md           # Este arquivo
└── api-requests.http                # Requisições REST Client
```

---

## 🎯 Cenários de Uso

### "Nunca usei RabbitMQ"
1. Ler: [INSTALACAO_RABBITMQ.md](INSTALACAO_RABBITMQ.md)
2. Ler: [RABBITMQ_SETUP.md](RABBITMQ_SETUP.md) - Seção "Instalação e Configuração"
3. Executar os comandos de instalação
4. Testar com: `teste-checkout-rabbitmq.ps1`

### "Preciso apresentar em sala de aula"
1. Ler: [GUIA_DEMONSTRACAO_RABBITMQ.md](GUIA_DEMONSTRACAO_RABBITMQ.md)
2. Praticar o roteiro (7 minutos)
3. Preparar os terminais conforme o guia
4. Revisar as perguntas esperadas

### "Quero entender o código"
1. Ler: [RABBITMQ_SETUP.md](RABBITMQ_SETUP.md) - Seção "Arquitetura"
2. Ler: [RESUMO_IMPLEMENTACAO.md](RESUMO_IMPLEMENTACAO.md)
3. Examinar: `services/list-service/server.js` (Producer)
4. Examinar: `consumers/notification-consumer.js` (Consumer A)
5. Examinar: `consumers/analytics-consumer.js` (Consumer B)

### "Quero testar o sistema"
1. Iniciar RabbitMQ
2. Iniciar serviços (User + List)
3. Executar: `.\start-all-consumers.ps1`
4. Executar: `.\teste-checkout-rabbitmq.ps1`
5. Ou usar: [api-requests.http](api-requests.http)

### "Preciso verificar os requisitos"
1. Ler: [docs/Mensageria.md](docs/Mensageria.md) - Especificação original
2. Ler: [RESUMO_IMPLEMENTACAO.md](RESUMO_IMPLEMENTACAO.md) - Seção "Requisitos do Exercício"
3. Verificar checklist de implementação

---

## 📊 Mapa Mental da Documentação

```
Sistema RabbitMQ
│
├── 🏁 Começar
│   ├── INSTALACAO_RABBITMQ.md
│   ├── RABBITMQ_SETUP.md
│   └── teste-checkout-rabbitmq.ps1
│
├── 🎓 Apresentar
│   ├── GUIA_DEMONSTRACAO_RABBITMQ.md
│   └── EXEMPLOS_REQUISICOES.md
│
├── 💻 Desenvolver
│   ├── services/list-service/server.js
│   ├── consumers/notification-consumer.js
│   └── consumers/analytics-consumer.js
│
└── 📚 Referência
    ├── RESUMO_IMPLEMENTACAO.md
    ├── README_RABBITMQ.md
    └── docs/Mensageria.md
```

---

## ⚡ Comandos Rápidos

### Instalação Completa
```powershell
# 1. Instalar RabbitMQ (Windows)
choco install rabbitmq -y

# 2. Habilitar Management
rabbitmq-plugins enable rabbitmq_management

# 3. Instalar dependências
cd services/list-service
npm install
cd ../..
npm install
```

### Executar Sistema Completo
```powershell
# Terminal 1
cd services/user-service; npm start

# Terminal 2
cd services/list-service; npm start

# Terminal 3
.\start-all-consumers.ps1

# Terminal 4
.\teste-checkout-rabbitmq.ps1
```

### Verificar Sistema
```powershell
# RabbitMQ Management
start http://localhost:15672

# Health Checks
curl http://localhost:3001/health  # User Service
curl http://localhost:3002/health  # List Service

# Status RabbitMQ
rabbitmqctl status
```

---

## 🔗 Links Rápidos

- **RabbitMQ Management**: http://localhost:15672 (guest/guest)
- **User Service**: http://localhost:3001
- **List Service**: http://localhost:3002
- **RabbitMQ Docs**: https://www.rabbitmq.com/documentation.html
- **AMQP Node.js**: https://amqp-node.github.io/amqplib/

---

## 📞 Ajuda Rápida

### Erro: "RabbitMQ não conecta"
→ Ver: [INSTALACAO_RABBITMQ.md](INSTALACAO_RABBITMQ.md#-troubleshooting)

### Erro: "Consumer não recebe mensagens"
→ Ver: [RABBITMQ_SETUP.md](RABBITMQ_SETUP.md#-troubleshooting)

### Dúvida: "Como funciona o fluxo?"
→ Ver: [RABBITMQ_SETUP.md](RABBITMQ_SETUP.md#-arquitetura)

### Dúvida: "Quais arquivos foram modificados?"
→ Ver: [RESUMO_IMPLEMENTACAO.md](RESUMO_IMPLEMENTACAO.md#-arquivos-modificados)

---

## ✅ Checklist de Documentação

- [x] Guia de instalação do RabbitMQ
- [x] Guia de configuração e uso
- [x] Roteiro de demonstração
- [x] Exemplos de requisições
- [x] Resumo da implementação
- [x] README atualizado
- [x] Scripts de automação
- [x] Arquivo REST Client
- [x] Índice de navegação
- [x] Documentação completa

---

**📖 Navegação facilitada! Escolha o documento adequado ao seu objetivo.**

---

_Sistema de Lista de Compras com Microsserviços_  
_Lab. Desenv. App. Móveis e Distribuídas - PUC Minas 2025_
