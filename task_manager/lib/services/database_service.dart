import 'dart:async';
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

    // Versão inicial do DB (criação do zero)
    const dbVersion = 1;

    return await openDatabase(
      dbPath,
      version: dbVersion,
      onCreate: _onCreate,
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
        photoPaths TEXT,
        completedAt TEXT,
        completedBy TEXT,
        latitude REAL,
        longitude REAL,
        locationName TEXT
      )
    ''');
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
}