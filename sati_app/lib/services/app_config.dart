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
  switch (environment) {
    case Environment.production:
      return dotenv.env['PRODUCTION_API_URL'] ?? 'https://api.satiatelier.com/api';

    case Environment.working:
      return dotenv.env['WORKING_API_URL'] ?? 'http://localhost:5001/api';
  }
} 
static const Duration timeout = Duration(seconds: 15);
}
