import 'dart:convert';

class Task {
  final int? id;
  final String title;
  final String description;
  final String priority;
  final bool completed;
  final DateTime createdAt;
  final DateTime updatedAt;  // Para resolução de conflitos LWW
  final bool isSynced;       // Indica se está sincronizado com o servidor

  // CÂMERA
  final List<String>? photoPaths;

  // SENSORES
  final DateTime? completedAt;
  final String? completedBy;      // 'manual', 'shake'

  // GPS
  final double? latitude;
  final double? longitude;
  final String? locationName;

  Task({
    this.id,
    required this.title,
    required this.description,
    required this.priority,
    this.completed = false,
    DateTime? createdAt,
    DateTime? updatedAt,
    this.isSynced = false,
    this.photoPaths,
    this.completedAt,
    this.completedBy,
    this.latitude,
    this.longitude,
    this.locationName,
  }) : createdAt = createdAt ?? DateTime.now(),
       updatedAt = updatedAt ?? DateTime.now();

  // Getters auxiliares
  bool get hasPhoto => photoPaths != null && photoPaths!.isNotEmpty;
  bool get hasLocation => latitude != null && longitude != null;
  bool get wasCompletedByShake => completedBy == 'shake';

  Map<String, dynamic> toMap({bool forApi = false}) {
    if (forApi) {
      // Format for API (MockAPI format)
      return {
        if (id != null) 'id': id.toString(), // String ID for API
        'title': title,
        'description': description,
        'priority': priority,
        'completed': completed, // Boolean for API
        'createdAt': createdAt.millisecondsSinceEpoch ~/ 1000, // Unix timestamp
        'updatedAt': updatedAt.millisecondsSinceEpoch ~/ 1000, // Unix timestamp
        'isSynced': isSynced, // Boolean for API
        'photoPaths': photoPaths ?? [], // Array for API
        if (completedAt != null) 'completedAt': completedAt!.millisecondsSinceEpoch ~/ 1000,
        'completedBy': completedBy,
        'latitude': latitude,
        'longitude': longitude,
        'locationName': locationName,
      };
    } else {
      // Format for SQLite (original format)
      return {
        'id': id,
        'title': title,
        'description': description,
        'priority': priority,
        'completed': completed ? 1 : 0,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
        'isSynced': isSynced ? 1 : 0,
        'photoPaths': json.encode(photoPaths),
        'completedAt': completedAt?.toIso8601String(),
        'completedBy': completedBy,
        'latitude': latitude,
        'longitude': longitude,
        'locationName': locationName,
      };
    }
  }

  factory Task.fromMap(Map<String, dynamic> map) {
    // Parse ID - handle both String (from API) and int (from SQLite)
    int? parsedId;
    if (map['id'] != null) {
      if (map['id'] is String) {
        parsedId = int.tryParse(map['id'] as String);
      } else {
        parsedId = map['id'] as int?;
      }
    }

    // Parse timestamps - handle both Unix epoch (from API) and ISO 8601 (from SQLite)
    DateTime parseTimestamp(dynamic value, DateTime defaultValue) {
      if (value == null) return defaultValue;
      if (value is int) {
        // Unix timestamp in seconds
        return DateTime.fromMillisecondsSinceEpoch(value * 1000);
      }
      if (value is String) {
        return DateTime.parse(value);
      }
      return defaultValue;
    }

    DateTime? parseNullableTimestamp(dynamic value) {
      if (value == null) return null;
      if (value is int) {
        return DateTime.fromMillisecondsSinceEpoch(value * 1000);
      }
      if (value is String) {
        return DateTime.parse(value);
      }
      return null;
    }

    // Parse boolean - handle both bool (from API) and int (from SQLite)
    bool parseBool(dynamic value) {
      if (value is bool) return value;
      if (value is int) return value == 1;
      return false;
    }

    // Parse photo paths - handle both Array (from API) and JSON string (from SQLite)
    List<String>? parsePhotoPaths(dynamic value) {
      if (value == null) return null;
      if (value is List) {
        return List<String>.from(value);
      }
      if (value is String && value.isNotEmpty) {
        try {
          return List<String>.from(json.decode(value));
        } catch (_) {
          return null;
        }
      }
      return null;
    }

    return Task(
      id: parsedId,
      title: map['title'] as String,
      description: map['description'] as String? ?? '',
      priority: map['priority'] as String? ?? 'Média',
      completed: parseBool(map['completed']),
      createdAt: parseTimestamp(map['createdAt'], DateTime.now()),
      updatedAt: parseTimestamp(map['updatedAt'], parseTimestamp(map['createdAt'], DateTime.now())),
      isSynced: parseBool(map['isSynced']),
      photoPaths: parsePhotoPaths(map['photoPaths']),
      completedAt: parseNullableTimestamp(map['completedAt']),
      completedBy: map['completedBy'] as String?,
      latitude: map['latitude'] != null ? (map['latitude'] as num).toDouble() : null,
      longitude: map['longitude'] != null ? (map['longitude'] as num).toDouble() : null,
      locationName: map['locationName'] as String?,
    );
  }

  Task copyWith({
    int? id,
    String? title,
    String? description,
    String? priority,
    bool? completed,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? isSynced,
    List<String>? photoPaths,
    DateTime? completedAt,
    String? completedBy,
    double? latitude,
    double? longitude,
    String? locationName,
  }) {
    return Task(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      priority: priority ?? this.priority,
      completed: completed ?? this.completed,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? DateTime.now(), // Sempre atualiza o timestamp
      isSynced: isSynced ?? this.isSynced,
      photoPaths: photoPaths ?? this.photoPaths,
      completedAt: completedAt ?? this.completedAt,
      completedBy: completedBy ?? this.completedBy,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      locationName: locationName ?? this.locationName,
    );
  }
}