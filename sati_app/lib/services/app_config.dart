import 'package:flutter_dotenv/flutter_dotenv.dart';

enum Environment { working, production }

class AppConfig {
  static Future<void> init() async {
    try {
      await dotenv.load(fileName: ".env");
    } catch (_) {
      // Fallback defaults if .env is missing
    }
  }

  static Environment get environment {
    final envStr = dotenv.env['ENV']?.toLowerCase() ?? 'working';
    return envStr == 'production' ? Environment.production : Environment.working;
  }

  static bool get isProduction => environment == Environment.production;
  static String get baseUrl {
    // 1. Direct override if provided
    final direct = dotenv.env['API_URL'] ?? dotenv.env['API_BASE_URL'];
    if (direct != null && direct.trim().isNotEmpty) {
      return _sanitizeUrl(direct.trim());
    }

    // 2. Strict read from .env based on ENV mode
    final key = isProduction ? 'PRODUCTION_API_URL' : 'WORKING_API_URL';
    final url = dotenv.env[key];

    if (url == null || url.trim().isEmpty) {
      throw StateError(
        'Missing "$key" in .env file. Please define it in your .env configuration.',
      );
    }

    return _sanitizeUrl(url.trim());
  }

  static String _sanitizeUrl(String url) {
    return url.endsWith('/') ? url.substring(0, url.length - 1) : url;
  }

  static const Duration timeout = Duration(seconds: 15);
}
