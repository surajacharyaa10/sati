import "api_service.dart";

/// Reads and mutates the current user's saved/wishlist items.
class WishlistService {
  final ApiService _api = ApiService();

  /// GET /api/wishlist/me — returns a list of product ids.
  Future<ApiResponse<dynamic>> getWishlist() async {
    return _api.get("/wishlist/me");
  }

  /// POST /api/wishlist/me — add a product id to the wishlist.
  Future<ApiResponse<dynamic>> add(String productId) async {
    return _api.post("/wishlist/me", body: {"productId": productId});
  }

  /// DELETE /api/wishlist/me/:productId — remove a product id.
  Future<ApiResponse<dynamic>> remove(String productId) async {
    return _api.delete("/wishlist/me/$productId");
  }

  /// POST /api/wishlist/me/toggle — add or remove in one call.
  Future<ApiResponse<dynamic>> toggle(String productId) async {
    return _api.post("/wishlist/me/toggle", body: {"productId": productId});
  }
}