import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'screens/login_page.dart';
import 'screens/signup_page.dart';
import 'screens/onboarding_page.dart';
import 'services/app_config.dart';
import 'services/auth_provider.dart';
import 'screens/home_page.dart';
import 'screens/profile_page.dart';
import 'screens/saved_page.dart';
import 'screens/men_page.dart';
import 'screens/women_page.dart';
import 'screens/orders_page.dart';
import 'screens/cart_page.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await AppConfig.init();
  runApp(const SatiApp());
}

class SatiApp extends StatelessWidget {
  const SatiApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AuthProvider(),
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'SATI',
        theme: ThemeData(
          brightness: Brightness.light,
          scaffoldBackgroundColor: Colors.white,
          colorScheme: const ColorScheme.light(
            primary: Color(0xFFE07A1F),
            secondary: Color(0xFFC86A1A),
            surface: Colors.white,
            onSurface: Colors.black87,
          ),
          useMaterial3: true,
        ),
        initialRoute: '/onboarding',
        routes: {
          '/onboarding': (context) => const OnboardingPage(),
          '/login': (context) => const LoginPage(),
          '/signup': (context) => const SignupPage(),
          '/home': (context) => const HomePage(),
          '/men': (context) => const MenPage(),
          '/women': (context) => const WomenPage(),
          '/profile': (context) => const ProfilePage(),
          '/saved': (context) => const SavedPage(),
        '/orders': (context) => const OrdersPage(),
        '/order-detail': (context) => const OrdersPage(),
        '/cart': (context) => const CartPage(),
        },
      ),
    );
  }
}
