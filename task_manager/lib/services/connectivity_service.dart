import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';

class ConnectivityService {
  static final ConnectivityService instance = ConnectivityService._init();
  
  ConnectivityService._init();

  final Connectivity _connectivity = Connectivity();
  final StreamController<bool> _connectionStatusController = StreamController<bool>.broadcast();
  
  bool _isOnline = false;
  StreamSubscription<List<ConnectivityResult>>? _subscription;

  bool get isOnline => _isOnline;
  Stream<bool> get connectionStream => _connectionStatusController.stream;

  Future<void> initialize() async {
    // Verificar status inicial
    final result = await _connectivity.checkConnectivity();
    _updateConnectionStatus(result);

    // Ouvir mudanças de conectividade
    _subscription = _connectivity.onConnectivityChanged.listen((List<ConnectivityResult> results) {
      _updateConnectionStatus(results);
    });
  }

  void _updateConnectionStatus(List<ConnectivityResult> results) {
    // Considera online se houver qualquer tipo de conexão (WiFi, mobile, etc)
    final wasOnline = _isOnline;
    _isOnline = results.isNotEmpty && 
                results.any((result) => 
                  result == ConnectivityResult.wifi || 
                  result == ConnectivityResult.mobile ||
                  result == ConnectivityResult.ethernet
                );
    
    // Notificar mudança de status
    if (wasOnline != _isOnline) {
      _connectionStatusController.add(_isOnline);
    }
  }

  void dispose() {
    _subscription?.cancel();
    _connectionStatusController.close();
  }
}
