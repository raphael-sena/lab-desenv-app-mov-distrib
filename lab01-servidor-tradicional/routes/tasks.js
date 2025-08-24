const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Task = require('../model/Task');
const database = require('../database/database');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Listar tarefas com paginação
router.get('/', async (req, res) => {
    try {
        const { completed, priority, page = 1, limit = 10 } = req.query;
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

        sql += ' ORDER BY createdAt DESC';

        // Paginação
        const pageNum = Math.max(parseInt(page), 1);
        const limitNum = Math.max(parseInt(limit), 1);
        const offset = (pageNum - 1) * limitNum;
        sql += ' LIMIT ? OFFSET ?';
        params.push(limitNum, offset);

        const [rows, countRow] = await Promise.all([
            database.all(sql, params),
            database.get(countSql, countParams)
        ]);
        const total = countRow ? countRow.total : 0;
        const tasks = rows.map(row => new Task({...row, completed: row.completed === 1}));

        res.json({
            success: true,
            data: tasks.map(task => task.toJSON()),
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
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

        res.status(201).json({
            success: true,
            message: 'Tarefa criada com sucesso',
            data: task.toJSON()
        });
    } catch (error) {
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
            return res.status(404).json({
                success: false,
                message: 'Tarefa não encontrada'
            });
        }

        const task = new Task({...row, completed: row.completed === 1});
        res.json({
            success: true,
            data: task.toJSON(),
            pagination: null
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// Atualizar tarefa
router.put('/:id', async (req, res) => {
    try {
        const { title, description, completed, priority } = req.body;
        
        const result = await database.run(
            'UPDATE tasks SET title = ?, description = ?, completed = ?, priority = ? WHERE id = ? AND userId = ?',
            [title, description, completed ? 1 : 0, priority, req.params.id, req.user.id]
        );

        if (result.changes === 0) {
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
        
        res.json({
            success: true,
            message: 'Tarefa atualizada com sucesso',
            data: task.toJSON()
        });
    } catch (error) {
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
            return res.status(404).json({
                success: false,
                message: 'Tarefa não encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Tarefa deletada com sucesso'
        });
    } catch (error) {
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

        res.json({
            success: true,
            data: {
                ...stats,
                completionRate: stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(2) : 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

module.exports = router;