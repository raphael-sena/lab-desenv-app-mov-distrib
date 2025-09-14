# Chat em Tempo Real (Streaming Bidirecional gRPC)

## Visão Geral
O serviço `ChatService` implementa comunicação em tempo real usando streaming bidirecional do gRPC. Clientes enviam e recebem mensagens simultaneamente por um canal persistente.

## Proto (`chat_service.proto`)
```protobuf
service ChatService {
  rpc ChatStream(stream ChatMessage) returns (stream ChatMessage);
  rpc Join(JoinRequest) returns (stream ChatMessage);
}
```

## Mensagens
```protobuf
message ChatMessage {
  string id;        // UUID
  string room;      // sala
  string user_id;   // identificador do usuário
  string username;  // apelido exibido
  string content;   // texto
  int64 timestamp;  // epoch ms
  MessageType type; // USER, SYSTEM, JOIN, LEAVE, ERROR
}
```

## Fluxo ChatStream
1. Cliente abre stream
2. PRIMEIRA mensagem deve conter: `room`, `username` (e opcionalmente `user_id`, `token`)
3. Servidor confirma com mensagem SYSTEM e notifica outros (JOIN)
4. Mensagens subsequentes com `{ content: "texto" }` são broadcast para todos da sala
5. Encerrar stream envia LEAVE para os demais

## Tipos de Mensagem
| Tipo   | Descrição                         |
|--------|----------------------------------|
| USER   | Mensagem normal de usuário       |
| SYSTEM | Mensagem informativa do sistema  |
| JOIN   | Usuário entrou                   |
| LEAVE  | Usuário saiu                     |
| ERROR  | Erro de validação ou interno     |

## Exemplo de Cliente (Pseudo)
```js
const client = new chat.ChatService('localhost:50051', grpc.credentials.createInsecure());
const stream = client.ChatStream();

stream.on('data', msg => {
  console.log(`[${msg.room}] ${msg.username}: ${msg.content}`);
});

// Primeiro envio = JOIN
stream.write({ room: 'geral', username: 'alice' });

// Enviar mensagens
stream.write({ content: 'Olá pessoal!' });
stream.write({ content: 'Tudo bem?' });

// Fechar
stream.end();
```

## Segurança
- Token JWT opcional pode ser enviado no primeiro pacote (`token`) ou via metadata `authorization: Bearer <token>` (recomendado)
- Possível estender para verificação obrigatória

## Boas Práticas
- Limitar tamanho de mensagem no servidor
- Adicionar persistência (histórico) se necessário
- Aplicar rate limiting para evitar flood
- Identificar usuários via JWT ao invés de campo livre

## Teste Automatizado
Arquivo: `tests/chat.test.js`
Valida broadcast básico entre dois clientes simulados.

## Extensões Futuras
- Lista de usuários ativos
- Histórico inicial via `Join`
- Mensagens privadas (campo target)
- Suporte a múltiplas instâncias com Redis Pub/Sub

## Comandos Úteis
```powershell
# Rodar testes
npm test -- chat.test.js

# Subir servidor
npm start

# Subir múltiplas instâncias + LB
npm run start:multi
```
