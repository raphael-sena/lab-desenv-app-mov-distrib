# 🐇 Guia de Instalação do RabbitMQ

## 📋 Visão Geral

Este guia fornece instruções detalhadas para instalar e configurar o RabbitMQ no Windows, Linux e macOS.

---

## 🪟 Windows

### Opção 1: Instalação com Chocolatey (Recomendado)

**1. Instalar Chocolatey (se ainda não tiver)**
```powershell
# Executar como Administrador
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

**2. Instalar RabbitMQ**
```powershell
# Executar como Administrador
choco install rabbitmq -y
```

**3. Habilitar Management Plugin**
```powershell
# Executar como Administrador
cd "C:\Program Files\RabbitMQ Server\rabbitmq_server-X.X.X\sbin"
.\rabbitmq-plugins.bat enable rabbitmq_management
```

**4. Reiniciar Serviço**
```powershell
# Executar como Administrador
net stop RabbitMQ
net start RabbitMQ
```

### Opção 2: Instalação Manual

**1. Instalar Erlang**
- Download: https://www.erlang.org/downloads
- Executar o instalador
- Adicionar ao PATH: `C:\Program Files\erl-X.X\bin`

**2. Instalar RabbitMQ**
- Download: https://www.rabbitmq.com/install-windows.html
- Executar o instalador
- Aceitar as configurações padrão

**3. Configurar Variável de Ambiente**
```powershell
$env:PATH += ";C:\Program Files\RabbitMQ Server\rabbitmq_server-X.X.X\sbin"
```

**4. Habilitar Management**
```powershell
cd "C:\Program Files\RabbitMQ Server\rabbitmq_server-X.X.X\sbin"
.\rabbitmq-plugins enable rabbitmq_management
```

**5. Iniciar Serviço**
- Abrir "Serviços" (services.msc)
- Procurar "RabbitMQ"
- Clicar com direito → Iniciar

### Opção 3: Docker (Windows/WSL2)

```powershell
docker run -d --name rabbitmq `
  -p 5672:5672 `
  -p 15672:15672 `
  -e RABBITMQ_DEFAULT_USER=guest `
  -e RABBITMQ_DEFAULT_PASS=guest `
  rabbitmq:3-management
```

---

## 🐧 Linux (Ubuntu/Debian)

### Instalação via apt

**1. Adicionar Repositório**
```bash
# Importar chave GPG
curl -fsSL https://github.com/rabbitmq/signing-keys/releases/download/2.0/rabbitmq-release-signing-key.asc | sudo apt-key add -

# Adicionar repositório
sudo tee /etc/apt/sources.list.d/bintray.rabbitmq.list <<EOF
deb https://dl.cloudsmith.io/public/rabbitmq/rabbitmq-erlang/deb/ubuntu focal main
deb https://dl.cloudsmith.io/public/rabbitmq/rabbitmq-server/deb/ubuntu focal main
EOF
```

**2. Instalar RabbitMQ**
```bash
sudo apt-get update
sudo apt-get install -y erlang-base \
                        erlang-asn1 \
                        erlang-crypto \
                        erlang-eldap \
                        erlang-ftp \
                        erlang-inets \
                        erlang-mnesia \
                        erlang-os-mon \
                        erlang-parsetools \
                        erlang-public-key \
                        erlang-runtime-tools \
                        erlang-snmp \
                        erlang-ssl \
                        erlang-syntax-tools \
                        erlang-tftp \
                        erlang-tools \
                        erlang-xmerl

sudo apt-get install -y rabbitmq-server
```

**3. Habilitar e Iniciar Serviço**
```bash
sudo systemctl enable rabbitmq-server
sudo systemctl start rabbitmq-server
```

**4. Habilitar Management Plugin**
```bash
sudo rabbitmq-plugins enable rabbitmq_management
```

**5. Verificar Status**
```bash
sudo systemctl status rabbitmq-server
```

### Docker (Linux)

```bash
docker run -d --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=guest \
  -e RABBITMQ_DEFAULT_PASS=guest \
  rabbitmq:3-management
```

---

## 🍎 macOS

### Instalação com Homebrew

**1. Instalar RabbitMQ**
```bash
brew update
brew install rabbitmq
```

**2. Adicionar ao PATH**
```bash
echo 'export PATH="/usr/local/sbin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**3. Iniciar Serviço**
```bash
# Iniciar agora
brew services start rabbitmq

# Ou apenas para esta sessão
rabbitmq-server
```

**4. Habilitar Management Plugin**
```bash
rabbitmq-plugins enable rabbitmq_management
```

### Docker (macOS)

```bash
docker run -d --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=guest \
  -e RABBITMQ_DEFAULT_PASS=guest \
  rabbitmq:3-management
```

---

## ✅ Verificação da Instalação

### 1. Verificar Serviço
```bash
# Windows (PowerShell como Admin)
Get-Service RabbitMQ

# Linux/macOS
sudo systemctl status rabbitmq-server  # Linux
brew services list | grep rabbitmq      # macOS
```

### 2. Verificar Status via CLI
```bash
rabbitmqctl status
```

### 3. Acessar Management Interface
- URL: http://localhost:15672
- Usuário: **guest**
- Senha: **guest**

Se conseguir fazer login, a instalação está OK! ✅

### 4. Testar Conectividade
```bash
# Listar usuários
rabbitmqctl list_users

# Listar vhosts
rabbitmqctl list_vhosts

# Listar queues
rabbitmqctl list_queues
```

---

## 🔧 Comandos Úteis

### Gerenciamento do Serviço

**Windows:**
```powershell
# Iniciar
net start RabbitMQ

# Parar
net stop RabbitMQ

# Reiniciar
net stop RabbitMQ; net start RabbitMQ

# Status
Get-Service RabbitMQ
```

**Linux:**
```bash
# Iniciar
sudo systemctl start rabbitmq-server

# Parar
sudo systemctl stop rabbitmq-server

# Reiniciar
sudo systemctl restart rabbitmq-server

# Status
sudo systemctl status rabbitmq-server
```

**macOS:**
```bash
# Iniciar
brew services start rabbitmq

# Parar
brew services stop rabbitmq

# Reiniciar
brew services restart rabbitmq

# Status
brew services list | grep rabbitmq
```

### Plugins

```bash
# Listar plugins disponíveis
rabbitmq-plugins list

# Habilitar plugin
rabbitmq-plugins enable PLUGIN_NAME

# Desabilitar plugin
rabbitmq-plugins disable PLUGIN_NAME

# Habilitar Management (essencial para este projeto)
rabbitmq-plugins enable rabbitmq_management
```

### Gerenciamento de Usuários

```bash
# Criar usuário
rabbitmqctl add_user username password

# Definir como administrador
rabbitmqctl set_user_tags username administrator

# Dar permissões
rabbitmqctl set_permissions -p / username ".*" ".*" ".*"

# Listar usuários
rabbitmqctl list_users

# Deletar usuário
rabbitmqctl delete_user username
```

---

## 🐛 Troubleshooting

### Problema: Porta 15672 não acessível

**Solução:**
```bash
# Verificar se o plugin está habilitado
rabbitmq-plugins enable rabbitmq_management

# Reiniciar RabbitMQ
# Windows
net stop RabbitMQ; net start RabbitMQ

# Linux
sudo systemctl restart rabbitmq-server

# macOS
brew services restart rabbitmq
```

### Problema: Erro "ERLANG_HOME not set"

**Solução (Windows):**
```powershell
# Adicionar variável de ambiente
[System.Environment]::SetEnvironmentVariable('ERLANG_HOME', 'C:\Program Files\erl-X.X', 'Machine')
```

### Problema: Serviço não inicia

**Solução:**
```bash
# Ver logs
# Windows
type "C:\Users\%USERNAME%\AppData\Roaming\RabbitMQ\log\*"

# Linux
sudo tail -f /var/log/rabbitmq/rabbit@hostname.log

# macOS
tail -f /usr/local/var/log/rabbitmq/rabbit@hostname.log

# Remover dados e reiniciar (CUIDADO: apaga tudo)
rabbitmqctl stop_app
rabbitmqctl reset
rabbitmqctl start_app
```

### Problema: Conexão recusada (ECONNREFUSED)

**Verificar:**
1. RabbitMQ está rodando?
2. Firewall bloqueando porta 5672?
3. Conectando em `localhost` ou `127.0.0.1`?

**Solução:**
```bash
# Verificar se está escutando na porta
# Windows
netstat -an | findstr :5672

# Linux/macOS
netstat -an | grep 5672
```

---

## 🔐 Segurança (Produção)

⚠️ **Importante**: O usuário `guest` só funciona em `localhost` por padrão.

Para ambientes de produção:

```bash
# Criar novo usuário admin
rabbitmqctl add_user admin senha_forte_aqui
rabbitmqctl set_user_tags admin administrator
rabbitmqctl set_permissions -p / admin ".*" ".*" ".*"

# Opcional: Deletar usuário guest
rabbitmqctl delete_user guest
```

---

## 📊 Configuração para Este Projeto

Após instalar, configure o seguinte:

1. **Habilitar Management Plugin**
   ```bash
   rabbitmq-plugins enable rabbitmq_management
   ```

2. **Verificar Acesso**
   - http://localhost:15672 (Management)
   - guest/guest (credenciais padrão)

3. **Pronto!** O sistema já vai criar automaticamente:
   - Exchange: `shopping_events`
   - Queues: `notification_queue`, `analytics_queue`
   - Bindings: `list.checkout.#`

---

## 🐳 Alternativa: Docker Compose

Crie `docker-compose.yml`:

```yaml
version: '3.8'
services:
  rabbitmq:
    image: rabbitmq:3-management
    container_name: rabbitmq
    ports:
      - "5672:5672"    # AMQP
      - "15672:15672"  # Management
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

volumes:
  rabbitmq_data:
```

Execute:
```bash
docker-compose up -d
```

---

## ✅ Checklist Pós-Instalação

- [ ] RabbitMQ instalado
- [ ] Serviço iniciado
- [ ] Management Plugin habilitado
- [ ] Acesso a http://localhost:15672 funcionando
- [ ] Login com guest/guest funcionando
- [ ] Porta 5672 acessível (AMQP)
- [ ] Porta 15672 acessível (Management)

---

**🎉 RabbitMQ instalado e pronto para uso!**

Próximo passo: [RABBITMQ_SETUP.md](RABBITMQ_SETUP.md)
