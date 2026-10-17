import "dart:convert";
import "dart:io";
import "package:http/http.dart" as http;
import "app_config.dart";

class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? message;
  final int? statusCode;

  ApiResponse({
    required this.success,
    this.data,
    this.message,
    this.statusCode,
  });
}

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  String? _authToken;
  void setToken(String? token) => _authToken = token;

  Map<String, String> _headers() {
    final h = <String, String>{
      "Content-Type": "application/json",
      "Accept": "application/json",
    };
    if (_authToken != null) {
      h["Authorization"] = "Bearer $_authToken";
    }
    return h;
  }

  Future<ApiResponse<dynamic>> post(
    String endpoint, {
    Map<String, dynamic>? body,
  }) async {
    final uri = Uri.parse("${AppConfig.baseUrl}$endpoint");
    try {
      final res = await http
          .post(
            uri,
            headers: _headers(),
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(AppConfig.timeout);
      return _handleResponse(res);
    } on SocketException {
      return ApiResponse(
        success: false,
        message: "No internet connection or server unreachable",
      );
    } catch (e) {
      return ApiResponse(success: false, message: e.toString());
    }
  }

  Future<ApiResponse<dynamic>> get(String endpoint) async {
    final uri = Uri.parse("${AppConfig.baseUrl}$endpoint");
    try {
      final res = await http.get(uri, headers: _headers()).timeout(AppConfig.timeout);
      return _handleResponse(res);
    } on SocketException {
      return ApiResponse(
        success: false,
        message: "No internet connection or server unreachable",
      );
    } catch (e) {
      return ApiResponse(success: false, message: e.toString());
    }
  }

  Future<ApiResponse<dynamic>> delete(String endpoint) async {
    final uri = Uri.parse("${AppConfig.baseUrl}$endpoint");
    try {
      final res = await http.delete(uri, headers: _headers()).timeout(AppConfig.timeout);
      return _handleResponse(res);
    } on SocketException {
      return ApiResponse(
        success: false,
        message: "No internet connection or server unreachable",
      );
    } catch (e) {
      return ApiResponse(success: false, message: e.toString());
    }
  }

  ApiResponse<dynamic> _handleResponse(http.Response res) {
    try {
      final data = jsonDecode(res.body);
      final isOk = res.statusCode >= 200 && res.statusCode < 300;
      final msg = data is Map ? (data["message"] ?? data["error"]) : null;
      return ApiResponse(
        success: isOk,
        data: data,
        message: msg?.toString() ?? (isOk ? null : "Request failed (${res.statusCode})"),
        statusCode: res.statusCode,
      );
    } catch (_) {
      return ApiResponse(
        success: res.statusCode >= 200 && res.statusCode < 300,
        message: res.body.isNotEmpty ? res.body : "Invalid server response",
        statusCode: res.statusCode,
      );
    }
  }
}
