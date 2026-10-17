import "api_service.dart";

class AuthService {
  final ApiService _api = ApiService();

  Future<ApiResponse<dynamic>> login({
    required String email,
    required String password,
  }) async {
    final res = await _api.post(
      "/auth/login",
      body: {"email": email, "password": password},
    );
    if (res.success && res.data is Map && res.data["token"] != null) {
      _api.setToken(res.data["token"].toString());
    }
    return res;
  }

  Future<ApiResponse<dynamic>> signup({
    required String fullName,
    required String email,
    required String currency,
    required String phone,
    required String password,
  }) async {
    return _api.post(
      "/auth/signup",
      body: {
        "name": fullName,
        "email": email,
        "country": currency == 'GBP' ? 'UK' : 'Nepal',
        "phoneNumber": phone,
        "password": password,
      },
    );
  }
}
