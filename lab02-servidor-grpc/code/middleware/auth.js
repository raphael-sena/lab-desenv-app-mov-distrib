const jwt = require('jsonwebtoken');
const grpc = require('@grpc/grpc-js');

const config = { 
    jwtSecret: process.env.JWT_SECRET || 'seu-secret-aqui-lab02-grpc',
    tokenExpiry: '24h'
};

/**
 * Interceptor de Autenticação gRPC
 * 
 * No gRPC, interceptors funcionam como middleware,
 * permitindo processamento cross-cutting como autenticação.
 * Este interceptor valida tokens JWT passados nos metadados das requisições.
 */

class AuthInterceptor {
    /**
     * Validar token JWT extraído dos metadados da chamada gRPC
     */
    static validateTokenFromMetadata(call) {
        const metadata = call.metadata;
        const authHeader = metadata.get('authorization')[0];
        
        if (!authHeader) {
            const error = new Error('Token de autenticação obrigatório nos metadados');
            error.code = grpc.status.UNAUTHENTICATED;
            throw error;
        }

        // Extrair token do header "Bearer TOKEN"
        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.slice(7) 
            : authHeader;

        try {
            const decoded = jwt.verify(token, config.jwtSecret);
            return decoded;
        } catch (error) {
            const grpcError = new Error('Token inválido ou expirado');
            grpcError.code = grpc.status.UNAUTHENTICATED;
            throw grpcError;
        }
    }

    /**
     * Interceptador servidor-side para autenticação JWT
     */
    static createServerInterceptor(methodsToSecure = []) {
        return (call, methodDefinition, next) => {
            const methodName = methodDefinition.path;
            
            // Se o método não está na lista de métodos seguros, pula autenticação
            if (methodsToSecure.length > 0 && !methodsToSecure.includes(methodName)) {
                return next(call);
            }

            // Métodos que não precisam de autenticação (login, register)
            const publicMethods = [
                '/auth.AuthService/Login',
                '/auth.AuthService/Register'
            ];

            if (publicMethods.includes(methodName)) {
                return next(call);
            }

            try {
                // Validar token e adicionar usuário ao contexto da chamada
                const user = AuthInterceptor.validateTokenFromMetadata(call);
                call.user = user;
                
                return next(call);
            } catch (error) {
                // Retornar erro de autenticação
                const callback = call.callback || call.write;
                if (callback) {
                    callback(error);
                    return;
                }
                throw error;
            }
        };
    }

    /**
     * Interceptador cliente-side para adicionar token automaticamente
     */
    static createClientInterceptor(token) {
        return (options, nextCall) => {
            if (token) {
                if (!options.metadata) {
                    options.metadata = new grpc.Metadata();
                }
                options.metadata.set('authorization', `Bearer ${token}`);
            }
            
            return nextCall(options);
        };
    }

    /**
     * Gerar token JWT para usuário autenticado
     */
    static generateToken(user) {
        const payload = {
            id: user.id,
            email: user.email,
            username: user.username,
            iat: Math.floor(Date.now() / 1000)
        };

        return jwt.sign(payload, config.jwtSecret, { 
            expiresIn: config.tokenExpiry 
        });
    }

    /**
     * Validar token JWT (função utilitária)
     */
    static validateToken(token) {
        try {
            return jwt.verify(token, config.jwtSecret);
        } catch (error) {
            throw new Error('Token inválido ou expirado');
        }
    }

    /**
     * Middleware para validação de token em serviços gRPC
     */
    static async validateAuth(call, callback) {
        try {
            const user = AuthInterceptor.validateTokenFromMetadata(call);
            call.user = user;
            return user;
        } catch (error) {
            if (callback) {
                callback(error);
                return null;
            }
            throw error;
        }
    }
}

module.exports = AuthInterceptor;