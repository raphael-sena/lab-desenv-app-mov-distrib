import 'dart:async';
import '../models/task.dart';
import 'api_service.dart';
import 'connectivity_service.dart';
import 'database_service.dart';

class SyncService {
  static final SyncService instance = SyncService._init();
  
  SyncService._init();

  bool _isSyncing = false;
  StreamSubscription<bool>? _connectivitySubscription;

  // Inicializar serviço de sincronização
  Future<void> initialize() async {
    // Escutar mudanças de conectividade
    _connectivitySubscription = ConnectivityService.instance.connectionStream.listen((isOnline) {
      if (isOnline && !_isSyncing) {
        // Quando voltar a ficar online, sincronizar automaticamente
        syncPendingChanges();
      }
    });

    // Tentar sincronizar ao iniciar (se estiver online)
    if (ConnectivityService.instance.isOnline) {
      syncPendingChanges();
    }
  }

  void dispose() {
    _connectivitySubscription?.cancel();
  }

  // ========== MÉTODOS PRINCIPAIS ==========

  /// Adiciona operação à fila de sincronização
  Future<void> queueOperation({
    required int taskId,
    required String operation,
    required Task task,
  }) async {
    await DatabaseService.instance.addToSyncQueue(
      taskId: taskId,
      operation: operation,
      taskData: task.toMap(),
    );

    // Marcar como não sincronizado
    await DatabaseService.instance.markTaskAsUnsynced(taskId);

    // Se estiver online, tentar sincronizar imediatamente
    if (ConnectivityService.instance.isOnline) {
      syncPendingChanges();
    }
  }

  /// Sincroniza todas as mudanças pendentes
  Future<void> syncPendingChanges() async {
    if (_isSyncing) return;
    
    _isSyncing = true;

    try {
      print('===== INICIANDO SINCRONIZAÇÃO =====');
      
      // 1. Buscar items pendentes da fila
      final pendingItems = await DatabaseService.instance.getPendingSyncItems();

      if (pendingItems.isEmpty) {
        print('Nenhuma mudança pendente para enviar ao servidor');
      } else {
        print('Sincronizando ${pendingItems.length} mudança(s)...');

        // 2. Processar cada item da fila
        for (final item in pendingItems) {
          final syncQueueId = item['id'] as int;
          final taskId = item['taskId'] as int;
          final operation = item['operation'] as String;
          final taskData = item['taskData'] as Map<String, dynamic>;

          bool success = false;

          switch (operation) {
            case 'CREATE':
              success = await _syncCreate(taskData);
              break;
            case 'UPDATE':
              success = await _syncUpdate(taskId, taskData);
              break;
            case 'DELETE':
              success = await _syncDelete(taskId);
              break;
          }

          if (success) {
            // Marcar item da fila como sincronizado
            await DatabaseService.instance.markSyncItemAsSynced(syncQueueId);
            
            // Marcar tarefa como sincronizada (se não for DELETE)
            if (operation != 'DELETE') {
              await DatabaseService.instance.markTaskAsSynced(taskId);
            }

            print('✓ Sincronizado: $operation taskId=$taskId');
          } else {
            print('✗ Falha ao sincronizar: $operation taskId=$taskId');
          }
        }
      }

      // 3. Baixar mudanças do servidor e resolver conflitos (SEMPRE executa)
      await _pullServerChanges();
      
      print('===== SINCRONIZAÇÃO CONCLUÍDA =====');

    } catch (e) {
      print('Erro durante sincronização: $e');
    } finally {
      _isSyncing = false;
    }
  }

  // ========== SYNC OPERATIONS ==========

  Future<bool> _syncCreate(Map<String, dynamic> taskData) async {
    try {
      final task = Task.fromMap(taskData);
      final result = await ApiService.instance.createTask(task);
      return result != null;
    } catch (e) {
      print('Error syncing CREATE: $e');
      return false;
    }
  }

  Future<bool> _syncUpdate(int taskId, Map<String, dynamic> taskData) async {
    try {
      final task = Task.fromMap(taskData);
      final result = await ApiService.instance.updateTask(taskId, task);
      return result != null;
    } catch (e) {
      print('Error syncing UPDATE: $e');
      return false;
    }
  }

  Future<bool> _syncDelete(int taskId) async {
    try {
      return await ApiService.instance.deleteTask(taskId);
    } catch (e) {
      print('Error syncing DELETE: $e');
      return false;
    }
  }

  // ========== CONFLICT RESOLUTION (Last-Write-Wins) ==========

  Future<void> _pullServerChanges() async {
    try {
      print('Baixando tarefas do servidor...');
      
      // Buscar todas as tarefas do servidor
      final serverTasks = await ApiService.instance.getAllTasks();
      final localTasks = await DatabaseService.instance.getAllTasks();

      print('Servidor tem ${serverTasks.length} tarefa(s)');
      print('Local tem ${localTasks.length} tarefa(s)');

      // Criar um mapa de tarefas locais por ID para busca rápida
      final localTasksMap = <int, Task>{};
      for (final task in localTasks) {
        if (task.id != null) {
          localTasksMap[task.id!] = task;
        }
      }

      // Processar tarefas do servidor
      for (final serverTask in serverTasks) {
        if (serverTask.id == null) continue;

        final localTask = localTasksMap[serverTask.id];

        if (localTask == null) {
          // Tarefa não existe localmente, criar
          print('Criando tarefa do servidor: ${serverTask.id} - ${serverTask.title}');
          await DatabaseService.instance.create(
            serverTask.copyWith(isSynced: true).toMap()
          );
        } else {
          // Comparar timestamps: se servidor for mais recente, atualizar local
          if (serverTask.updatedAt.isAfter(localTask.updatedAt)) {
            print('Conflito resolvido (LWW): servidor mais recente para task ${serverTask.id}');
            await DatabaseService.instance.update(
              serverTask.id!,
              serverTask.copyWith(isSynced: true).toMap(),
            );
          } else {
            print('Local mais recente para task ${localTask.id}, mantendo versão local');
            // Marcar como sincronizado se ainda não estiver
            if (!localTask.isSynced) {
              await DatabaseService.instance.markTaskAsSynced(localTask.id!);
            }
          }
        }
      }

      // Verificar se há tarefas locais que foram deletadas no servidor
      final serverTaskIds = serverTasks.where((t) => t.id != null).map((t) => t.id!).toSet();
      
      for (final localTask in localTasks) {
        if (localTask.id == null) continue;

        final existsOnServer = serverTaskIds.contains(localTask.id);
        
        if (!existsOnServer && localTask.isSynced) {
          // Tarefa foi deletada no servidor
          await DatabaseService.instance.delete(localTask.id!);
          print('Tarefa ${localTask.id} deletada (removida do servidor)');
        }
      }

      print('Sincronização de tarefas do servidor concluída');
    } catch (e) {
      print('Erro ao baixar mudanças do servidor: $e');
    }
  }

  // ========== HELPER METHODS ==========

  /// Força sincronização imediata
  Future<void> forceSyncNow() async {
    if (!ConnectivityService.instance.isOnline) {
      throw Exception('Sem conexão com a internet');
    }
    await syncPendingChanges();
  }

  /// Retorna quantidade de itens pendentes
  Future<int> getPendingCount() async {
    final items = await DatabaseService.instance.getPendingSyncItems();
    return items.length;
  }

  bool get isSyncing => _isSyncing;
}
