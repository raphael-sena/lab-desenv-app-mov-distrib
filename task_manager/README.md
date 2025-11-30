# 📱 Task Manager - Offline-First Application

Um aplicativo Flutter completo de gerenciamento de tarefas com **funcionalidade Offline-First**, permitindo operação sem internet e sincronização automática.

---

## ✨ Funcionalidades

### 🎯 Funcionalidades Principais
- ✅ Criar, editar e deletar tarefas
- 📸 Anexar múltiplas fotos às tarefas
- 📍 Adicionar localização GPS às tarefas
- 📱 Completar tarefas sacudindo o celular (shake detection)
- 🎨 Interface Material Design moderna
- 🔄 Filtros por status (todas, pendentes, concluídas, próximas)

### 🌐 Offline-First (NOVO!)
- 🔴 **Modo Offline Completo** - Funciona sem internet
- 🟢 **Sincronização Automática** - Quando a conexão retorna
- 📊 **Fila de Sincronização** - Todas operações offline são registradas
- ⚔️ **Resolução de Conflitos (LWW)** - Last-Write-Wins automático
- 🎨 **Indicadores Visuais** - Status de conectividade e sincronização
- 💾 **Persistência Garantida** - Dados salvos localmente sempre

---

## 🚀 Como Executar

### Pré-requisitos
```bash
Flutter SDK >= 3.9.2
Dart SDK >= 3.9.2
```

### Instalação
```bash
# 1. Clonar repositório
git clone <url-do-repo>

# 2. Entrar na pasta
cd task_manager

# 3. Instalar dependências
flutter pub get

# 4. Configurar URL da API
# Editar lib/services/api_service.dart linha 10
# Substituir por sua URL do MockAPI.io ou backend

# 5. Executar
flutter run
```

---

## 📚 Documentação

### Documentos Principais
- 📄 **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Resumo executivo completo
- 📄 **[OFFLINE_FIRST_README.md](OFFLINE_FIRST_README.md)** - Documentação técnica detalhada
- 📄 **[API_TESTING_GUIDE.md](API_TESTING_GUIDE.md)** - Guia de testes com Postman
- 📄 **[PRESENTATION_CHECKLIST.md](PRESENTATION_CHECKLIST.md)** - Checklist para apresentação
- 📄 **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - Estrutura completa do projeto

### Documentos de Referência
- 📄 **[Offiline-First.md](Offiline-First.md)** - Especificação original da atividade

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ TaskListScreen│  │ TaskFormScreen│  │  TaskCard   │      │
│  └───────┬──────┘  └───────┬──────┘  └──────┬───────┘      │
└──────────┼──────────────────┼─────────────────┼─────────────┘
           │                  │                 │
           ▼                  ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Database   │  │     Sync     │  │ Connectivity │      │
│  │   Service    │◄─┤   Service    ├─►│   Service    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘      │
│         │                 │                                  │
│         │          ┌──────▼───────┐                         │
│         │          │     API      │                         │
│         │          │   Service    │                         │
│         │          └──────────────┘                         │
└─────────┼────────────────┼────────────────────────────────┘
          │                │
          ▼                ▼
┌─────────────────┐  ┌─────────────┐
│  SQLite Local   │  │   Backend   │
│   - tasks       │  │     API     │
│   - sync_queue  │  │             │
└─────────────────┘  └─────────────┘
```

---

## 🔧 Configuração do Backend

### Opção 1: MockAPI.io (Recomendado)

1. Acesse: https://mockapi.io/
2. Crie um projeto "TaskManager"
3. Crie recurso "tasks" com os campos do modelo Task
4. Copie a URL da API
5. Atualize em `lib/services/api_service.dart`:
   ```dart
   static const String baseUrl = 'https://SEU_ID.mockapi.io/api/v1';
   ```

### Opção 2: Backend Próprio

Configure sua URL em `lib/services/api_service.dart`.

O backend deve implementar os endpoints:
- `GET /tasks` - Listar todas
- `POST /tasks` - Criar nova
- `PUT /tasks/:id` - Atualizar
- `DELETE /tasks/:id` - Deletar
- `GET /tasks/:id` - Buscar uma

---

## 🎬 Demonstração (Roteiro Completo)

### 1. Prova de Vida Offline (5 min)
```
✈️ Ativar Modo Avião
📝 Criar 2 tarefas novas
✏️ Editar 1 tarefa existente
👁️ Verificar ícones "Pendente"
👁️ Verificar badge "3 pendentes"
```

### 2. Persistência (3 min)
```
❌ Fechar app completamente (kill process)
✅ Reabrir app
👁️ Dados ainda estão lá!
```

### 3. Sincronização (3 min)
```
📡 Desativar Modo Avião
⏳ Aguardar sincronização automática
👁️ Ícones mudam para "Sincronizado"
👁️ Badge de pendentes desaparece
📋 Logs no console
```

### 4. Prova de Conflito (4 min)
```
✏️ Editar tarefa no app
✏️ Editar mesma tarefa no Postman (timestamp mais recente)
🔄 Sincronizar app
👁️ Versão do servidor prevalece (LWW)
📋 Log de conflito no console
```

---

## 📦 Dependências

### Principais
```yaml
dependencies:
  sqflite: ^2.3.0              # Banco de dados local
  connectivity_plus: ^6.1.3    # Detecção de conectividade
  http: ^1.2.2                 # Cliente HTTP
  path_provider: ^2.1.1        # Diretórios do app
  camera: ^0.11.3              # Câmera
  geolocator: ^14.0.2          # GPS
  sensors_plus: ^7.0.0         # Acelerômetro (shake)
```

---

## 🗄️ Banco de Dados

### Tabela: tasks
```sql
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL,
  completed INTEGER NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,         -- Para LWW
  isSynced INTEGER NOT NULL,       -- Status de sincronização
  photoPaths TEXT,
  completedAt TEXT,
  completedBy TEXT,
  latitude REAL,
  longitude REAL,
  locationName TEXT
)
```

### Tabela: sync_queue
```sql
CREATE TABLE sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  taskId INTEGER NOT NULL,
  operation TEXT NOT NULL,        -- CREATE, UPDATE, DELETE
  taskData TEXT NOT NULL,         -- JSON da tarefa
  createdAt TEXT NOT NULL,
  synced INTEGER NOT NULL DEFAULT 0
)
```

---

## 🧪 Testes

### Comandos
```bash
# Executar testes
flutter test

# Executar com coverage
flutter test --coverage

# Executar em dispositivo específico
flutter run -d <device-id>

# Build APK
flutter build apk

# Build para release
flutter run --release
```

### Cenários de Teste

#### Teste 1: Criar Offline
- Modo Avião ativado
- Criar nova tarefa
- Verificar ícone "Pendente"
- Desativar Modo Avião
- Verificar sincronização

#### Teste 2: Editar Offline
- Modo Avião ativado
- Editar tarefa existente
- Fechar e reabrir app
- Verificar persistência
- Conectar e sincronizar

#### Teste 3: Deletar Offline
- Modo Avião ativado
- Deletar tarefa
- Conectar
- Verificar remoção no servidor

#### Teste 4: Conflito LWW
- Editar no app (timestamp T1)
- Editar no servidor (timestamp T2 > T1)
- Sincronizar
- Verificar que versão do servidor prevalece

---

## 🎨 Recursos Visuais

### Indicadores de Status

#### Conectividade (AppBar)
- 🟢 **Online** - Badge verde com ícone `cloud_done`
- 🔴 **Offline** - Badge vermelho com ícone `cloud_off`
- 🟠 **X pendentes** - Badge laranja quando há itens não sincronizados

#### Sincronização (Cards)
- 🟠 **Pendente** - Ícone `cloud_off` laranja
- 🟢 **Sincronizado** - Ícone `cloud_done` verde

### Notificações
- Conexão estabelecida: "🟢 Conectado - Sincronizando..."
- Conexão perdida: "🔴 Offline - Mudanças serão sincronizadas quando voltar a conexão"
- Sincronização concluída: "✓ Sincronização concluída"

---

## 📊 Requisitos Atendidos

| Requisito | Status | Evidência |
|-----------|--------|-----------|
| Persistência Local (SQLite) | ✅ | DatabaseService com tabelas tasks + sync_queue |
| Detector de Conectividade | ✅ | ConnectivityService + indicador visual |
| Fila de Sincronização | ✅ | Tabela sync_queue + SyncService |
| Resolução de Conflitos (LWW) | ✅ | Comparação de updatedAt em SyncService |
| Prova de Vida Offline | ✅ | Criar/editar em Modo Avião |
| Persistência | ✅ | Kill app + reabrir com dados intactos |
| Sincronização | ✅ | Automática ao conectar + manual |
| Prova de Conflito | ✅ | LWW automático |

---

## 🐛 Troubleshooting

### App não sincroniza
- Verificar URL da API em `api_service.dart`
- Testar endpoint no navegador/Postman
- Verificar logs no console
- Clicar no botão ⟳ para forçar sync

### Badge não atualiza
- Puxar para baixo na lista (RefreshIndicator)
- Clicar em ⟳
- Reiniciar app

### Erros de compilação
```bash
flutter clean
flutter pub get
flutter run
```

---

## 📞 Suporte

### Durante Desenvolvimento
- Consultar `OFFLINE_FIRST_README.md`
- Ver exemplos em `API_TESTING_GUIDE.md`
- Verificar estrutura em `PROJECT_STRUCTURE.md`

### Durante Apresentação
- Usar `PRESENTATION_CHECKLIST.md`
- Verificar console Flutter para logs
- Usar Device Inspector para debug SQLite

---

## 🏆 Créditos

**Desenvolvido para:** Atividade Offline-First  
**Disciplina:** Laboratório de Desenvolvimento de Aplicações Móveis e Distribuídas  
**Instituição:** PUC Minas  
**Ano:** 2025

---

## 📄 Licença

Este projeto foi desenvolvido para fins educacionais.

---

## 🎓 Aprendizados

- Arquitetura Offline-First
- Sincronização de dados
- Resolução de conflitos (LWW)
- SQLite e migrations
- Reactive Programming com Streams
- HTTP Client e APIs REST
- Material Design no Flutter
- Gerenciamento de estado
- Padrões de projeto (Singleton, Repository, Observer)

---

**Status:** ✅ Implementação Completa  
**Última Atualização:** 30/11/2025  
**Desenvolvido com ❤️ usando Flutter**
