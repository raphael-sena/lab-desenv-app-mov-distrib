const grpc = require('@grpc/grpc-js');
const ProtoLoader = require('../utils/protoLoader');
const ChatService = require('../services/ChatService');

/**
 * Teste básico de ChatService broadcast.
 * NOTA: Este teste usa chamada direta ao handler (sem rede) para foco na lógica.
 */

describe('ChatService', () => {
  let chatService;
  let chatProto;

  beforeAll(() => {
    chatService = new ChatService();
    const loader = new ProtoLoader();
    chatProto = loader.loadProto('chat_service.proto', 'chat');
  });

  test('deve fazer broadcast de mensagem para todos os clientes na sala', (done) => {
    const room = 'sala-test';
    const receivedClient2 = [];

    // Mock de stream (call) simplificado
    function createMockCall() {
      const handlers = { data: null, end: null, error: null };
      const call = {
        writes: [],
        on: (event, fn) => { handlers[event] = fn; },
        write: (msg) => { call.writes.push(msg); },
        end: () => {},
        _handlers: handlers
      };
      return call;
    }

    const mockCall1 = createMockCall();
    const mockCall2 = createMockCall();

    // Entrar na sala (JOIN) via ChatStream primeira mensagem
    chatService.ChatStream(mockCall1);
    chatService.ChatStream(mockCall2);

    // Simular primeira mensagem (join) para cada
    mockCall1._handlers.data({ room, username: 'alice', user_id: 'u1' });
    mockCall2._handlers.data({ room, username: 'bob', user_id: 'u2' });

    // Limpar writes de welcome/system para focalizar no broadcast
    mockCall1.writes = [];
    mockCall2.writes = [];

    // Enviar mensagem de Alice
    const content = 'Olá Bob';
    mockCall1._handlers.data({ content });

    // Broadcast é síncrono; verificar diretamente
    const bobMessages = mockCall2.writes.filter(m => m.type === 'USER');
    expect(bobMessages.length).toBe(1);
    expect(bobMessages[0].content).toBe(content);
    done();
  });
});