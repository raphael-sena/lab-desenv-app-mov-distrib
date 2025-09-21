const axios = require('axios');

async function testSystem() {
    const baseURL = 'http://localhost:3000';
    
    try {
        console.log('=== TESTE RÁPIDO DO SISTEMA ===');
        
        // 1. Criar usuário
        console.log('1. Criando usuário...');
        const userData = {
            email: 'demo2@test.com',
            username: 'demouser2',
            password: '123456',
            firstName: 'Demo',
            lastName: 'User'
        };
        
        const createResponse = await axios.post(`${baseURL}/api/users/auth/register`, userData);
        console.log('✅ Usuário criado:', createResponse.data.message);
        
        // 2. Login
        console.log('2. Fazendo login...');
        const loginData = {
            identifier: 'demo2@test.com',
            password: '123456'
        };
        
        const loginResponse = await axios.post(`${baseURL}/api/users/auth/login`, loginData);
        const token = loginResponse.data.token;
        console.log('✅ Login realizado, token obtido');
        
        // 3. Testar itens
        console.log('3. Testando catálogo...');
        const itemsResponse = await axios.get(`${baseURL}/api/items?limit=3`);
        console.log(`✅ ${itemsResponse.data.data.length} itens encontrados`);
        itemsResponse.data.data.forEach(item => {
            console.log(`   - ${item.name}: R$ ${item.averagePrice.toFixed(2)}`);
        });
        
        // 4. Criar lista
        console.log('4. Criando lista...');
        const listData = {
            name: 'Lista de Teste',
            description: 'Teste do sistema',
            budget: 50.0
        };
        
        const headers = { Authorization: `Bearer ${token}` };
        const listResponse = await axios.post(`${baseURL}/api/lists`, listData, { headers });
        const listId = listResponse.data.data.id;
        console.log('✅ Lista criada:', listResponse.data.data.name);
        
        // 5. Adicionar item à lista
        console.log('5. Adicionando item à lista...');
        const firstItem = itemsResponse.data.data[0];
        const itemData = {
            itemId: firstItem.id,
            quantity: 2,
            notes: 'Teste de adição'
        };
        
        const addItemResponse = await axios.post(`${baseURL}/api/lists/${listId}/items`, itemData, { headers });
        console.log('✅ Item adicionado à lista');
        
        // 6. Ver lista completa
        console.log('6. Recuperando lista completa...');
        const fullListResponse = await axios.get(`${baseURL}/api/lists/${listId}`, { headers });
        const fullList = fullListResponse.data.data;
        
        console.log('📊 Lista final:');
        console.log(`   Nome: ${fullList.name}`);
        console.log(`   Itens: ${fullList.items.length}`);
        console.log(`   Total: R$ ${fullList.summary.total.toFixed(2)}`);
        console.log(`   Orçamento: R$ ${fullList.budget.toFixed(2)}`);
        
        console.log('\n🎉 SISTEMA FUNCIONANDO PERFEITAMENTE!');
        
    } catch (error) {
        console.error('❌ Erro:', error.response?.data?.message || error.message);
    }
}

testSystem();