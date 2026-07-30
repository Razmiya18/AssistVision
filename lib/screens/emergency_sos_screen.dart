import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class EmergencySosScreen extends StatelessWidget {
  const EmergencySosScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF450A0A),
      appBar: AppBar(
        title: const Text('EMERGENCY SOS'),
        backgroundColor: AppTheme.crimsonRed,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ElevatedButton(
              onPressed: () {},
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.crimsonRed,
                shape: const CircleBorder(),
                padding: const EdgeInsets.all(48),
              ),
              child: const Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.warning, size: 80, color: Colors.white),
                  SizedBox(height: 12),
                  Text(
                    'SOS',
                    style: TextStyle(fontSize: 32, fontWeight: FontWeight.black),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 24.0),
              child: Text(
                'Calling Emergency Contact & Broadcasting Live Location Coordinates',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
