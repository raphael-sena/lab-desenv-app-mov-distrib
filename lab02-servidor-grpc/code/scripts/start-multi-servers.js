/**
 * Script para subir múltiplas instâncias do servidor gRPC
 * e um load balancer simples em frente a elas.
 */

const { spawn } = require('child_process');
const path = require('path');

function startServer(port, index) {
  const serverPath = path.join(__dirname, '..', 'server.js');
  const env = { ...process.env, GRPC_PORT: port, INSTANCE_ID: `srv-${index}` };

  const proc = spawn('node', [serverPath], { env });

  proc.stdout.on('data', data => {
    process.stdout.write(`[S${index} ${port}] ${data}`);
  });
  proc.stderr.on('data', data => {
    process.stderr.write(`[S${index} ${port} ERROR] ${data}`);
  });
  proc.on('exit', code => {
    console.log(`[S${index}] Servidor na porta ${port} saiu com código ${code}`);
  });

  return proc;
}

function startLoadBalancer() {
  const lbPath = path.join(__dirname, '..', 'load-balancer.js');
  const env = { ...process.env, GRPC_LB_PORT: 50050 };
  const proc = spawn('node', [lbPath], { env });

  proc.stdout.on('data', data => process.stdout.write(`[LB] ${data}`));
  proc.stderr.on('data', data => process.stderr.write(`[LB ERROR] ${data}`));
  proc.on('exit', code => console.log(`[LB] Load Balancer saiu com código ${code}`));
  return proc;
}

async function main() {
  console.log('Iniciando múltiplos servidores gRPC + Load Balancer...');
  const servers = [];
  const basePort = 50051;
  const instances = parseInt(process.env.GRPC_INSTANCES || '2', 10);

  for (let i = 0; i < instances; i++) {
    servers.push(startServer(basePort + i, i + 1));
  }

  const lb = startLoadBalancer();

  process.on('SIGINT', () => {
    console.log('\nEncerrando todos os processos...');
    servers.forEach(p => p.kill());
    lb.kill();
    process.exit(0);
  });
}

main().catch(err => {
  console.error('Falha ao iniciar multi-servidor:', err);
  process.exit(1);
});