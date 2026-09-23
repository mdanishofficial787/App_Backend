import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '/theme/app_theme.dart';

class PasswordRequirementIndicator extends StatelessWidget {
  final String password;

  const PasswordRequirementIndicator({super.key, required this.password});

  bool get hasMinLength => password.length >= 8;
  bool get hasLetter => RegExp(r'[a-zA-Z]').hasMatch(password);
  bool get hasNumber => RegExp(r'[0-9]').hasMatch(password);
  bool get hasSpecialChar =>
      RegExp(r'[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\/`~]').hasMatch(password);

  @override
  Widget build(BuildContext context) {
    if (password.isEmpty) {
      return const SizedBox.shrink();
    }

    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      margin: const EdgeInsets.only(top: 8, bottom: 4, left: 4, right: 4),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderLight, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Password Requirements',
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
              letterSpacing: 0.2,
            ),
          ),
          const SizedBox(height: 6),
          _buildRequirementItem('At least 8 characters', hasMinLength),
          const SizedBox(height: 4),
          _buildRequirementItem('At least one letter (a-z / A-Z)', hasLetter),
          const SizedBox(height: 4),
          _buildRequirementItem('At least one number (0-9)', hasNumber),
          const SizedBox(height: 4),
          _buildRequirementItem(
            'At least one special character (!@#\$...)',
            hasSpecialChar,
          ),
        ],
      ),
    );
  }

  Widget _buildRequirementItem(String text, bool isMet) {
    return AnimatedDefaultTextStyle(
      duration: const Duration(milliseconds: 200),
      style: GoogleFonts.inter(
        fontSize: 11,
        fontWeight: isMet ? FontWeight.w600 : FontWeight.w400,
        color: isMet ? AppColors.success : AppColors.textSecondary,
      ),
      child: Row(
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            width: 16,
            height: 16,
            decoration: BoxDecoration(
              color: isMet ? AppColors.success : Colors.grey.shade300,
              shape: BoxShape.circle,
            ),
            child: Icon(
              isMet ? Icons.check : Icons.circle,
              size: isMet ? 11 : 5,
              color: Colors.white,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(child: Text(text)),
        ],
      ),
    );
  }
}
