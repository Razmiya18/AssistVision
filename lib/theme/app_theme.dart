import 'package:flutter/material.dart';

class AppTheme {
  static const Color darkBg = Color(0xFF070A14);
  static const Color cardBg = Color(0xFF0F172A);
  static const Color royalBlue = Color(0xFF2563EB);
  static const Color emeraldGreen = Color(0xFF10B981);
  static const Color orangeWarning = Color(0xFFF59E0B);
  static const Color crimsonRed = Color(0xFFEF4444);

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: darkBg,
      primaryColor: royalBlue,
      colorScheme: const ColorScheme.dark(
        primary: royalBlue,
        secondary: emeraldGreen,
        error: crimsonRed,
        surface: cardBg,
      ),
      fontFamily: 'Outfit',
      cardTheme: CardTheme(
        color: cardBg,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: Colors.white12),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          minimumSize: const Size(56, 56), // Minimum 56dp touch target
          backgroundColor: royalBlue,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          textStyle: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}
