import "package:flutter/material.dart";
import "package:provider/provider.dart";
import "../components/app_theme.dart";
import "../components/profile_header.dart";
import "../components/profile_tile.dart";
import "../services/auth_provider.dart";
import "../services/orders_service.dart";
import "../services/wishlist_service.dart";

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  String _name = "Loading...";
  String _email = "";
  String? _phone;
  String _country = "";
  String? _avatarUrl;
  int _orders = 0;
  int _saved = 0;
  int _points = 0;
  bool _loading = true;

  final OrdersService _ordersService = OrdersService();
  final WishlistService _wishlist = WishlistService();

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Re-load user-scoped stats if the logged-in user changed while this
    // screen was already open (e.g. sign out → sign in).
    if (context.read<AuthProvider>().userId != null) {
      _loadStats();
    }
  }

  Future<void> _loadProfile() async {
    final auth = context.read<AuthProvider>();
    final profile = await auth.fetchProfile();
    if (!mounted) return;
    if (profile != null) {
      setState(() {
        _name = profile["name"] ?? "User";
        _email = profile["email"] ?? "";
        _phone = profile["phoneNumber"];
        _country = profile["country"] ?? "";
        _avatarUrl = profile["avatarUrl"];
      });
    }
    await _loadStats();
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _loadStats() async {
    // Order count
    try {
      final oRes = await _ordersService.list();
      if (mounted && oRes.success && oRes.data is List) {
        setState(() => _orders = (oRes.data as List).length);
      }
    } catch (_) {}

    // Saved (wishlist) count
    try {
      final wRes = await _wishlist.getWishlist();
      if (mounted && wRes.success && wRes.data is List) {
        setState(() => _saved = (wRes.data as List).length);
      }
    } catch (_) {}
  }

  void _editProfile() {
    Navigator.of(context).pushNamed("/edit-profile");
  }

  void _openSettings() {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text("Settings coming soon")));
  }

  void _openOrders() {
    Navigator.of(context).pushNamed("/orders");
  }

  void _openAddress() {
    Navigator.of(context).pushNamed("/address");
  }

  void _openPayment() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text("Payment methods coming soon")),
    );
  }

  void _openNotifications() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text("Notification settings coming soon")),
    );
  }

  void _openHelp() {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text("Help centre coming soon")));
  }

  void _openContact() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text("Contact concierge coming soon")),
    );
  }

  void _logout() {
    context.read<AuthProvider>().logout();
    Navigator.of(context).pushReplacementNamed("/login");
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        titleSpacing: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () => Navigator.pushReplacementNamed(context, '/home'),
        ),
        title: const Text(
          "Profile",
          style: TextStyle(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w600,
            fontSize: 18,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(
              Icons.settings_outlined,
              color: AppColors.textPrimary,
            ),
            onPressed: _openSettings,
            tooltip: "Settings",
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              child: Column(
                children: [
                  ProfileHeader(
                    name: _name,
                    email: _email,
                    phone: _phone,
                    country: _country,
                    avatarUrl: _avatarUrl,
                    orders: _orders,
                    saved: _saved,
                    points: _points,
                  ),
                  const SizedBox(height: 16),
                  ProfileSection(
                    title: "ACCOUNT",
                    children: [
                      ProfileTile(
                        leading: const Icon(
                          Icons.person_outline,
                          color: AppColors.primary,
                        ),
                        title: "Edit profile",
                        subtitle: "Update your name, photo and details",
                        onTap: _editProfile,
                      ),
                      ProfileTile(
                        leading: const Icon(
                          Icons.location_on_outlined,
                          color: AppColors.primary,
                        ),
                        title: "Addresses",
                        subtitle: "Manage delivery addresses in Nepal & UK",
                        onTap: _openAddress,
                      ),
                      ProfileTile(
                        leading: const Icon(
                          Icons.payments_outlined,
                          color: AppColors.primary,
                        ),
                        title: "Payment methods",
                        subtitle: "Saved cards and wallet",
                        onTap: _openPayment,
                      ),
                    ],
                  ),
                  ProfileSection(
                    title: "SHOP",
                    children: [
                      ProfileTile(
                        leading: const Icon(
                          Icons.receipt_long_outlined,
                          color: AppColors.primary,
                        ),
                        title: "Order history",
                        subtitle: "Track and reorder your bespoke pieces",
                        onTap: _openOrders,
                      ),
                      ProfileTile(
                        leading: const Icon(
                          Icons.favorite_border,
                          color: AppColors.primary,
                        ),
                        title: "Saved items",
                        onTap: () => Navigator.pushNamed(
                          context,
                          "/saved",
                          arguments: {
                            'userId': context.read<AuthProvider>().userId,
                          },
                        ),
                      ),
                    ],
                  ),
                  ProfileSection(
                    title: "PREFERENCES",
                    children: [
                      ProfileTile(
                        leading: const Icon(
                          Icons.notifications_outlined,
                          color: AppColors.primary,
                        ),
                        title: "Notifications",
                        onTap: _openNotifications,
                      ),
                      ProfileTile(
                        leading: const Icon(
                          Icons.help_outline,
                          color: AppColors.primary,
                        ),
                        title: "Help centre",
                        onTap: _openHelp,
                      ),
                      ProfileTile(
                        leading: const Icon(
                          Icons.headset_mic_outlined,
                          color: AppColors.primary,
                        ),
                        title: "Contact concierge",
                        onTap: _openContact,
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  _SignOutTile(onTap: _logout),
                  const SizedBox(height: 24),
                ],
              ),
            ),
    );
  }
}

class _SignOutTile extends StatelessWidget {
  final VoidCallback onTap;

  const _SignOutTile({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.red.withValues(alpha: 0.25)),
        ),
        child: ListTile(
          leading: const Icon(Icons.logout, color: Colors.red, size: 22),
          title: const Text(
            "Sign out",
            style: TextStyle(
              color: Colors.red,
              fontWeight: FontWeight.w600,
              fontSize: 15,
            ),
          ),
          onTap: onTap,
        ),
      ),
    );
  }
}
