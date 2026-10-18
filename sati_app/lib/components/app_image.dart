import 'package:flutter/material.dart';

/// Renders product and banner images gracefully whether they are:
/// 1. Remote URLs (e.g. Cloudinary `https://...`) -> [Image.network]
/// 2. Catalogue relative paths (e.g. `/assets/image1.jpeg`) -> [Image.asset]
/// 3. Fallback to grey placeholder icon on error or empty URL.
class AppProductImage extends StatelessWidget {
  final String image;
  final BoxFit fit;
  final double? width;
  final double? height;

  const AppProductImage({
    super.key,
    required this.image,
    this.fit = BoxFit.cover,
    this.width,
    this.height,
  });

  Widget _placeholder() {
    return Container(
      width: width,
      height: height,
      color: Colors.grey.shade100,
      alignment: Alignment.center,
      child: const Icon(
        Icons.image_outlined,
        color: Colors.grey,
        size: 24,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final trimmed = image.trim();
    if (trimmed.isEmpty) return _placeholder();

    // 1. Full remote URL (e.g. Cloudinary uploaded product)
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return Image.network(
        trimmed,
        width: width,
        height: height,
        fit: fit,
        errorBuilder: (_, _, _) => _placeholder(),
      );
    }

    // 2. Relative catalogue asset (e.g. "/assets/image1.jpeg" or "assets/images/image1.jpeg")
    final filename = trimmed.split('/').last;
    final assetPath = 'assets/images/$filename';

    return Image.asset(
      assetPath,
      width: width,
      height: height,
      fit: fit,
      errorBuilder: (_, _, _) => _placeholder(),
    );
  }
}
