
import 'package:flutter/material.dart';
import 'screens/login_page.dart';
import 'screens/signup_page.dart';

void main() {
  runApp(const SatiApp());
}

class SatiApp extends StatelessWidget {
  const SatiApp({super.key});

  static const Color orange = Color(0xFFFF7900);
  static const Color black = Color(0xFF222222);
  static const Color white = Colors.white;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'SATI',

      // Always use light mode
      themeMode: ThemeMode.light,

      theme: ThemeData(
        brightness: Brightness.light,
        useMaterial3: true,
        scaffoldBackgroundColor: white,
        canvasColor: white,

        colorScheme: const ColorScheme.light(
          primary: orange,
          onPrimary: white,
          secondary: orange,
          onSecondary: white,
          surface: white,
          onSurface: black,
          error: Color(0xFFD32F2F),
          onError: white,
        ),

        appBarTheme: const AppBarTheme(
          backgroundColor: white,
          foregroundColor: black,
          surfaceTintColor: Colors.transparent,
          elevation: 0,
        ),

        textTheme: ThemeData.light().textTheme.apply(
          bodyColor: black,
          displayColor: black,
        ),

        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: const Color(0xFFF7F7F7),
          hintStyle: const TextStyle(
            color: Color(0xFF888888),
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(
              color: Color(0xFFE5E5E5),
            ),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(
              color: Color(0xFFE5E5E5),
            ),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(
              color: orange,
              width: 1.5,
            ),
          ),
        ),

        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: orange,
            foregroundColor: white,
            minimumSize: const Size(double.infinity, 54),
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
        ),

        textButtonTheme: TextButtonThemeData(
          style: TextButton.styleFrom(
            foregroundColor: orange,
          ),
        ),
      ),

      initialRoute: '/login',
      routes: {
        '/login': (context) => const LoginPage(),
        '/signup': (context) => const SignupPage(),
      },
    );
  }
}
