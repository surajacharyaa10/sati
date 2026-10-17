import "api_service.dart";

/// Reads the product catalogue from the backend.
class ProductsService {
  final ApiService _api = ApiService();

  /// GET /api/products?audience=Men|Women
  Future<ApiResponse<dynamic>> list({String? audience}) async {
    final suffix = audience == null ? "" : "?audience=$audience";
    return _api.get("/products$suffix");
  }
}