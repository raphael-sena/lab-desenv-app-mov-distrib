const axios = require('axios');

class ShoppingListDemoClient {
    constructor() {
        this.baseURL = 'http://localhost:3000';
        this.authToken = null;
        this.currentUser = null;
    }

    // Utility para logs coloridos
    log(message, type = 'info') {
        const colors = {
            info: '\x1b[36m',    // Cyan
            success: '\x1b[32m', // Green
            warning: '\x1b[33m', // Yellow
            error: '\x1b[31m',   // Red
            reset: '\x1b[0m'     // Reset
        };
        console.log(`${colors[type]}${message}${colors.reset}`);
    }

    // Test health checks
    async testHealthChecks() {
        this.log('=== TESTANDO HEALTH CHECKS ===', 'info');
        
        try {
            // Gateway health
            const gatewayHealth = await axios.get(`${this.baseURL}/health`);
            this.log('✅ API Gateway: ' + gatewayHealth.data.status, 'success');

            // Service registry
            const registry = await axios.get(`${this.baseURL}/registry`);
            this.log(`✅ Services registrados: ${registry.data.count}`, 'success');
            
            Object.entries(registry.data.services).forEach(([name, service]) => {
                this.log(`   - ${name}: ${service.healthy ? '✅' : '❌'} ${service.url}`, service.healthy ? 'success' : 'error');
            });

        } catch (error) {
            this.log('❌ Erro no health check: ' + error.message, 'error');
        }
        
        console.log();
    }

    // Test user authentication
    async testAuthentication() {
        this.log('=== TESTANDO AUTENTICAÇÃO ===', 'info');
        
        try {
            // Login com admin
            const loginData = {
                identifier: 'admin@microservices.com',
                password: 'admin123'
            };
            
            const loginResponse = await axios.post(`${this.baseURL}/api/users/auth/login`, loginData);
            this.authToken = loginResponse.data.token;
            this.currentUser = loginResponse.data.user;
            
            this.log('✅ Login realizado com sucesso', 'success');
            this.log(`   Usuário: ${this.currentUser.name} (${this.currentUser.email})`, 'info');
            this.log(`   Token JWT: ${this.authToken.substring(0, 20)}...`, 'info');

        } catch (error) {
            this.log('❌ Erro na autenticação: ' + error.response?.data?.message || error.message, 'error');
        }
        
        console.log();
    }

    // Test item catalog
    async testItemCatalog() {
        this.log('=== TESTANDO CATÁLOGO DE ITENS ===', 'info');
        
        try {
            // Listar itens
            const itemsResponse = await axios.get(`${this.baseURL}/api/items?limit=5`);
            this.log(`✅ Encontrados ${itemsResponse.data.data.length} itens`, 'success');
            
            itemsResponse.data.data.forEach(item => {
                this.log(`   - ${item.name} (${item.category}) - R$ ${item.averagePrice.toFixed(2)}`, 'info');
            });

            // Testar categorias
            const categoriesResponse = await axios.get(`${this.baseURL}/api/categories`);
            this.log(`✅ Encontradas ${categoriesResponse.data.data.length} categorias`, 'success');
            
            categoriesResponse.data.data.forEach(cat => {
                this.log(`   - ${cat.name}: ${cat.itemCount} itens (média R$ ${cat.averagePrice.toFixed(2)})`, 'info');
            });

            // Buscar itens
            const searchResponse = await axios.get(`${this.baseURL}/api/items?name=arroz`);
            this.log(`✅ Busca por "arroz": ${searchResponse.data.data.length} resultados`, 'success');

        } catch (error) {
            this.log('❌ Erro no catálogo: ' + error.response?.data?.message || error.message, 'error');
        }
        
        console.log();
    }

    // Test list management
    async testListManagement() {
        this.log('=== TESTANDO GERENCIAMENTO DE LISTAS ===', 'info');
        
        if (!this.authToken) {
            this.log('❌ Token de autenticação necessário', 'error');
            return;
        }

        const headers = { Authorization: `Bearer ${this.authToken}` };
        
        try {
            // Criar nova lista
            const listData = {
                name: 'Lista de Compras Demo',
                description: 'Lista criada pelo cliente de demonstração',
                budget: 100.0
            };

            const createResponse = await axios.post(`${this.baseURL}/api/lists`, listData, { headers });
            const listId = createResponse.data.data.id;
            
            this.log(`✅ Lista criada: ${createResponse.data.data.name} (ID: ${listId})`, 'success');

            // Buscar alguns itens para adicionar
            const itemsResponse = await axios.get(`${this.baseURL}/api/items?limit=3`);
            const items = itemsResponse.data.data;

            // Adicionar itens à lista
            for (const item of items) {
                const itemData = {
                    itemId: item.id,
                    quantity: Math.floor(Math.random() * 3) + 1, // 1-3 unidades
                    notes: `Adicionado automaticamente - ${item.brand || 'sem marca'}`
                };

                const addResponse = await axios.post(`${this.baseURL}/api/lists/${listId}/items`, itemData, { headers });
                this.log(`   ✅ Item adicionado: ${item.name} (${itemData.quantity}x)`, 'success');
            }

            // Recuperar lista completa com cálculos
            const fullListResponse = await axios.get(`${this.baseURL}/api/lists/${listId}`, { headers });
            const fullList = fullListResponse.data.data;

            this.log('📊 Resumo da Lista:', 'info');
            this.log(`   Itens: ${fullList.items.length}`, 'info');
            this.log(`   Total: R$ ${fullList.summary.total.toFixed(2)}`, 'info');
            this.log(`   Orçamento: R$ ${fullList.budget.toFixed(2)}`, 'info');
            this.log(`   Status: ${fullList.summary.total <= fullList.budget ? '✅ Dentro do orçamento' : '⚠️ Acima do orçamento'}`, 
                fullList.summary.total <= fullList.budget ? 'success' : 'warning');

        } catch (error) {
            this.log('❌ Erro no gerenciamento: ' + error.response?.data?.message || error.message, 'error');
        }
        
        console.log();
    }

    // Test global search
    async testGlobalSearch() {
        this.log('=== TESTANDO BUSCA GLOBAL ===', 'info');
        
        try {
            const searchTerm = 'leite';
            const searchResponse = await axios.get(`${this.baseURL}/api/search?q=${searchTerm}`);
            
            this.log(`✅ Busca global por "${searchTerm}"`, 'success');
            
            Object.entries(searchResponse.data.data).forEach(([service, results]) => {
                if (results.success && results.data.length > 0) {
                    this.log(`   ${service}: ${results.data.length} resultados`, 'info');
                } else {
                    this.log(`   ${service}: sem resultados`, 'warning');
                }
            });

        } catch (error) {
            this.log('❌ Erro na busca global: ' + error.response?.data?.message || error.message, 'error');
        }
        
        console.log();
    }

    // Test dashboard
    async testDashboard() {
        this.log('=== TESTANDO DASHBOARD ===', 'info');
        
        if (!this.authToken) {
            this.log('❌ Token de autenticação necessário', 'error');
            return;
        }

        const headers = { Authorization: `Bearer ${this.authToken}` };
        
        try {
            const dashResponse = await axios.get(`${this.baseURL}/api/dashboard`, { headers });
            const dashboard = dashResponse.data.data;

            this.log('📊 Dashboard do Sistema:', 'success');
            this.log(`   Arquitetura: ${dashboard.architecture}`, 'info');
            this.log(`   Serviços ativos: ${Object.keys(dashboard.services_status).length}`, 'info');
            
            if (dashboard.users?.available) {
                this.log(`   Usuários: ${dashboard.users.data.length} registrados`, 'info');
            }
            
            if (dashboard.lists?.available) {
                this.log(`   Listas: ${dashboard.lists.data.length} criadas`, 'info');
            }

            if (dashboard.items?.available) {
                this.log(`   Itens: ${dashboard.items.data.length} no catálogo`, 'info');
            }

        } catch (error) {
            this.log('❌ Erro no dashboard: ' + error.response?.data?.message || error.message, 'error');
        }
        
        console.log();
    }

    // Run all tests
    async runAllTests() {
        this.log('🚀 INICIANDO DEMONSTRAÇÃO COMPLETA DO SISTEMA', 'success');
        this.log('================================================', 'success');
        console.log();

        await this.testHealthChecks();
        await this.testAuthentication();
        await this.testItemCatalog();
        await this.testListManagement();
        await this.testGlobalSearch();
        await this.testDashboard();

        this.log('🎉 DEMONSTRAÇÃO CONCLUÍDA COM SUCESSO!', 'success');
        this.log('===========================================', 'success');
    }
}

// Execute demonstration
if (require.main === module) {
    const demo = new ShoppingListDemoClient();
    
    demo.runAllTests().catch(error => {
        console.error('\n❌ Erro fatal na demonstração:', error.message);
        process.exit(1);
    });
}

module.exports = ShoppingListDemoClient;