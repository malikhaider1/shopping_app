import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // Primary Brand Colors
  static const Color primary = Color(0xFF1A1A2E);
  static const Color primaryLight = Color(0xFF16213E);
  static const Color primaryDark = Color(0xFF0F0F1A);

  // Accent Colors
  static const Color accent = Color(0xFFE94560);
  static const Color accentLight = Color(0xFFFF6B6B);
  static const Color accentDark = Color(0xFFD13355);

  // Secondary Colors
  static const Color secondary = Color(0xFF533483);
  static const Color secondaryLight = Color(0xFF7B5EA7);
  static const Color secondaryDark = Color(0xFF3D2663);

  // Neutral Colors
  static const Color white = Color(0xFFFFFFFF);
  static const Color offWhite = Color(0xFFF8F9FA);
  static const Color lightGrey = Color(0xFFE9ECEF);
  static const Color grey = Color(0xFFADB5BD);
  static const Color darkGrey = Color(0xFF6C757D);
  static const Color charcoal = Color(0xFF343A40);
  static const Color black = Color(0xFF212529);

  // Semantic Colors
  static const Color success = Color(0xFF28A745);
  static const Color successLight = Color(0xFFD4EDDA);
  static const Color warning = Color(0xFFFFC107);
  static const Color warningLight = Color(0xFFFFF3CD);
  static const Color error = Color(0xFFDC3545);
  static const Color errorLight = Color(0xFFF8D7DA);
  static const Color info = Color(0xFF17A2B8);
  static const Color infoLight = Color(0xFFD1ECF1);

  // Background Colors
  static const Color background = Color(0xFFF8F9FA);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceVariant = Color(0xFFF1F3F4);

  // Text Colors
  static const Color textPrimary = Color(0xFF212529);
  static const Color textSecondary = Color(0xFF6C757D);
  static const Color textHint = Color(0xFFADB5BD);
  static const Color textOnPrimary = Color(0xFFFFFFFF);
  static const Color textOnAccent = Color(0xFFFFFFFF);

  // Rating Colors
  static const Color star = Color(0xFFFFD700);
  static const Color starEmpty = Color(0xFFE0E0E0);

  // Gradient
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primary, primaryLight],
  );

  static const LinearGradient accentGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [accent, accentLight],
  );

  static const LinearGradient shimmerGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFEBEBF4), Color(0xFFF4F4F4), Color(0xFFEBEBF4)],
  );
}
