const grpc = require('@grpc/grpc-js');

/**
 * Sistema de Tratamento de Erros gRPC
 * 
 * Implementa tratamento padronizado de erros para serviços gRPC,
 * incluindo mapeamento de códigos de status, logging estruturado
 * e formatação consistente de respostas de erro.
 */

class GrpcErrorHandler {
    constructor() {
        // Mapeamento de tipos de erro para códigos gRPC
        this.errorCodeMap = new Map([
            // Erros de autenticação
            ['UNAUTHENTICATED', grpc.status.UNAUTHENTICATED],
            ['UNAUTHORIZED', grpc.status.PERMISSION_DENIED],
            ['TOKEN_EXPIRED', grpc.status.UNAUTHENTICATED],
            ['TOKEN_INVALID', grpc.status.UNAUTHENTICATED],
            ['INVALID_CREDENTIALS', grpc.status.UNAUTHENTICATED],
            
            // Erros de validação
            ['VALIDATION_ERROR', grpc.status.INVALID_ARGUMENT],
            ['MISSING_FIELD', grpc.status.INVALID_ARGUMENT],
            ['INVALID_FORMAT', grpc.status.INVALID_ARGUMENT],
            ['INVALID_INPUT', grpc.status.INVALID_ARGUMENT],
            
            // Erros de recursos
            ['NOT_FOUND', grpc.status.NOT_FOUND],
            ['ALREADY_EXISTS', grpc.status.ALREADY_EXISTS],
            ['RESOURCE_EXHAUSTED', grpc.status.RESOURCE_EXHAUSTED],
            
            // Erros de banco de dados
            ['DATABASE_ERROR', grpc.status.INTERNAL],
            ['CONNECTION_ERROR', grpc.status.UNAVAILABLE],
            ['TIMEOUT', grpc.status.DEADLINE_EXCEEDED],
            
            // Erros de negócio
            ['BUSINESS_RULE_VIOLATION', grpc.status.FAILED_PRECONDITION],
            ['OPERATION_NOT_ALLOWED', grpc.status.PERMISSION_DENIED],
            ['QUOTA_EXCEEDED', grpc.status.RESOURCE_EXHAUSTED],
            
            // Erros do sistema
            ['INTERNAL_ERROR', grpc.status.INTERNAL],
            ['SERVICE_UNAVAILABLE', grpc.status.UNAVAILABLE],
            ['NOT_IMPLEMENTED', grpc.status.UNIMPLEMENTED]
        ]);
    }

    /**
     * Criar erro gRPC padronizado
     */
    createError(type, message, details = null, metadata = null) {
        const error = new Error(message);
        error.code = this.errorCodeMap.get(type) || grpc.status.INTERNAL;
        error.type = type;
        error.details = details;
        
        if (metadata) {
            error.metadata = metadata;
        }

        // Adicionar stack trace em desenvolvimento
        if (process.env.NODE_ENV !== 'production') {
            Error.captureStackTrace(error, this.createError);
        }

        return error;
    }

    /**
     * Tratar erro de validação com detalhes específicos
     */
    createValidationError(field, value, expectedFormat) {
        const details = {
            field,
            value: typeof value === 'object' ? JSON.stringify(value) : value,
            expectedFormat,
            timestamp: new Date().toISOString()
        };

        return this.createError(
            'VALIDATION_ERROR',
            `Valor inválido para o campo '${field}': ${expectedFormat}`,
            details
        );
    }

    /**
     * Tratar erro de autenticação
     */
    createAuthError(reason = 'Credenciais inválidas') {
        return this.createError(
            'UNAUTHENTICATED',
            reason,
            { timestamp: new Date().toISOString() }
        );
    }

    /**
     * Tratar erro de recurso não encontrado
     */
    createNotFoundError(resource, id) {
        return this.createError(
            'NOT_FOUND',
            `${resource} com ID '${id}' não encontrado`,
            { resource, id, timestamp: new Date().toISOString() }
        );
    }

    /**
     * Tratar erro de recurso já existente
     */
    createAlreadyExistsError(resource, identifier) {
        return this.createError(
            'ALREADY_EXISTS',
            `${resource} com identificador '${identifier}' já existe`,
            { resource, identifier, timestamp: new Date().toISOString() }
        );
    }

    /**
     * Tratar erro de permissão
     */
    createPermissionError(action, resource) {
        return this.createError(
            'UNAUTHORIZED',
            `Permissão negada para ${action} em ${resource}`,
            { action, resource, timestamp: new Date().toISOString() }
        );
    }

    /**
     * Tratar erro interno do servidor
     */
    createInternalError(originalError, context = '') {
        const details = {
            context,
            timestamp: new Date().toISOString(),
            errorName: originalError.name,
            errorMessage: originalError.message
        };

        // Em desenvolvimento, incluir stack trace
        if (process.env.NODE_ENV !== 'production') {
            details.stack = originalError.stack;
        }

        return this.createError(
            'INTERNAL_ERROR',
            `Erro interno do servidor${context ? `: ${context}` : ''}`,
            details
        );
    }

    /**
     * Wrapper para capturar e tratar erros automaticamente
     */
    wrapServiceMethod(methodFunction) {
        return async (call, callback) => {
            try {
                return await methodFunction(call, callback);
            } catch (error) {
                const grpcError = this.handleError(error, {
                    method: methodFunction.name,
                    userId: call.user?.id,
                    timestamp: new Date().toISOString()
                });

                this.logError(grpcError, {
                    method: methodFunction.name,
                    userId: call.user?.id,
                    request: this.sanitizeRequest(call.request)
                });

                if (callback) {
                    callback(grpcError);
                } else {
                    throw grpcError;
                }
            }
        };
    }

    /**
     * Processar erro e converter para formato gRPC
     */
    handleError(error, context = {}) {
        // Se já é um erro gRPC formatado, retornar como está
        if (error.code && Object.values(grpc.status).includes(error.code)) {
            return error;
        }

        // Mapear erros conhecidos
        if (error.message.includes('Token')) {
            return this.createAuthError(error.message);
        }

        if (error.message.includes('not found')) {
            return this.createError('NOT_FOUND', error.message);
        }

        if (error.message.includes('already exists')) {
            return this.createError('ALREADY_EXISTS', error.message);
        }

        if (error.message.includes('validation') || error.message.includes('invalid')) {
            return this.createError('VALIDATION_ERROR', error.message);
        }

        // Erro genérico interno
        return this.createInternalError(error, context.method);
    }

    /**
     * Log estruturado de erros
     */
    logError(error, context = {}) {
        const logLevel = this.getLogLevel(error.code);
        const logData = {
            timestamp: new Date().toISOString(),
            level: logLevel,
            error: {
                type: error.type,
                code: error.code,
                message: error.message,
                details: error.details
            },
            context,
            grpcStatus: Object.keys(grpc.status).find(key => grpc.status[key] === error.code)
        };

        // Log baseado no nível
        if (logLevel === 'ERROR') {
            console.error('🚨 gRPC Error:', JSON.stringify(logData, null, 2));
        } else if (logLevel === 'WARN') {
            console.warn('⚠️ gRPC Warning:', JSON.stringify(logData, null, 2));
        } else {
            console.info('ℹ️ gRPC Info:', JSON.stringify(logData, null, 2));
        }
    }

    /**
     * Determinar nível de log baseado no código de erro
     */
    getLogLevel(grpcCode) {
        const errorLevels = {
            [grpc.status.INTERNAL]: 'ERROR',
            [grpc.status.UNAVAILABLE]: 'ERROR',
            [grpc.status.DEADLINE_EXCEEDED]: 'ERROR',
            [grpc.status.UNAUTHENTICATED]: 'WARN',
            [grpc.status.PERMISSION_DENIED]: 'WARN',
            [grpc.status.NOT_FOUND]: 'INFO',
            [grpc.status.ALREADY_EXISTS]: 'INFO',
            [grpc.status.INVALID_ARGUMENT]: 'INFO'
        };

        return errorLevels[grpcCode] || 'ERROR';
    }

    /**
     * Sanitizar dados da requisição para logging
     */
    sanitizeRequest(request) {
        if (!request) return null;

        const sanitized = { ...request };
        
        // Remover campos sensíveis
        const sensitiveFields = ['password', 'token', 'authorization', 'secret'];
        sensitiveFields.forEach(field => {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        });

        return sanitized;
    }

    /**
     * Interceptor para tratamento automático de erros
     */
    createErrorInterceptor() {
        return (call, methodDefinition, next) => {
            const originalCallback = call.callback;
            
            // Wrapper para callback que trata erros automaticamente
            call.callback = (error, response) => {
                if (error) {
                    const grpcError = this.handleError(error, {
                        method: methodDefinition.path,
                        userId: call.user?.id
                    });
                    
                    this.logError(grpcError, {
                        method: methodDefinition.path,
                        userId: call.user?.id,
                        request: this.sanitizeRequest(call.request)
                    });
                    
                    originalCallback(grpcError, response);
                } else {
                    originalCallback(error, response);
                }
            };

            return next(call);
        };
    }

    /**
     * Validar entrada de dados
     */
    validateInput(data, schema) {
        const errors = [];

        for (const [field, rules] of Object.entries(schema)) {
            const value = data[field];

            if (rules.required && (value === undefined || value === null || value === '')) {
                errors.push(this.createValidationError(field, value, 'Campo obrigatório'));
            }

            if (value && rules.type && typeof value !== rules.type) {
                errors.push(this.createValidationError(field, value, `Tipo ${rules.type}`));
            }

            if (value && rules.minLength && value.length < rules.minLength) {
                errors.push(this.createValidationError(field, value, `Mínimo ${rules.minLength} caracteres`));
            }

            if (value && rules.maxLength && value.length > rules.maxLength) {
                errors.push(this.createValidationError(field, value, `Máximo ${rules.maxLength} caracteres`));
            }

            if (value && rules.pattern && !rules.pattern.test(value)) {
                errors.push(this.createValidationError(field, value, rules.patternMessage || 'Formato inválido'));
            }
        }

        if (errors.length > 0) {
            const error = this.createError(
                'VALIDATION_ERROR',
                `Erro de validação: ${errors.length} campo(s) inválido(s)`,
                { errors }
            );
            throw error;
        }

        return true;
    }
}

// Instância singleton
const errorHandler = new GrpcErrorHandler();

module.exports = errorHandler;