import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../components/bottom_nav.dart';
import '../components/product_tile.dart';
import '../services/products_service.dart';
import '../services/wishlist_service.dart';
import '../services/auth_provider.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _selectedNav = 0;
  String _selectedCategory = 'All';

  static const Color orange = Color(0xFFFF7900);
  static const Color ink = Color(0xFF1A1A1A);
  static const Color muted = Color(0xFF777777);

  final ProductsService _products = ProductsService();
  final WishlistService _wishlist = WishlistService();

  List<Map<String, dynamic>> _items = [];
  List<String> _categories = const ['All'];
  bool _loading = true;
  String? _error;
  Set<String> _savedIds = const {};
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
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final res = await _products.list();
      if (!mounted) return;

      if (!res.success) {
        setState(() {
          _error = res.message ?? 'Failed to load products.';
          _loading = false;
        });
        return;
      }

      final list = res.data is List
          ? res.data.cast<Map<String, dynamic>>()
          : <Map<String, dynamic>>[];

      // Derive category filter options from the catalogue.
      final cats = <String>['All'];
      for (final p in list) {
        final c = (p['category'] ?? '').toString();
        if (c.isNotEmpty && !cats.contains(c)) cats.add(c);
      }

      // Track which products are already in the wishlist.
      final wRes = await _wishlist.getWishlist();
      final saved = wRes.success && wRes.data is List
          ? wRes.data.cast<String>().toSet()
          : <String>{};

      if (!mounted) return;
      setState(() {
        _items = list;
        _categories = cats;
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
    final filtered = _selectedCategory == 'All'
        ? _items
        : _items
              .where(
                (p) => (p['category'] ?? '').toString() == _selectedCategory,
              )
              .toList();

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        automaticallyImplyLeading: false,
        titleSpacing: 20,
        title: Image.asset(
          'assets/logo/logo.png',
          height: 38,
          fit: BoxFit.contain,
          errorBuilder: (ctx, obj, st) => const Text(
            'S A T I',
            style: TextStyle(
              color: orange,
              fontWeight: FontWeight.w600,
              letterSpacing: 4,
            ),
          ),
        ),
        actions: [
          IconButton(
            icon: Image.asset(
              'assets/logo/search.png',
              width: 22,
              height: 22,
              fit: BoxFit.contain,
              color: ink,
              colorBlendMode: BlendMode.srcIn,
            ),
            onPressed: () {},
            tooltip: 'Search',
          ),
          IconButton(
            icon: Image.asset(
              'assets/logo/carts.png',
              width: 22,
              height: 22,
              fit: BoxFit.contain,
              color: ink,
              colorBlendMode: BlendMode.srcIn,
            ),
            onPressed: () {
              if (context.read<AuthProvider>().isLoggedIn) {
                Navigator.pushNamed(context, '/cart');
              } else {
                Navigator.pushReplacementNamed(context, '/login');
              }
            },
            tooltip: 'Cart',
          ),
          IconButton(
            icon: Image.asset(
              'assets/logo/saved.png',
              width: 22,
              height: 22,
              fit: BoxFit.contain,
              color: ink,
              colorBlendMode: BlendMode.srcIn,
            ),
            onPressed: () {
              final auth = context.read<AuthProvider>();
              Navigator.pushNamed(
                context,
                '/saved',
                arguments: {'userId': auth.userId},
              );
            },
            tooltip: 'Saved',
          ),
          const SizedBox(width: 8),
        ],
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
                    style: const TextStyle(color: muted),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: _load,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: orange,
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: _load,
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Hero banner
                    Container(
                      margin: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      height: 220,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        gradient: const LinearGradient(
                          colors: [Color(0xFF1A1A1A), Color(0xFF2C2C2C)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: Stack(
                        children: [
                          Positioned.fill(
                            child: Opacity(
                              opacity: 0.35,
                              child: Image.asset(
                                'assets/images/image8.jpeg',
                                fit: BoxFit.cover,
                                errorBuilder: (ctx, obj, st) =>
                                    const SizedBox(),
                              ),
                            ),
                          ),
                          Positioned.fill(
                            child: Padding(
                              padding: const EdgeInsets.all(22),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 10,
                                      vertical: 4,
                                    ),
                                    decoration: BoxDecoration(
                                      color: orange,
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: const Text(
                                      'AUTUMN / WINTER 2026',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 1.5,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  const Text(
                                    'Crafted in Kathmandu,\nStyled Globally.',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 22,
                                      fontWeight: FontWeight.w400,
                                      height: 1.25,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                  const SizedBox(height: 14),
                                  OutlinedButton(
                                    onPressed: () => Navigator.pushNamed(context, '/catalog'),
                                    style: OutlinedButton.styleFrom(
                                      foregroundColor: Colors.white,
                                      side: const BorderSide(
                                        color: Colors.white,
                                        width: 1.2,
                                      ),
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 18,
                                        vertical: 8,
                                      ),
                                      minimumSize: Size.zero,
                                      tapTargetSize:
                                          MaterialTapTargetSize.shrinkWrap,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                    ),
                                    child: const Text(
                                      'Explore Collection',
                                      style: TextStyle(fontSize: 12),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Categories
                    SizedBox(
                      height: 38,
                      child: ListView.separated(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        scrollDirection: Axis.horizontal,
                        itemCount: _categories.length,
                        separatorBuilder: (ctx, i) => const SizedBox(width: 8),
                        itemBuilder: (context, i) {
                          final cat = _categories[i];
                          final isSelected = cat == _selectedCategory;
                          return ChoiceChip(
                            label: Text(cat),
                            selected: isSelected,
                            onSelected: (_) =>
                                setState(() => _selectedCategory = cat),
                            selectedColor: orange,
                            backgroundColor: Colors.grey.shade100,
                            labelStyle: TextStyle(
                              color: isSelected ? Colors.white : ink,
                              fontSize: 12.5,
                              fontWeight: isSelected
                                  ? FontWeight.w600
                                  : FontWeight.w400,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(20),
                            ),
                            side: BorderSide.none,
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                          );
                        },
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Section header
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Curated Pieces',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                              color: ink,
                            ),
                          ),
                          TextButton(
                            onPressed: () {
                              Navigator.pushNamed(context, '/catalog');
                            },
                            style: TextButton.styleFrom(
                              foregroundColor: orange,
                            ),
                            child: const Text(
                              'View all',
                              style: TextStyle(fontSize: 13),
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Product grid
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: GridView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: filtered.length,
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              childAspectRatio: 0.62,
                              crossAxisSpacing: 12,
                              mainAxisSpacing: 16,
                            ),
                        itemBuilder: (context, i) {
                          final p = filtered[i];
                          final id = (p['id'] ?? p['_id'] ?? '') as String;
                          return ProductTile(
                            product: p,
                            onTap: () {},
                            onFavorite: () => _toggle(id),
                          );
                        },
                      ),
                    ),

                    const SizedBox(height: 28),

                    // Brand promise banner
                    Container(
                      margin: const EdgeInsets.symmetric(horizontal: 16),
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFF3E6),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: orange.withValues(alpha: 0.2),
                        ),
                      ),
                      child: const Column(
                        children: [
                          Text(
                            'SATI BESPOKE EXPERIENCE',
                            style: TextStyle(
                              color: orange,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.5,
                            ),
                          ),
                          SizedBox(height: 8),
                          Text(
                            '100% Authentic Fabrications · Dedicated Concierge · Deliveries in Nepal & UK',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: ink,
                              fontSize: 12,
                              height: 1.4,
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
      bottomNavigationBar: BottomNav(
        currentIndex: _selectedNav,
        onTap: (i) {
          if (i == 1) {
            Navigator.pushNamed(context, '/men');
            return;
          }
          if (i == 2) {
            Navigator.pushNamed(context, '/women');
            return;
          }
          if (i == 3) {
            Navigator.pushReplacementNamed(context, '/profile');
            return;
          }
          setState(() => _selectedNav = i);
        },
      ),
    );
  }
}
