import "package:flutter/material.dart";
import "../components/app_theme.dart";

/// Shared bottom navigation bar — only Home, Men's, Women's, Profile.
class BottomNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const BottomNav({super.key, required this.currentIndex, required this.onTap});

  static const List<_Entry> _entries = [
    _Entry("assets/logo/home.png", "Home"),
    _Entry("assets/logo/mans.png", "Men's"),
    _Entry("assets/logo/women.png", "Women's"),
    _Entry("assets/logo/profile.png", "Profile"),
  ];

  @override
  Widget build(BuildContext context) {
    return BottomNavigationBar(
      currentIndex: currentIndex,
      onTap: onTap,
      selectedItemColor: AppColors.primary,
      unselectedItemColor: AppColors.textMuted,
      type: BottomNavigationBarType.fixed,
      backgroundColor: Colors.white,
      elevation: 8,
      selectedFontSize: 11,
      unselectedFontSize: 11,
      items: List.generate(_entries.length, (i) {
        final e = _entries[i];
        return BottomNavigationBarItem(
          icon: Image.asset(
            e.icon,
            width: 24,
            height: 24,
            fit: BoxFit.contain,
            color: i == currentIndex ? AppColors.primary : AppColors.textMuted,
            colorBlendMode: BlendMode.srcIn,
          ),
          label: e.label,
        );
      }),
    );
  }
}

class _Entry {
  final String icon;
  final String label;
  const _Entry(this.icon, this.label);
}
