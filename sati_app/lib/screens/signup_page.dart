
import 'package:flutter/material.dart';

class SignupPage extends StatefulWidget {
  const SignupPage({super.key});

  @override
  State<SignupPage> createState() => _SignupPageState();
}

class _SignupPageState extends State<SignupPage> {
  static const Color orange = Color(0xFFFF7900);
  static const Color black = Color(0xFF222222);
  static const Color grey = Color(0xFF777777);
  static const Color lightGrey = Color(0xFFF7F7F7);
  static const Color borderGrey = Color(0xFFE5E5E5);
  static const Color paleOrange = Color(0xFFFFF1E5);

  final _fullNameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _confirmPassCtrl = TextEditingController();

  String _currency = 'NPR';
  bool _obscurePass = true;
  bool _obscureConfirm = true;
  bool _agreeToTerms = false;

  @override
  void dispose() {
    _fullNameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _passCtrl.dispose();
    _confirmPassCtrl.dispose();
    super.dispose();
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: orange,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _signup() {
    final name = _fullNameCtrl.text.trim();
    final email = _emailCtrl.text.trim();
    final phone = _phoneCtrl.text.trim();
    final pass = _passCtrl.text;
    final confirm = _confirmPassCtrl.text;

    if (name.isEmpty ||
        email.isEmpty ||
        phone.isEmpty ||
        pass.isEmpty ||
        confirm.isEmpty) {
      _showMessage('Please fill in all fields');
      return;
    }

    if (!email.contains('@') || !email.contains('.')) {
      _showMessage('Please enter a valid email address');
      return;
    }

    if (pass.length < 8) {
      _showMessage('Password must contain at least 8 characters');
      return;
    }

    if (pass != confirm) {
      _showMessage('Passwords do not match');
      return;
    }

    if (!_agreeToTerms) {
      _showMessage('Please agree to the terms and conditions');
      return;
    }

    _showMessage('Welcome to SATI, $name');

    // Connect your account creation and verification API here.
    // Selected currency: $_currency
    // Phone number: ${_currency == 'NPR' ? '+977' : '+44'}$phone
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(
              horizontal: 24,
              vertical: 24,
            ),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Sign-in link
                  Wrap(
                    alignment: WrapAlignment.end,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      const Text(
                        'Already have an account? ',
                        style: TextStyle(
                          color: grey,
                          fontSize: 13,
                        ),
                      ),
                      TextButton(
                        onPressed: () {
                          Navigator.of(context)
                              .pushReplacementNamed('/login');
                        },
                        style: TextButton.styleFrom(
                          foregroundColor: orange,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 4,
                          ),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: const Text(
                          'Sign in',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // SATI logo
                  Center(
                    child: Image.asset(
                      'assets/logo/logo.png',
                      width: 145,
                      height: 85,
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) {
                        return const Icon(
                          Icons.image_outlined,
                          size: 58,
                          color: orange,
                        );
                      },
                    ),
                  ),

                  const SizedBox(height: 8),

                  const Text(
                    'BESPOKE MEMBERSHIP',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: grey,
                      fontSize: 10,
                      letterSpacing: 3,
                      fontWeight: FontWeight.w500,
                    ),
                  ),

                  const SizedBox(height: 32),

                  const Text(
                    'Create an account',
                    style: TextStyle(
                      color: black,
                      fontSize: 27,
                      fontWeight: FontWeight.w700,
                    ),
                  ),

                  const SizedBox(height: 8),

                  const Text(
                    'Enter your details to create your bespoke profile.',
                    style: TextStyle(
                      color: grey,
                      fontSize: 13,
                      height: 1.5,
                    ),
                  ),

                  const SizedBox(height: 28),

                  _InputField(
                    label: 'FULL NAME',
                    controller: _fullNameCtrl,
                    keyboardType: TextInputType.name,
                    hintText: 'Enter your full name',
                  ),

                  const SizedBox(height: 20),

                  _InputField(
                    label: 'EMAIL ADDRESS',
                    controller: _emailCtrl,
                    keyboardType: TextInputType.emailAddress,
                    hintText: 'Enter your email address',
                  ),

                  const SizedBox(height: 20),

                  // Currency preference
                  const _FieldLabel(label: 'CURRENCY PREFERENCE'),

                  const SizedBox(height: 9),

                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: _CurrencyChip(
                          label: 'Nepal · Rs (NPR)',
                          selected: _currency == 'NPR',
                          onTap: () {
                            setState(() => _currency = 'NPR');
                          },
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _CurrencyChip(
                          label: 'United Kingdom · £ (GBP)',
                          selected: _currency == 'GBP',
                          onTap: () {
                            setState(() => _currency = 'GBP');
                          },
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 20),

                  _InputField(
                    label: 'PHONE NUMBER',
                    controller: _phoneCtrl,
                    keyboardType: TextInputType.phone,
                    hintText: 'Enter phone number',
                    prefixText: _currency == 'NPR' ? '+977 ' : '+44 ',
                  ),

                  const SizedBox(height: 20),

                  _InputField(
                    label: 'PASSWORD',
                    controller: _passCtrl,
                    obscure: _obscurePass,
                    hintText: 'Create a password',
                    suffix: IconButton(
                      tooltip:
                          _obscurePass ? 'Show password' : 'Hide password',
                      onPressed: () {
                        setState(() => _obscurePass = !_obscurePass);
                      },
                      icon: Icon(
                        _obscurePass
                            ? Icons.visibility_off_outlined
                            : Icons.visibility_outlined,
                        color: grey,
                        size: 20,
                      ),
                    ),
                  ),

                  const SizedBox(height: 20),

                  _InputField(
                    label: 'CONFIRM PASSWORD',
                    controller: _confirmPassCtrl,
                    obscure: _obscureConfirm,
                    hintText: 'Confirm your password',
                    suffix: IconButton(
                      tooltip: _obscureConfirm
                          ? 'Show password'
                          : 'Hide password',
                      onPressed: () {
                        setState(
                          () => _obscureConfirm = !_obscureConfirm,
                        );
                      },
                      icon: Icon(
                        _obscureConfirm
                            ? Icons.visibility_off_outlined
                            : Icons.visibility_outlined,
                        color: grey,
                        size: 20,
                      ),
                    ),
                  ),

                  const SizedBox(height: 18),

                  // Terms and conditions
                  CheckboxListTile(
                    value: _agreeToTerms,
                    onChanged: (value) {
                      setState(() => _agreeToTerms = value ?? false);
                    },
                    activeColor: orange,
                    checkColor: Colors.white,
                    controlAffinity: ListTileControlAffinity.leading,
                    contentPadding: EdgeInsets.zero,
                    dense: true,
                    title: const Text(
                      'I agree to the terms and conditions',
                      style: TextStyle(
                        color: grey,
                        fontSize: 12,
                      ),
                    ),
                  ),

                  const SizedBox(height: 14),

                  const Text(
                    'Crafted in Kathmandu, styled globally. Create your account '
                    'to access private seasonal sales, currency-matched '
                    'checkout in NPR (Rs) or GBP (£), and dedicated '
                    'concierge support.',
                    style: TextStyle(
                      color: grey,
                      fontSize: 11,
                      height: 1.6,
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Orange action button
                  SizedBox(
                    height: 54,
                    child: ElevatedButton(
                      onPressed: _signup,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: orange,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Flexible(
                            child: Text(
                              'Continue to Verification',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.4,
                              ),
                            ),
                          ),
                          SizedBox(width: 10),
                          Icon(Icons.arrow_forward, size: 17),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 26),

                  // Footer information
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'NP',
                        style: TextStyle(
                          color: orange,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 6),
                        child: Text(
                          '·',
                          style: TextStyle(color: grey),
                        ),
                      ),
                      const Text(
                        'UK',
                        style: TextStyle(
                          color: orange,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(width: 10),
                      const Expanded(
                        child: Text(
                          '100% Authentic Fabrications · Premium satisfaction',
                          softWrap: true,
                          style: TextStyle(
                            color: grey,
                            fontSize: 10,
                            height: 1.5,
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 26),

                  const Text(
                    '© 2026 SATI Atelier. All rights reserved',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: grey,
                      fontSize: 11,
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

class _FieldLabel extends StatelessWidget {
  final String label;

  const _FieldLabel({required this.label});

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: const TextStyle(
        color: Color(0xFF777777),
        fontSize: 10.5,
        fontWeight: FontWeight.w600,
        letterSpacing: 1.2,
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
    return Semantics(
      button: true,
      selected: selected,
      child: Material(
        color: selected
            ? const Color(0xFFFFF1E5)
            : Colors.white,
        borderRadius: BorderRadius.circular(9),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(9),
          child: Container(
            constraints: const BoxConstraints(minHeight: 48),
            padding: const EdgeInsets.symmetric(
              vertical: 10,
              horizontal: 8,
            ),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(9),
              border: Border.all(
                color: selected
                    ? const Color(0xFFFF7900)
                    : const Color(0xFFE5E5E5),
                width: selected ? 1.5 : 1,
              ),
            ),
            alignment: Alignment.center,
            child: Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: selected
                    ? const Color(0xFFFF7900)
                    : const Color(0xFF777777),
                fontSize: 11,
                fontWeight:
                    selected ? FontWeight.w700 : FontWeight.w400,
              ),
            ),
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
  final String? hintText;

  const _InputField({
    required this.label,
    required this.controller,
    this.obscure = false,
    this.keyboardType = TextInputType.text,
    this.suffix,
    this.prefixText,
    this.hintText,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _FieldLabel(label: label),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          obscureText: obscure,
          keyboardType: keyboardType,
          style: const TextStyle(
            color: Color(0xFF222222),
            fontSize: 14,
          ),
          decoration: InputDecoration(
            hintText: hintText,
            hintStyle: const TextStyle(
              color: Color(0xFF999999),
              fontSize: 13,
            ),
            filled: true,
            fillColor: const Color(0xFFF7F7F7),
            isDense: true,
            prefixText: prefixText,
            prefixStyle: const TextStyle(
              color: Color(0xFF222222),
              fontSize: 14,
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 12,
              vertical: 14,
            ),
            suffixIcon: suffix,
            suffixIconConstraints: const BoxConstraints(
              minWidth: 38,
              minHeight: 38,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(9),
              borderSide: const BorderSide(
                color: Color(0xFFE5E5E5),
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(9),
              borderSide: const BorderSide(
                color: Color(0xFFFF7900),
                width: 1.5,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
