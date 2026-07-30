import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../widgets/voice_mic_button.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _isListening = false;

  void _toggleMic() {
    setState(() {
      _isListening = !_isListening;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: AppTheme.cardBg,
        title: const Text(
          'BlindViz 2.0',
          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
        ),
        actions: const [
          Chip(
            avatar: Icon(Icons.gps_fixed, size: 14, color: AppTheme.emeraldGreen),
            label: Text('GPS Fix', style: TextStyle(fontSize: 12)),
          ),
          SizedBox(width: 12),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Say a Command',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              VoiceMicButton(
                isListening: _isListening,
                onTap: _toggleMic,
              ),
              Expanded(
                child: GridView.count(
                  crossAxisCount: 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  children: [
                    _buildCommandCard('Start Navigation', Icons.navigation, AppTheme.royalBlue),
                    _buildCommandCard('Read Text', Icons.description, Colors.lightBlue),
                    _buildCommandCard('Detect Objects', Icons.view_in_ar, AppTheme.emeraldGreen),
                    _buildCommandCard('Detect Currency', Icons.attach_money, AppTheme.orangeWarning),
                    _buildCommandCard('Recognize Face', Icons.face, Colors.purple),
                    _buildCommandCard('Emergency', Icons.warning, AppTheme.crimsonRed),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCommandCard(String title, IconData icon, Color color) {
    return Card(
      child: InkWell(
        onTap: () {},
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 36, color: color),
              const SizedBox(height: 8),
              Text(
                title,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
