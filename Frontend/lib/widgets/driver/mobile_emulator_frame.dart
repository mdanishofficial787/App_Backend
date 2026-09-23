import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../theme/app_theme.dart';

enum DevicePreset {
  iphone15Pro('iPhone 15 Pro', 393, 852, 50, true),
  pixel8('Google Pixel 8', 412, 892, 44, false),
  samsungS24('Samsung Galaxy S24', 400, 860, 42, false);

  final String name;
  final double width;
  final double height;
  final double cornerRadius;
  final bool hasDynamicIsland;

  const DevicePreset(
    this.name,
    this.width,
    this.height,
    this.cornerRadius,
    this.hasDynamicIsland,
  );
}

class MobileEmulatorFrame extends StatefulWidget {
  final Widget child;

  const MobileEmulatorFrame({super.key, required this.child});

  @override
  State<MobileEmulatorFrame> createState() => _MobileEmulatorFrameState();
}

class _MobileEmulatorFrameState extends State<MobileEmulatorFrame> {
  DevicePreset _selectedDevice = DevicePreset.iphone15Pro;
  bool _showFrame = true;
  String _currentTime = '';
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _updateTime();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => _updateTime());
  }

  void _updateTime() {
    if (mounted) {
      setState(() {
        _currentTime = DateFormat('h:mm').format(DateTime.now());
      });
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  bool get _isMobilePlatform {
    if (kIsWeb) return false;
    return defaultTargetPlatform == TargetPlatform.android ||
        defaultTargetPlatform == TargetPlatform.iOS;
  }

  @override
  Widget build(BuildContext context) {
    if (_isMobilePlatform || !_showFrame) {
      return Scaffold(
        backgroundColor: AppColors.background,
        body: widget.child,
      );
    }

    final screenSize = MediaQuery.of(context).size;
    final isCompactScreen = screenSize.width < 500;

    if (isCompactScreen) {
      return Scaffold(
        backgroundColor: AppColors.background,
        body: widget.child,
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: SafeArea(
        child: Column(
          children: [
            _buildEmulatorHeader(),
            Expanded(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  physics: const BouncingScrollPhysics(),
                  child: _buildSmartphoneChassis(),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmulatorHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        border: Border(
          bottom: BorderSide(
            color: Colors.white.withValues(alpha: 0.1),
            width: 1,
          ),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: AppColors.primaryBlue.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.phone_android_rounded,
                  color: AppColors.primaryBlue,
                  size: 20,
                ),
              ),
              const SizedBox(width: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Mobile Device Emulator View',
                    style: GoogleFonts.inter(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                  Text(
                    'Interactive Mobile Interface Preview',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      color: Colors.white.withValues(alpha: 0.6),
                    ),
                  ),
                ],
              ),
            ],
          ),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFF334155),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<DevicePreset>(
                    value: _selectedDevice,
                    dropdownColor: const Color(0xFF1E293B),
                    icon: const Icon(
                      Icons.keyboard_arrow_down_rounded,
                      color: Colors.white,
                      size: 18,
                    ),
                    items: DevicePreset.values.map((preset) {
                      return DropdownMenuItem<DevicePreset>(
                        value: preset,
                        child: Text(
                          preset.name,
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                      );
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) {
                        setState(() => _selectedDevice = val);
                      }
                    },
                  ),
                ),
              ),
              const SizedBox(width: 10),
              IconButton(
                icon: Icon(
                  _showFrame ? Icons.fullscreen : Icons.fullscreen_exit,
                  color: Colors.white,
                  size: 22,
                ),
                tooltip: _showFrame ? 'Full Screen View' : 'Show Device Frame',
                onPressed: () {
                  setState(() => _showFrame = !_showFrame);
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSmartphoneChassis() {
    return Container(
      width: _selectedDevice.width + 24,
      height: _selectedDevice.height + 24,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF475569),
            Color(0xFF1E293B),
            Color(0xFF334155),
            Color(0xFF0F172A),
          ],
        ),
        borderRadius: BorderRadius.circular(_selectedDevice.cornerRadius + 12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.55),
            blurRadius: 35,
            spreadRadius: 4,
            offset: const Offset(0, 15),
          ),
          BoxShadow(
            color: AppColors.primaryBlue.withValues(alpha: 0.2),
            blurRadius: 25,
            spreadRadius: -5,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      padding: const EdgeInsets.all(12),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.black,
          borderRadius: BorderRadius.circular(_selectedDevice.cornerRadius),
          border: Border.all(color: Colors.black, width: 3),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(_selectedDevice.cornerRadius - 2),
          child: Stack(
            children: [
              Positioned.fill(
                child: Column(
                  children: [
                    _buildStatusBar(),
                    Expanded(child: widget.child),
                    _buildHomeIndicator(),
                  ],
                ),
              ),
              if (_selectedDevice.hasDynamicIsland)
                Positioned(
                  top: 10,
                  left: 0,
                  right: 0,
                  child: Center(
                    child: Container(
                      width: 105,
                      height: 28,
                      decoration: BoxDecoration(
                        color: Colors.black,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Padding(
                            padding: const EdgeInsets.only(left: 12.0),
                            child: Container(
                              width: 10,
                              height: 10,
                              decoration: const BoxDecoration(
                                color: Color(0xFF1E293B),
                                shape: BoxShape.circle,
                              ),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.only(right: 12.0),
                            child: Container(
                              width: 10,
                              height: 10,
                              decoration: BoxDecoration(
                                color: const Color(0xFF0F172A),
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: const Color(0xFF334155),
                                  width: 1.5,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                )
              else
                Positioned(
                  top: 12,
                  left: 0,
                  right: 0,
                  child: Center(
                    child: Container(
                      width: 14,
                      height: 14,
                      decoration: BoxDecoration(
                        color: Colors.black,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: const Color(0xFF334155),
                          width: 1.5,
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusBar() {
    return Container(
      color: Colors.white,
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: _selectedDevice.hasDynamicIsland ? 14 : 10,
        bottom: 6,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            _currentTime.isEmpty ? '9:41' : _currentTime,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: Colors.black,
            ),
          ),
          const Row(
            children: [
              Icon(
                Icons.signal_cellular_4_bar_rounded,
                size: 14,
                color: Colors.black,
              ),
              SizedBox(width: 4),
              Icon(Icons.wifi_rounded, size: 14, color: Colors.black),
              SizedBox(width: 4),
              Icon(Icons.battery_5_bar_rounded, size: 16, color: Colors.black),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHomeIndicator() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.only(bottom: 6, top: 4),
      child: Center(
        child: Container(
          width: 120,
          height: 4,
          decoration: BoxDecoration(
            color: Colors.black.withValues(alpha: 0.8),
            borderRadius: BorderRadius.circular(2),
          ),
        ),
      ),
    );
  }
}
