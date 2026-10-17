import 'package:flutter/material.dart';
import '../components/app_theme.dart';
import '../components/product_tile.dart';
import '../services/products_service.dart';
import '../services/wishlist_service.dart';

class MenPage extends StatefulWidget {
  const MenPage({super.key});

  @override
  State<MenPage> createState() => _MenPageState();
}

class _MenPageState extends State<MenPage> {
  final ProductsService _products = ProductsService();
  final WishlistService _wishlist = WishlistService();

  List<Map<String, dynamic>> _items = [];
  bool _loading = true;
  String? _error;
  Set<String> _savedIds = const {};

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
      final res = await _products.list(audience: 'Men');
      if (!mounted) return;

      if (!res.success) {
        setState(() {
          _error = res.message ?? 'Failed to load products.';
          _loading = false;
        });
        return;
      }

      final list = res.data is List ? res.data.cast<Map<String, dynamic>>() : <Map<String, dynamic>>[];

      // Track which products are already in the wishlist.
      final wRes = await _wishlist.getWishlist();
      final saved = wRes.success && wRes.data is List
          ? wRes.data.cast<String>().toSet()
          : <String>{};

      if (!mounted) return;
      setState(() {
        _items = list;
        _savedIds = saved;
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

  Future<void> _toggle(String id) async {
    final res = await _wishlist.toggle(id);
    if (!mounted) return;
    if (res.success) {
      setState(() {
        if (_savedIds.contains(id)) {
          _savedIds = _savedIds.where((x) => x != id).toSet();
        } else {
          _savedIds = {..._savedIds, id};
        }
      });
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to toggle wishlist')),
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
        title: const Text(
          'Men',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w600,
            fontSize: 18,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
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
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : _items.isEmpty
                  ? const Center(
                      child: Text(
                        'No men\'s pieces available yet',
                        style: TextStyle(fontSize: 16, color: AppColors.textMuted),
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
                        final id = (p['_id'] ?? p['id'] ?? '') as String;
                        return ProductTile(
                          product: p,
                          onTap: () {},
                          onFavorite: () => _toggle(id),
                        );
                      },
                    ),
    );
  }
}
