import 'package:flutter/material.dart';
import 'app_theme.dart';
import 'app_image.dart';

/// A product card used in the Men/Women collection grids.
class ProductTile extends StatelessWidget {
  final Map<String, dynamic> product;
  final VoidCallback? onTap;
  final VoidCallback? onFavorite;

  const ProductTile({
    super.key,
    required this.product,
    this.onTap,
    this.onFavorite,
  });

  String _str(String key, [String fallback = '']) {
    final v = product[key];
    return v is String ? v : (v?.toString() ?? fallback);
  }

  /// The backend stores the primary image in `image` (a relative path such as
  /// `/assets/image10.jpeg` or a full Cloudinary URL). Newly uploaded products
  /// may only populate `images[0].url`, so fall back to that.
  String _firstImageUrl() {
    final primary = _str('image');
    if (primary.isNotEmpty) return primary;
    final images = product['images'];
    if (images is List && images.isNotEmpty) {
      final first = images[0];
      if (first is Map) {
        final url = first['url'];
        if (url is String && url.isNotEmpty) return url;
      }
    }
    return '';
  }

  @override
  Widget build(BuildContext context) {
    final name = _str('name');
    final category = _str('category');
    final audience = _str('audience');
    final price = _str('price');
    final label = _str('label');
    final image = _firstImageUrl();
    final rating = product['rating'] is num ? product['rating'] as num : null;
    final reviewCount =
        product['reviewCount'] is num ? product['reviewCount'] as num : null;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.grey.shade200),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image area
            Expanded(
              child: Stack(
                children: [
                  Positioned.fill(
                    child: AppProductImage(
                      image: image,
                      fit: BoxFit.cover,
                    ),
                  ),
                  if (label.isNotEmpty)
                    Positioned(
                      top: 8,
                      left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(3),
                        ),
                        child: Text(
                          label,
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
                          Icons.favorite,
                          size: 24,
                        ),
                        color: Colors.white,
                        onPressed: onFavorite,
                        constraints: const BoxConstraints(),
                        padding: const EdgeInsets.all(4),
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
                  if (category.isNotEmpty)
                    Text(
                      category.toUpperCase(),
                      style: const TextStyle(
                        color: AppColors.primary,
                        fontSize: 9.5,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.8,
                      ),
                    ),
                  const SizedBox(height: 4),
                  Text(
                    name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  if (audience.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      audience,
                      style: const TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 10.5,
                      ),
                    ),
                  ],
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Text(
                        'Rs. $price',
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 12.5,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (rating != null) ...[
                        const SizedBox(width: 6),
                        const Icon(Icons.star, size: 11, color: Colors.amber),
                        Text(
                          rating.toStringAsFixed(1),
                          style: const TextStyle(
                            color: AppColors.textMuted,
                            fontSize: 10.5,
                          ),
                        ),
                        if (reviewCount != null && reviewCount > 0) ...[
                          const SizedBox(width: 2),
                          Text(
                            '($reviewCount)',
                            style: const TextStyle(
                              color: AppColors.textMuted,
                              fontSize: 10.5,
                            ),
                          ),
                        ],
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}