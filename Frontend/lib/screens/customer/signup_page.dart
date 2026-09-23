import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:ride_and_serve/screens/customer/login_page.dart';
import 'package:ride_and_serve/screens/customer/otp_verification_page.dart';

import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:google_sign_in/google_sign_in.dart';
//import 'package:google_sign_in_web/web_only.dart';

class SignUpPage extends StatefulWidget {
  const SignUpPage({super.key});

  @override
  State<SignUpPage> createState() => _SignUpPageState();
}

class _SignUpPageState extends State<SignUpPage> {
  final _formKey = GlobalKey<FormState>();

  final ImagePicker _picker = ImagePicker();
  XFile? _selectedImage;
  Uint8List? _selectedImageBytes;

  final _fullNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  final GoogleSignIn googleSignIn = GoogleSignIn(
    clientId:
        "895664225286-bg2kcb118qi532u7pehcja01s33f1a58.apps.googleusercontent.com",
  );

  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _agreedToTerms = false;
  bool _isSubmitting = false;

  String _countryCode = '+92';

  String? _requiredValidator(String? value, String fieldName) {
    if (value == null || value.trim().isEmpty) {
      return '$fieldName is required';
    }
    return null;
  }

  String? _phoneValidator(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Phone number is required';
    }
    final digitsOnly = value.replaceAll(RegExp(r'[^0-9]'), '');
    if (digitsOnly.length < 9) return 'Enter a valid phone number';
    return null;
  }

  String? _emailValidator(String? value) {
    // Optional field — only validate format if something was typed.
    if (value == null || value.trim().isEmpty) return null;
    final emailRegex = RegExp(r'^[\w\.\-]+@([\w\-]+\.)+[\w\-]{2,4}$');
    if (!emailRegex.hasMatch(value.trim())) return 'Enter a valid email';
    return null;
  }

  String? _passwordValidator(String? value) {
    if (value == null || value.isEmpty) return 'Password is required';
    if (value.length < 8) return 'Must be at least 8 characters';
    return null;
  }

  String? _confirmPasswordValidator(String? value) {
    if (value == null || value.isEmpty) return 'Please confirm your password';
    if (value != _passwordController.text) return 'Passwords do not match';
    return null;
  }

  Future<void> _handleGoogleSignup() async {
    try {
      debugPrint("Starting Google Sign-In...");

      final GoogleSignInAccount? account = await googleSignIn.signIn();

      if (account == null) {
        debugPrint("Google Sign-In cancelled.");
        return;
      }

      debugPrint("Google account: ${account.email}");

      final GoogleSignInAuthentication googleAuth =
          await account.authentication;

      final String? accessToken = googleAuth.accessToken;

      debugPrint("Access Token received: ${accessToken != null}");

      if (accessToken == null || accessToken.isEmpty) {
        if (!mounted) return;

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Google access token was not received."),
          ),
        );

        return;
      }

      // Send ACCESS TOKEN to your Node.js backend
      final response = await http.post(
        Uri.parse("http://localhost:3000/api/auth/google"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"accessToken": accessToken}),
      );

      debugPrint("Google backend status: ${response.statusCode}");

      debugPrint("Google backend response: ${response.body}");

      if (!mounted) return;

      if (response.statusCode == 200 || response.statusCode == 201) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Google signup/login successful!")),
        );

        // Later you can navigate to your dashboard/home page here.
        // For now, we only confirm successful authentication.
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Google signup failed: ${response.body}")),
        );
      }
    } catch (e) {
      debugPrint("Google Signup Error: $e");

      if (!mounted) return;

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text("Google signup failed: $e")));
    }
  }

  Future<void> _handleCreateAccount() async {
    final isValid = _formKey.currentState?.validate() ?? false;
    if (!isValid) return;

    if (!_agreedToTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please agree to the Terms & Conditions')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final uri = Uri.parse("http://localhost:3000/api/auth/signup");

      var request = http.MultipartRequest("POST", uri);

      request.fields["fullName"] = _fullNameController.text.trim();

      request.fields["PhoneNumber"] = _phoneController.text
          .trim(); // Only the number, e.g. 3001234567

      request.fields["countryCode"] = _countryCode; // e.g. +92

      debugPrint('EMAIL BEING SENT: ${_emailController.text.trim()}');

      request.fields['Email'] = _emailController.text.trim();

      request.fields["Password"] = _passwordController.text;

      request.fields["confirmPassword"] = _confirmPasswordController.text;

      request.fields["termsAccepted"] = "true";

      request.fields["tcVersion"] = "1.0";

      if (_selectedImage != null && _selectedImageBytes != null) {
        request.files.add(
          http.MultipartFile.fromBytes(
            "CustomerPhoto",
            _selectedImageBytes!,
            filename: _selectedImage!.name,
          ),
        );
      }

      final response = await request.send();

      final responseBody = await response.stream.bytesToString();

      if (!mounted) return;

      if (response.statusCode == 200 || response.statusCode == 201) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) {
            return Dialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const CircleAvatar(
                      radius: 35,
                      backgroundColor: Color(0xFFE8F5E9),
                      child: Icon(
                        Icons.check_circle,
                        color: Colors.green,
                        size: 50,
                      ),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      "Account Created!",
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      "Your account has been created successfully.\n\nWe've sent a verification code to your email.",
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 25),
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF1959F6),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text(
                          "VERIFY NOW",
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        onPressed: () {
                          Navigator.pop(context);

                          Navigator.pushReplacement(
                            context,
                            MaterialPageRoute(
                              builder: (_) => OtpVerificationPage(
                                email: _emailController.text.trim(),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      } else {
        throw Exception(responseBody);
      }
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text("Signup failed: $e")));
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  Future<void> pickImage() async {
    final image = await _picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 80,
    );

    if (image != null) {
      final bytes = await image.readAsBytes();
      setState(() {
        _selectedImage = image;
        _selectedImageBytes = bytes;
      });
    }
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF1959F6);
    const fieldFill = Color(0xFFF5F6F8);
    //const labelGrey = Color(0xFF8A8F98);

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Form(
            key: _formKey,
            autovalidateMode: AutovalidateMode.onUserInteraction,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top bar: back arrow
                const SizedBox(height: 8),
                IconButton(
                  padding: EdgeInsets.zero,
                  alignment: Alignment.centerLeft,
                  onPressed: () => Navigator.of(context).maybePop(),
                  icon: const Icon(Icons.arrow_back, color: Colors.black87),
                ),

                // Title
                const Center(
                  child: Text(
                    'Create Account',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: Colors.black87,
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // Avatar picker
                Center(
                  child: Stack(
                    clipBehavior: Clip.none,
                    children: [
                      Container(
                        width: 88,
                        height: 88,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: Colors.grey.shade300,
                            width: 1.2,
                          ),
                          image: _selectedImageBytes != null
                              ? DecorationImage(
                                  image: MemoryImage(_selectedImageBytes!),
                                  fit: BoxFit.cover,
                                )
                              : null,
                        ),
                        child: _selectedImageBytes == null
                            ? const Icon(
                                Icons.person_outline,
                                size: 40,
                                color: Colors.black45,
                              )
                            : null,
                      ),

                      // + button
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: GestureDetector(
                          onTap: pickImage,
                          child: Container(
                            width: 28,
                            height: 28,
                            decoration: const BoxDecoration(
                              color: primaryBlue,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.add,
                              size: 18,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 28),

                // Full Name
                _FieldLabel('FULL NAME', const Color.fromARGB(255, 10, 10, 10)),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _fullNameController,
                  textInputAction: TextInputAction.next,
                  decoration: _inputDecoration(
                    hint: 'John Doe',
                    fill: fieldFill,
                  ),
                  validator: (v) => _requiredValidator(v, 'Full name'),
                ),
                const SizedBox(height: 20),

                // Phone Number
                _FieldLabel(
                  'PHONE NUMBER',
                  const Color.fromARGB(255, 10, 10, 10),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Container(
                      height: 52,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: fieldFill,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _countryCode,
                          icon: const Icon(Icons.keyboard_arrow_down, size: 18),
                          items: const [
                            DropdownMenuItem(
                              value: '+92',
                              child: Text('🇵🇰 +92'),
                            ),
                            DropdownMenuItem(
                              value: '+1',
                              child: Text('🇺🇸 +1'),
                            ),
                            DropdownMenuItem(
                              value: '+44',
                              child: Text('🇬🇧 +44'),
                            ),
                          ],
                          onChanged: (val) {
                            if (val != null) setState(() => _countryCode = val);
                          },
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextFormField(
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        textInputAction: TextInputAction.next,
                        decoration: _inputDecoration(
                          hint: '300 1234567',
                          fill: fieldFill,
                        ),
                        validator: _phoneValidator,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Email (optional)
                _FieldLabel(
                  'EMAIL (OPTIONAL)',
                  const Color.fromARGB(255, 10, 10, 10),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  decoration: _inputDecoration(
                    hint: 'john@example.com',
                    fill: fieldFill,
                  ),
                  validator: _emailValidator,
                ),
                const SizedBox(height: 20),

                // Password
                _FieldLabel('PASSWORD', const Color.fromARGB(255, 10, 10, 10)),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  textInputAction: TextInputAction.next,
                  decoration: _inputDecoration(
                    hint: '••••••••',
                    fill: fieldFill,
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword
                            ? Icons.visibility_off_outlined
                            : Icons.visibility_outlined,
                        size: 20,
                        color: Colors.black45,
                      ),
                      onPressed: () =>
                          setState(() => _obscurePassword = !_obscurePassword),
                    ),
                  ),
                  validator: _passwordValidator,
                ),
                const SizedBox(height: 20),

                // Confirm Password
                _FieldLabel(
                  'CONFIRM PASSWORD',
                  const Color.fromARGB(255, 10, 10, 10),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _confirmPasswordController,
                  obscureText: _obscureConfirmPassword,
                  textInputAction: TextInputAction.done,
                  decoration: _inputDecoration(
                    hint: '••••••••',
                    fill: fieldFill,
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscureConfirmPassword
                            ? Icons.visibility_off_outlined
                            : Icons.visibility_outlined,
                        size: 20,
                        color: Colors.black45,
                      ),
                      onPressed: () => setState(
                        () =>
                            _obscureConfirmPassword = !_obscureConfirmPassword,
                      ),
                    ),
                  ),
                  validator: _confirmPasswordValidator,
                ),
                const SizedBox(height: 16),

                // Terms checkbox
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    SizedBox(
                      width: 22,
                      height: 22,
                      child: Checkbox(
                        value: _agreedToTerms,
                        activeColor: primaryBlue,
                        onChanged: (val) =>
                            setState(() => _agreedToTerms = val ?? false),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: RichText(
                        text: TextSpan(
                          style: const TextStyle(
                            fontSize: 13,
                            color: Colors.black87,
                          ),
                          children: [
                            const TextSpan(text: 'I agree to the '),
                            TextSpan(
                              text: 'Terms & Conditions',
                              style: const TextStyle(
                                color: primaryBlue,
                                fontWeight: FontWeight.w600,
                              ),
                              recognizer: null,
                            ),
                            const TextSpan(text: ' and '),
                            TextSpan(
                              text: 'Privacy Policy',
                              style: const TextStyle(
                                color: primaryBlue,
                                fontWeight: FontWeight.w600,
                              ),
                              recognizer: null,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Create Account button
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _isSubmitting ? null : _handleCreateAccount,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primaryBlue,
                      disabledBackgroundColor: primaryBlue.withValues(
                        alpha: 0.4,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                      elevation: 0,
                    ),
                    child: _isSubmitting
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.4,
                              color: Colors.white,
                            ),
                          )
                        : const Text(
                            'CREATE ACCOUNT',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.5,
                            ),
                          ),
                  ),
                ),
                const SizedBox(height: 20),

                // OR divider
                Row(
                  children: [
                    Expanded(child: Divider(color: Colors.grey.shade300)),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Text(
                        'OR',
                        style: TextStyle(
                          color: const Color.fromARGB(255, 148, 147, 147),
                          fontSize: 12,
                        ),
                      ),
                    ),
                    Expanded(child: Divider(color: Colors.grey.shade300)),
                  ],
                ),
                const SizedBox(height: 20),

                // Social buttons
                _SocialButton(
                  icon: Icons.g_mobiledata,
                  iconColor: Colors.redAccent,
                  label: 'Continue with Google',
                  onTap: _handleGoogleSignup,
                ),
                const SizedBox(height: 12),
                _SocialButton(
                  icon: Icons.business,
                  iconColor: const Color(0xFF0A66C2),
                  label: 'Continue with LinkedIn',
                  onTap: () {},
                ),
                const SizedBox(height: 12),
                _SocialButton(
                  icon: Icons.sms_outlined,
                  iconColor: primaryBlue,
                  label: 'Continue with Phone OTP',
                  onTap: () {},
                ),
                const SizedBox(height: 24),

                Center(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        'Already have an account? ',
                        style: TextStyle(fontSize: 13, color: Colors.black54),
                      ),
                      TextButton(
                        onPressed: () {
                          Navigator.pushReplacement(
                            context,
                            MaterialPageRoute(
                              builder: (context) => const LoginPage(),
                            ),
                          );
                        },
                        style: TextButton.styleFrom(
                          padding: EdgeInsets.zero,
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: const Text(
                          'Login',
                          style: TextStyle(
                            color: primaryBlue,
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration({
    required String hint,
    required Color fill,
    Widget? suffixIcon,
  }) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: Colors.black38),
      filled: true,
      fillColor: fill,
      suffixIcon: suffixIcon,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFF1959F6), width: 1.4),
      ),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  final String text;
  final Color color;
  const _FieldLabel(this.text, this.color);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w600,
        color: color,
        letterSpacing: 0.5,
      ),
    );
  }
}

class _SocialButton extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String label;
  final VoidCallback onTap;

  const _SocialButton({
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: OutlinedButton.icon(
        onPressed: onTap,
        style: OutlinedButton.styleFrom(
          side: BorderSide(color: Colors.grey.shade300),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        icon: Icon(icon, color: iconColor, size: 20),
        label: Text(
          label,
          style: const TextStyle(
            color: Colors.black87,
            fontWeight: FontWeight.w500,
            fontSize: 14,
          ),
        ),
      ),
    );
  }
}
