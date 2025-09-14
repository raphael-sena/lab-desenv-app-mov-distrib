const grpc = require('@grpc/grpc-js');
const ErrorHandler = require('../middleware/errorHandler');
const Logger = require('../middleware/logger');
const JWTUtils = require('../utils/jwtUtils');

/**
 * Exemplo de uso dos sistemas de autenticação e error handling
 * 
 * Demonstra como usar os interceptadores, error handling e logging
 * em um serviço gRPC real.
 */

class ExampleAuthService {
    /**
     * Exemplo de método de login com error handling completo
     */
    async login(call, callback) {
        const requestId = call.requestId || 'example-' + Date.now();
        
        try {
            Logger.info('Iniciando processo de login', {
                requestId,
                identifier: call.request.identifier
            });

            // Validação de entrada
            ErrorHandler.validateInput(call.request, {
                identifier: { 
                    required: true, 
                    type: 'string', 
                    minLength: 3 
                },
                password: { 
                    required: true, 
                    type: 'string', 
                    minLength: 6 
                }
            });

            const { identifier, password } = call.request;

            // Simular busca de usuário
            const user = await this.findUserByIdentifier(identifier);
            if (!user) {
                throw ErrorHandler.createNotFoundError('Usuário', identifier);
            }

            // Simular verificação de senha
            const validPassword = await this.verifyPassword(password, user.password);
            if (!validPassword) {
                throw ErrorHandler.createAuthError('Credenciais inválidas');
            }

            // Gerar tokens JWT
            const tokens = JWTUtils.generateTokenPair(user);

            // Log de auditoria
            Logger.audit('USER_LOGIN', 'SUCCESS', {
                userId: user.id,
                requestId,
                timestamp: new Date().toISOString()
            });

            // Resposta de sucesso
            const response = {
                success: true,
                message: 'Login realizado com sucesso',
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    first_name: user.first_name,
                    last_name: user.last_name
                },
                token: tokens.accessToken,
                refreshToken: tokens.refreshToken
            };

            Logger.info('Login realizado com sucesso', {
                userId: user.id,
                requestId
            });

            callback(null, response);

        } catch (error) {
            // Error handling automático
            Logger.error('Erro no processo de login', error, {
                requestId,
                identifier: call.request?.identifier
            });

            // Auditoria de falha
            Logger.audit('USER_LOGIN', 'FAILED', {
                error: error.message,
                identifier: call.request?.identifier,
                requestId
            });

            const grpcError = ErrorHandler.handleError(error);
            callback(grpcError);
        }
    }

    /**
     * Exemplo de método protegido com validação JWT
     */
    async getProfile(call, callback) {
        const requestId = call.requestId || 'profile-' + Date.now();

        try {
            // Verificar se usuário foi autenticado (feito pelo interceptor)
            if (!call.user) {
                throw ErrorHandler.createAuthError('Usuário não autenticado');
            }

            Logger.info('Buscando perfil do usuário', {
                userId: call.user.id,
                requestId
            });

            // Simular busca do perfil
            const profile = await this.getUserProfile(call.user.id);
            
            if (!profile) {
                throw ErrorHandler.createNotFoundError('Perfil', call.user.id);
            }

            const response = {
                success: true,
                user: profile
            };

            Logger.info('Perfil encontrado com sucesso', {
                userId: call.user.id,
                requestId
            });

            callback(null, response);

        } catch (error) {
            Logger.error('Erro ao buscar perfil', error, {
                userId: call.user?.id,
                requestId
            });

            const grpcError = ErrorHandler.handleError(error);
            callback(grpcError);
        }
    }

    /**
     * Simular busca de usuário
     */
    async findUserByIdentifier(identifier) {
        // Simular delay de banco de dados
        await new Promise(resolve => setTimeout(resolve, 100));

        // Usuário de exemplo
        return {
            id: 'user-123',
            email: 'user@example.com',
            username: 'testuser',
            first_name: 'Test',
            last_name: 'User',
            password: '$2a$10$hashed_password_example'
        };
    }

    /**
     * Simular verificação de senha
     */
    async verifyPassword(plainPassword, hashedPassword) {
        // Em produção, usar bcrypt
        return plainPassword === 'password123';
    }

    /**
     * Simular busca de perfil
     */
    async getUserProfile(userId) {
        return {
            id: userId,
            email: 'user@example.com',
            username: 'testuser',
            first_name: 'Test',
            last_name: 'User',
            created_at: Date.now()
        };
    }
}

/**
 * Exemplo de cliente gRPC com autenticação
 */
class ExampleGrpcClient {
    constructor(serverAddress = 'localhost:50051') {
        this.serverAddress = serverAddress;
        this.authToken = null;
    }

    /**
     * Conectar ao servidor gRPC
     */
    connect() {
        // Em implementação real, carregar proto files
        Logger.info('Conectando ao servidor gRPC', {
            address: this.serverAddress
        });
    }

    /**
     * Fazer login e obter token
     */
    async login(identifier, password) {
        try {
            Logger.info('Fazendo login via gRPC', { identifier });

            // Simular chamada gRPC
            const response = {
                success: true,
                token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                user: { id: 'user-123', email: identifier }
            };

            this.authToken = response.token;
            Logger.info('Login realizado com sucesso');

            return response;

        } catch (error) {
            Logger.error('Erro no login do cliente', error);
            throw error;
        }
    }

    /**
     * Fazer chamada autenticada
     */
    async getProfile() {
        try {
            if (!this.authToken) {
                throw ErrorHandler.createAuthError('Token não disponível. Faça login primeiro.');
            }

            Logger.info('Buscando perfil com token de autenticação');

            // Simular chamada gRPC com token
            const response = {
                success: true,
                user: {
                    id: 'user-123',
                    email: 'user@example.com',
                    username: 'testuser'
                }
            };

            Logger.info('Perfil obtido com sucesso');
            return response;

        } catch (error) {
            Logger.error('Erro ao buscar perfil', error);
            throw error;
        }
    }
}

/**
 * Função de teste para demonstrar o uso
 */
async function demonstrateUsage() {
    console.log('\n=== Demonstração de Autenticação e Error Handling gRPC ===\n');

    try {
        // 1. Exemplo de serviço
        const authService = new ExampleAuthService();
        
        // 2. Simular chamada de login
        const loginCall = {
            requestId: 'demo-login-' + Date.now(),
            request: {
                identifier: 'user@example.com',
                password: 'password123'
            }
        };

        await new Promise((resolve, reject) => {
            authService.login(loginCall, (error, response) => {
                if (error) {
                    console.error('Erro no login:', error.message);
                    reject(error);
                } else {
                    console.log('✓ Login realizado:', response.message);
                    resolve(response);
                }
            });
        });

        // 3. Exemplo de cliente
        const client = new ExampleGrpcClient();
        client.connect();
        
        const loginResponse = await client.login('user@example.com', 'password123');
        console.log('✓ Token obtido:', loginResponse.token.substring(0, 20) + '...');

        const profile = await client.getProfile();
        console.log('✓ Perfil obtido:', profile.user.username);

        // 4. Demonstrar error handling
        try {
            ErrorHandler.validateInput({ email: '' }, {
                email: { required: true, type: 'string', minLength: 5 }
            });
        } catch (validationError) {
            console.log('✓ Validação funcionando:', validationError.message);
        }

        console.log('\n✅ Demonstração concluída com sucesso!\n');

    } catch (error) {
        Logger.error('Erro na demonstração', error);
        console.error('❌ Erro na demonstração:', error.message);
    }
}

// Executar demonstração se arquivo for chamado diretamente
if (require.main === module) {
    demonstrateUsage();
}

module.exports = {
    ExampleAuthService,
    ExampleGrpcClient,
    demonstrateUsage
};