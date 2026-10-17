import "package:flutter/material.dart";
import "../components/app_theme.dart";
import "../components/wishlist_tile.dart";
import "../services/api_service.dart";
import "../services/wishlist_service.dart";

class SavedPage extends StatefulWidget {
  const SavedPage({super.key});

  @override
  State<SavedPage> createState() => _SavedPageState();
}

class _SavedPageState extends State<SavedPage> {
  final WishlistService _wishlist = WishlistService();
  final ApiService _api = ApiService();

  List<Map<String, dynamic>> _items = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      // Step 1: get product ids from the wishlist
      final wRes = await _wishlist.getWishlist();
      if (!mounted) return;

      if (!wRes.success) {
        setState(() {
          _error = wRes.message ?? "Failed to load saved items.";
          _loading = false;
        });
        return;
      }

      // The backend returns a list of product ids (strings)
      final ids = wRes.data is List ? wRes.data.cast<String>() : <String>[];

      if (ids.isEmpty) {
        setState(() {
          _items = [];
          _loading = false;
        });
        return;
      }

      // Step 2: fetch each product by id
      final futures = ids.map((id) => _fetchProduct(id));
      final products = (await Future.wait(futures))
          .where((p) => p != null && p["name"] != null)
          .cast<Map<String, dynamic>>()
          .toList();

      setState(() {
        _items = products;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<Map<String, dynamic>?> _fetchProduct(String id) async {
    try {
      final res = await _api.get("/products/$id");
      return res.success ? (res.data as Map<String, dynamic>) : null;
    } catch (_) {
      return null;
    }
  }

  Future<void> _remove(String productId, int index) async {
    final res = await _wishlist.remove(productId);
    if (!mounted) return;
    if (res.success) {
      setState(() {
        _items.removeAt(index);
      });
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(res.message ?? "Failed to remove")),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        titleSpacing: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          "Saved",
          style: TextStyle(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w600,
            fontSize: 18,
          ),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.error_outline, size: 48, color: Colors.red),
                      const SizedBox(height: 16),
                      Text(
                        _error!,
                        style: const TextStyle(color: AppColors.textMuted),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: _load,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                        ),
                        child: const Text("Retry"),
                      ),
                    ],
                  ),
                )
              : _items.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.favorite_border,
                            size: 64,
                            color: AppColors.textMuted,
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            "No saved items yet",
                            style: TextStyle(
                              color: AppColors.textMuted,
                              fontSize: 16,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            "Tap the heart on a product to save it here.",
                            style: TextStyle(
                              color: AppColors.textMuted,
                              fontSize: 13,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    )
                  : GridView.builder(
                      padding: const EdgeInsets.all(16),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        childAspectRatio: 0.65,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 16,
                      ),
                      itemCount: _items.length,
                      itemBuilder: (context, index) {
                        final p = _items[index];
                        final id = (p["_id"] ?? "") as String;
                        return WishlistTile.fromMap(
                          p,
                          onTap: () {},
                          onRemove: () => _remove(id, index),
                        );
                      },
                    ),
    );
  }
}