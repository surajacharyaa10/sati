import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:async';
import '../components/app_theme.dart';
import '../components/app_image.dart';
import '../services/api_service.dart';
import '../services/cart_service.dart';
import '../services/wishlist_service.dart';
import '../services/auth_provider.dart';

class ProductDetailPage extends StatefulWidget {
  final Map<String, dynamic> product;

  const ProductDetailPage({super.key, required this.product});

  @override
  State<ProductDetailPage> createState() => _ProductDetailPageState();
}

class _ProductDetailPageState extends State<ProductDetailPage> {
  final ApiService _api = ApiService();
  final CartService _cart = CartService();
  final WishlistService _wishlist = WishlistService();

  late Map<String, dynamic> _product;
  int _selectedImageIndex = 0;
  String _selectedSize = '';
  String _selectedColor = '';
  int _quantity = 1;

  bool _isSaved = false;
  bool _addingToCart = false;

  // Reviews state
  bool _loadingReviews = true;
  List<Map<String, dynamic>> _reviews = [];
  double _avgRating = 0.0;
  int _reviewCount = 0;
  Map<String, int> _distribution = {'1': 0, '2': 0, '3': 0, '4': 0, '5': 0};

  final ScrollController _scrollController = ScrollController();
  final GlobalKey _reviewsSectionKey = GlobalKey();
  final PageController _pageController = PageController();
  Timer? _autoSlideTimer;
  static const Duration _autoSlideInterval = Duration(seconds: 4);

  @override
  void initState() {
    super.initState();
    _product = Map<String, dynamic>.from(widget.product);

    // Default size
    final sizes = _sizes;
    if (sizes.isNotEmpty) {
      _selectedSize = sizes.first;
    }

    // Default color
    final colors = _colors;
    if (colors.isNotEmpty) {
      _selectedColor = colors.first;
    }

    _checkWishlist();
    _loadProductDetailsAndReviews();
    _startAutoSlide();
  }

  void _startAutoSlide() {
    _autoSlideTimer?.cancel();
    _autoSlideTimer = Timer.periodic(_autoSlideInterval, (_) {
      if (!mounted) return;
      final images = _galleryImages;
      if (images.length < 2) return;
      final next = (_selectedImageIndex + 1) % images.length;
      _pageController.animateToPage(
        next,
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOut,
      );
    });
  }

  void _pauseAutoSlide() {
    _autoSlideTimer?.cancel();
    _autoSlideTimer = null;
  }

  void _resumeAutoSlide() {
    if (_autoSlideTimer == null) _startAutoSlide();
  }

  @override
  void dispose() {
    _autoSlideTimer?.cancel();
    _scrollController.dispose();
    _pageController.dispose();
    super.dispose();
  }

  String get _id => (_product['_id'] ?? _product['id'] ?? '').toString();
  String get _name => (_product['name'] ?? 'Product').toString();
  String get _audience => (_product['audience'] ?? '').toString();
  String get _category => (_product['category'] ?? '').toString();
  String get _description => (_product['description'] ?? '').toString();
  String get _material => (_product['material'] ?? '').toString();
  String get _fit => (_product['fit'] ?? '').toString();
  String get _details => (_product['details'] ?? '').toString();
  String get _label => (_product['label'] ?? '').toString();

  String get _priceFormatted {
    final price = _product['price'];
    if (price is num) return 'Rs. ${price.toStringAsFixed(0)}';
    return price != null ? 'Rs. $price' : '';
  }

  String? get _originalPriceFormatted {
    final orig = _product['originalPrice'];
    if (orig is num) return 'Rs. ${orig.toStringAsFixed(0)}';
    return orig != null ? 'Rs. $orig' : null;
  }

  String? get _poundPriceFormatted {
    final p = _product['poundPrice'];
    if (p is num) return '£${p.toStringAsFixed(0)}';
    return p != null ? '£$p' : null;
  }

  List<String> get _sizes {
    final raw = _product['sizes'];
    if (raw is List) {
      return raw.map((e) => e.toString()).toList();
    }
    return const ['XS', 'S', 'M', 'L', 'XL'];
  }

  List<String> get _colors {
    final raw = _product['colors'];
    if (raw is List) {
      return raw.map((e) => e.toString()).toList();
    }
    return const [];
  }

  /// Each entry is a map with `url`, `size`, and `color` keys.
  /// Falls back to plain strings when the backend sends a flat list.
  /// The primary `image` is always placed first, but inherits the size/color
  /// from its matching entry in `images` when available.
  List<Map<String, String>> get _galleryImages {
    final entries = <Map<String, String>>[];

    void add(String url, {String size = '', String color = ''}) {
      if (url.isEmpty) return;
      for (final e in entries) {
        if (e['url'] == url) {
          // Merge: keep existing size/color if this entry omits them
          if ((e['size'] ?? '').isEmpty && size.isNotEmpty) e['size'] = size;
          if ((e['color'] ?? '').isEmpty && color.isNotEmpty) e['color'] = color;
          return;
        }
      }
      entries.add({'url': url, 'size': size, 'color': color});
    }

    // 1. Collect all variant images first so their size/color are captured.
    final rawImages = _product['images'];
    if (rawImages is List) {
      for (final item in rawImages) {
        if (item is Map) {
          final u = (item['url'] ?? item['image'] ?? '').toString();
          add(u,
              size: (item['size'] ?? '').toString(),
              color: (item['color'] ?? '').toString());
        } else if (item is String) {
          add(item);
        }
      }
    }

    // 2. Ensure the primary `image` is first (with size/color from product
    //    level fields, or inherited from its matching variant entry).
    final primary = (_product['image'] ?? '').toString();
    if (primary.isNotEmpty) {
      final primaryEntry = entries.firstWhere(
        (e) => e['url'] == primary,
        orElse: () => <String, String>{},
      );
      if (primaryEntry.isNotEmpty) {
        // Move the matching entry to the front so the primary image leads.
        entries.remove(primaryEntry);
        entries.insert(0, primaryEntry);
      } else {
        entries.insert(0, {
          'url': primary,
          'size': (_product['size'] ?? '').toString(),
          'color': (_product['color'] ?? '').toString(),
        });
      }
    }

    if (entries.isEmpty) entries.add({'url': '', 'size': '', 'color': ''});
    return entries;
  }

  Future<void> _checkWishlist() async {
    try {
      final res = await _wishlist.getWishlist();
      if (mounted && res.success && res.data is List) {
        final ids = (res.data as List).map((e) => e.toString()).toSet();
        setState(() {
          _isSaved = ids.contains(_id);
        });
      }
    } catch (_) {}
  }

  Future<void> _loadProductDetailsAndReviews() async {
    // 1. Fetch fresh product details
    try {
      final pRes = await _api.get('/products/$_id');
      if (mounted && pRes.success && pRes.data is Map) {
        setState(() {
          _product = Map<String, dynamic>.from(pRes.data as Map);
        });
      }
    } catch (_) {}

    // 2. Fetch reviews
    try {
      final rRes = await _api.get('/products/$_id/reviews');
      if (mounted && rRes.success && rRes.data is Map) {
        final data = rRes.data as Map;
        final revs = data['reviews'] is List
            ? (data['reviews'] as List).cast<Map<String, dynamic>>()
            : <Map<String, dynamic>>[];

        final stats = data['stats'] is Map ? data['stats'] as Map : {};
        final rating = stats['rating'] is num ? (stats['rating'] as num).toDouble() : 0.0;
        final count = stats['reviewCount'] is num ? (stats['reviewCount'] as num).toInt() : revs.length;

        final distMap = <String, int>{'1': 0, '2': 0, '3': 0, '4': 0, '5': 0};
        if (stats['distribution'] is Map) {
          (stats['distribution'] as Map).forEach((k, v) {
            distMap[k.toString()] = (v is num) ? v.toInt() : 0;
          });
        }

        setState(() {
          _reviews = revs;
          _avgRating = rating;
          _reviewCount = count;
          _distribution = distMap;
          _loadingReviews = false;
        });
        return;
      }
    } catch (_) {}

    if (mounted) {
      setState(() => _loadingReviews = false);
    }
  }

  Future<void> _toggleWishlist() async {
    final res = await _wishlist.toggle(_id);
    if (!mounted) return;
    if (res.success) {
      setState(() => _isSaved = !_isSaved);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(_isSaved ? 'Added to Saved items' : 'Removed from Saved items'),
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  Future<void> _addToCart() async {
    final auth = context.read<AuthProvider>();
    if (!auth.isLoggedIn) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please log in to add items to bag')),
      );
      Navigator.pushNamed(context, '/login');
      return;
    }

    setState(() => _addingToCart = true);
    final res = await _cart.add(
      _id,
      quantity: _quantity,
      size: _selectedSize.isNotEmpty ? _selectedSize : null,
      color: _selectedColor.isNotEmpty ? _selectedColor : null,
    );
    if (!mounted) return;
    setState(() => _addingToCart = false);

    if (res.success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Added $_quantity × $_name to bag'),
          action: SnackBarAction(
            label: 'View Bag',
            textColor: Colors.amber,
            onPressed: () => Navigator.pushNamed(context, '/cart'),
          ),
          duration: const Duration(seconds: 3),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(res.message ?? 'Failed to add item to bag')),
      );
    }
  }

  void _scrollToReviews() {
    final keyContext = _reviewsSectionKey.currentContext;
    if (keyContext != null) {
      Scrollable.ensureVisible(
        keyContext,
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeInOut,
      );
    }
  }

  void _openAddReviewSheet() {
    final auth = context.read<AuthProvider>();
    final defaultName = auth.user?['name']?.toString() ?? '';
    final defaultEmail = auth.user?['email']?.toString() ?? '';

    final nameController = TextEditingController(text: defaultName);
    final emailController = TextEditingController(text: defaultEmail);
    final titleController = TextEditingController();
    final commentController = TextEditingController();

    int selectedStars = 5;
    bool isSubmitting = false;
    String? formError;

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
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
              ),
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Handle
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade300,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Write a Review',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Share your thoughts on $_name',
                      style: const TextStyle(fontSize: 13, color: AppColors.textMuted),
                    ),
                    const SizedBox(height: 18),

                    // Star Rating Picker
                    const Text(
                      'Your Rating *',
                      style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: List.generate(5, (index) {
                        final star = index + 1;
                        return GestureDetector(
                          onTap: () => setModalState(() => selectedStars = star),
                          child: Padding(
                            padding: const EdgeInsets.only(right: 6),
                            child: Icon(
                              star <= selectedStars ? Icons.star : Icons.star_border,
                              color: Colors.amber,
                              size: 36,
                            ),
                          ),
                        );
                      }),
                    ),
                    const SizedBox(height: 16),

                    // Name
                    TextField(
                      controller: nameController,
                      decoration: InputDecoration(
                        labelText: 'Your Name *',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Review Title
                    TextField(
                      controller: titleController,
                      decoration: InputDecoration(
                        labelText: 'Review Headline (e.g. Stunning drape & fit)',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Comment
                    TextField(
                      controller: commentController,
                      maxLines: 4,
                      decoration: InputDecoration(
                        labelText: 'Review Feedback *',
                        hintText: 'Describe fabric quality, sizing accuracy, comfort...',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                    ),
                    if (formError != null) ...[
                      const SizedBox(height: 12),
                      Text(formError!, style: const TextStyle(color: Colors.red, fontSize: 13)),
                    ],
                    const SizedBox(height: 20),

                    // Submit Button
                    SizedBox(
                      height: 50,
                      child: ElevatedButton(
                        onPressed: isSubmitting
                            ? null
                            : () async {
                                final name = nameController.text.trim();
                                final comment = commentController.text.trim();
                                if (name.isEmpty) {
                                  setModalState(() => formError = 'Please enter your name');
                                  return;
                                }
                                if (comment.length < 3) {
                                  setModalState(
                                    () => formError = 'Please write at least 3 characters',
                                  );
                                  return;
                                }

                                setModalState(() {
                                  isSubmitting = true;
                                  formError = null;
                                });

                                final messenger = ScaffoldMessenger.of(context);
                                final nav = Navigator.of(ctx);

                                try {
                                  final res = await _api.post(
                                    '/products/$_id/reviews',
                                    body: {
                                      'userName': name,
                                      'userEmail': emailController.text.trim(),
                                      'rating': selectedStars,
                                      'title': titleController.text.trim(),
                                      'comment': comment,
                                    },
                                  );

                                  if (!mounted) return;
                                  if (res.success && res.data is Map) {
                                    nav.pop();
                                    messenger.showSnackBar(
                                      const SnackBar(
                                        content: Text('Thank you! Your review has been published.'),
                                      ),
                                    );
                                    _loadProductDetailsAndReviews();
                                  } else {
                                    setModalState(() {
                                      isSubmitting = false;
                                      formError = res.message ?? 'Failed to submit review';
                                    });
                                  }
                                } catch (e) {
                                  setModalState(() {
                                    isSubmitting = false;
                                    formError = e.toString();
                                  });
                                }
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: isSubmitting
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2,
                                ),
                              )
                            : const Text(
                                'Submit Review',
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final images = _galleryImages;

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: CustomScrollView(
        controller: _scrollController,
        slivers: [
          // App Bar with Gallery Carousel
          SliverAppBar(
            expandedHeight: 380,
            pinned: true,
            backgroundColor: Colors.white,
            elevation: 0,
            leading: Padding(
              padding: const EdgeInsets.all(8),
              child: CircleAvatar(
                backgroundColor: Colors.white.withValues(alpha: 0.9),
                child: IconButton(
                  icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary, size: 20),
                  onPressed: () => Navigator.pop(context),
                ),
              ),
            ),
            actions: [
              Padding(
                padding: const EdgeInsets.all(8),
                child: CircleAvatar(
                  backgroundColor: Colors.white.withValues(alpha: 0.9),
                  child: IconButton(
                    icon: Icon(
                      _isSaved ? Icons.favorite : Icons.favorite_border,
                      color: _isSaved ? Colors.red : AppColors.textPrimary,
                      size: 20,
                    ),
                    onPressed: _toggleWishlist,
                  ),
                ),
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                children: [
                  Listener(
                    onPointerDown: (_) => _pauseAutoSlide(),
                    onPointerUp: (_) => _resumeAutoSlide(),
                    onPointerCancel: (_) => _resumeAutoSlide(),
                    behavior: HitTestBehavior.translucent,
                    child: PageView.builder(
                      controller: _pageController,
                      itemCount: images.length,
                      onPageChanged: (i) => setState(() => _selectedImageIndex = i),
                      itemBuilder: (context, i) {
                        final entry = images[i];
                        return AppProductImage(
                          image: entry['url']!,
                          fit: BoxFit.cover,
                        );
                      },
                    ),
                  ),
                  // Badge (Sale, New, etc.)
                  if (_label.isNotEmpty)
                    Positioned(
                      top: 100,
                      left: 16,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          _label.toUpperCase(),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1,
                          ),
                        ),
),
                  ),
                  // Image indicators with size & color
                  if (images.length > 1)
                    Positioned(
                      bottom: 16,
                      left: 0,
                      right: 0,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Row(
                            children: List.generate(images.length, (i) {
                              final isSel = _selectedImageIndex == i;
                              return AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                margin: const EdgeInsets.symmetric(horizontal: 4),
                                width: isSel ? 20 : 6,
                                height: 6,
                                decoration: BoxDecoration(
                                  color: isSel ? AppColors.primary : Colors.white.withValues(alpha: 0.7),
                                  borderRadius: BorderRadius.circular(3),
                                ),
                              );
                            }),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            _imageVariantLabel(images[_selectedImageIndex]),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              shadows: [
                                Shadow(
                                  color: Colors.black,
                                  blurRadius: 4,
                                  offset: Offset(0, 1),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ),

          // Product Details & Reviews
          SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Audience · Category
                  Text(
                    '${_audience.toUpperCase()} · ${_category.toUpperCase()}',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(height: 6),

                  // Title
                  Text(
                    _name,
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Rating row
                  GestureDetector(
                    onTap: _scrollToReviews,
                    child: Row(
                      children: [
                        const Icon(Icons.star, color: Colors.amber, size: 18),
                        const SizedBox(width: 4),
                        Text(
                          _avgRating > 0 ? _avgRating.toStringAsFixed(1) : '4.8',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          '($_reviewCount ${_reviewCount == 1 ? 'review' : 'reviews'})',
                          style: const TextStyle(
                            color: AppColors.textMuted,
                            fontSize: 13,
                            decoration: TextDecoration.underline,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Pricing row
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.baseline,
                    textBaseline: TextBaseline.alphabetic,
                    children: [
                      Text(
                        _priceFormatted,
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      if (_originalPriceFormatted != null) ...[
                        const SizedBox(width: 8),
                        Text(
                          _originalPriceFormatted!,
                          style: const TextStyle(
                            fontSize: 15,
                            color: AppColors.textMuted,
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                      ],
                      if (_poundPriceFormatted != null) ...[
                        const SizedBox(width: 10),
                        Text(
                          _poundPriceFormatted!,
                          style: const TextStyle(
                            fontSize: 14,
                            color: AppColors.textSecondary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 24),
                  const Divider(height: 1),
                  const SizedBox(height: 20),

                  // Size selection
                  if (_sizes.isNotEmpty) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Select Size',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                        ),
                        Text(
                          'Selected: $_selectedSize',
                          style: const TextStyle(fontSize: 12, color: AppColors.primary),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: _sizes.map((sz) {
                        final isSel = _selectedSize == sz;
                        return GestureDetector(
                          onTap: () => setState(() => _selectedSize = sz),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 160),
                            width: 48,
                            height: 44,
                            decoration: BoxDecoration(
                              color: isSel ? AppColors.primary : Colors.white,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: isSel ? AppColors.primary : AppColors.border,
                                width: isSel ? 1.5 : 1,
                              ),
                            ),
                            child: Center(
                              child: Text(
                                sz,
                                style: TextStyle(
                                  color: isSel ? Colors.white : AppColors.textPrimary,
                                  fontWeight: isSel ? FontWeight.bold : FontWeight.w600,
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // Color selection
                  if (_colors.isNotEmpty) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Select Color',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                        ),
                        Text(
                          'Selected: $_selectedColor',
                          style: const TextStyle(fontSize: 12, color: AppColors.primary),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _colors.map((c) {
                        final isSel = _selectedColor == c;
                        return ChoiceChip(
                          label: Text(c),
                          selected: isSel,
                          onSelected: (_) => setState(() => _selectedColor = c),
                          selectedColor: AppColors.primary,
                          labelStyle: TextStyle(
                            color: isSel ? Colors.white : AppColors.textPrimary,
                            fontWeight: isSel ? FontWeight.bold : FontWeight.w500,
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // Quantity
                  Row(
                    children: [
                      const Text(
                        'Quantity',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                      ),
                      const Spacer(),
                      Container(
                        decoration: BoxDecoration(
                          color: AppColors.bg,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          children: [
                            IconButton(
                              icon: const Icon(Icons.remove, size: 18),
                              onPressed: _quantity > 1 ? () => setState(() => _quantity--) : null,
                            ),
                            Text(
                              '$_quantity',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                            ),
                            IconButton(
                              icon: const Icon(Icons.add, size: 18),
                              onPressed: () => setState(() => _quantity++),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  const Divider(height: 1),
                  const SizedBox(height: 20),

                  // Description
                  if (_description.isNotEmpty) ...[
                    const Text(
                      'Description',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _description,
                      style: const TextStyle(
                        fontSize: 14,
                        color: AppColors.textSecondary,
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // Material & Craftsmanship
                  if (_material.isNotEmpty || _fit.isNotEmpty) ...[
                    const Text(
                      'Materials & Details',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 10),
                    if (_material.isNotEmpty)
                      _detailBullet('Material', _material),
                    if (_fit.isNotEmpty)
                      _detailBullet('Fit & Cut', _fit),
                    if (_details.isNotEmpty)
                      _detailBullet('Finish', _details),
                    const SizedBox(height: 24),
                    const Divider(height: 1),
                    const SizedBox(height: 24),
                  ],

                  // Customer Reviews Section
                  Container(
                    key: _reviewsSectionKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Text(
                              'Customer Reviews',
                              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                            ),
                            const Spacer(),
                            OutlinedButton.icon(
                              onPressed: _openAddReviewSheet,
                              icon: const Icon(Icons.rate_review_outlined, size: 16),
                              label: const Text('Write Review'),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: AppColors.primary,
                                side: const BorderSide(color: AppColors.primary),
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // Review Stats Card
                        _buildReviewStatsCard(),
                        const SizedBox(height: 20),

                        // Reviews List
                        if (_loadingReviews)
                          const Center(
                            child: Padding(
                              padding: EdgeInsets.all(24),
                              child: CircularProgressIndicator(),
                            ),
                          )
                        else if (_reviews.isEmpty)
                          Container(
                            padding: const EdgeInsets.all(24),
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: AppColors.bg,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Column(
                              children: [
                                const Icon(Icons.reviews_outlined, color: AppColors.textMuted, size: 40),
                                const SizedBox(height: 8),
                                const Text(
                                  'No reviews yet',
                                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                ),
                                const SizedBox(height: 4),
                                const Text(
                                  'Be the first to review this artisanal piece!',
                                  style: TextStyle(color: AppColors.textMuted, fontSize: 13),
                                ),
                              ],
                            ),
                          )
                        else
                          ListView.separated(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: _reviews.length,
                            separatorBuilder: (_, _) => const Divider(height: 24),
                            itemBuilder: (context, i) {
                              final r = _reviews[i];
                              return _buildReviewTile(r);
                            },
                          ),
                      ],
                    ),
                  ),

                  // Space for sticky bottom bar
                  const SizedBox(height: 80),
                ],
              ),
            ),
          ),
        ],
      ),

      // Bottom Sticky Action Bar
      bottomNavigationBar: SafeArea(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.08),
                blurRadius: 10,
                offset: const Offset(0, -3),
              ),
            ],
          ),
          child: Row(
            children: [
              // Wishlist icon button
              Container(
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.border),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: IconButton(
                  icon: Icon(
                    _isSaved ? Icons.favorite : Icons.favorite_border,
                    color: _isSaved ? Colors.red : AppColors.textPrimary,
                  ),
                  onPressed: _toggleWishlist,
                  tooltip: _isSaved ? 'Remove from Wishlist' : 'Add to Wishlist',
                ),
              ),
              const SizedBox(width: 12),

              // Add to Bag Button
              Expanded(
                child: SizedBox(
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _addingToCart ? null : _addToCart,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 0,
                    ),
                    child: _addingToCart
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )
                        : Text(
                            'Add to Bag · $_priceFormatted',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _detailBullet(String title, String content) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('•  ', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
          Text('$title: ', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13.5)),
          Expanded(
            child: Text(
              content,
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 13.5),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReviewStatsCard() {
    final total = _reviewCount > 0 ? _reviewCount : 1;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.bg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          // Left: Big Score
          Column(
            children: [
              Text(
                _avgRating > 0 ? _avgRating.toStringAsFixed(1) : '4.8',
                style: const TextStyle(
                  fontSize: 36,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              Row(
                children: List.generate(5, (index) {
                  return const Icon(Icons.star, color: Colors.amber, size: 16);
                }),
              ),
              const SizedBox(height: 4),
              Text(
                '$_reviewCount ratings',
                style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
              ),
            ],
          ),
          const SizedBox(width: 20),
          const SizedBox(
            height: 70,
            child: VerticalDivider(width: 1, color: AppColors.border),
          ),
          const SizedBox(width: 20),

          // Right: Star Bar Rows (5 down to 1)
          Expanded(
            child: Column(
              children: [5, 4, 3, 2, 1].map((star) {
                final count = _distribution['$star'] ?? 0;
                final fraction = count / total;
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2),
                  child: Row(
                    children: [
                      Text('$star★', style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                      const SizedBox(width: 6),
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: fraction,
                            minHeight: 6,
                            backgroundColor: Colors.grey.shade200,
                            valueColor: const AlwaysStoppedAnimation<Color>(Colors.amber),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      SizedBox(
                        width: 20,
                        child: Text(
                          '$count',
                          textAlign: TextAlign.end,
                          style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReviewTile(Map<String, dynamic> r) {
    final userName = (r['userName'] ?? 'Customer').toString();
    final title = (r['title'] ?? '').toString();
    final comment = (r['comment'] ?? '').toString();
    final rating = (r['rating'] is num) ? (r['rating'] as num).toInt() : 5;
    final verified = r['verifiedPurchase'] == true;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            // Stars
            Row(
              children: List.generate(5, (i) {
                return Icon(
                  i < rating ? Icons.star : Icons.star_border,
                  color: Colors.amber,
                  size: 15,
                );
              }),
            ),
            const SizedBox(width: 8),
            Text(
              userName,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
            ),
            if (verified) ...[
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.green.shade50,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Row(
                  children: [
                    Icon(Icons.verified, size: 12, color: Colors.green.shade700),
                    const SizedBox(width: 2),
                    Text(
                      'Verified',
                      style: TextStyle(
                        fontSize: 10,
                        color: Colors.green.shade800,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
        if (title.isNotEmpty) ...[
          const SizedBox(height: 6),
          Text(
            title,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
          ),
        ],
        const SizedBox(height: 6),
        Text(
          comment,
          style: const TextStyle(
            fontSize: 13.5,
            color: AppColors.textSecondary,
            height: 1.4,
          ),
        ),
      ],
    );
  }

  String _imageVariantLabel(Map<String, String> entry) {
    final parts = <String>[];
    if ((entry['size'] ?? '').isNotEmpty) parts.add('Size: ${entry['size']}');
    if ((entry['color'] ?? '').isNotEmpty) parts.add('Color: ${entry['color']}');
    return parts.join('  ·  ');
  }
}
