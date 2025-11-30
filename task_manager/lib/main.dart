import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:task_manager/screens/task_list_screen.dart';
import 'package:task_manager/services/camera_service.dart';
import 'package:task_manager/services/connectivity_service.dart';
import 'package:task_manager/services/sync_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Inicializar câmera
  await CameraService.instance.initialize();

  // Inicializar serviço de conectividade
  await ConnectivityService.instance.initialize();

  // Inicializar serviço de sincronização
  await SyncService.instance.initialize();

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Task Manager Pro',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.blue,
          brightness: Brightness.light,
        ),
        useMaterial3: true,
        cardTheme: CardThemeData(
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      home: const TaskListScreen(),
    );
  }
}