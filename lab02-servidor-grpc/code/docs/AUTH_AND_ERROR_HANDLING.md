# Sistema de Autenticação JWT e Error Handling para gRPC

## Visão Geral

Este sistema implementa autenticação JWT robusta e tratamento de erros padronizado para serviços gRPC, fornecendo:

- **Autenticação JWT** com interceptadores automáticos
- **Error Handling** padronizado com códigos gRPC apropriados
- **Logging estruturado** para auditoria e debugging
- **Validação de dados** com mensagens de erro detalhadas

## Componentes

### 1. Interceptador de Autenticação (`middleware/auth.js`)

Valida tokens JWT automaticamente em métodos protegidos.

```javascript
const AuthInterceptor = require('./middleware/auth');

// Validação automática via interceptador
const authInterceptor = AuthInterceptor.createServerInterceptor(securedMethods);

// Validação manual
const user = AuthInterceptor.validateTokenFromMetadata(call);
```

**Características:**
- Extração automática de tokens dos metadados
- Validação de expiração e integridade
- Diferenciação entre métodos públicos e protegidos
- Suporte a refresh tokens

### 2. Utilitário JWT (`utils/jwtUtils.js`)

Gerencia criação e validação de tokens JWT.

```javascript
const JWTUtils = require('./utils/jwtUtils');

// Gerar par de tokens
const tokens = JWTUtils.generateTokenPair(user);
// Resultado: { accessToken, refreshToken, expiresIn, tokenType }

// Validar token
const validation = JWTUtils.validateAccessToken(token);
if (validation.valid) {
    console.log('Usuário:', validation.user);
}

// Renovar token
const newToken = JWTUtils.refreshAccessToken(refreshToken, user);
```

**Tipos de Token:**
- **Access Token**: Curta duração (15min), para operações
- **Refresh Token**: Longa duração (7d), para renovação

### 3. Error Handling (`middleware/errorHandler.js`)

Sistema padronizado de tratamento de erros gRPC.

```javascript
const ErrorHandler = require('./middleware/errorHandler');

// Criar erros específicos
const authError = ErrorHandler.createAuthError('Credenciais inválidas');
const notFoundError = ErrorHandler.createNotFoundError('Usuário', 'user-123');
const validationError = ErrorHandler.createValidationError('email', '', 'Email obrigatório');

// Wrapper automático para métodos
const wrappedMethod = ErrorHandler.wrapServiceMethod(originalMethod);

// Validação de entrada
ErrorHandler.validateInput(data, {
    email: { required: true, type: 'string', pattern: /^[^@]+@[^@]+$/ },
    password: { required: true, minLength: 8 }
});
```

**Códigos de Erro Suportados:**
- `UNAUTHENTICATED`: Problemas de autenticação
- `PERMISSION_DENIED`: Sem permissão para operação
- `NOT_FOUND`: Recurso não encontrado
- `ALREADY_EXISTS`: Recurso já existe
- `INVALID_ARGUMENT`: Dados inválidos
- `INTERNAL`: Erro interno do servidor

### 4. Sistema de Logging (`middleware/logger.js`)

Logging estruturado com múltiplos níveis.

```javascript
const Logger = require('./middleware/logger');

// Diferentes níveis de log
Logger.error('Erro crítico', error, { userId: '123' });
Logger.warn('Operação suspeita', { action: 'delete' });
Logger.info('Operação realizada', { method: 'createTask' });
Logger.debug('Dados de debug', { request: data });

// Log de auditoria
Logger.audit('USER_LOGIN', 'SUCCESS', { userId: '123' });

// Log de performance
Logger.performance('createTask', 1250, { userId: '123' });
```

**Recursos de Logging:**
- Output para console e arquivo
- Sanitização automática de dados sensíveis
- Rastreamento de performance
- Logs de auditoria para compliance

## Implementação no Servidor

### Servidor gRPC Completo (`server.js`)

```javascript
const grpc = require('@grpc/grpc-js');
const AuthInterceptor = require('./middleware/auth');
const ErrorHandler = require('./middleware/errorHandler');
const Logger = require('./middleware/logger');

class GrpcServer {
    constructor() {
        this.server = new grpc.Server();
        
        // Métodos que requerem autenticação
        this.securedMethods = [
            '/tasks.TaskService/CreateTask',
            '/tasks.TaskService/GetTasks',
            // ... outros métodos protegidos
        ];
    }

    // Wrapper que aplica todos os middlewares
    wrapWithAuth(originalMethod) {
        return ErrorHandler.wrapServiceMethod(
            Logger.wrapServiceMethod(
                async (call, callback) => {
                    // Lógica de autenticação
                    if (this.requiresAuth(originalMethod.name)) {
                        const user = await AuthInterceptor.validateAuth(call);
                        call.user = user;
                    }
                    
                    return await originalMethod(call, callback);
                },
                originalMethod.name
            )
        );
    }
}
```

### Uso em Serviços

```javascript
class TaskService {
    async createTask(call, callback) {
        try {
            // call.user já está disponível (injetado pelo interceptador)
            const userId = call.user.id;
            
            // Validar dados de entrada
            ErrorHandler.validateInput(call.request, {
                title: { required: true, minLength: 3, maxLength: 100 },
                description: { required: false, maxLength: 500 }
            });

            const task = await this.taskRepository.create({
                ...call.request,
                userId
            });

            // Log de auditoria
            Logger.audit('TASK_CREATED', 'SUCCESS', { 
                taskId: task.id, 
                userId 
            });

            callback(null, { success: true, task });

        } catch (error) {
            // Error handling automático via wrapper
            throw error;
        }
    }
}
```

## Uso no Cliente

### Cliente com Autenticação Automática

```javascript
const grpc = require('@grpc/grpc-js');
const AuthInterceptor = require('./middleware/auth');

class GrpcClient {
    constructor(token) {
        this.client = new grpc.Client(/* ... */);
        
        // Aplicar interceptador cliente para adicionar token automaticamente
        if (token) {
            const authInterceptor = AuthInterceptor.createClientInterceptor(token);
            // Aplicar ao cliente
        }
    }

    async login(credentials) {
        return new Promise((resolve, reject) => {
            this.client.login(credentials, (error, response) => {
                if (error) {
                    reject(new Error(`Login falhou: ${error.message}`));
                } else {
                    resolve(response);
                }
            });
        });
    }
}
```

### Exemplo de Uso Completo

```javascript
// 1. Fazer login
const client = new GrpcClient();
const loginResponse = await client.login({
    identifier: 'user@example.com',
    password: 'password123'
});

// 2. Criar cliente autenticado
const authenticatedClient = new GrpcClient(loginResponse.token);

// 3. Fazer operações protegidas
const task = await authenticatedClient.createTask({
    title: 'Minha tarefa',
    description: 'Descrição da tarefa'
});
```

## Configuração

### Variáveis de Ambiente

```bash
# JWT Configuration
JWT_ACCESS_SECRET=your-access-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
JWT_ISSUER=your-app-name
JWT_AUDIENCE=your-app-clients

# Logging Configuration
LOG_LEVEL=INFO  # ERROR, WARN, INFO, DEBUG, TRACE
NODE_ENV=production
```

### Schemas de Validação

```javascript
// Exemplo de schema para validação
const userSchema = {
    email: {
        required: true,
        type: 'string',
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        patternMessage: 'Email deve ter formato válido'
    },
    password: {
        required: true,
        type: 'string',
        minLength: 8,
        maxLength: 128
    },
    username: {
        required: true,
        type: 'string',
        minLength: 3,
        maxLength: 30,
        pattern: /^[a-zA-Z0-9_]+$/,
        patternMessage: 'Username só pode conter letras, números e underscore'
    }
};
```

## Logs e Monitoring

### Estrutura de Logs

```json
{
    "timestamp": "2025-09-14T20:07:37.140Z",
    "level": "INFO",
    "category": "GRPC_INFO",
    "message": "Login realizado com sucesso",
    "userId": "user-123",
    "requestId": "req_1757880457140_abc123",
    "context": {
        "method": "login",
        "duration": "245ms"
    }
}
```

### Tipos de Log por Categoria

- **GRPC_ERROR**: Erros em operações gRPC
- **GRPC_WARN**: Warnings e operações suspeitas
- **GRPC_INFO**: Operações normais e informações
- **AUDIT**: Logs de auditoria para compliance
- **PERFORMANCE**: Métricas de performance
- **CONNECTION**: Conexões e desconexões

## Boas Práticas

### Segurança

1. **Rotação de Secrets**: Mude os secrets JWT regularmente
2. **HTTPS/TLS**: Use sempre TLS em produção
3. **Rate Limiting**: Implemente rate limiting para login
4. **Sanitização**: Logs automaticamente removem dados sensíveis

### Performance

1. **Cache de Tokens**: Implemente cache para validação de tokens
2. **Connection Pooling**: Use pools de conexão para o banco
3. **Timeouts**: Configure timeouts apropriados
4. **Monitoring**: Monitore métricas de performance

### Debugging

1. **Request IDs**: Use request IDs para rastrear operações
2. **Log Levels**: Ajuste níveis de log por ambiente
3. **Structured Logging**: Mantenha logs estruturados em JSON
4. **Error Context**: Inclua contexto suficiente nos erros

## Troubleshooting

### Problemas Comuns

1. **Token Inválido**: Verifique se o secret está correto
2. **Método Não Protegido**: Confirme se está na lista `securedMethods`
3. **Logs Não Aparecem**: Verifique o `LOG_LEVEL`
4. **Performance Lenta**: Monitore logs de performance

### Debugging

```javascript
// Habilitar debug detalhado
process.env.LOG_LEVEL = 'DEBUG';

// Decodificar token para debug
const decoded = JWTUtils.decodeToken(token);
console.log('Token payload:', decoded.payload);

// Verificar se token está próximo do vencimento
const nearExpiry = JWTUtils.isTokenNearExpiry(token, 5); // 5 minutos
```

Este sistema fornece uma base sólida para autenticação e error handling em aplicações gRPC, garantindo segurança, observabilidade e manutenibilidade.