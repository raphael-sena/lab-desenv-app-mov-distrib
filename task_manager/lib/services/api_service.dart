import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/task.dart';

class ApiService {
  static final ApiService instance = ApiService._init();
  
  ApiService._init();

  // CONFIGURAR COM SEU BACKEND REAL OU USAR MOCKAPI
  // Exemplo: https://mockapi.io/ ou seu servidor local/remoto
  static const String baseUrl = 'https://692c8d9ec829d464006fe2c1.mockapi.io/api/v1';
  
  final Duration _timeout = const Duration(seconds: 10);

  // ========== CRUD METHODS ==========

  Future<Map<String, dynamic>?> createTask(Task task) async {
    try {
      final response = await http
          .post(
            Uri.parse('$baseUrl/tasks'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(task.toMap(forApi: true)),
          )
          .timeout(_timeout);

      if (response.statusCode == 201 || response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
      return null;
    } catch (e) {
      print('Error creating task on server: $e');
      return null;
    }
  }

  Future<Map<String, dynamic>?> updateTask(int taskId, Task task) async {
    try {
      final response = await http
          .put(
            Uri.parse('$baseUrl/tasks/$taskId'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(task.toMap(forApi: true)),
          )
          .timeout(_timeout);

      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
      return null;
    } catch (e) {
      print('Error updating task on server: $e');
      return null;
    }
  }

  Future<bool> deleteTask(int taskId) async {
    try {
      final response = await http
          .delete(Uri.parse('$baseUrl/tasks/$taskId'))
          .timeout(_timeout);

      return response.statusCode == 200 || response.statusCode == 204;
    } catch (e) {
      print('Error deleting task on server: $e');
      return false;
    }
  }

  Future<List<Task>> getAllTasks() async {
    try {
      final response = await http
          .get(Uri.parse('$baseUrl/tasks'))
          .timeout(_timeout);

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body) as List;
        return data.map((json) => Task.fromMap(json as Map<String, dynamic>)).toList();
      }
      return [];
    } catch (e) {
      print('Error fetching tasks from server: $e');
      return [];
    }
  }

  Future<Task?> getTask(int taskId) async {
    try {
      final response = await http
          .get(Uri.parse('$baseUrl/tasks/$taskId'))
          .timeout(_timeout);

      if (response.statusCode == 200) {
        return Task.fromMap(jsonDecode(response.body) as Map<String, dynamic>);
      }
      return null;
    } catch (e) {
      print('Error fetching task from server: $e');
      return null;
    }
  }

  // ========== HEALTH CHECK ==========

  Future<bool> checkConnection() async {
    try {
      final response = await http
          .get(Uri.parse('$baseUrl/tasks'))
          .timeout(const Duration(seconds: 5));
      
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
}
