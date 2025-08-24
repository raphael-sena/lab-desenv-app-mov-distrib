const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

// Middleware de rate limit por usuário autenticado
function userRateLimit(options = {}) {
    return rateLimit({
        ...options,
        keyGenerator: (req) => {
            // Se autenticado, usa o id do usuário, senão IP (com IPv6 subnet handling)
            if (req.user && req.user.id) {
                return `user:${req.user.id}`;
            }
            return ipKeyGenerator(req.ip);
        },
        handler: (req, res, next) => {
            res.status(429).json({
                success: false,
                message: 'Limite de requisições atingido. Tente novamente mais tarde.'
            });
        }
    });
}

module.exports = userRateLimit;
