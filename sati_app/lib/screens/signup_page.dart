import "package:flutter/material.dart";
import "../services/auth_service.dart";

class SignupPage extends StatefulWidget {
  const SignupPage({super.key});

  @override
  State<SignupPage> createState() => _SignupPageState();
}

class _SignupPageState extends State<SignupPage> {
  final _fullNameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _confirmPassCtrl = TextEditingController();
  final _auth = AuthService();

  String _currency = "NPR";
  bool _obscurePass = true;
  bool _obscureConfirm = true;
  bool _loading = false;

  @override
  void dispose() {
    _fullNameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _passCtrl.dispose();
    _confirmPassCtrl.dispose();
    super.dispose();
  }

  Future<void> _signup() async {
    final name = _fullNameCtrl.text.trim();
    final email = _emailCtrl.text.trim();
    final phone = _phoneCtrl.text.trim();
    final pass = _passCtrl.text;
    final confirm = _confirmPassCtrl.text;

    if (name.isEmpty || email.isEmpty || phone.isEmpty || pass.isEmpty || confirm.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please fill in all fields")),
      );
      return;
    }
    if (pass != confirm) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Passwords do not match")),
      );
      return;
    }

    setState(() => _loading = true);
    final res = await _auth.signup(
      fullName: name,
      email: email,
      currency: _currency,
      phone: (_currency == "NPR" ? "+977" : "+44") + phone,
      password: pass,
    );
    if (!mounted) return;
    setState(() => _loading = false);

    if (res.success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: const Color(0xFFE07A1F),
          content: Text("Welcome to SATI, $name!"),
        ),
      );
      Navigator.of(context).pushReplacementNamed("/login");
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: Colors.red.shade700,
          content: Text(res.message ?? "Signup failed"),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      const Text(
                        "Already have an account? ",
                        style: TextStyle(color: Color(0xFF6B6B6B), fontSize: 13),
                      ),
                      GestureDetector(
                        onTap: () => Navigator.of(context).pushReplacementNamed("/login"),
                        child: const Text(
                          "Sign in",
                          style: TextStyle(
                            color: Color(0xFFE07A1F),
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Center(
                    child: Image.asset(
                      "assets/logo/logo.png",
                      height: 90,
                      fit: BoxFit.contain,
                      errorBuilder: (ctx, obj, st) => const Text(
                        "S A T I",
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.w300,
                          letterSpacing: 8,
                          color: Color(0xFFE07A1F),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    "Bespoke Membership",
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Color(0xFF9E9E9E),
                      fontSize: 11,
                      letterSpacing: 3,
                    ),
                  ),
                  const SizedBox(height: 28),
                  const Text(
                    "Create an account",
                    style: TextStyle(
                      color: Color(0xFF1A1A1A),
                      fontSize: 24,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    "Enter your details to create your bespoke profile.",
                    style: TextStyle(
                      color: Color(0xFF6B6B6B),
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 24),
                  _InputField(
                    label: "FULL NAME",
                    controller: _fullNameCtrl,
                    keyboardType: TextInputType.name,
                  ),
                  const SizedBox(height: 16),
                  _InputField(
                    label: "EMAIL ADDRESS",
                    controller: _emailCtrl,
                    keyboardType: TextInputType.emailAddress,
                  ),
                  const SizedBox(height: 16),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        "CURRENCY PREFERENCE",
                        style: TextStyle(
                          color: Color(0xFF6B6B6B),
                          fontSize: 10.5,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: _CurrencyChip(
                              label: "Nepal · Rs (NPR)",
                              selected: _currency == "NPR",
                              onTap: () => setState(() => _currency = "NPR"),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: _CurrencyChip(
                              label: "United Kingdom · £ (GBP)",
                              selected: _currency == "GBP",
                              onTap: () => setState(() => _currency = "GBP"),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _InputField(
                    label: "PHONE NUMBER",
                    controller: _phoneCtrl,
                    keyboardType: TextInputType.phone,
                    prefixText: _currency == "NPR" ? "+977 " : "+44 ",
                  ),
                  const SizedBox(height: 16),
                  _InputField(
                    label: "PASSWORD",
                    controller: _passCtrl,
                    obscure: _obscurePass,
                    suffix: IconButton(
                      icon: Icon(
                        _obscurePass ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                        color: const Color(0xFF9E9E9E),
                        size: 20,
                      ),
                      onPressed: () => setState(() => _obscurePass = !_obscurePass),
                    ),
                  ),
                  const SizedBox(height: 16),
                  _InputField(
                    label: "CONFIRM PASSWORD",
                    controller: _confirmPassCtrl,
                    obscure: _obscureConfirm,
                    suffix: IconButton(
                      icon: Icon(
                        _obscureConfirm ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                        color: const Color(0xFF9E9E9E),
                        size: 20,
                      ),
                      onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                    ),
                  ),
                  const SizedBox(height: 18),
                  const Text(
                    "Crafted in Kathmandu, styled globally. Create your account to unlock private seasonal sales, currency-matched checkout in NPR (Rs) or GBP (£), and dedicated concierge support.",
                    style: TextStyle(
                      color: Color(0xFF9E9E9E),
                      fontSize: 11,
                      height: 1.45,
                    ),
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: _loading ? null : _signup,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFE07A1F),
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: const Color(0xFFE07A1F).withValues(alpha: 0.6),
                      minimumSize: const Size(double.infinity, 50),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                      elevation: 0,
                    ),
                    child: _loading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                "Continue to Verification",
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  letterSpacing: 0.5,
                                ),
                              ),
                              SizedBox(width: 8),
                              Icon(Icons.arrow_forward, size: 16),
                            ],
                          ),
                  ),
                  const SizedBox(height: 20),
                  Wrap(
                    alignment: WrapAlignment.center,
                    spacing: 4,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: const [
                      Text("NP", style: TextStyle(color: Color(0xFFE07A1F), fontSize: 11, fontWeight: FontWeight.bold)),
                      Text("·", style: TextStyle(color: Color(0xFF9E9E9E))),
                      Text("UK", style: TextStyle(color: Color(0xFFE07A1F), fontSize: 11, fontWeight: FontWeight.bold)),
                      SizedBox(width: 4),
                      Text(
                        "100% Authentic Fabrications · Premium satisfaction",
                        style: TextStyle(color: Color(0xFF6B6B6B), fontSize: 10.5),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  const Center(
                    child: Text(
                      "© 2026 SATI Atelier. All rights reserved",
                      style: TextStyle(
                        color: Color(0xFF9E9E9E),
                        fontSize: 11,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _CurrencyChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _CurrencyChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(6),
          border: Border.all(
            color: selected ? const Color(0xFFE07A1F) : const Color(0xFFE0E0E0),
            width: selected ? 1.5 : 1.0,
          ),
          color: selected ? const Color(0xFFFFF3E6) : Colors.white,
        ),
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            color: selected ? const Color(0xFFE07A1F) : const Color(0xFF6B6B6B),
            fontSize: 11,
            fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
          ),
        ),
      ),
    );
  }
}

class _InputField extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final bool obscure;
  final TextInputType keyboardType;
  final Widget? suffix;
  final String? prefixText;

  const _InputField({
    required this.label,
    required this.controller,
    this.obscure = false,
    this.keyboardType = TextInputType.text,
    this.suffix,
    this.prefixText,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Color(0xFF6B6B6B),
            fontSize: 10.5,
            fontWeight: FontWeight.w600,
            letterSpacing: 1.2,
          ),
        ),
        const SizedBox(height: 4),
        TextField(
          controller: controller,
          obscureText: obscure,
          keyboardType: keyboardType,
          style: const TextStyle(color: Color(0xFF1A1A1A), fontSize: 14),
          decoration: InputDecoration(
            isDense: true,
            prefixText: prefixText,
            prefixStyle: const TextStyle(color: Color(0xFF1A1A1A), fontSize: 14),
            contentPadding: const EdgeInsets.symmetric(vertical: 10),
            suffixIcon: suffix,
            suffixIconConstraints: const BoxConstraints(minWidth: 32, minHeight: 32),
            enabledBorder: const UnderlineInputBorder(
              borderSide: BorderSide(color: Color(0xFFE0E0E0)),
            ),
            focusedBorder: const UnderlineInputBorder(
              borderSide: BorderSide(color: Color(0xFFE07A1F), width: 1.8),
            ),
          ),
        ),
      ],
    );
  }
}
