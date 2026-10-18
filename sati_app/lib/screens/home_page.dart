import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../components/bottom_nav.dart';
import '../components/product_tile.dart';
import '../services/products_service.dart';
import '../services/wishlist_service.dart';
import '../services/cart_service.dart';
import '../services/auth_provider.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _selectedNav = 0;
  String _selectedCategory = 'All';
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  static const Color orange = Color(0xFFFF7900);
  static const Color ink = Color(0xFF1A1A1A);
  static const Color muted = Color(0xFF777777);

  final ProductsService _products = ProductsService();
  final WishlistService _wishlist = WishlistService();
  // Typed as dynamic so this compiles whatever CartService's exact API is;
  // see _loadCartCount for the call that reads the cart.
  final dynamic _cartService = CartService();
  int _cartCount = 0;

  // In-app notifications shown under the bell. Each item looks like
  // {'title': ..., 'body': ..., 'read': false}. They are kept in memory here;
  // fill _notifications from your backend if you have a notifications API.
  final List<Map<String, dynamic>> _notifications = [];

  int get _unreadCount => _notifications.where((n) => n['read'] != true).length;

  List<Map<String, dynamic>> _items = [];
  List<String> _categories = const ['All'];
  bool _loading = true;
  String? _error;
  Set<String> _savedIds = const {};
  String? _userId;

  /// Products matching the current query. Names that START with the query
  /// are listed first, then the rest.
  List<Map<String, dynamic>> get _searchMatches {
    final q = _searchQuery.trim().toLowerCase();
    if (q.isEmpty) return [];

    final matches = _items.where((p) {
      final name = (p['name'] ?? '').toString().toLowerCase();
      final category = (p['category'] ?? '').toString().toLowerCase();
      final audience = (p['audience'] ?? '').toString().toLowerCase();
      final desc = (p['description'] ?? '').toString().toLowerCase();
      return name.contains(q) ||
          category.contains(q) ||
          audience.contains(q) ||
          desc.contains(q);
    }).toList();

    matches.sort((a, b) {
      final an = (a['name'] ?? '').toString().toLowerCase().startsWith(q);
      final bn = (b['name'] ?? '').toString().toLowerCase().startsWith(q);
      if (an == bn) return 0;
      return an ? -1 : 1;
    });
    return matches;
  }

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

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
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
      _loadCartCount();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  /// Loads how many items are in the cart (sums quantities when present).
  Future<void> _loadCartCount() async {
    if (!context.read<AuthProvider>().isLoggedIn) {
      if (mounted) setState(() => _cartCount = 0);
      return;
    }
    try {
      final res = await _cartService.getCart();
      dynamic data = res.data;
      if (data is Map) {
        data = data['items'] ?? data['cart'] ?? data['products'];
      }
      var count = 0;
      if (data is List) {
        for (final item in data) {
          final q = item is Map ? (item['quantity'] ?? item['qty']) : null;
          count += q is num ? q.toInt() : 1;
        }
      }
      if (!mounted) return;
      setState(() => _cartCount = count);
    } catch (_) {
      // Leave the badge as-is if the cart can't be read.
    }
  }

  /// Re-syncs the heart and cart badges (e.g. after returning to this page).
  Future<void> _refreshCounts() async {
    try {
      final wRes = await _wishlist.getWishlist();
      if (mounted && wRes.success && wRes.data is List) {
        setState(() => _savedIds = wRes.data.cast<String>().toSet());
      }
    } catch (_) {}
    await _loadCartCount();
  }

  void _showNotifications() {
    final items = List<Map<String, dynamic>>.from(_notifications);
    // Opening the sheet marks everything as read, which clears the badge.
    setState(() {
      for (final n in _notifications) {
        n['read'] = true;
      }
    });

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetCtx) {
        return ConstrainedBox(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(sheetCtx).size.height * 0.6,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 12),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 12, 8),
                child: Row(
                  children: [
                    const Expanded(
                      child: Text(
                        'Notifications',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color: ink,
                        ),
                      ),
                    ),
                    if (items.isNotEmpty)
                      TextButton(
                        style: TextButton.styleFrom(foregroundColor: orange),
                        onPressed: () {
                          setState(() => _notifications.clear());
                          Navigator.pop(sheetCtx);
                        },
                        child: const Text('Clear all'),
                      ),
                  ],
                ),
              ),
              Flexible(
                child: items.isEmpty
                    ? const Padding(
                        padding: EdgeInsets.fromLTRB(20, 24, 20, 40),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.notifications_none_rounded,
                              size: 40,
                              color: muted,
                            ),
                            SizedBox(height: 12),
                            Text(
                              "You're all caught up",
                              style: TextStyle(color: muted),
                            ),
                          ],
                        ),
                      )
                    : ListView.separated(
                        shrinkWrap: true,
                        padding: const EdgeInsets.only(bottom: 20),
                        itemCount: items.length,
                        separatorBuilder: (ctx, i) =>
                            const Divider(height: 1, indent: 20, endIndent: 20),
                        itemBuilder: (ctx, i) {
                          final n = items[i];
                          return ListTile(
                            leading: const CircleAvatar(
                              backgroundColor: Color(0xFFFFF3E6),
                              child: Icon(
                                Icons.favorite_rounded,
                                color: orange,
                                size: 18,
                              ),
                            ),
                            title: Text(
                              (n['title'] ?? '').toString(),
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                                color: ink,
                                fontSize: 14,
                              ),
                            ),
                            subtitle: Text(
                              (n['body'] ?? '').toString(),
                              style: const TextStyle(
                                color: muted,
                                fontSize: 12.5,
                              ),
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        );
      },
    );
  }

  /// Wraps an icon with a small orange count badge.
  Widget _badged(Widget icon, int count) {
    return Badge(
      isLabelVisible: count > 0,
      label: Text(count > 99 ? '99+' : '$count'),
      backgroundColor: orange,
      textColor: Colors.white,
      offset: const Offset(4, -4),
      child: icon,
    );
  }

  Future<void> _toggle(String id) async {
    final res = await _wishlist.toggle(id);
    if (!mounted) return;
    if (res.success) {
      final wasSaved = _savedIds.contains(id);
      setState(() {
        if (wasSaved) {
          _savedIds = _savedIds.where((x) => x != id).toSet();
        } else {
          _savedIds = {..._savedIds, id};
          final match = _items.where((p) => (p['id'] ?? p['_id'] ?? '') == id);
          final name = match.isEmpty
              ? 'Item'
              : (match.first['name'] ?? 'Item').toString();
          _notifications.insert(0, {
            'title': 'Saved to wishlist',
            'body': '$name was added to your saved items.',
            'read': false,
          });
        }
      });
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to toggle wishlist')),
      );
    }
  }

  void _closeSearch() {
    FocusScope.of(context).unfocus();
    _searchController.clear();
    setState(() => _searchQuery = '');
  }

  /// Called when the user taps a suggestion in the dropdown.
  void _openProduct(Map<String, dynamic> product) {
    _closeSearch();
    Navigator.pushNamed(context, '/product-detail', arguments: product);
  }

  // ---------------------------------------------------------------------------
  // Search UI
  // ---------------------------------------------------------------------------

  Widget _buildSearchField() {
    OutlineInputBorder border(Color color, double width) => OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: width == 0
          ? BorderSide.none
          : BorderSide(color: color, width: width),
    );

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 2, 16, 12),
      child: SizedBox(
        height: 46,
        child: TextField(
          controller: _searchController,
          textInputAction: TextInputAction.search,
          textAlignVertical: TextAlignVertical.center,
          cursorColor: orange,
          style: const TextStyle(color: ink, fontSize: 15),
          decoration: InputDecoration(
            hintText: 'Search products...',
            hintStyle: const TextStyle(color: muted, fontSize: 14.5),
            filled: true,
            fillColor: const Color(0xFFF4F4F5),
            isDense: true,
            contentPadding: EdgeInsets.zero,
            prefixIcon: const Icon(
              Icons.search_rounded,
              size: 22,
              color: muted,
            ),
            suffixIcon: _searchQuery.isEmpty
                ? null
                : IconButton(
                    icon: const Icon(
                      Icons.cancel_rounded,
                      size: 18,
                      color: muted,
                    ),
                    onPressed: () {
                      _searchController.clear();
                      setState(() => _searchQuery = '');
                    },
                  ),
            border: border(Colors.transparent, 0),
            enabledBorder: border(Colors.transparent, 0),
            focusedBorder: border(orange, 1.4),
          ),
          // Suggestions update on every keystroke.
          onChanged: (val) => setState(() => _searchQuery = val),
          // Submitting only hides the keyboard; the user picks from the list.
          onSubmitted: (_) => FocusScope.of(context).unfocus(),
          onTapOutside: (_) => FocusScope.of(context).unfocus(),
        ),
      ),
    );
  }

  /// Finds the product's image path/URL, trying the common field names.
  String? _productImage(Map<String, dynamic> p) {
    for (final key in const [
      'image',
      'imageUrl',
      'image_url',
      'thumbnail',
      'photo',
    ]) {
      final v = p[key];
      if (v is String && v.isNotEmpty) return v;
    }
    final imgs = p['images'];
    if (imgs is List && imgs.isNotEmpty) {
      final first = imgs.first;
      if (first is String && first.isNotEmpty) return first;
      if (first is Map) {
        final u = first['url'] ?? first['src'];
        if (u is String && u.isNotEmpty) return u;
      }
    }
    return null;
  }

  Widget _suggestionThumb(Map<String, dynamic> p) {
    const size = 48.0;
    final placeholder = Container(
      width: size,
      height: size,
      color: Colors.grey.shade100,
      child: const Icon(Icons.image_outlined, size: 20, color: muted),
    );
    final src = _productImage(p);
    if (src == null)
      return ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: placeholder,
      );

    final img = src.startsWith('http')
        ? Image.network(
            src,
            width: size,
            height: size,
            fit: BoxFit.cover,
            errorBuilder: (ctx, e, st) => placeholder,
          )
        : Image.asset(
            src,
            width: size,
            height: size,
            fit: BoxFit.cover,
            errorBuilder: (ctx, e, st) => placeholder,
          );

    return ClipRRect(borderRadius: BorderRadius.circular(8), child: img);
  }

  Widget _buildSuggestions() {
    final matches = _searchMatches;

    return Material(
      color: Colors.white,
      elevation: 10,
      shadowColor: Colors.black38,
      borderRadius: BorderRadius.circular(16),
      clipBehavior: Clip.antiAlias,
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.5,
        ),
        child: matches.isEmpty
            ? Padding(
                padding: const EdgeInsets.all(20),
                child: Text(
                  'No products found for "$_searchQuery"',
                  style: const TextStyle(color: muted, fontSize: 14),
                ),
              )
            : ListView.separated(
                shrinkWrap: true,
                padding: EdgeInsets.zero,
                itemCount: matches.length,
                separatorBuilder: (ctx, i) => const Divider(height: 1),
                itemBuilder: (context, i) {
                  final p = matches[i];
                  final name = (p['name'] ?? '').toString();
                  final category = (p['category'] ?? '').toString();
                  return ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 4,
                    ),
                    leading: _suggestionThumb(p),
                    title: Text(
                      name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: ink,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    subtitle: category.isEmpty
                        ? null
                        : Text(
                            category,
                            style: const TextStyle(color: muted, fontSize: 12),
                          ),
                    trailing: const Icon(
                      Icons.north_west,
                      size: 16,
                      color: muted,
                    ),
                    onTap: () => _openProduct(p),
                  );
                },
              ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Main body
  // ---------------------------------------------------------------------------

  Widget _buildBody(List<Map<String, dynamic>> filtered) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
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
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Hero banner
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
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
                        errorBuilder: (ctx, obj, st) => const SizedBox(),
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
                            onPressed: () =>
                                Navigator.pushNamed(context, '/catalog'),
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
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
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
                    onSelected: (_) => setState(() => _selectedCategory = cat),
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
                    onPressed: () => Navigator.pushNamed(context, '/catalog'),
                    style: TextButton.styleFrom(foregroundColor: orange),
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
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
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
                    onTap: () {
                      Navigator.pushNamed(
                        context,
                        '/product-detail',
                        arguments: p,
                      );
                    },
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
                border: Border.all(color: orange.withValues(alpha: 0.2)),
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
                    style: TextStyle(color: ink, fontSize: 12, height: 1.4),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
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

    final showSuggestions = _searchQuery.trim().isNotEmpty;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        automaticallyImplyLeading: false,
        titleSpacing: 20,
        // The logo is always visible; the search bar sits in its own row below.
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
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(60),
          child: _buildSearchField(),
        ),
        actions: [
          IconButton(
            icon: _badged(
              const Icon(
                Icons.notifications_none_rounded,
                size: 25,
                color: ink,
              ),
              _unreadCount,
            ),
            onPressed: _showNotifications,
            tooltip: 'Notifications',
          ),
          IconButton(
            icon: _badged(
              const Icon(Icons.shopping_cart_outlined, size: 24, color: ink),
              _cartCount,
            ),
            onPressed: () async {
              if (context.read<AuthProvider>().isLoggedIn) {
                await Navigator.pushNamed(context, '/cart');
                if (mounted) _refreshCounts();
              } else {
                Navigator.pushReplacementNamed(context, '/login');
              }
            },
            tooltip: 'Cart',
          ),
          IconButton(
            icon: _badged(
              Icon(
                _savedIds.isEmpty
                    ? Icons.favorite_border_rounded
                    : Icons.favorite_rounded,
                size: 24,
                color: _savedIds.isEmpty ? ink : orange,
              ),
              _savedIds.length,
            ),
            onPressed: () async {
              final auth = context.read<AuthProvider>();
              await Navigator.pushNamed(
                context,
                '/saved',
                arguments: {'userId': auth.userId},
              );
              if (mounted) _refreshCounts();
            },
            tooltip: 'Saved',
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Stack(
        children: [
          _buildBody(filtered),
          // Live suggestions dropdown, shown over the page while typing.
          if (showSuggestions)
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 0),
                child: _buildSuggestions(),
              ),
            ),
        ],
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
