import "package:flutter/material.dart";

class OnboardingPage extends StatefulWidget {
  const OnboardingPage({super.key});

  @override
  State<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends State<OnboardingPage> {
  final _pageCtrl = PageController();
  int _index = 0;

  final List<_OnboardStep> _steps = const [
    _OnboardStep(
      title: "Bespoke by Design",
      subtitle: "Crafted in Kathmandu, styled globally. Every piece is measured and made to your exact silhouette.",
      icon: Icons.checkroom_outlined,
    ),
    _OnboardStep(
      title: "Currency-Matched Checkout",
      subtitle: "Shop seamlessly in Nepal Rs (NPR) or British Pounds (GBP) with pricing matched to your region.",
      icon: Icons.payments_outlined,
    ),
    _OnboardStep(
      title: "Private Atelier Access",
      subtitle: "Unlock seasonal sales, real-time bespoke delivery tracking, and dedicated concierge support.",
      icon: Icons.diamond_outlined,
    ),
  ];

  @override
  void dispose() {
    _pageCtrl.dispose();
    super.dispose();
  }

  void _next() {
    if (_index < _steps.length - 1) {
      _pageCtrl.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      Navigator.of(context).pushReplacementNamed("/login");
    }
  }

  void _skip() {
    Navigator.of(context).pushReplacementNamed("/login");
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: Alignment.topRight,
              child: TextButton(
                onPressed: _skip,
                child: const Text(
                  "Skip",
                  style: TextStyle(
                    color: Color(0xFFE07A1F),
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Center(
              child: Image.asset(
                "assets/logo/logo.png",
                height: 70,
                fit: BoxFit.contain,
                errorBuilder: (ctx, obj, st) => const SizedBox.shrink(),
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _pageCtrl,
                itemCount: _steps.length,
                onPageChanged: (i) => setState(() => _index = i),
                itemBuilder: (context, i) {
                  final step = _steps[i];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 40),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 110,
                          height: 110,
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF3E6),
                            borderRadius: BorderRadius.circular(55),
                            border: Border.all(
                              color: const Color(0xFFE07A1F).withValues(alpha: 0.2),
                              width: 1.5,
                            ),
                          ),
                          child: Icon(step.icon, size: 52, color: const Color(0xFFE07A1F)),
                        ),
                        const SizedBox(height: 32),
                        Text(
                          step.title,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: Color(0xFF1A1A1A),
                            fontSize: 22,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          step.subtitle,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: Color(0xFF6B6B6B),
                            fontSize: 13.5,
                            height: 1.5,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              child: Row(
                children: [
                  ...List.generate(_steps.length, (i) {
                    return Expanded(
                      child: Container(
                        height: 4,
                        margin: EdgeInsets.only(right: i < _steps.length - 1 ? 6 : 0),
                        decoration: BoxDecoration(
                          color: i <= _index ? const Color(0xFFE07A1F) : const Color(0xFFE8E8E8),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
              child: ElevatedButton(
                onPressed: _next,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFE07A1F),
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                  elevation: 0,
                ),
                child: Text(
                  _index < _steps.length - 1 ? "Next" : "Get Started",
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, letterSpacing: 0.5),
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}

class _OnboardStep {
  final String title;
  final String subtitle;
  final IconData icon;

  const _OnboardStep({required this.title, required this.subtitle, required this.icon});
}
