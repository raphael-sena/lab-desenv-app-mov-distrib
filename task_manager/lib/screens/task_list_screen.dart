import 'package:flutter/material.dart';
import '../models/task.dart';
import '../services/camera_service.dart';
import '../services/database_service.dart';
import '../services/sensor_service.dart';
import '../services/location_service.dart';
import '../services/connectivity_service.dart';
import '../services/sync_service.dart';
import '../screens/task_form_screen.dart';
import '../widgets/task_card.dart';
import 'dart:async';

class TaskListScreen extends StatefulWidget {
  const TaskListScreen({super.key});

  @override
  State<TaskListScreen> createState() => _TaskListScreenState();
}

class _TaskListScreenState extends State<TaskListScreen> {
  List<Task> _tasks = [];
  String _filter = 'all';
  bool _isLoading = true;
  bool _isOnline = false;
  int _pendingSyncCount = 0;
  bool _isSyncing = false;
  StreamSubscription<bool>? _connectivitySubscription;

  @override
  void initState() {
    super.initState();
    _loadTasks();
    _setupShakeDetection(); // INICIAR SHAKE
    _setupConnectivityListener(); // INICIAR LISTENER DE CONECTIVIDADE
    _updateOnlineStatus();
    _updatePendingSyncCount();
    _initialSync(); // SINCRONIZAÇÃO INICIAL
  }

  // Sincronização inicial ao abrir o app
  Future<void> _initialSync() async {
    // Aguardar um pouco para garantir que a conectividade foi verificada
    await Future.delayed(const Duration(milliseconds: 500));
    
    if (ConnectivityService.instance.isOnline) {
      try {
        print('===== INICIANDO SINCRONIZAÇÃO AUTOMÁTICA =====');
        setState(() => _isSyncing = true);
        
        await SyncService.instance.syncPendingChanges();
        await _loadTasks();
        _updatePendingSyncCount();
        
        print('===== SINCRONIZAÇÃO AUTOMÁTICA CONCLUÍDA =====');
      } catch (e) {
        print('Erro na sincronização inicial: $e');
      } finally {
        if (mounted) {
          setState(() => _isSyncing = false);
        }
      }
    }
  }

  @override
  void dispose() {
    SensorService.instance.stop(); // PARAR SHAKE
    _connectivitySubscription?.cancel();
    super.dispose();
  }

  // CONNECTIVITY LISTENER
  void _setupConnectivityListener() {
    _connectivitySubscription = ConnectivityService.instance.connectionStream.listen((isOnline) {
      if (mounted) {
        setState(() {
          _isOnline = isOnline;
        });

        if (isOnline) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('🟢 Conectado - Sincronizando...'),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 2),
            ),
          );
          _updatePendingSyncCount();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('🔴 Offline - Mudanças serão sincronizadas quando voltar a conexão'),
              backgroundColor: Colors.red,
              duration: Duration(seconds: 3),
            ),
          );
        }
      }
    });
  }

  void _updateOnlineStatus() {
    setState(() {
      _isOnline = ConnectivityService.instance.isOnline;
    });
  }

  Future<void> _updatePendingSyncCount() async {
    final count = await SyncService.instance.getPendingCount();
    if (mounted) {
      setState(() {
        _pendingSyncCount = count;
      });
    }
  }

  // SHAKE DETECTION
  void _setupShakeDetection() {
    SensorService.instance.startShakeDetection(() {
      _showShakeDialog();
    });
  }

  void _showShakeDialog() {
    final pendingTasks = _tasks.where((t) => !t.completed).toList();

    if (pendingTasks.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('🎉 Nenhuma tarefa pendente!'),
          backgroundColor: Colors.green,
        ),
      );
      return;
    }

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: const [
            Icon(Icons.vibration, color: Colors.blue),
            SizedBox(width: 8),
            Expanded(child: Text('Shake detectado!')),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Selecione uma tarefa para completar:'),
            const SizedBox(height: 16),
            ...pendingTasks
                .take(3)
                .map(
                  (task) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(
                      task.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    trailing: IconButton(
                      icon: const Icon(Icons.check_circle, color: Colors.green),
                      onPressed: () => _completeTaskByShake(task),
                    ),
                  ),
                ),
            if (pendingTasks.length > 3)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  '+ ${pendingTasks.length - 3} outras',
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                ),
              ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
        ],
      ),
    );
  }

  Future<void> _completeTaskByShake(Task task) async {
    try {
      final updated = task.copyWith(
        completed: true,
        completedAt: DateTime.now(),
        completedBy: 'shake',
      );

      await DatabaseService.instance.update(updated.id!, updated.toMap());
      Navigator.pop(context);
      
      // Adicionar à fila de sincronização
      if (updated.id != null) {
        await SyncService.instance.queueOperation(
          taskId: updated.id!,
          operation: 'UPDATE',
          task: updated,
        );
      }
      
      await _loadTasks();
      _updatePendingSyncCount();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✅ "${task.title}" completa via shake!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      Navigator.pop(context);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _loadTasks() async {
    setState(() => _isLoading = true);

    try {
      // Substitua por `readAll`, `getAll`, `readAllTasks` ou pelo método correto do seu DatabaseService
      final tasks = await DatabaseService.instance.getAllTasks();

      if (mounted) {
        setState(() {
          _tasks = tasks;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro ao carregar: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  List<Task> get _filteredTasks {
    switch (_filter) {
      case 'pending':
        return _tasks.where((t) => !t.completed).toList();
      case 'completed':
        return _tasks.where((t) => t.completed).toList();
      case 'nearby':
        // Implementar filtro de proximidade
        return _tasks;
      default:
        return _tasks;
    }
  }

  Map<String, int> get _statistics {
    final total = _tasks.length;
    final completed = _tasks.where((t) => t.completed).length;
    final pending = total - completed;
    final completionRate = total > 0 ? ((completed / total) * 100).round() : 0;

    return {
      'total': total,
      'completed': completed,
      'pending': pending,
      'completionRate': completionRate,
    };
  }

  Future<void> _filterByNearby() async {
    final position = await LocationService.instance.getCurrentLocation();

    if (position == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('❌ Não foi possível obter localização'),
            backgroundColor: Colors.red,
          ),
        );
      }
      return;
    }

    final nearbyTasks = await DatabaseService.instance.getTasksNearLocation(
      latitude: position.latitude,
      longitude: position.longitude,
      radiusInMeters: 1000,
    );

    setState(() {
      _tasks = nearbyTasks;
      _filter = 'nearby';
    });

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('📍 ${nearbyTasks.length} tarefa(s) próxima(s)'),
          backgroundColor: Colors.blue,
        ),
      );
    }
  }

  Future<void> _deleteTask(Task task) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmar exclusão'),
        content: Text('Deseja deletar "${task.title}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Deletar'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      if (task.hasPhoto &&
          task.photoPaths != null &&
          task.photoPaths!.isNotEmpty) {
        await CameraService.instance.deletePhotos(task.photoPaths!);
      }

      await DatabaseService.instance.delete(task.id!);
      
      // Adicionar à fila de sincronização
      if (task.id != null) {
        await SyncService.instance.queueOperation(
          taskId: task.id!,
          operation: 'DELETE',
          task: task,
        );
      }
      
      await _loadTasks();
      _updatePendingSyncCount();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('🗑️ Tarefa deletada'),
            duration: Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _toggleComplete(Task task) async {
    try {
      final updated = task.copyWith(
        completed: !task.completed,
        completedAt: !task.completed ? DateTime.now() : null,
        completedBy: !task.completed ? 'manual' : null,
      );

      await DatabaseService.instance.update(updated.id!, updated.toMap());
      
      // Adicionar à fila de sincronização
      if (updated.id != null) {
        await SyncService.instance.queueOperation(
          taskId: updated.id!,
          operation: 'UPDATE',
          task: updated,
        );
      }
      
      await _loadTasks();
      _updatePendingSyncCount();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final stats = _statistics;
    final filteredTasks = _filteredTasks;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Minhas Tarefas'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        actions: [
          // Status de conectividade com badge
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                icon: Icon(
                  _isOnline ? Icons.cloud_done : Icons.cloud_off,
                  color: Colors.white,
                ),
                tooltip: _isOnline ? 'Online' : 'Offline',
                onPressed: () {
                  showDialog(
                    context: context,
                    builder: (context) => AlertDialog(
                      title: Row(
                        children: [
                          Icon(
                            _isOnline ? Icons.wifi : Icons.wifi_off,
                            color: _isOnline ? Colors.green : Colors.red,
                          ),
                          const SizedBox(width: 8),
                          Text(_isOnline ? 'Conectado' : 'Offline'),
                        ],
                      ),
                      content: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _isOnline 
                                ? 'Você está online. As tarefas serão sincronizadas automaticamente.' 
                                : 'Você está offline. As alterações serão salvas localmente e sincronizadas quando a conexão for restaurada.',
                          ),
                          if (_pendingSyncCount > 0) ...[
                            const SizedBox(height: 16),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.orange.shade50,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: Colors.orange.shade200),
                              ),
                              child: Row(
                                children: [
                                  Icon(Icons.sync, color: Colors.orange.shade700),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      '$_pendingSyncCount alteraç${_pendingSyncCount > 1 ? 'ões' : 'ão'} aguardando sincronização',
                                      style: TextStyle(color: Colors.orange.shade900),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(context),
                          child: const Text('Fechar'),
                        ),
                      ],
                    ),
                  );
                },
              ),
              // Badge indicador de status
              if (!_isOnline || _pendingSyncCount > 0)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: !_isOnline ? Colors.red : Colors.orange,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 16,
                      minHeight: 16,
                    ),
                    child: _pendingSyncCount > 0
                        ? Text(
                            _pendingSyncCount > 9 ? '9+' : '$_pendingSyncCount',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                            textAlign: TextAlign.center,
                          )
                        : null,
                  ),
                ),
            ],
          ),
          // Filtros
          Stack(
            alignment: Alignment.center,
            children: [
              PopupMenuButton<String>(
                icon: const Icon(Icons.filter_list),
                tooltip: 'Filtrar tarefas',
                onSelected: (value) {
                  if (value == 'nearby') {
                    _filterByNearby();
                  } else {
                    setState(() {
                      _filter = value;
                      if (value != 'nearby') _loadTasks();
                    });
                  }
                },
                itemBuilder: (context) => [
                  PopupMenuItem(
                    value: 'all',
                    child: Row(
                      children: [
                        Icon(Icons.list_alt, color: _filter == 'all' ? Colors.blue : null),
                        const SizedBox(width: 8),
                        Text('Todas', style: TextStyle(fontWeight: _filter == 'all' ? FontWeight.bold : null)),
                      ],
                    ),
                  ),
                  PopupMenuItem(
                    value: 'pending',
                    child: Row(
                      children: [
                        Icon(Icons.pending_outlined, color: _filter == 'pending' ? Colors.blue : null),
                        const SizedBox(width: 8),
                        Text('Pendentes', style: TextStyle(fontWeight: _filter == 'pending' ? FontWeight.bold : null)),
                      ],
                    ),
                  ),
                  PopupMenuItem(
                    value: 'completed',
                    child: Row(
                      children: [
                        Icon(Icons.check_circle_outline, color: _filter == 'completed' ? Colors.blue : null),
                        const SizedBox(width: 8),
                        Text('Concluídas', style: TextStyle(fontWeight: _filter == 'completed' ? FontWeight.bold : null)),
                      ],
                    ),
                  ),
                  PopupMenuItem(
                    value: 'nearby',
                    child: Row(
                      children: [
                        Icon(Icons.near_me, color: _filter == 'nearby' ? Colors.blue : null),
                        const SizedBox(width: 8),
                        Text('Próximas', style: TextStyle(fontWeight: _filter == 'nearby' ? FontWeight.bold : null)),
                      ],
                    ),
                  ),
                ],
              ),
              // Badge indicador de filtro ativo
              if (_filter != 'all')
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: Colors.orange,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 1.5),
                    ),
                  ),
                ),
            ],
          ),
          // Sincronização manual
          IconButton(
            icon: _isSyncing 
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : const Icon(Icons.sync),
            tooltip: 'Sincronizar',
            onPressed: (_isOnline && !_isSyncing) ? () async {
              try {
                print('===== SINCRONIZAÇÃO MANUAL INICIADA =====');
                setState(() => _isSyncing = true);
                
                await SyncService.instance.forceSyncNow();
                await _loadTasks();
                _updatePendingSyncCount();
                
                print('===== SINCRONIZAÇÃO MANUAL CONCLUÍDA =====');
                
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('✓ Sincronização concluída'),
                      backgroundColor: Colors.green,
                      duration: Duration(seconds: 2),
                    ),
                  );
                }
              } catch (e) {
                print('Erro na sincronização manual: $e');
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Erro: $e'),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              } finally {
                if (mounted) {
                  setState(() => _isSyncing = false);
                }
              }
            } : null,
          ),
          // Menu de informações
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert),
            tooltip: 'Mais opções',
            onSelected: (value) {
              if (value == 'tips') {
                showDialog(
                  context: context,
                  builder: (context) => AlertDialog(
                    title: const Text('💡 Dicas de Uso'),
                    content: SingleChildScrollView(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text('• Toque no card para editar'),
                          SizedBox(height: 8),
                          Text('• Marque como completa com checkbox'),
                          SizedBox(height: 8),
                          Text('• Sacuda o celular para completar rápido!'),
                          SizedBox(height: 8),
                          Text('• Use filtros para organizar'),
                          SizedBox(height: 8),
                          Text('• Adicione fotos e localização'),
                          SizedBox(height: 8),
                          Text('• Modo offline: alterações sincronizam automaticamente'),
                        ],
                      ),
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('Entendi'),
                      ),
                    ],
                  ),
                );
              } else if (value == 'about') {
                showDialog(
                  context: context,
                  builder: (context) => AlertDialog(
                    title: const Text('📱 Sobre'),
                    content: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text('Task Manager', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                        SizedBox(height: 8),
                        Text('Versão 1.0.0'),
                        SizedBox(height: 16),
                        Text('Recursos:'),
                        SizedBox(height: 8),
                        Text('✓ Modo Offline-First'),
                        Text('✓ Sincronização automática'),
                        Text('✓ Detecção de shake'),
                        Text('✓ Câmera integrada'),
                        Text('✓ Geolocalização'),
                        Text('✓ Filtros inteligentes'),
                      ],
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('Fechar'),
                      ),
                    ],
                  ),
                );
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'tips',
                child: Row(
                  children: [
                    Icon(Icons.lightbulb_outline),
                    SizedBox(width: 8),
                    Text('Dicas de Uso'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'about',
                child: Row(
                  children: [
                    Icon(Icons.info_outline),
                    SizedBox(width: 8),
                    Text('Sobre o App'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadTasks,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : Column(
                children: [
                  // CARD DE ESTATÍSTICAS
                  Container(
                    margin: const EdgeInsets.all(16),
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Colors.blue.shade400, Colors.blue.shade700],
                      ),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.blue.withOpacity(0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _StatItem(
                          label: 'Total',
                          value: stats['total'].toString(),
                          icon: Icons.list_alt,
                        ),
                        Container(
                          width: 1,
                          height: 40,
                          color: Colors.white.withOpacity(0.3),
                        ),
                        _StatItem(
                          label: 'Concluídas',
                          value: stats['completed'].toString(),
                          icon: Icons.check_circle,
                        ),
                        Container(
                          width: 1,
                          height: 40,
                          color: Colors.white.withOpacity(0.3),
                        ),
                        _StatItem(
                          label: 'Taxa',
                          value: '${stats['completionRate']}%',
                          icon: Icons.trending_up,
                        ),
                      ],
                    ),
                  ),

                  // LISTA DE TAREFAS
                  Expanded(
                    child: filteredTasks.isEmpty
                        ? _buildEmptyState()
                        : ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: filteredTasks.length,
                            itemBuilder: (context, index) {
                              final task = filteredTasks[index];
                              return TaskCard(
                                task: task,
                                onTap: () async {
                                  final result = await Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) =>
                                          TaskFormScreen(task: task),
                                    ),
                                  );
                                  if (result == true) _loadTasks();
                                },
                                onDelete: () => _deleteTask(task),
                                onCheckboxChanged: (value) =>
                                    _toggleComplete(task),
                              );
                            },
                          ),
                  ),
                ],
              ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const TaskFormScreen()),
          );
          if (result == true) _loadTasks();
        },
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Nova Tarefa'),
      ),
    );
  }

  Widget _buildEmptyState() {
    String message;
    IconData icon;

    switch (_filter) {
      case 'pending':
        message = '🎉 Nenhuma tarefa pendente!';
        icon = Icons.check_circle_outline;
        break;
      case 'completed':
        message = '📋 Nenhuma tarefa concluída ainda';
        icon = Icons.pending_outlined;
        break;
      case 'nearby':
        message = '📍 Nenhuma tarefa próxima';
        icon = Icons.near_me;
        break;
      default:
        message = '📝 Nenhuma tarefa ainda.\nToque em + para criar!';
        icon = Icons.add_task;
    }

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 80, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text(
            message,
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 16, color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;

  const _StatItem({
    required this.label,
    required this.value,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: Colors.white, size: 28),
        const SizedBox(height: 8),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 12),
        ),
      ],
    );
  }
}
