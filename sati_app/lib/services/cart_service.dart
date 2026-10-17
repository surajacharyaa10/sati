import "api_service.dart";

/// Cart API for the logged-in user.
///
/// The backend's cart is keyed by the authenticated user id (from the JWT),
/// so every call here just needs the bearer token — no explicit user id is
/// required on the wire.
class CartService {
  final ApiService _api = ApiService();

  /// GET /api/cart/me — returns a list of cart line items.
  Future<ApiResponse<dynamic>> getCart() async {
    return _api.get("/cart/me");
  }

  /// POST /api/cart/me — add a product to the cart.
  Future<ApiResponse<dynamic>> add(String productId,
      {int quantity = 1, String? size, String? color}) async {
    return _api.post("/cart/me", body: {
      "productId": productId,
      "quantity": quantity,
      if (size != null) "size": size,
      if (color != null) "color": color,
    });
  }

  /// PUT /api/cart/me/:productId — update the quantity of a line.
  Future<ApiResponse<dynamic>> update(String productId, int quantity) async {
    return _api.post("/cart/me/$productId", body: {"quantity": quantity});
  }

  /// DELETE /api/cart/me/:productId — remove a line from the cart.
  Future<ApiResponse<dynamic>> remove(String productId) async {
    return _api.delete("/cart/me/$productId");
  }

  /// DELETE /api/cart/me — clear the whole cart.
  Future<ApiResponse<dynamic>> clear() async {
    return _api.delete("/cart/me");
  }
}