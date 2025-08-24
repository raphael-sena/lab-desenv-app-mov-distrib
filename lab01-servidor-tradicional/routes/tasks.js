const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Task = require('../model/Task');
const database = require('../database/database');
const memoryCache = require('../config/memoryCache');
const logger = require('../config/logger');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Listar tarefas com paginação e cache
router.get('/', async (req, res) => {
    try {
        const { completed, priority, page = 1, limit = 10, date, category, tags } = req.query;
        const pageNum = Math.max(parseInt(page), 1);
        const limitNum = Math.max(parseInt(limit), 1);

        // Cache baseado em usuário, filtros, página e limite
        const cacheKey = `tasks:${req.user.id}:completed=${completed}:priority=${priority}:date=${date}:category=${category}:tags=${tags}:page=${pageNum}:limit=${limitNum}`;

        const cached = memoryCache.get(cacheKey);
        if (cached) {
            logger.info('Cache hit for tasks list', {
                userId: req.user.id,
                query: req.query
            });
            return res.json(cached);
        }

        let sql = 'SELECT * FROM tasks WHERE userId = ?';
        let countSql = 'SELECT COUNT(*) as total FROM tasks WHERE userId = ?';
        const params = [req.user.id];
        const countParams = [req.user.id];

        if (completed !== undefined) {
            sql += ' AND completed = ?';
            countSql += ' AND completed = ?';
            const completedVal = completed === 'true' ? 1 : 0;
            params.push(completedVal);
            countParams.push(completedVal);
        }
        
        if (priority) {
            sql += ' AND priority = ?';
            countSql += ' AND priority = ?';
            params.push(priority);
            countParams.push(priority);
        }

        if (date) {
            sql += ' AND DATE(createdAt) = DATE(?)';
            countSql += ' AND DATE(createdAt) = DATE(?)';
            params.push(date);
            countParams.push(date);
        }

        if (category) {
            sql += ' AND category = ?';
            countSql += ' AND category = ?';
            params.push(category);
            countParams.push(category);
        }

        if (tags) {
            // Tags podem ser separadas por vírgula, correspondendo a qualquer tag
            const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
            if (tagList.length > 0) {
                const tagConditions = tagList.map(() => `tags LIKE ?`).join(' OR ');
                sql += ` AND (${tagConditions})`;
                countSql += ` AND (${tagConditions})`;
                tagList.forEach(tag => {
                    params.push(`%${tag}%`);
                    countParams.push(`%${tag}%`);
                });
            }
        }

        sql += ' ORDER BY createdAt DESC';
        const offset = (pageNum - 1) * limitNum;
        sql += ' LIMIT ? OFFSET ?';
        params.push(limitNum, offset);

        const [rows, countRow] = await Promise.all([
            database.all(sql, params),
            database.get(countSql, countParams)
        ]);
        const total = countRow ? countRow.total : 0;
        const tasks = rows.map(row => new Task({...row, completed: row.completed === 1}));

        const response = {
            success: true,
            data: tasks.map(task => task.toJSON()),
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        };
        // Cache 30 segundos
        memoryCache.set(cacheKey, response, 30000);
        logger.info('Tasks listed', {
            userId: req.user.id,
            query: req.query,
            total,
            page: pageNum,
            limit: limitNum
        });
        res.json(response);
    } catch (error) {
        logger.error('Erro ao listar tarefas', {
            userId: req.user?.id,
            error: error.message,
            stack: error.stack,
            query: req.query
        });
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// Criar tarefa
router.post('/', validate('task'), async (req, res) => {
    try {
        const taskData = { 
            id: uuidv4(), 
            ...req.body, 
            userId: req.user.id 
        };
        
        const task = new Task(taskData);
        const validation = task.validate();
        
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Dados inválidos',
                errors: validation.errors
            });
        }

        await database.run(
            'INSERT INTO tasks (id, title, description, priority, userId) VALUES (?, ?, ?, ?, ?)',
            [task.id, task.title, task.description, task.priority, task.userId]
        );

        // Invalidar todos os caches para este usuário
        memoryCache.clear();
        logger.info('Task created', {
            userId: req.user.id,
            taskId: task.id,
            title: task.title
        });
        res.status(201).json({
            success: true,
            message: 'Tarefa criada com sucesso',
            data: task.toJSON()
        });
    } catch (error) {
        logger.error('Erro ao criar tarefa', {
            userId: req.user?.id,
            error: error.message,
            stack: error.stack,
            body: req.body
        });
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// Buscar tarefa por ID (sem paginação, mas mantendo a estrutura)
router.get('/:id', async (req, res) => {
    try {
        const row = await database.get(
            'SELECT * FROM tasks WHERE id = ? AND userId = ?',
            [req.params.id, req.user.id]
        );

        if (!row) {
            logger.warn('Task not found', {
                userId: req.user.id,
                taskId: req.params.id
            });
            return res.status(404).json({
                success: false,
                message: 'Tarefa não encontrada'
            });
        }

        const task = new Task({...row, completed: row.completed === 1});
        logger.info('Task fetched', {
            userId: req.user.id,
            taskId: req.params.id
        });
        res.json({
            success: true,
            data: task.toJSON(),
            pagination: null
        });
    } catch (error) {
        logger.error('Erro ao buscar tarefa por ID', {
            userId: req.user?.id,
            taskId: req.params?.id,
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// Atualizar tarefa
router.put('/:id', async (req, res) => {
    try {
        const { title, description, completed, priority, category, tags } = req.body;
        // tags: array or comma-separated string
        let tagsStr = '';
        if (Array.isArray(tags)) {
            tagsStr = tags.join(',');
        } else if (typeof tags === 'string') {
            tagsStr = tags;
        }

        const result = await database.run(
            'UPDATE tasks SET title = ?, description = ?, completed = ?, priority = ?, category = ?, tags = ? WHERE id = ? AND userId = ?',
            [title, description, completed ? 1 : 0, priority, category, tagsStr, req.params.id, req.user.id]
        );

        if (result.changes === 0) {
            logger.warn('Task not found for update', {
                userId: req.user.id,
                taskId: req.params.id
            });
            return res.status(404).json({
                success: false,
                message: 'Tarefa não encontrada'
            });
        }

        const updatedRow = await database.get(
            'SELECT * FROM tasks WHERE id = ? AND userId = ?',
            [req.params.id, req.user.id]
        );

        const task = new Task({...updatedRow, completed: updatedRow.completed === 1});
        // Invalidar todos os caches para este usuário
        memoryCache.clear();
        logger.info('Task updated', {
            userId: req.user.id,
            taskId: req.params.id
        });
        res.json({
            success: true,
            message: 'Tarefa atualizada com sucesso',
            data: task.toJSON()
        });
    } catch (error) {
        logger.error('Erro ao atualizar tarefa', {
            userId: req.user?.id,
            taskId: req.params?.id,
            error: error.message,
            stack: error.stack,
            body: req.body
        });
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// Deletar tarefa
router.delete('/:id', async (req, res) => {
    try {
        const result = await database.run(
            'DELETE FROM tasks WHERE id = ? AND userId = ?',
            [req.params.id, req.user.id]
        );

        if (result.changes === 0) {
            logger.warn('Task not found for delete', {
                userId: req.user.id,
                taskId: req.params.id
            });
            return res.status(404).json({
                success: false,
                message: 'Tarefa não encontrada'
            });
        }
        // Invalidar todos os caches para este usuário
        memoryCache.clear();
        logger.info('Task deleted', {
            userId: req.user.id,
            taskId: req.params.id
        });
        res.json({
            success: true,
            message: 'Tarefa deletada com sucesso'
        });
    } catch (error) {
        logger.error('Erro ao deletar tarefa', {
            userId: req.user?.id,
            taskId: req.params?.id,
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// Estatísticas
router.get('/stats/summary', async (req, res) => {
    try {
        const stats = await database.get(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN completed = 0 THEN 1 ELSE 0 END) as pending
            FROM tasks WHERE userId = ?
        `, [req.user.id]);

        logger.info('Task stats fetched', {
            userId: req.user.id,
            stats
        });
        res.json({
            success: true,
            data: {
                ...stats,
                completionRate: stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(2) : 0
            }
        });
    } catch (error) {
        logger.error('Erro ao buscar estatísticas', {
            userId: req.user?.id,
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

module.exports = router;