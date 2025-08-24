const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const userRateLimit = require('./middleware/userRateLimit');

const config = require('./config/database');
const database = require('./database/database');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const logger = require('./config/logger');

/**
 * Servidor de Aplicação Tradicional
 * 
 * Implementa arquitetura cliente-servidor conforme Coulouris et al. (2012):
 * - Centralização do estado da aplicação
 * - Comunicação Request-Reply via HTTP
 * - Processamento síncrono das requisições
 */

const app = express();

// Middleware de segurança
app.use(helmet());
app.use(cors());

// Parsing de dados
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Structured logging de requisições e respostas
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('request', {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            durationMs: duration,
            params: req.params,
            query: req.query,
            body: req.body
        });
    });
    next();
});

// Rotas principais
app.get('/', (req, res) => {
    res.json({
        service: 'Task Management API',
        version: '1.0.0',
        architecture: 'Traditional Client-Server',
        endpoints: {
            auth: ['POST /api/auth/register', 'POST /api/auth/login'],
            tasks: ['GET /api/tasks', 'POST /api/tasks', 'PUT /api/tasks/:id', 'DELETE /api/tasks/:id']
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
// Aplica rate limit por usuário autenticado nas rotas de tasks
app.use('/api/tasks', require('./middleware/auth').authMiddleware, userRateLimit(config.rateLimit), taskRoutes);

// 404 handler
app.use((req, res) => {
    logger.warn('404 Not Found', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip
    });
    res.status(404).json({
        success: false,
        message: 'Endpoint não encontrado'
    });
});

// Error handler global
app.use((error, req, res, next) => {
    logger.error('Erro interno do servidor', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        stack: error.stack,
        message: error.message,
        params: req.params,
        query: req.query,
        body: req.body
    });
    res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
    });
});

// Inicialização
async function startServer() {
    try {
        await database.init();
        logger.info('Servidor iniciado', {
            port: config.port,
            url: `http://localhost:${config.port}`,
            health: `http://localhost:${config.port}/health`
        });
        app.listen(config.port, () => {
            logger.info('Servidor ouvindo', {
                port: config.port
            });
        });
    } catch (error) {
        console.error('❌ Falha na inicialização:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    startServer();
}

module.exports = app;