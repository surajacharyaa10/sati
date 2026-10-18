import "package:flutter/material.dart";
import "package:provider/provider.dart";
import "../components/app_theme.dart";
import "../components/app_image.dart";
import "../services/cart_service.dart";
import "../services/auth_provider.dart";

class CartPage extends StatefulWidget {
  const CartPage({super.key});

  @override
  State<CartPage> createState() => _CartPageState();
}

class _CartPageState extends State<CartPage> {
  final CartService _cart = CartService();

  List<Map<String, dynamic>> _items = [];
  bool _loading = true;
  String? _error;
  String? _userId;

  @override
  void initState() {
    super.initState();
    _userId = context.read<AuthProvider>().userId;
    _load();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final id = context.read<AuthProvider>().userId;
    if (id != _userId) {
      _userId = id;
      _load();
    }
  }

  Future<void> _load() async {
    if (_userId == null) {
      if (mounted) setState(() => _loading = false);
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await _cart.getCart();
      if (!mounted) return;
      if (!res.success) {
        setState(() {
          _error = res.message ?? "Failed to load cart.";
          _loading = false;
        });
        return;
      }
      final list = res.data is List
          ? res.data.cast<Map<String, dynamic>>()
          : <Map<String, dynamic>>[];
      setState(() {
        _items = list;
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

  Future<void> _remove(String productId, int index) async {
    final res = await _cart.remove(productId);
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

  Widget _cartThumb({required Map<String, dynamic> item}) {
    final image = item['image'] is String ? item['image'] as String : '';
    return Container(
      width: 56,
      height: 56,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: AppProductImage(
        image: image,
        width: 56,
        height: 56,
        fit: BoxFit.cover,
      ),
    );
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
          "Cart",
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
                    Icons.shopping_cart_outlined,
                    size: 64,
                    color: AppColors.textMuted,
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    "Your cart is empty",
                    style: TextStyle(color: AppColors.textMuted, fontSize: 16),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    "Tap the cart icon on a product to add it here.",
                    style: TextStyle(color: AppColors.textMuted, fontSize: 13),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            )
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemCount: _items.length,
              itemBuilder: (context, index) {
                final item = _items[index];
                final id = (item['id'] ?? '') as String;
                final name = (item['name'] ?? '') as String;
                final price = item['price'];
                final priceStr = price is num
                    ? "Rs. ${price.toStringAsFixed(0)}"
                    : "$price";
                final qty = item['quantity'] is num
                    ? (item['quantity'] as num).toInt()
                    : 1;
                return Container(
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: ListTile(
                    leading: _cartThumb(item: item),
                    title: Text(
                      name,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                    subtitle: Text(
                      "Qty. $qty",
                      style: const TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 12.5,
                      ),
                    ),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          priceStr,
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(width: 8),
                        IconButton(
                          icon: const Icon(
                            Icons.delete_outline,
                            color: Colors.red,
                          ),
                          onPressed: () => _remove(id, index),
                        ),
                      ],
                    ),
                    onTap: () {
                      Navigator.pushNamed(
                        context,
                        '/product-detail',
                        arguments: item,
                      );
                    },
                  ),
                );
              },
            ),
    );
  }
}
