import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../components/app_theme.dart';
import '../components/product_tile.dart';
import '../services/products_service.dart';
import '../services/wishlist_service.dart';
import '../services/auth_provider.dart';

/// Full catalogue page showing all products with multi-attribute filtering:
/// - Audience (Men, Women, Kids)
/// - Size (XS, S, M, L, XL)
/// - Color (Cobalt, Rust, Ivory, Ink, Olive, etc.)
/// - Category (Dresses, Sets, Tops, Outerwear)
/// - Badge (Sale, New, Bestseller)
/// - Sort by Price / Name
class CatalogPage extends StatefulWidget {
  final String? initialAudience;
  final String? initialCategory;

  const CatalogPage({
    super.key,
    this.initialAudience,
    this.initialCategory,
  });

  @override
  State<CatalogPage> createState() => _CatalogPageState();
}

class _CatalogPageState extends State<CatalogPage> {
  final ProductsService _productsService = ProductsService();
  final WishlistService _wishlistService = WishlistService();

  List<Map<String, dynamic>> _allProducts = [];
  bool _loading = true;
  String? _error;
  Set<String> _savedIds = const {};
  String? _userId;

  // Filter States
  String _selectedAudience = 'All'; // All, Women, Men, Kids
  String _selectedCategory = 'All';
  String _selectedSize = 'All';
  String _selectedColor = 'All';
  String _selectedBadge = 'All';
  String _sortBy = 'Default'; // Default, Price: Low to High, Price: High to Low, Name: A-Z
  String _searchQuery = '';

  final TextEditingController _searchController = TextEditingController();

  static const List<String> _audiences = ['All', 'Women', 'Men', 'Kids'];
  static const List<String> _sizes = ['All', 'XS', 'S', 'M', 'L', 'XL'];
  static const List<String> _sortOptions = [
    'Default',
    'Price: Low to High',
    'Price: High to Low',
    'Name: A-Z',
  ];

  @override
  void initState() {
    super.initState();
    if (widget.initialAudience != null && widget.initialAudience!.isNotEmpty) {
      _selectedAudience = widget.initialAudience!;
    }
    if (widget.initialCategory != null && widget.initialCategory!.isNotEmpty) {
      _selectedCategory = widget.initialCategory!;
    }
    _userId = context.read<AuthProvider>().userId;
    _load();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args = ModalRoute.of(context)?.settings.arguments;
    if (args is Map) {
      if (args['audience'] is String) {
        _selectedAudience = args['audience'] as String;
      }
      if (args['category'] is String) {
        _selectedCategory = args['category'] as String;
      }
    }
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
      final res = await _productsService.list();
      if (!mounted) return;

      if (!res.success) {
        setState(() {
          _error = res.message ?? 'Failed to load catalogue.';
          _loading = false;
        });
        return;
      }

      final list = res.data is List
          ? (res.data as List).cast<Map<String, dynamic>>()
          : <Map<String, dynamic>>[];

      // Wishlist items
      final wRes = await _wishlistService.getWishlist();
      final saved = wRes.success && wRes.data is List
          ? (wRes.data as List).map((e) => e.toString()).toSet()
          : <String>{};

      if (!mounted) return;
      setState(() {
        _allProducts = list;
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

  Future<void> _toggleWishlist(String id) async {
    final res = await _wishlistService.toggle(id);
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
        SnackBar(content: Text(res.message ?? 'Failed to update wishlist')),
      );
    }
  }

  // Derive unique categories dynamically
  List<String> get _categories {
    final set = <String>{'All'};
    for (final p in _allProducts) {
      final c = (p['category'] ?? '').toString().trim();
      if (c.isNotEmpty) set.add(c);
    }
    return set.toList();
  }

  // Derive unique colors dynamically
  List<String> get _colors {
    final set = <String>{'All'};
    for (final p in _allProducts) {
      final colors = p['colors'];
      if (colors is List) {
        for (final c in colors) {
          final s = c.toString().trim();
          if (s.isNotEmpty) set.add(s);
        }
      }
    }
    return set.toList();
  }

  // Filter & sort logic
  List<Map<String, dynamic>> get _filteredProducts {
    var list = _allProducts.where((p) {
      // 1. Audience / Gender (Men, Women, Kids)
      if (_selectedAudience != 'All') {
        final aud = (p['audience'] ?? '').toString().toLowerCase();
        if (aud != _selectedAudience.toLowerCase()) {
          return false;
        }
      }

      // 2. Category
      if (_selectedCategory != 'All') {
        final cat = (p['category'] ?? '').toString().toLowerCase();
        if (cat != _selectedCategory.toLowerCase()) {
          return false;
        }
      }

      // 3. Size
      if (_selectedSize != 'All') {
        final sizes = p['sizes'];
        if (sizes is List) {
          final hasSize = sizes.any(
            (s) => s.toString().toUpperCase() == _selectedSize.toUpperCase(),
          );
          if (!hasSize) return false;
        } else {
          return false;
        }
      }

      // 4. Color
      if (_selectedColor != 'All') {
        final colors = p['colors'];
        if (colors is List) {
          final hasColor = colors.any(
            (c) => c.toString().toLowerCase() == _selectedColor.toLowerCase(),
          );
          if (!hasColor) return false;
        } else {
          return false;
        }
      }

      // 5. Badge
      if (_selectedBadge != 'All') {
        final badge = (p['label'] ?? '').toString().toLowerCase();
        if (badge != _selectedBadge.toLowerCase()) {
          return false;
        }
      }

      // 6. Search query
      if (_searchQuery.trim().isNotEmpty) {
        final q = _searchQuery.trim().toLowerCase();
        final name = (p['name'] ?? '').toString().toLowerCase();
        final desc = (p['description'] ?? '').toString().toLowerCase();
        final details = (p['details'] ?? '').toString().toLowerCase();
        if (!name.contains(q) && !desc.contains(q) && !details.contains(q)) {
          return false;
        }
      }

      return true;
    }).toList();

    // Sorting
    if (_sortBy == 'Price: Low to High') {
      list.sort((a, b) {
        final pa = (a['price'] is num ? a['price'] as num : 0);
        final pb = (b['price'] is num ? b['price'] as num : 0);
        return pa.compareTo(pb);
      });
    } else if (_sortBy == 'Price: High to Low') {
      list.sort((a, b) {
        final pa = (a['price'] is num ? a['price'] as num : 0);
        final pb = (b['price'] is num ? b['price'] as num : 0);
        return pb.compareTo(pa);
      });
    } else if (_sortBy == 'Name: A-Z') {
      list.sort((a, b) {
        final na = (a['name'] ?? '').toString();
        final nb = (b['name'] ?? '').toString();
        return na.compareTo(nb);
      });
    }

    return list;
  }

  int get _activeFilterCount {
    int count = 0;
    if (_selectedAudience != 'All') count++;
    if (_selectedCategory != 'All') count++;
    if (_selectedSize != 'All') count++;
    if (_selectedColor != 'All') count++;
    if (_selectedBadge != 'All') count++;
    if (_sortBy != 'Default') count++;
    return count;
  }

  void _resetFilters() {
    setState(() {
      _selectedAudience = 'All';
      _selectedCategory = 'All';
      _selectedSize = 'All';
      _selectedColor = 'All';
      _selectedBadge = 'All';
      _sortBy = 'Default';
      _searchQuery = '';
      _searchController.clear();
    });
  }

  void _openFilterModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return DraggableScrollableSheet(
              initialChildSize: 0.8,
              minChildSize: 0.5,
              maxChildSize: 0.95,
              expand: false,
              builder: (_, scrollController) {
                return Column(
                  children: [
                    // Handle & Header
                    Container(
                      margin: const EdgeInsets.only(top: 12, bottom: 8),
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 12,
                      ),
                      child: Row(
                        children: [
                          const Text(
                            'Filters',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const Spacer(),
                          if (_activeFilterCount > 0)
                            TextButton(
                              onPressed: () {
                                _resetFilters();
                                setModalState(() {});
                              },
                              child: const Text(
                                'Reset All',
                                style: TextStyle(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                    const Divider(height: 1),

                    // Filter Options List
                    Expanded(
                      child: ListView(
                        controller: scrollController,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 16,
                        ),
                        children: [
                          // 1. Audience / Gender
                          _filterSectionHeader('Department / Gender'),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: _audiences.map((aud) {
                              final sel = _selectedAudience == aud;
                              return ChoiceChip(
                                label: Text(aud),
                                selected: sel,
                                onSelected: (_) {
                                  setModalState(() => _selectedAudience = aud);
                                  setState(() {});
                                },
                                selectedColor: AppColors.primary,
                                labelStyle: TextStyle(
                                  color: sel ? Colors.white : AppColors.textPrimary,
                                  fontWeight: sel ? FontWeight.bold : FontWeight.normal,
                                ),
                              );
                            }).toList(),
                          ),
                          const SizedBox(height: 20),

                          // 2. Sizes
                          _filterSectionHeader('Size'),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: _sizes.map((sz) {
                              final sel = _selectedSize == sz;
                              return ChoiceChip(
                                label: Text(sz),
                                selected: sel,
                                onSelected: (_) {
                                  setModalState(() => _selectedSize = sz);
                                  setState(() {});
                                },
                                selectedColor: AppColors.primary,
                                labelStyle: TextStyle(
                                  color: sel ? Colors.white : AppColors.textPrimary,
                                  fontWeight: sel ? FontWeight.bold : FontWeight.normal,
                                ),
                              );
                            }).toList(),
                          ),
                          const SizedBox(height: 20),

                          // 3. Colors
                          if (_colors.length > 1) ...[
                            _filterSectionHeader('Color'),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: _colors.map((c) {
                                final sel = _selectedColor == c;
                                return ChoiceChip(
                                  label: Text(c),
                                  selected: sel,
                                  onSelected: (_) {
                                    setModalState(() => _selectedColor = c);
                                    setState(() {});
                                  },
                                  selectedColor: AppColors.primary,
                                  labelStyle: TextStyle(
                                    color: sel ? Colors.white : AppColors.textPrimary,
                                    fontWeight: sel ? FontWeight.bold : FontWeight.normal,
                                  ),
                                );
                              }).toList(),
                            ),
                            const SizedBox(height: 20),
                          ],

                          // 4. Categories
                          if (_categories.length > 1) ...[
                            _filterSectionHeader('Category'),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: _categories.map((cat) {
                                final sel = _selectedCategory == cat;
                                return ChoiceChip(
                                  label: Text(cat),
                                  selected: sel,
                                  onSelected: (_) {
                                    setModalState(() => _selectedCategory = cat);
                                    setState(() {});
                                  },
                                  selectedColor: AppColors.primary,
                                  labelStyle: TextStyle(
                                    color: sel ? Colors.white : AppColors.textPrimary,
                                    fontWeight: sel ? FontWeight.bold : FontWeight.normal,
                                  ),
                                );
                              }).toList(),
                            ),
                            const SizedBox(height: 20),
                          ],

                          // 5. Sort By
                          _filterSectionHeader('Sort By'),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: _sortOptions.map((opt) {
                              final sel = _sortBy == opt;
                              return ChoiceChip(
                                label: Text(opt),
                                selected: sel,
                                onSelected: (_) {
                                  setModalState(() => _sortBy = opt);
                                  setState(() {});
                                },
                                selectedColor: AppColors.primary,
                                labelStyle: TextStyle(
                                  color: sel ? Colors.white : AppColors.textPrimary,
                                  fontWeight: sel ? FontWeight.bold : FontWeight.normal,
                                ),
                              );
                            }).toList(),
                          ),
                          const SizedBox(height: 20),
                        ],
                      ),
                    ),

                    // Apply Button
                    SafeArea(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: SizedBox(
                          width: double.infinity,
                          height: 50,
                          child: ElevatedButton(
                            onPressed: () => Navigator.pop(context),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: Text(
                              'View Results (${_filteredProducts.length})',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                );
              },
            );
          },
        );
      },
    );
  }

  Widget _filterSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w700,
          color: AppColors.textPrimary,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final products = _filteredProducts;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'All Products',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w700,
            fontSize: 18,
          ),
        ),
        actions: [
          // Filter button with active badge
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.tune_outlined, color: AppColors.textPrimary),
                onPressed: _openFilterModal,
                tooltip: 'Filter Catalogue',
              ),
              if (_activeFilterCount > 0)
                Positioned(
                  top: 10,
                  right: 10,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                    child: Text(
                      '$_activeFilterCount',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
            child: TextField(
              controller: _searchController,
              onChanged: (val) => setState(() => _searchQuery = val),
              decoration: InputDecoration(
                hintText: 'Search pieces, fabrics, styles...',
                hintStyle: const TextStyle(fontSize: 14, color: AppColors.textMuted),
                prefixIcon: const Icon(Icons.search, color: AppColors.textMuted, size: 20),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 18, color: AppColors.textMuted),
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _searchQuery = '');
                        },
                      )
                    : null,
                filled: true,
                fillColor: Colors.white,
                contentPadding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.border),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.border),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
                ),
              ),
            ),
          ),

          // Department Quick Filter Pills
          SizedBox(
            height: 38,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _audiences.length,
              separatorBuilder: (_, _) => const SizedBox(width: 8),
              itemBuilder: (context, i) {
                final aud = _audiences[i];
                final isSelected = _selectedAudience == aud;
                return GestureDetector(
                  onTap: () => setState(() => _selectedAudience = aud),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: isSelected ? AppColors.primary : Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isSelected ? AppColors.primary : AppColors.border,
                      ),
                      boxShadow: isSelected
                          ? [
                              BoxShadow(
                                color: AppColors.primary.withValues(alpha: 0.3),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ]
                          : null,
                    ),
                    child: Center(
                      child: Text(
                        aud,
                        style: TextStyle(
                          color: isSelected ? Colors.white : AppColors.textPrimary,
                          fontSize: 13,
                          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 12),

          // Active filter chip banner (if any active filters)
          if (_activeFilterCount > 0)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Row(
                children: [
                  Expanded(
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          if (_selectedCategory != 'All')
                            _activeChip('Category: $_selectedCategory', () {
                              setState(() => _selectedCategory = 'All');
                            }),
                          if (_selectedSize != 'All')
                            _activeChip('Size: $_selectedSize', () {
                              setState(() => _selectedSize = 'All');
                            }),
                          if (_selectedColor != 'All')
                            _activeChip('Color: $_selectedColor', () {
                              setState(() => _selectedColor = 'All');
                            }),
                          if (_sortBy != 'Default')
                            _activeChip('Sort: $_sortBy', () {
                              setState(() => _sortBy = 'Default');
                            }),
                        ],
                      ),
                    ),
                  ),
                  TextButton(
                    onPressed: _resetFilters,
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      minimumSize: Size.zero,
                    ),
                    child: const Text(
                      'Clear',
                      style: TextStyle(fontSize: 12, color: Colors.red),
                    ),
                  ),
                ],
              ),
            ),

          // Product count info
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            child: Row(
              children: [
                Text(
                  '${products.length} ${products.length == 1 ? 'piece' : 'pieces'} found',
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.textMuted,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),

          // Product Grid or Empty State
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.error_outline, size: 48, color: Colors.red),
                            const SizedBox(height: 12),
                            Text(_error!, style: const TextStyle(color: AppColors.textMuted)),
                            const SizedBox(height: 16),
                            ElevatedButton(
                              onPressed: _load,
                              child: const Text('Retry'),
                            ),
                          ],
                        ),
                      )
                    : products.isEmpty
                        ? Center(
                            child: Padding(
                              padding: const EdgeInsets.all(32),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.filter_alt_off_outlined,
                                    size: 64,
                                    color: Colors.grey.shade400,
                                  ),
                                  const SizedBox(height: 16),
                                  const Text(
                                    'No pieces match your filters',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  const Text(
                                    'Try adjusting your size, color, or department selections.',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontSize: 13,
                                      color: AppColors.textMuted,
                                    ),
                                  ),
                                  const SizedBox(height: 20),
                                  OutlinedButton(
                                    onPressed: _resetFilters,
                                    child: const Text('Reset All Filters'),
                                  ),
                                ],
                              ),
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: _load,
                            child: GridView.builder(
                              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                              itemCount: products.length,
                              gridDelegate:
                                  const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 2,
                                childAspectRatio: 0.62,
                                crossAxisSpacing: 12,
                                mainAxisSpacing: 16,
                              ),
                              itemBuilder: (context, i) {
                                final p = products[i];
                                final id = (p['id'] ?? p['_id'] ?? '').toString();
                                return ProductTile(
                                  product: p,
                                  onTap: () {},
                                  onFavorite: () => _toggleWishlist(id),
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _activeChip(String label, VoidCallback onDeleted) {
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: Chip(
        label: Text(label, style: const TextStyle(fontSize: 11)),
        deleteIcon: const Icon(Icons.close, size: 14),
        onDeleted: onDeleted,
        backgroundColor: Colors.white,
        side: const BorderSide(color: AppColors.border),
        padding: const EdgeInsets.symmetric(horizontal: 4),
        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
      ),
    );
  }
}
