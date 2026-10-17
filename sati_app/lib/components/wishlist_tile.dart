import "package:flutter/material.dart";
import "../components/app_theme.dart";

/// The Next.js client serves the product catalogue images under /assets/.
/// The backend returns relative paths, so resolve them against the client
/// origin when loading images.
const String _imageOrigin = 'http://192.168.1.65:3000';

String _resolveImageUrl(String raw) {
  if (raw.isEmpty) return raw;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  if (raw.startsWith('/')) return '$_imageOrigin$raw';
  return '$_imageOrigin/$raw';
}

/// A single saved/wishlist product card.
class WishlistTile extends StatelessWidget {
  final String title;
  final String category;
  final String audience;
  final String imageUrl;
  final String price;
  final String? poundPrice;
  final String? label;
  final VoidCallback? onTap;
  final VoidCallback? onRemove;

  const WishlistTile({
    super.key,
    required this.title,
    required this.category,
    required this.audience,
    required this.imageUrl,
    required this.price,
    this.poundPrice,
    this.label,
    this.onTap,
    this.onRemove,
  });

  factory WishlistTile.fromMap(
    Map<String, dynamic> p, {
    VoidCallback? onTap,
    VoidCallback? onRemove,
  }) {
    final price = p["price"];
    final priceStr = price is num ? "Rs. ${price.toStringAsFixed(0)}" : "$price";
    final pound = p["poundPrice"];
    final poundStr = pound is num ? "£${pound.toStringAsFixed(0)}" : null;
    return WishlistTile(
      title: (p["name"] ?? "") as String,
      category: (p["category"] ?? "") as String,
      audience: (p["audience"] ?? "") as String,
      imageUrl: (p["image"] ?? "") as String,
      price: priceStr,
      poundPrice: poundStr,
      label: (p["label"] ?? "") as String,
      onTap: onTap,
      onRemove: onRemove,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkResponse(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image area
            Stack(
              children: [
                Positioned.fill(
                  child: Image.network(
                    _resolveImageUrl(imageUrl),
                    fit: BoxFit.cover,
                    errorBuilder: (_, _, _) => Container(
                      color: Colors.grey.shade100,
                      child: const Icon(Icons.image_outlined, color: Colors.grey),
                    ),
                  ),
                ),
                if (label != null && label!.isNotEmpty)
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(3),
                      ),
                      child: Text(
                        label!,
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
                    icon: const Icon(Icons.favorite, size: 20, color: Colors.white),
                    onPressed: onRemove,
                    tooltip: "Remove from saved",
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    audience.toUpperCase(),
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontSize: 9.5,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.8,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    category,
                    style: const TextStyle(
                      color: AppColors.textMuted,
                      fontSize: 11,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Text(
                        price,
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 12.5,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (poundPrice != null) ...[
                        const SizedBox(width: 6),
                        Text(
                          poundPrice!,
                          style: const TextStyle(
                            color: AppColors.textMuted,
                            fontSize: 11,
                          ),
                        ),
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