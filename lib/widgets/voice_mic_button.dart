import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class VoiceMicButton extends StatelessWidget {
  final bool isListening;
  final VoidCallback onTap;

  const VoiceMicButton({
    Key? key,
    required this.isListening,
    required this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 140,
        height: 140,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: LinearGradient(
            colors: isListening
                ? [AppTheme.emeraldGreen, const Color(0xFF059669)]
                : [AppTheme.royalBlue, const Color(0xFF1D4ED8)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          boxShadow: [
            BoxShadow(
              color: isListening
                  ? AppTheme.emeraldGreen.withOpacity(0.5)
                  : AppTheme.royalBlue.withOpacity(0.5),
              blurRadius: 30,
              spreadRadius: 5,
            ),
          ],
          border: Border.all(color: Colors.white24, width: 4),
        ),
        child: Column(
          mainAxisAlignment: MainCenter,
          children: [
            Icon(
              isListening ? Icons.mic : Icons.mic_none,
              size: 56,
              color: Colors.white,
            ),
            const SizedBox(height: 4),
            Text(
              isListening ? 'LISTENING' : 'TAP TO SPEAK',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w900,
                color: Colors.white,
                letterSpacing: 1.2,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
