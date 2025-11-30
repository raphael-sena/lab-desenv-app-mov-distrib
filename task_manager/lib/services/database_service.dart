import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:sqflite/sqflite.dart';
import '../models/task.dart';

class DatabaseService {
  static final DatabaseService instance = DatabaseService._init();
  static Database? _db;

  DatabaseService._init();

  Future<Database> get database async {
    if (_db != null) return _db!;
    _db = await _initDB('tasks.db');
    return _db!;
  }

  Future<Database> _initDB(String fileName) async {
    final docsDir = await getApplicationDocumentsDirectory();
    final dbPath = p.join(docsDir.path, fileName);

    // Versão atualizada para suportar offline-first
    const dbVersion = 2;

    return await openDatabase(
      dbPath,
      version: dbVersion,
      onCreate: _onCreate,
      onUpgrade: _onUpgrade,
    );
  }

  Future<void> _onCreate(Database db, int version) async {
    await db.execute('''
      CREATE TABLE tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        priority TEXT NOT NULL,
        completed INTEGER NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        isSynced INTEGER NOT NULL DEFAULT 0,
        photoPaths TEXT,
        completedAt TEXT,
        completedBy TEXT,
        latitude REAL,
        longitude REAL,
        locationName TEXT
      )
    ''');

    // Tabela de fila de sincronização
    await db.execute('''
      CREATE TABLE sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        taskId INTEGER NOT NULL,
        operation TEXT NOT NULL,
        taskData TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        synced INTEGER NOT NULL DEFAULT 0
      )
    ''');
  }

  Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 2) {
      // Adicionar novas colunas à tabela tasks
      await db.execute('ALTER TABLE tasks ADD COLUMN updatedAt TEXT');
      await db.execute('ALTER TABLE tasks ADD COLUMN isSynced INTEGER NOT NULL DEFAULT 0');
      
      // Atualizar updatedAt para tasks existentes
      await db.execute('UPDATE tasks SET updatedAt = createdAt WHERE updatedAt IS NULL');

      // Criar tabela sync_queue
      await db.execute('''
        CREATE TABLE sync_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          taskId INTEGER NOT NULL,
          operation TEXT NOT NULL,
          taskData TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          synced INTEGER NOT NULL DEFAULT 0
        )
      ''');
    }
  }

  Future<int> create(Map<String, dynamic> values) async {
    final db = await database;
    // Remover chave id se for nula para permitir AUTOINCREMENT
    final insertValues = Map<String, dynamic>.from(values);
    if (insertValues.containsKey('id') && insertValues['id'] == null) {
      insertValues.remove('id');
    }
    return await db.insert('tasks', insertValues);
  }

  Future<int> update(int id, Map<String, dynamic> values) async {
    final db = await database;
    final updateValues = Map<String, dynamic>.from(values);
    updateValues.remove('id');
    return await db.update('tasks', updateValues, where: 'id = ?', whereArgs: [id]);
  }

  Future<int> delete(int id) async {
    final db = await database;
    return await db.delete('tasks', where: 'id = ?', whereArgs: [id]);
  }

  Future<List<Task>> getAllTasks() async {
    final db = await database;
    final rows = await db.query('tasks', orderBy: 'createdAt DESC');
    return rows.map((r) => Task.fromMap(r)).toList();
  }

  Future<List<Task>> getTasksNearLocation({
    required double latitude,
    required double longitude,
    required int radiusInMeters,
  }) async {
    final db = await database;
    final latDelta = radiusInMeters / 111320.0;
    final lonDelta = radiusInMeters / (111320.0 * cos(latitude * (3.141592653589793 / 180)));

    final minLat = latitude - latDelta;
    final maxLat = latitude + latDelta;
    final minLon = longitude - lonDelta;
    final maxLon = longitude + lonDelta;

    final rows = await db.query(
      'tasks',
      where: 'latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?',
      whereArgs: [minLat, maxLat, minLon, maxLon],
    );

    return rows.map((r) => Task.fromMap(r)).toList();
  }

  // ========== SYNC QUEUE METHODS ==========

  Future<int> addToSyncQueue({
    required int taskId,
    required String operation,
    required Map<String, dynamic> taskData,
  }) async {
    final db = await database;
    return await db.insert('sync_queue', {
      'taskId': taskId,
      'operation': operation, // 'CREATE', 'UPDATE', 'DELETE'
      'taskData': jsonEncode(taskData),
      'createdAt': DateTime.now().toIso8601String(),
      'synced': 0,
    });
  }

  Future<List<Map<String, dynamic>>> getPendingSyncItems() async {
    final db = await database;
    final rows = await db.query(
      'sync_queue',
      where: 'synced = ?',
      whereArgs: [0],
      orderBy: 'createdAt ASC',
    );
    
    return rows.map((row) {
      return {
        'id': row['id'],
        'taskId': row['taskId'],
        'operation': row['operation'],
        'taskData': jsonDecode(row['taskData'] as String),
        'createdAt': row['createdAt'],
      };
    }).toList();
  }

  Future<void> markSyncItemAsSynced(int syncQueueId) async {
    final db = await database;
    await db.update(
      'sync_queue',
      {'synced': 1},
      where: 'id = ?',
      whereArgs: [syncQueueId],
    );
  }

  Future<void> deleteSyncItem(int syncQueueId) async {
    final db = await database;
    await db.delete('sync_queue', where: 'id = ?', whereArgs: [syncQueueId]);
  }

  Future<void> markTaskAsSynced(int taskId) async {
    final db = await database;
    await db.update(
      'tasks',
      {'isSynced': 1},
      where: 'id = ?',
      whereArgs: [taskId],
    );
  }

  Future<void> markTaskAsUnsynced(int taskId) async {
    final db = await database;
    await db.update(
      'tasks',
      {'isSynced': 0},
      where: 'id = ?',
      whereArgs: [taskId],
    );
  }
}