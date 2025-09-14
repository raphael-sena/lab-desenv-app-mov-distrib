const fs = require('fs');
const path = require('path');

/**
 * Sistema de Logging para gRPC
 * 
 * Implementa logging estruturado para operações gRPC,
 * incluindo rastreamento de performance, auditoria de operações
 * e debugging detalhado.
 */

class GrpcLogger {
    constructor() {
        this.logDir = path.join(__dirname, '..', 'logs');
        this.ensureLogDirectory();
        
        this.logLevels = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3,
            TRACE: 4
        };

        this.currentLogLevel = process.env.LOG_LEVEL || 'INFO';
    }

    /**
     * Garantir que o diretório de logs existe
     */
    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    /**
     * Verificar se deve logar baseado no nível
     */
    shouldLog(level) {
        return this.logLevels[level] <= this.logLevels[this.currentLogLevel];
    }

    /**
     * Formatar timestamp
     */
    getTimestamp() {
        return new Date().toISOString();
    }

    /**
     * Gerar ID único para rastreamento de requisições
     */
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Log estruturado base
     */
    log(level, message, data = {}, category = 'GENERAL') {
        if (!this.shouldLog(level)) return;

        const logEntry = {
            timestamp: this.getTimestamp(),
            level,
            category,
            message,
            ...data
        };

        // Console output
        this.logToConsole(level, logEntry);
        
        // File output
        this.logToFile(level, logEntry);
    }

    /**
     * Output para console com cores
     */
    logToConsole(level, logEntry) {
        const colors = {
            ERROR: '\x1b[31m',   // Red
            WARN: '\x1b[33m',    // Yellow
            INFO: '\x1b[36m',    // Cyan
            DEBUG: '\x1b[35m',   // Magenta
            TRACE: '\x1b[37m'    // White
        };

        const reset = '\x1b[0m';
        const color = colors[level] || colors.INFO;

        const prefix = `${color}[${logEntry.timestamp}] ${level}${reset}`;
        const output = `${prefix} ${logEntry.message}`;

        switch (level) {
            case 'ERROR':
                console.error(output, logEntry);
                break;
            case 'WARN':
                console.warn(output, logEntry);
                break;
            default:
                console.log(output, logEntry);
        }
    }

    /**
     * Output para arquivo
     */
    logToFile(level, logEntry) {
        try {
            const fileName = `grpc-${new Date().toISOString().split('T')[0]}.log`;
            const filePath = path.join(this.logDir, fileName);
            const logLine = JSON.stringify(logEntry) + '\n';

            fs.appendFileSync(filePath, logLine);
        } catch (error) {
            console.error('Erro ao escrever log em arquivo:', error);
        }
    }

    /**
     * Log de erro gRPC
     */
    error(message, error, context = {}) {
        const errorData = {
            category: 'GRPC_ERROR',
            error: {
                name: error?.name,
                message: error?.message,
                code: error?.code,
                stack: process.env.NODE_ENV !== 'production' ? error?.stack : undefined
            },
            context,
            grpcMethod: context.method,
            userId: context.userId,
            requestId: context.requestId
        };

        this.log('ERROR', message, errorData);
    }

    /**
     * Log de warning
     */
    warn(message, data = {}, context = {}) {
        this.log('WARN', message, {
            category: 'GRPC_WARN',
            ...data,
            context,
            requestId: context.requestId
        });
    }

    /**
     * Log informativo
     */
    info(message, data = {}, context = {}) {
        this.log('INFO', message, {
            category: 'GRPC_INFO',
            ...data,
            context,
            requestId: context.requestId
        });
    }

    /**
     * Log de debug
     */
    debug(message, data = {}, context = {}) {
        this.log('DEBUG', message, {
            category: 'GRPC_DEBUG',
            ...data,
            context,
            requestId: context.requestId
        });
    }

    /**
     * Log de trace (muito detalhado)
     */
    trace(message, data = {}, context = {}) {
        this.log('TRACE', message, {
            category: 'GRPC_TRACE',
            ...data,
            context,
            requestId: context.requestId
        });
    }

    /**
     * Log de auditoria para operações importantes
     */
    audit(operation, result, context = {}) {
        const auditData = {
            category: 'AUDIT',
            operation,
            result,
            userId: context.userId,
            requestId: context.requestId,
            timestamp: this.getTimestamp(),
            metadata: context.metadata
        };

        this.log('INFO', `Operação auditada: ${operation}`, auditData);
    }

    /**
     * Log de performance
     */
    performance(methodName, duration, context = {}) {
        const perfData = {
            category: 'PERFORMANCE',
            method: methodName,
            duration: `${duration}ms`,
            userId: context.userId,
            requestId: context.requestId,
            slow: duration > 1000 // Marcar como lento se > 1s
        };

        const level = duration > 5000 ? 'WARN' : 'INFO'; // Warning se > 5s
        this.log(level, `Performance: ${methodName} executado em ${duration}ms`, perfData);
    }

    /**
     * Interceptor de logging para gRPC
     */
    createLoggingInterceptor() {
        return (call, methodDefinition, next) => {
            const startTime = Date.now();
            const requestId = this.generateRequestId();
            const methodName = methodDefinition.path;

            // Adicionar requestId ao contexto da chamada
            call.requestId = requestId;

            const context = {
                method: methodName,
                requestId,
                userId: call.user?.id,
                timestamp: this.getTimestamp()
            };

            // Log início da requisição
            this.info(`Iniciando ${methodName}`, {
                request: this.sanitizeForLog(call.request)
            }, context);

            // Wrapper para callback
            const originalCallback = call.callback;
            if (originalCallback) {
                call.callback = (error, response) => {
                    const duration = Date.now() - startTime;

                    if (error) {
                        this.error(`Erro em ${methodName}`, error, {
                            ...context,
                            duration: `${duration}ms`,
                            request: this.sanitizeForLog(call.request)
                        });
                    } else {
                        this.info(`Sucesso em ${methodName}`, {
                            duration: `${duration}ms`,
                            response: this.sanitizeForLog(response)
                        }, context);
                    }

                    // Log de performance
                    this.performance(methodName, duration, context);

                    originalCallback(error, response);
                };
            }

            return next(call);
        };
    }

    /**
     * Sanitizar dados para log (remover informações sensíveis)
     */
    sanitizeForLog(data) {
        if (!data || typeof data !== 'object') return data;

        const sanitized = { ...data };
        const sensitiveFields = [
            'password', 'token', 'authorization', 'secret', 'key',
            'accessToken', 'refreshToken', 'jwt'
        ];

        const sanitizeObject = (obj) => {
            if (!obj || typeof obj !== 'object') return obj;

            const result = Array.isArray(obj) ? [] : {};

            Object.keys(obj).forEach(key => {
                const lowerKey = key.toLowerCase();
                
                if (sensitiveFields.some(field => lowerKey.includes(field))) {
                    result[key] = '[REDACTED]';
                } else if (typeof obj[key] === 'object') {
                    result[key] = sanitizeObject(obj[key]);
                } else {
                    result[key] = obj[key];
                }
            });

            return result;
        };

        return sanitizeObject(sanitized);
    }

    /**
     * Log de conexão de cliente
     */
    logClientConnection(clientInfo) {
        this.info('Nova conexão gRPC', {
            category: 'CONNECTION',
            client: clientInfo,
            timestamp: this.getTimestamp()
        });
    }

    /**
     * Log de desconexão de cliente
     */
    logClientDisconnection(clientInfo, reason) {
        this.info('Cliente desconectado', {
            category: 'DISCONNECTION',
            client: clientInfo,
            reason,
            timestamp: this.getTimestamp()
        });
    }

    /**
     * Log de estatísticas do servidor
     */
    logServerStats(stats) {
        this.info('Estatísticas do servidor', {
            category: 'SERVER_STATS',
            stats,
            timestamp: this.getTimestamp()
        });
    }

    /**
     * Wrapper para métodos de serviço com logging automático
     */
    wrapServiceMethod(methodFunction, methodName) {
        return async (call, callback) => {
            const startTime = Date.now();
            const requestId = call.requestId || this.generateRequestId();
            
            const context = {
                method: methodName,
                requestId,
                userId: call.user?.id
            };

            try {
                this.debug(`Executando ${methodName}`, {
                    request: this.sanitizeForLog(call.request)
                }, context);

                const result = await methodFunction(call, callback);
                const duration = Date.now() - startTime;

                this.performance(methodName, duration, context);
                
                return result;
            } catch (error) {
                const duration = Date.now() - startTime;
                
                this.error(`Falha em ${methodName}`, error, {
                    ...context,
                    duration: `${duration}ms`,
                    request: this.sanitizeForLog(call.request)
                });

                throw error;
            }
        };
    }
}

// Instância singleton
const grpcLogger = new GrpcLogger();

module.exports = grpcLogger;