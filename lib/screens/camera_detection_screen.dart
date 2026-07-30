import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class CameraDetectionScreen extends StatelessWidget {
  const CameraDetectionScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Live Camera AI Detection'),
        backgroundColor: AppTheme.cardBg,
      ),
      body: Column(
        children: [
          Container(
            height: 300,
            width: double.infinity,
            margin: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.black,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppTheme.royalBlue, width: 3),
            ),
            child: const Center(
              child: Text(
                'Live Camera Preview\n[Bounding Boxes Overlay Active]',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white, fontSize: 18),
              ),
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                _buildDetectionCard('Person', '2.1m', 'Front', '98%', false),
                _buildDetectionCard('Chair', '0.8m', 'Front', '97%', true),
                _buildDetectionCard('Bottle', '0.5m', 'Left', '95%', true),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetectionCard(String name, String distance, String direction, String confidence, bool isWarning) {
    return Card(
      color: isWarning ? AppTheme.crimsonRed.withOpacity(0.2) : AppTheme.cardBg,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: isWarning ? AppTheme.crimsonRed : Colors.white12, width: 2),
      ),
      child: ListTile(
        title: Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
        subtitle: Text('$direction • Confidence $confidence'),
        trailing: Text(distance, style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: isWarning ? AppTheme.crimsonRed : AppTheme.emeraldGreen)),
      ),
    );
  }
}
