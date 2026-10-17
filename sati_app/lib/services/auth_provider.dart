import "package:flutter/material.dart";
import "auth_service.dart";
import "api_service.dart";

class AuthProvider extends ChangeNotifier {
  final AuthService _auth = AuthService();
  final ApiService _api = ApiService();

  String? _userId;
  String? _token;
  Map<String, dynamic>? _user;
  bool _isLoading = false;
  String? _error;

  String? get userId => _userId;
  String? get token => _token;
  Map<String, dynamic>? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isLoggedIn => _token != null;

  /// Login with email and password
  Future<bool> login({required String email, required String password}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _auth.login(email: email, password: password);
      if (res.success && res.data is Map) {
        final data = res.data as Map<String, dynamic>;
        _token = data["token"] as String?;
        _user = data["user"] as Map<String, dynamic>?;
        _userId = _user?["id"] as String?;
        _api.setToken(_token);
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = res.message ?? "Login failed";
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Signup with user details
  Future<bool> signup({
    required String fullName,
    required String email,
    required String currency,
    required String phone,
    required String password,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _auth.signup(
        fullName: fullName,
        email: email,
        currency: currency,
        phone: phone,
        password: password,
      );
      if (res.success && res.data is Map) {
        final data = res.data as Map<String, dynamic>;
        _token = data["token"] as String?;
        _user = data["user"] as Map<String, dynamic>?;
        _userId = _user?["id"] as String?;
        _api.setToken(_token);
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = res.message ?? "Signup failed";
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Logout
  void logout() {
    _userId = null;
    _token = null;
    _user = null;
    _api.setToken(null);
    notifyListeners();
  }

  /// Fetch current user profile.
  ///
  /// GET /auth/me returns { "user": { id, name, email, avatarUrl, ... } },
  /// so unwrap the nested user object before caching it.
  Future<Map<String, dynamic>?> fetchProfile() async {
    if (_token == null) return null;
    try {
      final res = await _api.get("/auth/me");
      if (res.success && res.data is Map) {
        final data = res.data as Map<String, dynamic>;
        final user = data["user"] is Map
            ? data["user"] as Map<String, dynamic>
            : data;
        _user = user;
        _userId = user["id"] as String?;
        notifyListeners();
        return _user;
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}
