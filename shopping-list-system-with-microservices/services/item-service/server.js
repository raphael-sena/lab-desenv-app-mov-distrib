const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Importar banco NoSQL e service registry
const JsonDatabase = require('../../shared/JsonDatabase');
const serviceRegistry = require('../../shared/serviceRegistry');

class ItemService {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3003;
        this.serviceName = 'item-service';
        this.serviceUrl = `http://localhost:${this.port}`;
        
        this.setupDatabase();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
        this.seedInitialData();
    }

    setupDatabase() {
        const dbPath = path.join(__dirname, 'database');
        this.itemsDb = new JsonDatabase(dbPath, 'items');
        console.log('Item Service: Banco NoSQL inicializado');
    }

    async seedInitialData() {
        // Aguardar inicialização e criar itens exemplo
        setTimeout(async () => {
            try {
                const existingItems = await this.itemsDb.find();
                
                if (existingItems.length === 0) {
                    const sampleItems = [
                        // Alimentos
                        {
                            id: uuidv4(),
                            name: "Arroz Branco Tipo 1",
                            category: "Alimentos",
                            brand: "Tio João",
                            unit: "kg",
                            averagePrice: 6.99,
                            barcode: "7891234567890",
                            description: "Arroz branco tipo 1, pacote 5kg",
                            active: true,
                            createdAt: new Date().toISOString()
                        },
                        {
                            id: uuidv4(),
                            name: "Feijão Carioca",
                            category: "Alimentos",
                            brand: "Camil",
                            unit: "kg",
                            averagePrice: 8.50,
                            barcode: "7891234567891",
                            description: "Feijão carioca tipo 1, pacote 1kg",
                            active: true,
                            createdAt: new Date().toISOString()
                        },
                        {
                            id: uuidv4(),
                            name: "Açúcar Cristal",
                            category: "Alimentos",
                            brand: "União",
                            unit: "kg",
                            averagePrice: 4.99,
                            barcode: "7891234567892",
                            description: "Açúcar cristal refinado, pacote 1kg",
                            active: true,
                            createdAt: new Date().toISOString()
                        },
                        {
                            id: uuidv4(),
                            name: "Leite Integral UHT",
                            category: "Alimentos",
                            brand: "Nestle",
                            unit: "litro",
                            averagePrice: 4.50,
                            barcode: "7891234567893",
                            description: "Leite integral UHT, caixa 1L",
                            active: true,
                            createdAt: new Date().toISOString()
                        },
                        {
                            id: uuidv4(),
                            name: "Óleo de Soja",
                            category: "Alimentos",
                            brand: "Soya",
                            unit: "litro",
                            averagePrice: 5.99,
                            barcode: "7891234567894",
                            description: "Óleo de soja refinado, garrafa 900ml",
                            active: true,
                            createdAt: new Date().toISOString()
                        },

                        // Limpeza
                        {
                            id: uuidv4(),
                            name: "Detergente Líquido",
                            category: "Limpeza",
                            brand: "Ypê",
                            unit: "un",
                            averagePrice: 2.99,
                            barcode: "7891234567895",
                            description: "Detergente líquido neutro, frasco 500ml",
                            active: true,
                            createdAt: new Date().toISOString()
                        },
                        {
                            id: uuidv4(),
                            name: "Sabão em Pó",
                            category: "Limpeza",
                            brand: "OMO",
                            unit: "kg",
                            averagePrice: 12.99,
                            barcode: "7891234567896",
                            description: "Sabão em pó concentrado, caixa 1kg",
                            active: true,
                            createdAt: new Date().toISOString()
                        },
                        {
                            id: uuidv4(),
                            name: "Amaciante de Roupa",
                            category: "Limpeza",
                            brand: "Comfort",
                            unit: "litro",
                            averagePrice: 8.99,
                            barcode: "7891234567897",
                            description: "Amaciante concentrado, frasco 2L",
                            active: true,
                            createdAt: new Date().toISOString()
                        },
                        {
                            id: uuidv4(),
                            name: "Desinfetante",
                            category: "Limpeza",
                            brand: "Pinho Sol",
                            unit: "litro",
                            averagePrice: 6.99,
                            barcode: "7891234567898",
                            description: "Desinfetante pinho, frasco 1L",
                            active: true,
                            createdAt: new Date().toISOString()
                        },
                        {
                            id: uuidv4(),
                            name: "Esponja de Aço",
                            category: "Limpeza",
                            brand: "Bombril",
                            unit: "un",
                            averagePrice: 3.50,
                            barcode: "7891234567899",
                            description: "Esponja de aço, pacote com 8 unidades",
                            active: true,
                            createdAt: new Date().toISOString()
                        },

                        // Higiene
                        {
                            id: uuidv4(),
                            name: "Pasta de Dente",
                            category: "Higiene",
                            brand: "Colgate",
                            unit: "un",
                            averagePrice: 4.99,
                            barcode: "7891234567800",
                            description: "Pasta de dente total 12, tubo 90g",
                            active: true,
                            createdAt: new Date().toISOString()
                        },
                        {
                            id: uuidv4(),
                            name: "Shampoo",
                            category: "Higiene",
                            brand: "Seda",
                            unit: "un",
                            averagePrice: 12.99,
                            barcode: "7891234567801",
                            description: "Shampoo hidratação, frasco 325ml",
                            active: true,
                            createdAt: new Date().toISOString()
                        },
                        {
                            id: uuidv4(),
                            name: "Sabonete",
                            category: "Higiene",
                            brand: "Dove",
                            unit: "un",
                            averagePrice: 2.50,
                            barcode: "7891234567802",
                            description: "Sabonete hidratante, barra 90g",
                            active: true,
                            createdAt: new Date().toISOString()
                        },
                        {
                            id: uuidv4(),
                            name: "Papel Higiênico",
                            category: "Higiene",
                            brand: "Neve",
                            unit: "un",
                            averagePrice: 18.99,
                            barcode: "7891234567803",
                            description: "Papel higiênico folha dupla, pacote 12 rolos",
                            active: true,
                            createdAt: new Date().toISOString()
                        },

                        // Bebidas
                        {
                            id: uuidv4(),
                            name: "Refrigerante Cola",
                            category: "Bebidas",
                            brand: "Coca-Cola",
                            unit: "litro",
                            averagePrice: 6.99,
                            barcode: "7891234567804",
                            description: "Refrigerante cola, garrafa 2L",
                            active: true,
                            createdAt: new Date().toISOString()
                        },
                        {
                            id: uuidv4(),
                            name: "Suco de Laranja",
                            category: "Bebidas",
                            brand: "Tang",
                            unit: "un",
                            averagePrice: 3.99,
                            barcode: "7891234567805",
                            description: "Suco em pó sabor laranja, envelope 25g",
                            active: true,
                            createdAt: new Date().toISOString()
                        },
                        {
                            id: uuidv4(),
                            name: "Água Mineral",
                            category: "Bebidas",
                            brand: "Crystal",
                            unit: "litro",
                            averagePrice: 2.50,
                            barcode: "7891234567806",
                            description: "Água mineral natural, garrafa 1,5L",
                            active: true,
                            createdAt: new Date().toISOString()
                        },

                        // Padaria
                        {
                            id: uuidv4(),
                            name: "Pão de Forma",
                            category: "Padaria",
                            brand: "Pullman",
                            unit: "un",
                            averagePrice: 5.99,
                            barcode: "7891234567807",
                            description: "Pão de forma integral, pacote 500g",
                            active: true,
                            createdAt: new Date().toISOString()
                        },
                        {
                            id: uuidv4(),
                            name: "Biscoito Recheado",
                            category: "Padaria",
                            brand: "Oreo",
                            unit: "un",
                            averagePrice: 4.50,
                            barcode: "7891234567808",
                            description: "Biscoito recheado chocolate, pacote 144g",
                            active: true,
                            createdAt: new Date().toISOString()
                        },
                        {
                            id: uuidv4(),
                            name: "Bolacha Cream Cracker",
                            category: "Padaria",
                            brand: "Adria",
                            unit: "un",
                            averagePrice: 3.99,
                            barcode: "7891234567809",
                            description: "Bolacha cream cracker, pacote 200g",
                            active: true,
                            createdAt: new Date().toISOString()
                        }
                    ];

                    for (const item of sampleItems) {
                        await this.itemsDb.create(item);
                    }

                    console.log(`Itens de exemplo criados no Item Service (${sampleItems.length} itens)`);
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
                const itemCount = await this.itemsDb.count();
                const activeItems = await this.itemsDb.count({ active: true });
                
                res.json({
                    service: this.serviceName,
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime(),
                    version: '1.0.0',
                    database: {
                        type: 'JSON-NoSQL',
                        itemCount: itemCount,
                        activeItems: activeItems
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
                service: 'Item Service',
                version: '1.0.0',
                description: 'Microsserviço para catálogo de itens/produtos com NoSQL',
                database: 'JSON-NoSQL',
                endpoints: [
                    'GET /items - Listar itens com filtros',
                    'GET /items/:id - Buscar item específico',
                    'POST /items - Criar novo item (requer autenticação)',
                    'PUT /items/:id - Atualizar item',
                    'GET /categories - Listar categorias',
                    'GET /search - Buscar itens por nome'
                ]
            });
        });

        // Item routes
        this.app.get('/items', this.getItems.bind(this));
        this.app.get('/items/:id', this.getItem.bind(this));
        this.app.post('/items', this.authMiddleware.bind(this), this.createItem.bind(this));
        this.app.put('/items/:id', this.authMiddleware.bind(this), this.updateItem.bind(this));
        
        // Category routes
        this.app.get('/categories', this.getCategories.bind(this));
        
        // Search route
        this.app.get('/search', this.searchItems.bind(this));
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
            console.error('Item Service Error:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do serviço',
                service: this.serviceName
            });
        });
    }

    // Auth middleware simples (valida se existe Authorization header)
    authMiddleware(req, res, next) {
        const authHeader = req.header('Authorization');
        
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token obrigatório'
            });
        }
        
        // Para este exemplo, apenas verifica se o token existe
        // Em produção, deveria validar com User Service
        req.user = { id: 'mock-user-id' };
        next();
    }

    // Get items with filters
    async getItems(req, res) {
        try {
            const { 
                page = 1, 
                limit = 20, 
                category, 
                name,
                active = true
            } = req.query;
            
            const skip = (page - 1) * parseInt(limit);
            
            // Filtros NoSQL flexíveis
            const filter = { active: active === 'true' };

            // Filtrar por categoria
            if (category) {
                filter.category = category;
            }

            // Filtrar por nome (busca parcial)
            if (name) {
                // Simular busca case-insensitive
                const items = await this.itemsDb.find(filter);
                const filteredItems = items.filter(item => 
                    item.name.toLowerCase().includes(name.toLowerCase())
                );
                
                const paginatedItems = filteredItems.slice(skip, skip + parseInt(limit));
                
                return res.json({
                    success: true,
                    data: paginatedItems,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: filteredItems.length,
                        pages: Math.ceil(filteredItems.length / parseInt(limit))
                    }
                });
            }

            const items = await this.itemsDb.find(filter, {
                skip: skip,
                limit: parseInt(limit),
                sort: { name: 1 }
            });

            const total = await this.itemsDb.count(filter);

            res.json({
                success: true,
                data: items,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            });
        } catch (error) {
            console.error('Erro ao buscar itens:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Get item by ID
    async getItem(req, res) {
        try {
            const { id } = req.params;
            const item = await this.itemsDb.findById(id);

            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: 'Item não encontrado'
                });
            }

            res.json({
                success: true,
                data: item
            });
        } catch (error) {
            console.error('Erro ao buscar item:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Create item
    async createItem(req, res) {
        try {
            const { 
                name, 
                category, 
                brand = '',
                unit,
                averagePrice,
                barcode = '',
                description = ''
            } = req.body;

            if (!name || !category || !unit || averagePrice === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Nome, categoria, unidade e preço médio são obrigatórios'
                });
            }

            // Validar unidades válidas
            const validUnits = ['kg', 'un', 'litro', 'g', 'ml'];
            if (!validUnits.includes(unit)) {
                return res.status(400).json({
                    success: false,
                    message: 'Unidade deve ser: kg, un, litro, g ou ml'
                });
            }

            // Criar item com schema do enunciado
            const newItem = await this.itemsDb.create({
                id: uuidv4(),
                name,
                category,
                brand,
                unit,
                averagePrice: parseFloat(averagePrice),
                barcode,
                description,
                active: true,
                createdAt: new Date().toISOString()
            });

            res.status(201).json({
                success: true,
                message: 'Item criado com sucesso',
                data: newItem
            });
        } catch (error) {
            console.error('Erro ao criar item:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Update item
    async updateItem(req, res) {
        try {
            const { id } = req.params;
            const { 
                name, 
                category, 
                brand,
                unit,
                averagePrice,
                barcode,
                description,
                active
            } = req.body;

            const item = await this.itemsDb.findById(id);
            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: 'Item não encontrado'
                });
            }

            // Validar unidade se fornecida
            if (unit) {
                const validUnits = ['kg', 'un', 'litro', 'g', 'ml'];
                if (!validUnits.includes(unit)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Unidade deve ser: kg, un, litro, g ou ml'
                    });
                }
            }

            // Updates flexíveis
            const updates = {};
            if (name !== undefined) updates.name = name;
            if (category !== undefined) updates.category = category;
            if (brand !== undefined) updates.brand = brand;
            if (unit !== undefined) updates.unit = unit;
            if (averagePrice !== undefined) updates.averagePrice = parseFloat(averagePrice);
            if (barcode !== undefined) updates.barcode = barcode;
            if (description !== undefined) updates.description = description;
            if (active !== undefined) updates.active = active;

            const updatedItem = await this.itemsDb.update(id, updates);

            res.json({
                success: true,
                message: 'Item atualizado com sucesso',
                data: updatedItem
            });
        } catch (error) {
            console.error('Erro ao atualizar item:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Get categories
    async getCategories(req, res) {
        try {
            const items = await this.itemsDb.find({ active: true });
            
            // Extrair categorias únicas
            const categoriesSet = new Set();
            const categoryStats = {};
            
            items.forEach(item => {
                if (item.category) {
                    categoriesSet.add(item.category);
                    if (!categoryStats[item.category]) {
                        categoryStats[item.category] = {
                            name: item.category,
                            itemCount: 0,
                            averagePrice: 0,
                            totalPrice: 0
                        };
                    }
                    categoryStats[item.category].itemCount++;
                    categoryStats[item.category].totalPrice += item.averagePrice;
                }
            });

            // Calcular preço médio por categoria
            const categories = Array.from(categoriesSet).map(catName => {
                const stats = categoryStats[catName];
                stats.averagePrice = Math.round((stats.totalPrice / stats.itemCount) * 100) / 100;
                delete stats.totalPrice;
                return stats;
            }).sort((a, b) => a.name.localeCompare(b.name));
            
            res.json({
                success: true,
                data: categories
            });
        } catch (error) {
            console.error('Erro ao buscar categorias:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Search items
    async searchItems(req, res) {
        try {
            const { q, limit = 20 } = req.query;

            if (!q) {
                return res.status(400).json({
                    success: false,
                    message: 'Parâmetro de busca "q" é obrigatório'
                });
            }

            // Busca full-text NoSQL
            const items = await this.itemsDb.search(q, ['name', 'description', 'brand', 'category']);
            
            // Filtrar apenas itens ativos e aplicar limite
            const activeItems = items
                .filter(item => item.active)
                .slice(0, parseInt(limit));

            res.json({
                success: true,
                data: {
                    query: q,
                    results: activeItems,
                    total: activeItems.length
                }
            });
        } catch (error) {
            console.error('Erro na busca de itens:', error);
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
            endpoints: ['/health', '/items', '/categories', '/search']
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
            console.log(`Item Service iniciado na porta ${this.port}`);
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
    const itemService = new ItemService();
    itemService.start();

    // Graceful shutdown
    process.on('SIGTERM', () => {
        serviceRegistry.unregister('item-service');
        process.exit(0);
    });
    process.on('SIGINT', () => {
        serviceRegistry.unregister('item-service');
        process.exit(0);
    });
}

module.exports = ItemService;