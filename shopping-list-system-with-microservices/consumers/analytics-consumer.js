const amqp = require('amqplib');

class AnalyticsConsumer {
    constructor() {
        this.rabbitMQUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
        this.queueName = 'analytics_queue';
        this.exchangeName = 'shopping_events';
        this.routingKey = 'list.checkout.#';
        
        // Armazenar estatísticas em memória (em produção seria um banco)
        this.stats = {
            totalCheckouts: 0,
            totalRevenue: 0,
            totalItems: 0,
            averageTicket: 0,
            checkoutsByUser: {},
            popularItems: {}
        };
        
        this.init();
    }

    async init() {
        try {
            console.log('🔌 Conectando ao RabbitMQ...');
            this.connection = await amqp.connect(this.rabbitMQUrl);
            this.channel = await this.connection.createChannel();

            // Criar exchange
            await this.channel.assertExchange(this.exchangeName, 'topic', {
                durable: true
            });

            // Criar fila
            await this.channel.assertQueue(this.queueName, {
                durable: true
            });

            // Bind fila ao exchange com routing key
            await this.channel.bindQueue(
                this.queueName,
                this.exchangeName,
                this.routingKey
            );

            // Configurar prefetch
            this.channel.prefetch(1);

            console.log('✅ Analytics Consumer iniciado!');
            console.log(`📊 Aguardando mensagens na fila "${this.queueName}"...`);
            console.log(`🔑 Routing key: ${this.routingKey}\n`);

            // Consumir mensagens
            this.channel.consume(this.queueName, this.handleMessage.bind(this), {
                noAck: false
            });

            // Listener para erros
            this.connection.on('error', (err) => {
                console.error('❌ Erro na conexão RabbitMQ:', err);
            });

            this.connection.on('close', () => {
                console.log('⚠️  Conexão RabbitMQ fechada. Reconectando em 5s...');
                setTimeout(() => this.init(), 5000);
            });

        } catch (error) {
            console.error('❌ Erro ao inicializar consumer:', error);
            console.log('⚠️  Tentando reconectar em 5s...');
            setTimeout(() => this.init(), 5000);
        }
    }

    async handleMessage(msg) {
        if (!msg) return;

        try {
            const content = JSON.parse(msg.content.toString());
            
            console.log('\n📊 ========================================');
            console.log('📊 PROCESSANDO ANALYTICS DE CHECKOUT');
            console.log('📊 ========================================');
            
            const { data } = content;
            const totalAmount = parseFloat(data.totalAmount);
            
            // Atualizar estatísticas
            this.stats.totalCheckouts++;
            this.stats.totalRevenue += totalAmount;
            this.stats.totalItems += data.totalItems;
            this.stats.averageTicket = this.stats.totalRevenue / this.stats.totalCheckouts;

            // Estatísticas por usuário
            if (!this.stats.checkoutsByUser[data.userEmail]) {
                this.stats.checkoutsByUser[data.userEmail] = {
                    count: 0,
                    totalSpent: 0
                };
            }
            this.stats.checkoutsByUser[data.userEmail].count++;
            this.stats.checkoutsByUser[data.userEmail].totalSpent += totalAmount;

            // Rastrear itens populares
            data.items.forEach(item => {
                if (!this.stats.popularItems[item.itemName]) {
                    this.stats.popularItems[item.itemName] = {
                        count: 0,
                        totalQuantity: 0
                    };
                }
                this.stats.popularItems[item.itemName].count++;
                this.stats.popularItems[item.itemName].totalQuantity += item.quantity;
            });

            // Exibir dashboard atualizado
            console.log(`\n📈 Dashboard Atualizado:`);
            console.log(`   • Total de Checkouts: ${this.stats.totalCheckouts}`);
            console.log(`   • Receita Total: R$ ${this.stats.totalRevenue.toFixed(2)}`);
            console.log(`   • Total de Itens Vendidos: ${this.stats.totalItems}`);
            console.log(`   • Ticket Médio: R$ ${this.stats.averageTicket.toFixed(2)}`);
            
            console.log(`\n💰 Checkout Atual:`);
            console.log(`   • Lista: ${data.listName}`);
            console.log(`   • Usuário: ${data.userEmail}`);
            console.log(`   • Valor: R$ ${totalAmount.toFixed(2)}`);
            console.log(`   • Itens: ${data.totalItems}`);
            
            // Top 3 itens mais populares
            const topItems = Object.entries(this.stats.popularItems)
                .sort((a, b) => b[1].totalQuantity - a[1].totalQuantity)
                .slice(0, 3);
            
            if (topItems.length > 0) {
                console.log(`\n🏆 Top 3 Itens Mais Vendidos:`);
                topItems.forEach(([itemName, stats], index) => {
                    console.log(`   ${index + 1}. ${itemName} - ${stats.totalQuantity} unidades (${stats.count} compras)`);
                });
            }
            
            console.log('\n✅ Analytics processado com sucesso!');
            console.log('========================================\n');

            // Simular delay de processamento
            await new Promise(resolve => setTimeout(resolve, 500));

            // Acknowledge da mensagem
            this.channel.ack(msg);

        } catch (error) {
            console.error('❌ Erro ao processar mensagem:', error);
            
            // Rejeitar mensagem e reenviar para a fila
            this.channel.nack(msg, false, true);
        }
    }

    // Método para exibir relatório completo (opcional)
    displayFullReport() {
        console.log('\n📊 ========================================');
        console.log('📊 RELATÓRIO COMPLETO DE ANALYTICS');
        console.log('📊 ========================================');
        console.log(JSON.stringify(this.stats, null, 2));
        console.log('========================================\n');
    }
}

// Iniciar consumer
console.log('🚀 Iniciando Analytics Consumer...\n');
const analytics = new AnalyticsConsumer();

// Exibir relatório a cada 30 segundos
setInterval(() => {
    if (analytics.stats.totalCheckouts > 0) {
        analytics.displayFullReport();
    }
}, 30000);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n⚠️  Encerrando Analytics Consumer...');
    analytics.displayFullReport();
    process.exit(0);
});
