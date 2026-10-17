import "package:flutter/material.dart";
import "package:provider/provider.dart";
import "../components/app_theme.dart";
import "../services/orders_service.dart";
import "../services/auth_provider.dart";

class OrdersPage extends StatefulWidget {
  const OrdersPage({super.key});

  @override
  State<OrdersPage> createState() => _OrdersPageState();
}

class _OrdersPageState extends State<OrdersPage> {
  final OrdersService _orders = OrdersService();

  List<Map<String, dynamic>> _ordersList = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Re-fetch if the user changed (login/logout) while this screen was open.
    if (context.read<AuthProvider>().userId != null && _ordersList.isEmpty && _loading) {
      _load();
    }
  }

  Future<void> _load() async {
    if (context.read<AuthProvider>().userId == null) {
      if (mounted) setState(() => _loading = false);
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await _orders.list();
      if (!mounted) return;
      if (!res.success) {
        setState(() {
          _error = res.message ?? "Failed to load orders.";
          _loading = false;
        });
        return;
      }
      final list = res.data is List ? res.data.cast<Map<String, dynamic>>() : <Map<String, dynamic>>[];
      setState(() {
        _ordersList = list;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
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
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          "Order history",
          style: TextStyle(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w600,
            fontSize: 18,
          ),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.error_outline, size: 48, color: Colors.red),
                      const SizedBox(height: 16),
                      Text(
                        _error!,
                        style: const TextStyle(color: AppColors.textMuted),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: _load,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                        ),
                        child: const Text("Retry"),
                      ),
                    ],
                  ),
                )
              : _ordersList.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.receipt_long_outlined,
                            size: 64,
                            color: AppColors.textMuted,
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            "No orders yet",
                            style: TextStyle(
                              color: AppColors.textMuted,
                              fontSize: 16,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            "Your bespoke pieces will appear here once you check out.",
                            style: TextStyle(
                              color: AppColors.textMuted,
                              fontSize: 13,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemCount: _ordersList.length,
                      itemBuilder: (context, index) {
                        final o = _ordersList[index];
                        final id = (o["_id"] ?? o["id"] ?? "") as String;
                        final items = o["items"] is List ? (o["items"] as List).length : 0;
                        final total = o["total"];
                        final totalStr = total is num
                            ? "Rs. ${total.toStringAsFixed(0)}"
                            : "$total";
                        final status = (o["status"] ?? "") as String;
                        return Container(
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: ListTile(
                            leading: const Icon(
                              Icons.check_circle_outline,
                              color: AppColors.primary,
                            ),
                            title: Text(
                              id.isNotEmpty ? "Order ${id.substring(0, id.length > 8 ? 8 : id.length)}" : "Order",
                              style: const TextStyle(
                                color: AppColors.textPrimary,
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                              ),
                            ),
                            subtitle: Text(
                              "$items item(s) · $totalStr",
                              style: const TextStyle(
                                color: AppColors.textMuted,
                                fontSize: 12.5,
                              ),
                            ),
                            trailing: Text(
                              status.toUpperCase(),
                              style: TextStyle(
                                color: status.toLowerCase() == "delivered"
                                    ? Colors.green
                                    : AppColors.textMuted,
                                fontSize: 10.5,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.5,
                              ),
                            ),
                            onTap: () {
                              Navigator.pushNamed(context, "/order-detail", arguments: id);
                            },
                          ),
                        );
                      },
                    ),
    );
  }
}