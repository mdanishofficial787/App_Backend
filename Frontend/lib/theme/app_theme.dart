import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  // Primary Brand Blue
  static const Color primaryBlue = Color(0xFF1A56DB);
  static const Color primaryBlueDark = Color(0xFF1341B3);
  static const Color primaryBlueLight = Color(0xFFE8F0FD);
  static const Color primaryBlueSubtle = Color(0xFFF0F5FF);

  // Pure White Backgrounds
  static const Color background = Color(0xFFFFFFFF);
  static const Color surface = Color(0xFFF8F9FA);
  static const Color cardBg = Color(0xFFFFFFFF);

  // Text
  static const Color textPrimary = Color(0xFF0D1117);
  static const Color textSecondary = Color(0xFF525966);
  static const Color textMuted = Color(0xFF9BA3AF);
  static const Color textLight = Color(0xFFD1D5DB);

  // Borders
  static const Color borderLight = Color(0xFFE5E7EB);
  static const Color borderMedium = Color(0xFFD0D5DD);
  static const Color borderDark = Color(0xFF0D1117);
  static const Color dottedBorder = Color(0xFF9BA3AF);
  static const Color dashedBlue = Color(0xFF93C5FD);

  // AppBar Bottom Divider
  static const Color divider = Color(0xFFEAECF0);

  // Status
  static const Color success = Color(0xFF12B76A);
  static const Color successBg = Color(0xFFECFDF5);
  static const Color warning = Color(0xFFF79009);
  static const Color error = Color(0xFFF04438);
}

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light, // Force light mode always
      scaffoldBackgroundColor: AppColors.background,
      primaryColor: AppColors.primaryBlue,
      colorScheme: const ColorScheme.light(
        primary: AppColors.primaryBlue,
        onPrimary: Colors.white,
        surface: AppColors.background,
        onSurface: AppColors.textPrimary,
        secondary: AppColors.primaryBlue,
        onSecondary: Colors.white,
        error: AppColors.error,
        onError: Colors.white,
        outline: AppColors.borderMedium,
      ),
      textTheme: GoogleFonts.interTextTheme(ThemeData.light().textTheme).apply(
        bodyColor: AppColors.textPrimary,
        displayColor: AppColors.textPrimary,
      ),
      scrollbarTheme: ScrollbarThemeData(
        thumbVisibility: WidgetStateProperty.all(true),
        trackVisibility: WidgetStateProperty.all(false),
        thickness: WidgetStateProperty.all(3.5),
        radius: const Radius.circular(10),
        thumbColor: WidgetStateProperty.all(
          AppColors.primaryBlue.withValues(alpha: 0.5),
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.background,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: true,
        systemOverlayStyle: SystemUiOverlayStyle.dark.copyWith(
          statusBarColor: Colors.transparent,
          systemNavigationBarColor: Colors.white,
        ),
        titleTextStyle: GoogleFonts.inter(
          fontSize: 16,
          fontWeight: FontWeight.w700,
          color: AppColors.textPrimary,
          letterSpacing: -0.1,
        ),
        iconTheme: const IconThemeData(color: AppColors.textPrimary, size: 22),
        shape: const Border(
          bottom: BorderSide(color: AppColors.divider, width: 1),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: AppColors.divider,
        thickness: 1,
        space: 0,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(28),
          ),
        ),
      ),
      inputDecorationTheme: const InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: InputBorder.none,
        enabledBorder: InputBorder.none,
        focusedBorder: InputBorder.none,
        contentPadding: EdgeInsets.zero,
        isDense: true,
      ),
    );
  }
}
