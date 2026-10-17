import 'package:flutter/material.dart';
import '../components/bottom_nav.dart';

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

  final List<String> _categories = const [
    'All',
    'Bespoke',
    'Outerwear',
    'Silhouettes',
    'Accessories',
  ];

  final List<_ProductItem> _products = const [
    _ProductItem(
      title: 'Handcrafted Wool Overcoat',
      category: 'Outerwear',
      priceNpr: 'Rs. 28,500',
      priceGbp: '£175',
      image: 'assets/images/image1.jpeg',
      tag: 'Bespoke',
    ),
    _ProductItem(
      title: 'Silk Embroidered Kimono',
      category: 'Silhouettes',
      priceNpr: 'Rs. 22,000',
      priceGbp: '£135',
      image: 'assets/images/image2.jpeg',
      tag: 'New',
    ),
    _ProductItem(
      title: 'Tailored Linen Blazer',
      category: 'Bespoke',
      priceNpr: 'Rs. 18,500',
      priceGbp: '£115',
      image: 'assets/images/image3.jpeg',
      tag: 'Signature',
    ),
    _ProductItem(
      title: 'Cashmere Drape Cardigan',
      category: 'Outerwear',
      priceNpr: 'Rs. 24,000',
      priceGbp: '£150',
      image: 'assets/images/image4.jpeg',
    ),
    _ProductItem(
      title: 'Structured Velvet Kurta',
      category: 'Bespoke',
      priceNpr: 'Rs. 19,500',
      priceGbp: '£120',
      image: 'assets/images/image5.jpeg',
    ),
    _ProductItem(
      title: 'Pleated Wide-Leg Trousers',
      category: 'Silhouettes',
      priceNpr: 'Rs. 14,000',
      priceGbp: '£85',
      image: 'assets/images/image6.jpeg',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final filtered = _selectedCategory == 'All'
        ? _products
        : _products.where((p) => p.category == _selectedCategory).toList();

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
            onPressed: () {},
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
              Navigator.of(context).pushReplacementNamed('/saved');
            },
            tooltip: 'Saved',
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
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
                            onPressed: () {},
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
                      fontWeight:
                          isSelected ? FontWeight.w600 : FontWeight.w400,
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
                    onPressed: () {},
                    style: TextButton.styleFrom(foregroundColor: orange),
                    child:
                        const Text('View all', style: TextStyle(fontSize: 13)),
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
                  return Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.grey.shade200),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Stack(
                            children: [
                              Positioned.fill(
                                child: Image.asset(
                                  p.image,
                                  fit: BoxFit.cover,
                                  errorBuilder: (ctx, obj, st) => Container(
                                    color: Colors.grey.shade100,
                                    child: const Icon(
                                      Icons.image_outlined,
                                      color: Colors.grey,
                                    ),
                                  ),
                                ),
                              ),
                              if (p.tag != null)
                                Positioned(
                                  top: 8,
                                  left: 8,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 6,
                                      vertical: 2,
                                    ),
                                    decoration: BoxDecoration(
                                      color: orange,
                                      borderRadius: BorderRadius.circular(3),
                                    ),
                                    child: Text(
                                      p.tag!,
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 9.5,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ),
                              Positioned(
                                top: 4,
                                right: 4,
                                child: IconButton(
                                  icon: const Icon(
                                    Icons.favorite_border,
                                    size: 20,
                                  ),
                                  color: Colors.white,
                                  onPressed: () {},
                                ),
                              ),
                            ],
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(10),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                p.category.toUpperCase(),
                                style: const TextStyle(
                                  color: orange,
                                  fontSize: 9.5,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 0.8,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                p.title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: ink,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  Text(
                                    p.priceNpr,
                                    style: const TextStyle(
                                      color: ink,
                                      fontSize: 12.5,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    p.priceGbp,
                                    style: const TextStyle(
                                      color: muted,
                                      fontSize: 11,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
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
                    style: TextStyle(color: ink, fontSize: 12, height: 1.4),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),
          ],
        ),
      ),
      bottomNavigationBar: BottomNav(
        currentIndex: _selectedNav,
        onTap: (i) {
          if (i == 3) {
            // Replace so Home stays the root of the stack — pressing back on
            // Profile returns to Home as the root, never leaving a back
            // arrow on the Home screen.
            Navigator.pushReplacementNamed(context, '/profile');
            return;
          }
          setState(() => _selectedNav = i);
        },
      ),
    );
  }
}

class _ProductItem {
  final String title;
  final String category;
  final String priceNpr;
  final String priceGbp;
  final String image;
  final String? tag;

  const _ProductItem({
    required this.title,
    required this.category,
    required this.priceNpr,
    required this.priceGbp,
    required this.image,
    this.tag,
  });
}
