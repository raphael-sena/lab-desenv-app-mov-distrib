const crypto = require('crypto');
const grpc = require('@grpc/grpc-js');
const AuthInterceptor = require('../middleware/auth');
const ErrorHandler = require('../middleware/errorHandler');
const Logger = require('../middleware/logger');

/**
 * ChatService - Streaming bidirecional para chat em tempo real.
 * Suporta múltiplas salas (rooms) em memória.
 */
class ChatService {
  constructor() {
    // Estrutura: room -> Set(streams)
    this.rooms = new Map();
    // Map de stream para metadados: stream -> { userId, username, room }
    this.streamMetadata = new WeakMap();
  }

  /**
   * Cliente envia stream de ChatMessage e recebe stream de ChatMessage.
   */
  ChatStream(call) {
    // Primeiro evento esperado: mensagem JOIN com room e user info
    call.on('data', async (msg) => {
      try {
        if (!this.streamMetadata.has(call)) {
          // Primeira mensagem deve definir contexto (JOIN)
            if (!msg.room || !msg.username) {
              const err = ErrorHandler.createValidationError('room/username', `${msg.room}|${msg.username}`, 'Campos obrigatórios para entrar na sala');
              call.write(this._systemMessage('system', 'global', 'Erro: faltando room ou username', 'SYSTEM', true));
              call.end();
              return;
            }

          // Validar (opcional) token se enviado
          if (msg.token) {
            try {
              const decoded = AuthInterceptor.validateToken(msg.token);
              call.user = decoded; // compat
            } catch (e) {
              Logger.warn('Token inválido no ChatStream', { error: e.message });
            }
          }

          this._joinRoom(call, msg.room, msg.user_id || msg.username, msg.username);
          return; // não broadcast da mensagem JOIN original
        }

        // Broadcast de mensagem normal
        this._broadcastMessage(call, msg);
      } catch (error) {
        const grpcError = ErrorHandler.handleError(error);
        Logger.error('Erro no processamento de mensagem de chat', grpcError, { room: msg.room });
        try {
          call.write(this._systemMessage('system', msg.room, `Erro: ${grpcError.message}`, 'ERROR', true));
        } catch (_) {}
      }
    });

    call.on('error', (err) => {
      Logger.warn('Stream de chat com erro', { error: err.message });
      this._leaveRoom(call);
    });

    call.on('end', () => {
      this._leaveRoom(call);
      call.end();
    });
  }

  /**
   * Stream somente do servidor: envia histórico inicial e mensagens futuras.
   */
  Join(call) {
    const { room, user_id, username } = call.request;
    if (!room || !username) {
      const error = ErrorHandler.createValidationError('room/username', `${room}|${username}`, 'Campos obrigatórios');
      call.emit('error', error);
      call.end();
      return;
    }

    this._joinRoom(call, room, user_id || username, username, true);
  }

  /**
   * Adiciona stream à sala e envia mensagem de JOIN
   */
  _joinRoom(call, room, userId, username, serverSide = false) {
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }

    const streams = this.rooms.get(room);
    streams.add(call);
    this.streamMetadata.set(call, { userId, username, room, joinedAt: Date.now(), serverSide });

    Logger.info('Usuário entrou na sala', { room, userId, username, total: streams.size });

    // Mensagem de sistema para os demais
    const joinMsg = this._systemMessage(userId, room, `${username} entrou na sala`, 'JOIN');
    this._broadcastToRoom(room, joinMsg, call);

    // Mensagem de boas vindas para o próprio usuário
    try {
      call.write(this._systemMessage('system', room, `Bem-vindo(a), ${username}!`, 'SYSTEM'));
    } catch (_) {}
  }

  _leaveRoom(call) {
    const meta = this.streamMetadata.get(call);
    if (!meta) return;

    const { room, username, userId } = meta;
    const streams = this.rooms.get(room);
    if (!streams) return;

    streams.delete(call);
    this.streamMetadata.delete(call);

    Logger.info('Usuário saiu da sala', { room, userId, username, remaining: streams.size });

    const leaveMsg = this._systemMessage(userId, room, `${username} saiu da sala`, 'LEAVE');
    this._broadcastToRoom(room, leaveMsg, call);

    if (streams.size === 0) {
      this.rooms.delete(room);
      Logger.info('Sala removida (vazia)', { room });
    }
  }

  _broadcastMessage(call, msg) {
    const meta = this.streamMetadata.get(call);
    if (!meta) {
      Logger.warn('Mensagem recebida antes de JOIN');
      return;
    }

    const { room, username, userId } = meta;
    if (!msg.content || msg.content.trim() === '') return;

    const chatMsg = {
      id: crypto.randomUUID(),
      room,
      user_id: userId,
      username,
      content: msg.content,
      timestamp: Date.now(),
      type: 'USER'
    };

    this._broadcastToRoom(room, chatMsg);
  }

  _broadcastToRoom(room, message, excludeCall = null) {
    const streams = this.rooms.get(room);
    if (!streams) return;

    for (const stream of streams) {
      if (excludeCall && stream === excludeCall) continue;
      try {
        stream.write(message);
      } catch (e) {
        Logger.warn('Falha ao enviar mensagem para stream', { error: e.message });
      }
    }
  }

  _systemMessage(userId, room, content, type = 'SYSTEM', isError = false) {
    return {
      id: crypto.randomUUID(),
      room,
      user_id: userId,
      username: 'system',
      content,
      timestamp: Date.now(),
      type: isError ? 'ERROR' : type
    };
  }
}

module.exports = ChatService;