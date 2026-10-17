import "api_service.dart";

/// Orders API for the logged-in user.
class OrdersService {
  final ApiService _api = ApiService();

  /// GET /api/orders/me — list the current user's orders.
  Future<ApiResponse<dynamic>> list() async {
    return _api.get("/orders/me");
  }

  /// GET /api/orders/me/:orderId — fetch a single order.
  Future<ApiResponse<dynamic>> get(String orderId) async {
    return _api.get("/orders/me/$orderId");
  }
}