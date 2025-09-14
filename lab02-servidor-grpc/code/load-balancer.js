/**
 * Load Balancer gRPC (Proxy TCP Round-Robin)
 * 
 * Este componente atua como um proxy simples em nível de TCP
 * distribuindo conexões entre múltiplas instâncias do servidor gRPC.
 * Não depende de bibliotecas externas e serve como recurso didático.
 * 
 * Limitações:
 * - Não interpreta HTTP/2, só repassa os bytes (camada 4)
 * - Sem TLS (para produção seria necessário)
 * - Sem circuit breaker avançado (apenas tentativas simples)
 * 
 * Recursos:
 * - Round-robin para distribuição de conexões
 * - Health check simples (opcional)
 * - Remoção temporária de destinos que falham
 */

const net = require('net');
const Logger = require('./middleware/logger');

class GrpcLoadBalancer {
  constructor(options = {}) {
    this.listenPort = options.listenPort || 50050; // Porta de entrada do LB
    this.targets = options.targets || [
      { host: '127.0.0.1', port: 50051 },
      { host: '127.0.0.1', port: 50052 }
    ];
    this.currentIndex = 0;
    this.server = null;
    this.failedTargets = new Map(); // key -> timestamp última falha
    this.failureCooldownMs = options.failureCooldownMs || 15000; // 15s pausa antes de reconsiderar alvo
  }

  /**
   * Seleciona próximo destino usando round-robin, ignorando temporariamente destinos em falha
   */
  getNextTarget() {
    const now = Date.now();
    for (let i = 0; i < this.targets.length; i++) {
      const idx = (this.currentIndex + i) % this.targets.length;
      const target = this.targets[idx];
      const key = `${target.host}:${target.port}`;
      const failedAt = this.failedTargets.get(key);
      if (failedAt && now - failedAt < this.failureCooldownMs) {
        continue; // ainda em cooldown
      }
      this.currentIndex = (idx + 1) % this.targets.length;
      return target;
    }
    // Se todos falharam recentemente, limpar cooldown para tentar novamente
    this.failedTargets.clear();
    this.currentIndex = 0;
    return this.targets[0];
  }

  markTargetFailed(target) {
    const key = `${target.host}:${target.port}`;
    this.failedTargets.set(key, Date.now());
    Logger.warn('Destino marcado como falho', { target: key });
  }

  start() {
    if (this.server) return;

    this.server = net.createServer((clientSocket) => {
      const target = this.getNextTarget();
      const targetKey = `${target.host}:${target.port}`;
      Logger.info('Nova conexão encaminhada', { target: targetKey });

      const upstream = net.createConnection(target.port, target.host);

      // Encaminhar dados (TCP pipe)
      clientSocket.pipe(upstream).pipe(clientSocket);

      // Erros no destino
      upstream.on('error', (err) => {
        Logger.error('Erro no destino gRPC', err, { target: targetKey });
        this.markTargetFailed(target);
        clientSocket.destroy();
      });

      // Erros no cliente
      clientSocket.on('error', (err) => {
        Logger.warn('Erro no socket cliente', { error: err.message });
        upstream.destroy();
      });
    });

    this.server.on('error', (err) => {
      Logger.error('Erro no Load Balancer', err);
    });

    this.server.listen(this.listenPort, () => {
      Logger.info('Load Balancer gRPC iniciado', {
        listening: this.listenPort,
        targets: this.targets.map(t => `${t.host}:${t.port}`)
      });
      console.log('⚖️  Load Balancer gRPC ouvindo na porta', this.listenPort);
    });
  }

  stop(callback) {
    if (!this.server) return callback && callback();
    this.server.close(callback);
  }
}

// Execução direta
if (require.main === module) {
  const lb = new GrpcLoadBalancer({
    listenPort: process.env.GRPC_LB_PORT || 50050,
    targets: [
      { host: '127.0.0.1', port: 50051 },
      { host: '127.0.0.1', port: 50052 }
    ]
  });
  lb.start();
}

module.exports = GrpcLoadBalancer;