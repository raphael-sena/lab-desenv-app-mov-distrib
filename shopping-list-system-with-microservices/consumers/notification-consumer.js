const amqp = require('amqplib');

class NotificationConsumer {
    constructor() {
        this.rabbitMQUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
        this.queueName = 'notification_queue';
        this.exchangeName = 'shopping_events';
        this.routingKey = 'list.checkout.#';
        
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

            // Configurar prefetch para processar uma mensagem por vez
            this.channel.prefetch(1);

            console.log('✅ Notification Consumer iniciado!');
            console.log(`📬 Aguardando mensagens na fila "${this.queueName}"...`);
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
            
            console.log('\n📧 ========================================');
            console.log('📧 NOVO EVENTO DE CHECKOUT RECEBIDO');
            console.log('📧 ========================================');
            
            const { data } = content;
            
            // Simular envio de email/notificação
            console.log(`\n📤 Enviando comprovante da lista [${data.listId}] para o usuário [${data.userEmail}]`);
            console.log(`\n📋 Detalhes da Compra:`);
            console.log(`   • Lista: ${data.listName}`);
            console.log(`   • Total de itens: ${data.totalItems}`);
            console.log(`   • Valor total: R$ ${data.totalAmount}`);
            console.log(`   • Data: ${content.timestamp}`);
            
            console.log(`\n📦 Itens comprados:`);
            data.items.forEach((item, index) => {
                console.log(`   ${index + 1}. ${item.itemName} - ${item.quantity}x R$ ${item.estimatedPrice}`);
            });
            
            console.log('\n✅ Notificação enviada com sucesso!');
            console.log('========================================\n');

            // Simular delay de processamento
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Acknowledge da mensagem
            this.channel.ack(msg);

        } catch (error) {
            console.error('❌ Erro ao processar mensagem:', error);
            
            // Rejeitar mensagem e reenviar para a fila
            this.channel.nack(msg, false, true);
        }
    }
}

// Iniciar consumer
console.log('🚀 Iniciando Notification Consumer...\n');
new NotificationConsumer();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n⚠️  Encerrando Notification Consumer...');
    process.exit(0);
});
