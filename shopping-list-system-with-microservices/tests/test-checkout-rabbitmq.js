const axios = require('axios');

const BASE_URL = 'http://localhost:3002';
const USER_SERVICE_URL = 'http://localhost:3001';

async function testCheckoutWithRabbitMQ() {
    console.log('🧪 ========================================');
    console.log('🧪 TESTE DE CHECKOUT COM RABBITMQ');
    console.log('🧪 ========================================\n');

    try {
        // 1. Autenticar
        console.log('1️⃣ Autenticando usuário...');
        const loginResponse = await axios.post(`${USER_SERVICE_URL}/auth/login`, {
            identifier: 'admin@microservices.com',
            password: 'admin123'
        });

        const token = loginResponse.data.data.token;
        console.log('✅ Token obtido com sucesso\n');

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // 2. Criar uma nova lista
        console.log('2️⃣ Criando nova lista de compras...');
        const listData = {
            name: `Lista de Teste RabbitMQ ${new Date().toLocaleTimeString()}`,
            description: 'Lista criada automaticamente para testar mensageria',
            items: [
                {
                    itemId: 'test-item-001',
                    itemName: 'Notebook Dell Inspiron',
                    quantity: 1,
                    unit: 'unidade',
                    estimatedPrice: 3500.00,
                    purchased: false,
                    notes: 'Para trabalho'
                },
                {
                    itemId: 'test-item-002',
                    itemName: 'Mouse Logitech MX',
                    quantity: 2,
                    unit: 'unidade',
                    estimatedPrice: 250.00,
                    purchased: false,
                    notes: 'Sem fio'
                },
                {
                    itemId: 'test-item-003',
                    itemName: 'Teclado Mecânico',
                    quantity: 1,
                    unit: 'unidade',
                    estimatedPrice: 450.00,
                    purchased: false,
                    notes: 'RGB'
                }
            ]
        };

        const createResponse = await axios.post(`${BASE_URL}/lists`, listData, { headers });
        const listId = createResponse.data.data.id;
        
        console.log(`✅ Lista criada: ${listId}`);
        console.log(`   Nome: ${listData.name}`);
        console.log(`   Total de itens: ${listData.items.length}\n`);

        // 3. Aguardar um pouco
        console.log('⏳ Aguardando 2 segundos antes do checkout...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 4. Fazer checkout (dispara RabbitMQ)
        console.log('3️⃣ Realizando CHECKOUT (vai disparar evento RabbitMQ)...');
        const startTime = Date.now();
        
        const checkoutResponse = await axios.post(
            `${BASE_URL}/lists/${listId}/checkout`,
            {},
            { headers }
        );

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        console.log('\n✅ ========================================');
        console.log('✅ CHECKOUT REALIZADO COM SUCESSO!');
        console.log('✅ ========================================');
        console.log(`Status: ${checkoutResponse.status} ${checkoutResponse.statusText}`);
        console.log(`Tempo de resposta: ${responseTime}ms (RÁPIDO!)`);
        console.log(`\nResposta do servidor:`);
        console.log(JSON.stringify(checkoutResponse.data, null, 2));
        console.log('\n📬 ========================================');
        console.log('📬 VERIFIQUE OS TERMINAIS DOS CONSUMERS!');
        console.log('📬 ========================================');
        console.log('📧 Notification Consumer → deve mostrar envio de email');
        console.log('📊 Analytics Consumer → deve mostrar estatísticas');
        console.log('\n🌐 RabbitMQ Management: http://localhost:15672');
        console.log('   Veja as mensagens sendo processadas!\n');

        // 5. Informações adicionais
        const totalAmount = listData.items.reduce((sum, item) => 
            sum + (item.estimatedPrice * item.quantity), 0
        );

        console.log('📋 Resumo do Pedido:');
        console.log(`   • Lista ID: ${listId}`);
        console.log(`   • Total de itens: ${listData.items.length}`);
        console.log(`   • Valor total: R$ ${totalAmount.toFixed(2)}`);
        console.log(`   • Status: ${checkoutResponse.data.data.status}`);
        console.log('\n✅ Teste concluído com sucesso!\n');

    } catch (error) {
        console.error('\n❌ ========================================');
        console.error('❌ ERRO NO TESTE');
        console.error('❌ ========================================');
        
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Mensagem: ${JSON.stringify(error.response.data, null, 2)}`);
        } else if (error.request) {
            console.error('Erro de conexão. Verifique se os serviços estão rodando:');
            console.error('- User Service (porta 3001)');
            console.error('- List Service (porta 3002)');
            console.error('- RabbitMQ (porta 5672)');
        } else {
            console.error(`Erro: ${error.message}`);
        }
        console.error('\n');
    }
}

// Executar teste
console.log('\n🚀 Iniciando teste de checkout com RabbitMQ...\n');
testCheckoutWithRabbitMQ();
