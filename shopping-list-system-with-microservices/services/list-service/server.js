const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const axios = require('axios');
const amqp = require('amqplib');

// Importar banco NoSQL e service registry
const JsonDatabase = require('../../shared/JsonDatabase');
const serviceRegistry = require('../../shared/serviceRegistry');

class ListService {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3002;
        this.serviceName = 'list-service';
        this.serviceUrl = `http://127.0.0.1:${this.port}`;
        this.rabbitMQUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
        this.rabbitConnection = null;
        this.rabbitChannel = null;
        
        this.setupDatabase();
        this.setupRabbitMQ();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
        this.seedInitialData();
    }

    setupDatabase() {
        const dbPath = path.join(__dirname, 'database');
        this.listsDb = new JsonDatabase(dbPath, 'lists');
        console.log('List Service: Banco NoSQL inicializado');
    }

    async setupRabbitMQ() {
        try {
            this.rabbitConnection = await amqp.connect(this.rabbitMQUrl);
            this.rabbitChannel = await this.rabbitConnection.createChannel();
            
            // Criar exchange do tipo topic
            await this.rabbitChannel.assertExchange('shopping_events', 'topic', {
                durable: true
            });
            
            console.log('✅ List Service: RabbitMQ conectado - Exchange "shopping_events" criado');
            
            // Listener para reconexão
            this.rabbitConnection.on('error', (err) => {
                console.error('❌ RabbitMQ connection error:', err);
            });
            
            this.rabbitConnection.on('close', () => {
                console.log('⚠️  RabbitMQ connection closed. Reconnecting in 5s...');
                setTimeout(() => this.setupRabbitMQ(), 5000);
            });
        } catch (error) {
            console.error('❌ Erro ao conectar RabbitMQ:', error.message);
            console.log('⚠️  Tentando reconectar em 5s...');
            setTimeout(() => this.setupRabbitMQ(), 5000);
        }
    }

    async publishEvent(routingKey, message) {
        try {
            if (!this.rabbitChannel) {
                throw new Error('Canal RabbitMQ não disponível');
            }
            
            const messageBuffer = Buffer.from(JSON.stringify(message));
            this.rabbitChannel.publish(
                'shopping_events',
                routingKey,
                messageBuffer,
                { persistent: true }
            );
            
            console.log(`📤 Evento publicado: ${routingKey}`);
            return true;
        } catch (error) {
            console.error('❌ Erro ao publicar evento:', error);
            return false;
        }
    }

    async seedInitialData() {
        // Aguardar inicialização e criar listas exemplo
        setTimeout(async () => {
            try {
                const existingLists = await this.listsDb.find();
                
                if (existingLists.length === 0) {
                    const sampleLists = [
                        {
                            id: uuidv4(),
                            userId: "admin-user-id",
                            name: "Lista de Compras Semanal",
                            description: "Lista para compras semanais no supermercado",
                            status: "active",
                            items: [
                                {
                                    itemId: "item-001",
                                    itemName: "Leite Integral 1L",
                                    quantity: 2,
                                    unit: "unidade",
                                    estimatedPrice: 4.50,
                                    purchased: false,
                                    notes: "Preferir marca conhecida",
                                    addedAt: new Date().toISOString()
                                },
                                {
                                    itemId: "item-002", 
                                    itemName: "Pão de Forma",
                                    quantity: 1,
                                    unit: "pacote",
                                    estimatedPrice: 3.99,
                                    purchased: true,
                                    notes: "",
                                    addedAt: new Date().toISOString()
                                }
                            ],
                            summary: {
                                totalItems: 2,
                                purchasedItems: 1,
                                estimatedTotal: 8.49
                            },
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        },
                        {
                            id: uuidv4(),
                            userId: "admin-user-id",
                            name: "Lista de Materiais Escritório",
                            description: "Materiais necessários para o escritório",
                            status: "active",
                            items: [
                                {
                                    itemId: "item-003",
                                    itemName: "Canetas Azuis",
                                    quantity: 12,
                                    unit: "unidade",
                                    estimatedPrice: 1.50,
                                    purchased: false,
                                    notes: "Bic cristal",
                                    addedAt: new Date().toISOString()
                                },
                                {
                                    itemId: "item-004",
                                    itemName: "Resma Papel A4",
                                    quantity: 3,
                                    unit: "resma",
                                    estimatedPrice: 25.90,
                                    purchased: false,
                                    notes: "75g/m²",
                                    addedAt: new Date().toISOString()
                                }
                            ],
                            summary: {
                                totalItems: 2,
                                purchasedItems: 0,
                                estimatedTotal: 95.70
                            },
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        },
                        {
                            id: uuidv4(),
                            userId: "admin-user-id",
                            name: "Lista de Compras Festa",
                            description: "Itens para festa de aniversário",
                            status: "completed",
                            items: [
                                {
                                    itemId: "item-005",
                                    itemName: "Bolo de Chocolate",
                                    quantity: 1,
                                    unit: "unidade",
                                    estimatedPrice: 45.00,
                                    purchased: true,
                                    notes: "Encomendado na confeitaria",
                                    addedAt: new Date().toISOString()
                                },
                                {
                                    itemId: "item-006",
                                    itemName: "Refrigerante 2L",
                                    quantity: 3,
                                    unit: "garrafa",
                                    estimatedPrice: 8.99,
                                    purchased: true,
                                    notes: "Coca-Cola, Guaraná, Sprite",
                                    addedAt: new Date().toISOString()
                                }
                            ],
                            summary: {
                                totalItems: 2,
                                purchasedItems: 2,
                                estimatedTotal: 71.97
                            },
                            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                            updatedAt: new Date().toISOString()
                        }
                    ];

                    for (const list of sampleLists) {
                        await this.listsDb.create(list);
                    }

                    console.log('Listas de exemplo criadas no List Service');
                }
            } catch (error) {
                console.error('Erro ao criar dados iniciais:', error);
            }
        }, 1000);
    }

    setupMiddleware() {
        this.app.use(helmet());
        this.app.use(cors());
        this.app.use(morgan('combined'));
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));

        // Service info headers
        this.app.use((req, res, next) => {
            res.setHeader('X-Service', this.serviceName);
            res.setHeader('X-Service-Version', '1.0.0');
            res.setHeader('X-Database', 'JSON-NoSQL');
            next();
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', async (req, res) => {
            try {
                const listCount = await this.listsDb.count();
                const activeLists = await this.listsDb.count({ status: 'active' });
                
                res.json({
                    service: this.serviceName,
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime(),
                    version: '1.0.0',
                    database: {
                        type: 'JSON-NoSQL',
                        listCount: listCount,
                        activeLists: activeLists
                    }
                });
            } catch (error) {
                res.status(503).json({
                    service: this.serviceName,
                    status: 'unhealthy',
                    error: error.message
                });
            }
        });

        // Service info
        this.app.get('/', (req, res) => {
            res.json({
                service: 'List Service',
                version: '1.0.0',
                description: 'Microsserviço para gerenciamento de listas de compras com NoSQL',
                database: 'JSON-NoSQL',
                endpoints: [
                    'GET /lists - Listar listas do usuário',
                    'GET /lists/:id - Buscar lista específica',
                    'POST /lists - Criar nova lista',
                    'PUT /lists/:id - Atualizar lista',
                    'DELETE /lists/:id - Deletar lista',
                    'POST /lists/:id/items - Adicionar item à lista',
                    'PUT /lists/:id/items/:itemId - Atualizar item da lista',
                    'DELETE /lists/:id/items/:itemId - Remover item da lista',
                    'GET /lists/:id/summary - Resumo da lista',
                    'POST /lists/:id/checkout - Finalizar compra (publica evento)'
                ]
            });
        });

        // List routes
        this.app.get('/lists', this.authMiddleware.bind(this), this.getLists.bind(this));
        this.app.get('/lists/:id', this.authMiddleware.bind(this), this.getList.bind(this));
        this.app.post('/lists', this.authMiddleware.bind(this), this.createList.bind(this));
        this.app.put('/lists/:id', this.authMiddleware.bind(this), this.updateList.bind(this));
        this.app.delete('/lists/:id', this.authMiddleware.bind(this), this.deleteList.bind(this));
        
        // List items routes
        this.app.post('/lists/:id/items', this.authMiddleware.bind(this), this.addItemToList.bind(this));
        this.app.put('/lists/:id/items/:itemId', this.authMiddleware.bind(this), this.updateListItem.bind(this));
        this.app.delete('/lists/:id/items/:itemId', this.authMiddleware.bind(this), this.removeItemFromList.bind(this));

        // Summary route
        this.app.get('/lists/:id/summary', this.authMiddleware.bind(this), this.getListSummary.bind(this));

        // Checkout route (RabbitMQ)
        this.app.post('/lists/:id/checkout', this.authMiddleware.bind(this), this.checkoutList.bind(this));

        // Search route
        this.app.get('/search', this.authMiddleware.bind(this), this.searchLists.bind(this));
    }

    setupErrorHandling() {
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                message: 'Endpoint não encontrado',
                service: this.serviceName
            });
        });

        this.app.use((error, req, res, next) => {
            console.error('Product Service Error:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do serviço',
                service: this.serviceName
            });
        });
    }

    // Auth middleware (valida token com User Service)
    async authMiddleware(req, res, next) {
        const authHeader = req.header('Authorization');
        
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token obrigatório'
            });
        }

        try {
            // Descobrir User Service
            const userService = serviceRegistry.discover('user-service');
            
            // Validar token com User Service
            const response = await axios.post(`${userService.url}/auth/validate`, {
                token: authHeader.replace('Bearer ', '')
            }, { timeout: 5000 });

            if (response.data.success) {
                req.user = response.data.data.user;
                next();
            } else {
                res.status(401).json({
                    success: false,
                    message: 'Token inválido'
                });
            }
        } catch (error) {
            console.error('Erro na validação do token:', error.message);
            res.status(503).json({
                success: false,
                message: 'Serviço de autenticação indisponível'
            });
        }
    }

    // Get lists do usuário (com filtros e paginação)
    async getLists(req, res) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                status = 'active',
                search
            } = req.query;
            
            const skip = (page - 1) * parseInt(limit);
            
            // Filtrar apenas listas do usuário
            const filter = { 
                userId: req.user.id,
                ...(status !== 'all' ? { status } : {})
            };

            let lists;
            
            // Se há busca por texto, usar método de search
            if (search) {
                lists = await this.listsDb.search(search, ['name', 'description']);
                // Aplicar filtros do usuário e status
                lists = lists.filter(list => {
                    if (list.userId !== req.user.id) return false;
                    if (status !== 'all' && list.status !== status) return false;
                    return true;
                });
                // Aplicar paginação manual
                lists = lists.slice(skip, skip + parseInt(limit));
            } else {
                lists = await this.listsDb.find(filter, {
                    skip: skip,
                    limit: parseInt(limit),
                    sort: { updatedAt: -1 }
                });
            }

            const total = await this.listsDb.count(filter);

            res.json({
                success: true,
                data: lists,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            });
        } catch (error) {
            console.error('Erro ao buscar listas:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Get list by ID
    async getList(req, res) {
        try {
            const { id } = req.params;
            const list = await this.listsDb.findById(id);

            if (!list) {
                return res.status(404).json({
                    success: false,
                    message: 'Lista não encontrada'
                });
            }

            // Verificar permissão (usuário só pode ver suas próprias listas)
            if (list.userId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Acesso negado'
                });
            }

            res.json({
                success: true,
                data: list
            });
        } catch (error) {
            console.error('Erro ao buscar lista:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Create list (seguindo schema especificado)
    async createList(req, res) {
        try {
            const { 
                name, 
                description = ''
            } = req.body;

            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: 'Nome da lista é obrigatório'
                });
            }

            // Criar lista com schema especificado
            const newList = await this.listsDb.create({
                id: uuidv4(),
                userId: req.user.id,
                name,
                description,
                status: 'active',
                items: [],
                summary: {
                    totalItems: 0,
                    purchasedItems: 0,
                    estimatedTotal: 0
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            res.status(201).json({
                success: true,
                message: 'Lista criada com sucesso',
                data: newList
            });
        } catch (error) {
            console.error('Erro ao criar lista:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Função auxiliar para calcular summary da lista
    calculateListSummary(items) {
        const totalItems = items.length;
        const purchasedItems = items.filter(item => item.purchased).length;
        const estimatedTotal = items.reduce((total, item) => {
            return total + (item.estimatedPrice * item.quantity);
        }, 0);

        return {
            totalItems,
            purchasedItems,
            estimatedTotal: Math.round(estimatedTotal * 100) / 100 // Arredondar para 2 casas decimais
        };
    }

    // Update list (demonstrando flexibilidade NoSQL)
    async updateList(req, res) {
        try {
            const { id } = req.params;
            const { 
                name, 
            } = req.body;

            const list = await this.listsDb.findById(id);
            if (!list) {
                return res.status(404).json({
                    success: false,
                    message: 'Lista não encontrada'
                });
            }

            // Verificar permissão (usuário só pode atualizar suas próprias listas)
            if (list.userId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Acesso negado'
                });
            }

            // Validar status
            const validStatuses = ['active', 'completed', 'archived'];
            if (status && !validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Status inválido. Use: active, completed ou archived'
                });
            }

            // Updates flexíveis com NoSQL
            const updates = {
                updatedAt: new Date().toISOString()
            };
            
            if (name !== undefined) updates.name = name;
            if (description !== undefined) updates.description = description;
            if (status !== undefined) updates.status = status;

            const updatedList = await this.listsDb.update(id, updates);

            res.json({
                success: true,
                message: 'Lista atualizada com sucesso',
                data: updatedList
            });
        } catch (error) {
            console.error('Erro ao atualizar lista:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Delete list (soft delete - muda status para archived)
    async deleteList(req, res) {
        try {
            const { id } = req.params;

            const list = await this.listsDb.findById(id);
            if (!list) {
                return res.status(404).json({
                    success: false,
                    message: 'Lista não encontrada'
                });
            }

            // Verificar permissão (usuário só pode deletar suas próprias listas)
            if (list.userId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Acesso negado'
                });
            }

            // Soft delete - muda status para archived
            await this.listsDb.update(id, { 
                status: 'archived',
                updatedAt: new Date().toISOString()
            });

            res.json({
                success: true,
                message: 'Lista arquivada com sucesso'
            });
        } catch (error) {
            console.error('Erro ao deletar lista:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Add item to list
    async addItemToList(req, res) {
        try {
            const { id } = req.params;
            const { 
                itemId, 
                itemName, 
                quantity, 
                unit, 
                estimatedPrice, 
                notes = ''
            } = req.body;

            // Validações
            if (!itemId || !itemName || !quantity || !unit || estimatedPrice === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'itemId, itemName, quantity, unit e estimatedPrice são obrigatórios'
                });
            }

            const list = await this.listsDb.findById(id);
            if (!list) {
                return res.status(404).json({
                    success: false,
                    message: 'Lista não encontrada'
                });
            }

            // Verificar permissão
            if (list.userId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Acesso negado'
                });
            }

            // Verificar se item já existe na lista
            const existingItemIndex = list.items.findIndex(item => item.itemId === itemId);
            if (existingItemIndex !== -1) {
                return res.status(409).json({
                    success: false,
                    message: 'Item já existe na lista'
                });
            }

            // Criar novo item seguindo schema
            const newItem = {
                itemId,
                itemName,
                quantity: parseInt(quantity),
                unit,
                estimatedPrice: parseFloat(estimatedPrice),
                purchased: false,
                notes,
                addedAt: new Date().toISOString()
            };

            // Adicionar item à lista
            const updatedItems = [...list.items, newItem];
            
            // Recalcular summary
            const newSummary = this.calculateListSummary(updatedItems);

            // Atualizar lista no banco
            await this.listsDb.update(id, { 
                items: updatedItems,
                summary: newSummary,
                updatedAt: new Date().toISOString()
            });

            res.status(201).json({
                success: true,
                message: 'Item adicionado à lista com sucesso',
                data: {
                    listId: id,
                    item: newItem,
                    summary: newSummary
                }
            });
        } catch (error) {
            console.error('Erro ao adicionar item à lista:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Update list item
    async updateListItem(req, res) {
        try {
            const { id, itemId } = req.params;
            const { 
                itemName, 
                quantity, 
                unit, 
                estimatedPrice, 
                purchased,
                notes
            } = req.body;

            const list = await this.listsDb.findById(id);
            if (!list) {
                return res.status(404).json({
                    success: false,
                    message: 'Lista não encontrada'
                });
            }

            // Verificar permissão
            if (list.userId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Acesso negado'
                });
            }

            // Encontrar o item na lista
            const itemIndex = list.items.findIndex(item => item.itemId === itemId);
            if (itemIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Item não encontrado na lista'
                });
            }

            // Atualizar item
            const updatedItem = { ...list.items[itemIndex] };
            if (itemName !== undefined) updatedItem.itemName = itemName;
            if (quantity !== undefined) updatedItem.quantity = parseInt(quantity);
            if (unit !== undefined) updatedItem.unit = unit;
            if (estimatedPrice !== undefined) updatedItem.estimatedPrice = parseFloat(estimatedPrice);
            if (purchased !== undefined) updatedItem.purchased = purchased;
            if (notes !== undefined) updatedItem.notes = notes;

            // Atualizar array de itens
            const updatedItems = [...list.items];
            updatedItems[itemIndex] = updatedItem;

            // Recalcular summary
            const newSummary = this.calculateListSummary(updatedItems);

            // Atualizar lista no banco
            await this.listsDb.update(id, { 
                items: updatedItems,
                summary: newSummary,
                updatedAt: new Date().toISOString()
            });
            
            res.json({
                success: true,
                message: 'Item atualizado com sucesso',
                data: {
                    listId: id,
                    item: updatedItem,
                    summary: newSummary
                }
            });
        } catch (error) {
            console.error('Erro ao atualizar item da lista:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Remove item from list
    async removeItemFromList(req, res) {
        try {
            const { id, itemId } = req.params;

            const list = await this.listsDb.findById(id);
            if (!list) {
                return res.status(404).json({
                    success: false,
                    message: 'Lista não encontrada'
                });
            }

            // Verificar permissão
            if (list.userId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Acesso negado'
                });
            }

            // Encontrar o item na lista
            const itemIndex = list.items.findIndex(item => item.itemId === itemId);
            if (itemIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Item não encontrado na lista'
                });
            }

            // Remover item
            const updatedItems = list.items.filter(item => item.itemId !== itemId);

            // Recalcular summary
            const newSummary = this.calculateListSummary(updatedItems);

            // Atualizar lista no banco
            await this.listsDb.update(id, { 
                items: updatedItems,
                summary: newSummary,
                updatedAt: new Date().toISOString()
            });

            res.json({
                success: true,
                message: 'Item removido da lista com sucesso',
                data: {
                    listId: id,
                    removedItemId: itemId,
                    summary: newSummary
                }
            });
        } catch (error) {
            console.error('Erro ao remover item da lista:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Get list summary
    async getListSummary(req, res) {
        try {
            const { id } = req.params;

            const list = await this.listsDb.findById(id);
            if (!list) {
                return res.status(404).json({
                    success: false,
                    message: 'Lista não encontrada'
                });
            }

            // Verificar permissão
            if (list.userId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Acesso negado'
                });
            }

            res.json({
                success: true,
                data: {
                    listId: id,
                    listName: list.name,
                    summary: list.summary,
                    status: list.status
                }
            });
        } catch (error) {
            console.error('Erro ao buscar resumo da lista:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Search lists
    async searchLists(req, res) {
        try {
            const { q, limit = 10 } = req.query;

            if (!q) {
                return res.status(400).json({
                    success: false,
                    message: 'Parâmetro de busca "q" é obrigatório'
                });
            }

            // Busca full-text NoSQL filtrando por usuário
            let lists = await this.listsDb.search(q, ['name', 'description']);
            
            // Filtrar apenas listas do usuário
            lists = lists.filter(list => list.userId === req.user.id);
            
            // Aplicar limite
            lists = lists.slice(0, parseInt(limit));

            res.json({
                success: true,
                data: {
                    query: q,
                    results: lists,
                    total: lists.length
                }
            });
        } catch (error) {
            console.error('Erro na busca de listas:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Checkout list (RabbitMQ Producer)
    async checkoutList(req, res) {
        try {
            const { id } = req.params;

            const list = await this.listsDb.findById(id);
            if (!list) {
                return res.status(404).json({
                    success: false,
                    message: 'Lista não encontrada'
                });
            }

            // Verificar permissão
            if (list.userId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Acesso negado'
                });
            }

            // Calcular total da lista
            const totalAmount = list.items.reduce((sum, item) => {
                return sum + (item.estimatedPrice || 0) * (item.quantity || 1);
            }, 0);

            // Preparar mensagem para RabbitMQ
            const checkoutEvent = {
                eventType: 'list.checkout.completed',
                timestamp: new Date().toISOString(),
                data: {
                    listId: id,
                    listName: list.name,
                    userId: req.user.id,
                    userEmail: req.user.email,
                    totalItems: list.items.length,
                    totalAmount: totalAmount.toFixed(2),
                    items: list.items.map(item => ({
                        itemId: item.itemId,
                        itemName: item.itemName,
                        quantity: item.quantity,
                        estimatedPrice: item.estimatedPrice
                    }))
                }
            };

            // Publicar evento no RabbitMQ
            const published = await this.publishEvent('list.checkout.completed', checkoutEvent);

            if (!published) {
                return res.status(503).json({
                    success: false,
                    message: 'Erro ao publicar evento de checkout'
                });
            }

            // Atualizar status da lista
            await this.listsDb.update(id, { 
                status: 'completed',
                completedAt: new Date().toISOString()
            });

            // Retornar 202 Accepted imediatamente
            res.status(202).json({
                success: true,
                message: 'Checkout iniciado - processamento assíncrono em andamento',
                data: {
                    listId: id,
                    totalAmount: totalAmount.toFixed(2),
                    status: 'processing'
                }
            });

            console.log(`✅ Checkout processado para lista ${id} - Evento publicado`);
        } catch (error) {
            console.error('Erro no checkout da lista:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Register with service registry
    registerWithRegistry() {
        serviceRegistry.register(this.serviceName, {
            url: this.serviceUrl,
            version: '1.0.0',
            database: 'JSON-NoSQL',
            endpoints: ['/health', '/lists', '/lists/:id/items', '/lists/:id/summary', '/search']
        });
    }

    // Start health check reporting
    startHealthReporting() {
        setInterval(() => {
            serviceRegistry.updateHealth(this.serviceName, true);
        }, 30000);
    }

    start() {
        this.app.listen(this.port, () => {
            console.log('=====================================');
            console.log(`List Service iniciado na porta ${this.port}`);
            console.log(`URL: ${this.serviceUrl}`);
            console.log(`Health: ${this.serviceUrl}/health`);
            console.log(`Database: JSON-NoSQL`);
            console.log('=====================================');
            
            // Register with service registry
            this.registerWithRegistry();
            this.startHealthReporting();
        });
    }
}

// Start service
if (require.main === module) {
    const listService = new ListService();
    listService.start();

    // Graceful shutdown
    process.on('SIGTERM', () => {
        serviceRegistry.unregister('list-service');
        process.exit(0);
    });
    process.on('SIGINT', () => {
        serviceRegistry.unregister('list-service');
        process.exit(0);
    });
}

module.exports = ListService;
