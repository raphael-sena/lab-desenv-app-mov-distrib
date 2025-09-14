const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Utilitário JWT para Sistema gRPC
 * 
 * Gerencia criação, validação e refresh de tokens JWT
 * para autenticação em serviços gRPC distribuídos.
 */

class JWTUtils {
    constructor() {
        this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'lab02-grpc-access-secret-2025';
        this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'lab02-grpc-refresh-secret-2025';
        this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
        this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
        this.issuer = process.env.JWT_ISSUER || 'lab02-grpc-server';
        this.audience = process.env.JWT_AUDIENCE || 'lab02-grpc-clients';
    }

    /**
     * Gerar Access Token JWT
     */
    generateAccessToken(user) {
        const payload = {
            sub: user.id,           // Subject (user ID)
            email: user.email,
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
            type: 'access',
            iat: Math.floor(Date.now() / 1000),
            jti: crypto.randomUUID()  // JWT ID único
        };

        const options = {
            expiresIn: this.accessTokenExpiry,
            issuer: this.issuer,
            audience: this.audience,
            algorithm: 'HS256'
        };

        return jwt.sign(payload, this.accessTokenSecret, options);
    }

    /**
     * Gerar Refresh Token JWT
     */
    generateRefreshToken(user) {
        const payload = {
            sub: user.id,
            type: 'refresh',
            iat: Math.floor(Date.now() / 1000),
            jti: crypto.randomUUID()
        };

        const options = {
            expiresIn: this.refreshTokenExpiry,
            issuer: this.issuer,
            audience: this.audience,
            algorithm: 'HS256'
        };

        return jwt.sign(payload, this.refreshTokenSecret, options);
    }

    /**
     * Gerar par de tokens (access + refresh)
     */
    generateTokenPair(user) {
        return {
            accessToken: this.generateAccessToken(user),
            refreshToken: this.generateRefreshToken(user),
            expiresIn: this.accessTokenExpiry,
            tokenType: 'Bearer'
        };
    }

    /**
     * Validar Access Token
     */
    validateAccessToken(token) {
        try {
            const options = {
                issuer: this.issuer,
                audience: this.audience,
                algorithms: ['HS256']
            };

            const decoded = jwt.verify(token, this.accessTokenSecret, options);

            if (decoded.type !== 'access') {
                throw new Error('Token type inválido');
            }

            return {
                valid: true,
                decoded,
                user: {
                    id: decoded.sub,
                    email: decoded.email,
                    username: decoded.username,
                    first_name: decoded.first_name,
                    last_name: decoded.last_name
                }
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message,
                code: this.getErrorCode(error)
            };
        }
    }

    /**
     * Validar Refresh Token
     */
    validateRefreshToken(token) {
        try {
            const options = {
                issuer: this.issuer,
                audience: this.audience,
                algorithms: ['HS256']
            };

            const decoded = jwt.verify(token, this.refreshTokenSecret, options);

            if (decoded.type !== 'refresh') {
                throw new Error('Token type inválido');
            }

            return {
                valid: true,
                decoded,
                userId: decoded.sub
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message,
                code: this.getErrorCode(error)
            };
        }
    }

    /**
     * Renovar Access Token usando Refresh Token
     */
    refreshAccessToken(refreshToken, user) {
        const validation = this.validateRefreshToken(refreshToken);
        
        if (!validation.valid) {
            throw new Error(`Refresh token inválido: ${validation.error}`);
        }

        if (validation.userId !== user.id) {
            throw new Error('Refresh token não pertence ao usuário');
        }

        return this.generateAccessToken(user);
    }

    /**
     * Extrair token do header Authorization
     */
    extractTokenFromHeader(authHeader) {
        if (!authHeader) {
            throw new Error('Header Authorization não fornecido');
        }

        const parts = authHeader.split(' ');
        
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            throw new Error('Formato do token inválido. Use: Bearer <token>');
        }

        return parts[1];
    }

    /**
     * Decodificar token sem validação (para debug)
     */
    decodeToken(token) {
        return jwt.decode(token, { complete: true });
    }

    /**
     * Verificar se token está próximo do vencimento
     */
    isTokenNearExpiry(token, thresholdMinutes = 5) {
        try {
            const decoded = jwt.decode(token);
            if (!decoded || !decoded.exp) {
                return true;
            }

            const now = Math.floor(Date.now() / 1000);
            const timeUntilExpiry = decoded.exp - now;
            const thresholdSeconds = thresholdMinutes * 60;

            return timeUntilExpiry <= thresholdSeconds;
        } catch {
            return true;
        }
    }

    /**
     * Obter código de erro baseado no tipo de erro JWT
     */
    getErrorCode(error) {
        if (error.name === 'TokenExpiredError') {
            return 'TOKEN_EXPIRED';
        } else if (error.name === 'JsonWebTokenError') {
            return 'TOKEN_INVALID';
        } else if (error.name === 'NotBeforeError') {
            return 'TOKEN_NOT_ACTIVE';
        }
        return 'TOKEN_ERROR';
    }

    /**
     * Validar estrutura básica do token
     */
    validateTokenStructure(token) {
        if (!token) {
            throw new Error('Token não fornecido');
        }

        if (typeof token !== 'string') {
            throw new Error('Token deve ser uma string');
        }

        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Token JWT deve ter 3 partes separadas por ponto');
        }

        return true;
    }

    /**
     * Gerar token temporário (para testes ou operações específicas)
     */
    generateTemporaryToken(payload, expiresIn = '5m') {
        return jwt.sign(
            { ...payload, type: 'temporary' },
            this.accessTokenSecret,
            { expiresIn, issuer: this.issuer }
        );
    }
}

// Instância singleton
const jwtUtils = new JWTUtils();

module.exports = jwtUtils;