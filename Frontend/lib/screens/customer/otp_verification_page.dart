import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;

class OtpVerificationPage extends StatefulWidget {
  /// User's email address.
  /// Example: user@gmail.com
  final String email;

  const OtpVerificationPage({super.key, required this.email});

  @override
  State<OtpVerificationPage> createState() => _OtpVerificationPageState();
}

class _OtpVerificationPageState extends State<OtpVerificationPage> {
  static const int _otpLength = 6;
  static const int _resendSeconds = 30;

  final List<TextEditingController> _controllers = List.generate(
    _otpLength,
    (_) => TextEditingController(),
  );

  final List<FocusNode> _focusNodes = List.generate(
    _otpLength,
    (_) => FocusNode(),
  );

  Timer? _timer;

  int _secondsLeft = _resendSeconds;

  bool _isAutoFetching = true;
  bool _isVerifying = false;
  bool _isResending = false;

  // ===========================================================
  // INIT
  // ===========================================================

  @override
  void initState() {
    super.initState();

    _startResendTimer();

    // This is only a visual indicator.
    // Email OTP cannot be automatically fetched like SMS OTP.
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        setState(() {
          _isAutoFetching = false;
        });
      }
    });
  }

  // ===========================================================
  // DISPOSE
  // ===========================================================

  @override
  void dispose() {
    _timer?.cancel();

    for (final controller in _controllers) {
      controller.dispose();
    }

    for (final focusNode in _focusNodes) {
      focusNode.dispose();
    }

    super.dispose();
  }

  // ===========================================================
  // RESEND TIMER
  // ===========================================================

  void _startResendTimer() {
    _secondsLeft = _resendSeconds;

    _timer?.cancel();

    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_secondsLeft == 0) {
        timer.cancel();

        if (mounted) {
          setState(() {});
        }
      } else {
        if (mounted) {
          setState(() {
            _secondsLeft--;
          });
        }
      }
    });
  }

  // ===========================================================
  // OTP CODE
  // ===========================================================

  String get _otpCode {
    return _controllers.map((controller) {
      return controller.text;
    }).join();
  }

  bool get _isComplete {
    return _otpCode.length == _otpLength;
  }

  // ===========================================================
  // DIGIT CHANGE
  // ===========================================================

  void _onDigitChanged(int index, String value) {
    if (value.isNotEmpty && index < _otpLength - 1) {
      _focusNodes[index + 1].requestFocus();
    }

    if (value.isEmpty && index > 0) {
      _focusNodes[index - 1].requestFocus();
    }

    setState(() {});

    if (_isComplete) {
      FocusScope.of(context).unfocus();
    }
  }

  // ===========================================================
  // RESEND OTP
  // ===========================================================

  Future<void> _handleResend() async {
    if (_secondsLeft > 0 || _isResending) {
      return;
    }

    setState(() {
      _isResending = true;
      _isAutoFetching = true;
    });

    try {
      final response = await http.post(
        Uri.parse('http://localhost:3000/api/auth/resend-otp'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': widget.email}),
      );

      debugPrint('Resend OTP Status: ${response.statusCode}');

      debugPrint('Resend OTP Response: ${response.body}');

      final data = jsonDecode(response.body);

      if (!mounted) return;

      if (response.statusCode == 200 && data['success'] == true) {
        // Clear previous OTP
        for (final controller in _controllers) {
          controller.clear();
        }

        // Focus first OTP box
        _focusNodes[0].requestFocus();

        // Restart timer
        _startResendTimer();

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('A new OTP has been sent to your email.'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(data['message'] ?? 'Unable to resend OTP.'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;

      debugPrint('Resend OTP Error: $e');

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Unable to resend OTP: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isResending = false;
          _isAutoFetching = false;
        });
      }
    }
  }

  // ===========================================================
  // VERIFY OTP
  // ===========================================================

  Future<void> _handleVerify() async {
    if (!_isComplete || _isVerifying) {
      return;
    }

    setState(() {
      _isVerifying = true;
    });

    try {
      final response = await http.post(
        Uri.parse('http://localhost:3000/api/auth/verify-otp'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': widget.email, 'otp': _otpCode}),
      );

      debugPrint('OTP Verify Status: ${response.statusCode}');

      debugPrint('OTP Verify Response: ${response.body}');

      final data = jsonDecode(response.body);

      if (!mounted) return;

      if (response.statusCode == 200 && data['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Email verified successfully!'),
            backgroundColor: Colors.green,
          ),
        );

        Navigator.pop(context);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(data['message'] ?? 'OTP verification failed.'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;

      debugPrint('OTP Verify Error: $e');

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Unable to verify OTP: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isVerifying = false;
        });
      }
    }
  }

  // ===========================================================
  // BUILD
  // ===========================================================

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF1959F6);
    const cardFill = Color(0xFFF0F1F3);

    return Scaffold(
      backgroundColor: Colors.white,

      body: SafeArea(
        child: Stack(
          children: [
            // ===================================================
            // MAIN CONTENT
            // ===================================================
            SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24),

              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,

                children: [
                  const SizedBox(height: 100),

                  // =================================================
                  // TITLE
                  // =================================================
                  const Text(
                    'Verify Your Email',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                      color: Colors.black87,
                    ),
                  ),

                  const SizedBox(height: 8),

                  // =================================================
                  // EMAIL
                  // =================================================
                  Text(
                    'Code sent to ${widget.email}',
                    style: const TextStyle(
                      fontSize: 16,
                      color: Color.fromARGB(137, 3, 3, 3),
                    ),
                  ),

                  const SizedBox(height: 28),

                  // =================================================
                  // OTP BOXES
                  // =================================================
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,

                    children: List.generate(_otpLength, (index) {
                      return _OtpBox(
                        controller: _controllers[index],

                        focusNode: _focusNodes[index],

                        onChanged: (value) => _onDigitChanged(index, value),
                      );
                    }),
                  ),

                  const SizedBox(height: 16),

                  // =================================================
                  // AUTO FETCHING
                  // =================================================
                  if (_isAutoFetching)
                    Center(
                      child: Row(
                        mainAxisSize: MainAxisSize.min,

                        children: [
                          const SizedBox(
                            width: 14,
                            height: 14,

                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.black45,
                            ),
                          ),

                          const SizedBox(width: 8),

                          Text(
                            'Checking for OTP...',
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.grey.shade600,
                            ),
                          ),
                        ],
                      ),
                    ),

                  const SizedBox(height: 20),

                  // =================================================
                  // RESEND
                  // =================================================
                  Center(
                    child: Column(
                      children: [
                        if (_secondsLeft > 0)
                          RichText(
                            text: TextSpan(
                              style: const TextStyle(
                                fontSize: 14,
                                color: Colors.black87,
                              ),

                              children: [
                                const TextSpan(text: 'Resend OTP in '),

                                TextSpan(
                                  text:
                                      '00:${_secondsLeft.toString().padLeft(2, '0')}',

                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          ),

                        const SizedBox(height: 6),

                        GestureDetector(
                          onTap: (_secondsLeft == 0 && !_isResending)
                              ? _handleResend
                              : null,

                          child: Text(
                            _isResending ? 'Sending...' : 'Resend',

                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,

                              color: (_secondsLeft == 0 && !_isResending)
                                  ? primaryBlue
                                  : Colors.grey.shade400,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 28),

                  // =================================================
                  // SECURITY CARD
                  // =================================================
                  Container(
                    width: double.infinity,

                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 28,
                    ),

                    decoration: BoxDecoration(
                      color: cardFill,
                      borderRadius: BorderRadius.circular(16),
                    ),

                    child: Column(
                      children: [
                        Container(
                          width: 56,
                          height: 56,

                          decoration: BoxDecoration(
                            color: primaryBlue.withValues(alpha: 0.12),

                            shape: BoxShape.circle,
                          ),

                          child: const Icon(
                            Icons.mark_email_read_outlined,

                            color: primaryBlue,

                            size: 26,
                          ),
                        ),

                        const SizedBox(height: 14),

                        Text(
                          'SECURED VIA EMAIL',
                          style: TextStyle(
                            fontSize: 12,

                            fontWeight: FontWeight.w700,

                            letterSpacing: 0.6,

                            color: Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 90),
                ],
              ),
            ),

            // ===================================================
            // BACK BUTTON
            // ===================================================
            Positioned(
              top: 8,
              left: 24,

              child: IconButton(
                padding: EdgeInsets.zero,

                onPressed: () => Navigator.of(context).maybePop(),

                icon: const Icon(Icons.arrow_back, color: primaryBlue),
              ),
            ),

            // ===================================================
            // AVATAR
            // ===================================================
            const Positioned(
              top: 8,
              right: 24,

              child: CircleAvatar(
                radius: 18,

                backgroundColor: Color(0xFF3A3A3C),

                child: Text(
                  'A',

                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),

            // ===================================================
            // VERIFY BUTTON
            // ===================================================
            Positioned(
              left: 24,
              right: 24,
              bottom: 28,

              child: SizedBox(
                width: double.infinity,

                height: 52,

                child: ElevatedButton(
                  onPressed: (_isComplete && !_isVerifying)
                      ? _handleVerify
                      : null,

                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryBlue,

                    disabledBackgroundColor: primaryBlue.withValues(alpha: 0.4),

                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),

                    elevation: 0,
                  ),

                  child: _isVerifying
                      ? const SizedBox(
                          width: 22,
                          height: 22,

                          child: CircularProgressIndicator(
                            strokeWidth: 2.4,
                            color: Colors.white,
                          ),
                        )
                      : const Text(
                          'VERIFY',

                          style: TextStyle(
                            color: Colors.white,

                            fontWeight: FontWeight.w700,

                            letterSpacing: 0.5,

                            fontSize: 15,
                          ),
                        ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// =============================================================
// OTP BOX
// =============================================================

class _OtpBox extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final ValueChanged<String> onChanged;

  const _OtpBox({
    required this.controller,
    required this.focusNode,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF1959F6);

    return SizedBox(
      width: 44,
      height: 52,

      child: TextField(
        controller: controller,
        focusNode: focusNode,
        onChanged: onChanged,

        textAlign: TextAlign.center,

        keyboardType: TextInputType.number,

        maxLength: 1,

        style: const TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: Colors.black87,
        ),

        inputFormatters: [FilteringTextInputFormatter.digitsOnly],

        decoration: InputDecoration(
          counterText: '',
          contentPadding: EdgeInsets.zero,

          filled: true,
          fillColor: Colors.white,

          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),

            borderSide: BorderSide(color: Colors.grey.shade300),
          ),

          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),

            borderSide: BorderSide(color: Colors.grey.shade300),
          ),

          focusedBorder: const OutlineInputBorder(
            borderRadius: BorderRadius.all(Radius.circular(10)),

            borderSide: BorderSide(color: primaryBlue, width: 1.6),
          ),
        ),
      ),
    );
  }
}
