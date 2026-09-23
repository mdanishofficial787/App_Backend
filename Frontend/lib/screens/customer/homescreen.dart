import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:google_fonts/google_fonts.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:ride_and_serve/api_config.dart';
import 'package:ride_and_serve/screens/customer/signup_page.dart';
import 'package:ride_and_serve/screens/customer/login_page.dart';
import 'package:ride_and_serve/screens/customer/customer_ride_tracking_screen.dart';
import 'package:ride_and_serve/screens/customer/driver_details_screen.dart';
import 'package:ride_and_serve/widgets/customer/in_app_notification_banner.dart';

/// Entry point for quick testing.
/// If you're dropping this into an existing app, just use
/// `DriverOnboardingScreen` as a route/widget and remove `main()`.
void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Home Screen',
      theme: ThemeData(useMaterial3: true, fontFamily: 'Roboto'),
      home: const Homescreen(),
    );
  }
}

class Homescreen extends StatefulWidget {
  const Homescreen({super.key});

  static const Color primaryBlue = Color(0xFF1266F1);

  @override
  State<Homescreen> createState() => _HomescreenState();
}

class _HomescreenState extends State<Homescreen> {
  io.Socket? _socket;
  Map<String, dynamic>? _recentAcceptedRide;
  bool _showTopNotification = false;

  @override
  void initState() {
    super.initState();
    _initSocket();
  }

  @override
  void dispose() {
    _socket?.disconnect();
    _socket?.dispose();
    super.dispose();
  }

  void _openDriverDetails(Map<String, dynamic> ride) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => DriverDetailsScreen(rideData: ride),
      ),
    );
  }

  void _initSocket() {
    try {
      _socket = io.io(
        kBaseUrl,
        io.OptionBuilder()
            .setTransports(['websocket', 'polling'])
            .disableAutoConnect()
            .build(),
      );
      _socket?.connect();

      void onDriverAccepted(dynamic data) {
        if (!mounted || data == null) return;
        try {
          final map = data is Map<String, dynamic> ? data : jsonDecode(data.toString());
          final status = (map['status'] ?? map['rawStatus'] ?? '').toString().toUpperCase();
          if (status == 'ACCEPTED' || status == 'STARTED') {
            setState(() {
              _recentAcceptedRide = map;
              _showTopNotification = true;
            });

            final driver = map['driverDetails'] ?? map['driver'] ?? {};
            final driverName = driver['name'] ?? driver['Name'] ?? 'Your Driver';

            ScaffoldMessenger.of(context).hideCurrentSnackBar();
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Row(
                  children: [
                    const Icon(Icons.directions_car_rounded, color: Colors.white, size: 22),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Driver $driverName accepted your ride request!',
                        style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13),
                      ),
                    ),
                  ],
                ),
                action: SnackBarAction(
                  label: 'VIEW DRIVER',
                  textColor: const Color(0xFFFDE047),
                  onPressed: () => _openDriverDetails(map),
                ),
                backgroundColor: const Color(0xFF15803D),
                behavior: SnackBarBehavior.floating,
                duration: const Duration(seconds: 8),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            );
          }
        } catch (_) {}
      }

      const events = [
        'ride_accepted',
        'ride:accepted',
        'driver_accepted',
        'driver_assigned',
        'ride_status_updated',
      ];
      for (final ev in events) {
        _socket?.on(ev, onDriverAccepted);
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Stack(
          children: [
            Center(
              // Caps the width like a phone, and centers it on Chrome/desktop
              // so it never stretches full-bleed in a browser window.
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 480),
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Space for top banner if visible
                      if (_showTopNotification && _recentAcceptedRide != null)
                        const SizedBox(height: 70),

                      // Live Driver Notification Card (if accepted recently)
                      if (_recentAcceptedRide != null) ...[
                        _buildLiveDriverAlert(),
                        const SizedBox(height: 16),
                      ],

                      const SizedBox(height: 12),

                      // Illustration
                      ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: AspectRatio(
                          aspectRatio: 4 / 3,
                          child: Container(
                            color: const Color(0xFFF2F6FF),
                            child: Image.asset(
                              'assets/images/driver_onboarding.png',
                              fit: BoxFit.contain,
                              errorBuilder: (context, error, stackTrace) {
                                return const Center(
                                  child: Icon(
                                    Icons.directions_car_filled_rounded,
                                    size: 64,
                                    color: Color(0xFFB9CBEF),
                                  ),
                                );
                              },
                            ),
                          ),
                        ),
                      ),

                      const SizedBox(height: 36),

                      const Text(
                        'Drive and Earn on Your Schedule.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          height: 1.2,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Join our community of professional drivers and '
                        'manage your pick & drop services with ease.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 15,
                          color: const Color.fromARGB(255, 8, 8, 8),
                          height: 1.4,
                        ),
                      ),

                      const SizedBox(height: 32),

                      // REGISTER (filled button)
                      SizedBox(
                        height: 54,
                        child: ElevatedButton(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => const SignUpPage(),
                              ),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Homescreen.primaryBlue,
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                          child: const Text(
                            'REGISTER',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                      ),

                      const SizedBox(height: 14),

                      // LOG IN TO EXISTING ACCOUNT (outlined button)
                      SizedBox(
                        height: 54,
                        child: OutlinedButton(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => const LoginPage(),
                              ),
                            );
                          },
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Homescreen.primaryBlue,
                            side: const BorderSide(color: Homescreen.primaryBlue, width: 1.4),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                          child: const Text(
                            'LOG IN TO EXISTING ACCOUNT',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 0.3,
                            ),
                          ),
                        ),
                      ),

                      const SizedBox(height: 14),

                      // TRACK ACTIVE RIDE (soft filled button)
                      SizedBox(
                        height: 52,
                        child: TextButton.icon(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => CustomerRideTrackingScreen(
                                  initialRideId: _recentAcceptedRide?['rideId'] ??
                                      _recentAcceptedRide?['requestId'] ??
                                      _recentAcceptedRide?['_id'],
                                ),
                              ),
                            );
                          },
                          icon: const Icon(Icons.directions_car_filled_outlined,
                              size: 20, color: Homescreen.primaryBlue),
                          label: const Text(
                            'TRACK ACTIVE RIDE / STATUS',
                            style: TextStyle(
                              fontSize: 13.5,
                              fontWeight: FontWeight.w700,
                              color: Homescreen.primaryBlue,
                              letterSpacing: 0.4,
                            ),
                          ),
                          style: TextButton.styleFrom(
                            backgroundColor: const Color(0xFFEBF3FF),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                        ),
                      ),

                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),
            ),

            // Top In-App Notification Banner
            if (_showTopNotification && _recentAcceptedRide != null)
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                child: InAppNotificationBanner(
                  rideData: _recentAcceptedRide!,
                  onTap: () {
                    setState(() => _showTopNotification = false);
                    _openDriverDetails(_recentAcceptedRide!);
                  },
                  onDismiss: () {
                    setState(() => _showTopNotification = false);
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildLiveDriverAlert() {
    final driver = _recentAcceptedRide?['driverDetails'] ?? _recentAcceptedRide?['driver'] ?? {};
    final driverName = (driver['name'] ?? driver['Name'] ?? 'Your Driver').toString();
    final driverPhoto = (driver['profilePic'] ?? driver['driverPhoto'] ?? '').toString();
    final hasPhoto = driverPhoto.isNotEmpty && driverPhoto.startsWith('http');
    final vehicle = driver['vehicle'];
    String carText = 'Standard Vehicle';
    if (vehicle != null && vehicle is Map) {
      final make = vehicle['make'] ?? '';
      final model = vehicle['model'] ?? '';
      final plate = vehicle['registrationNumber'] ?? '';
      carText = '$make $model • $plate'.trim();
    }

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFEFF6FF),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFF93C5FD), width: 1.5),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1A1959F6),
            blurRadius: 8,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: const Color(0xFF1959F6),
                backgroundImage: hasPhoto ? NetworkImage(driverPhoto) : null,
                child: !hasPhoto
                    ? const Icon(Icons.person, color: Colors.white, size: 22)
                    : null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Driver Assigned & Accepted!',
                      style: GoogleFonts.inter(
                        fontWeight: FontWeight.w700,
                        fontSize: 13.5,
                        color: const Color(0xFF1E3A8A),
                      ),
                    ),
                    Text(
                      '$driverName ($carText)',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: const Color(0xFF3B82F6),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => _openDriverDetails(_recentAcceptedRide!),
                  icon: const Icon(Icons.person_pin_circle_rounded, size: 16),
                  label: const Text('DRIVER DETAILS', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11.5)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1959F6),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    elevation: 0,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => CustomerRideTrackingScreen(
                          initialRideId: _recentAcceptedRide?['rideId'] ??
                              _recentAcceptedRide?['requestId'] ??
                              _recentAcceptedRide?['_id'],
                        ),
                      ),
                    );
                  },
                  icon: const Icon(Icons.map_outlined, size: 16),
                  label: const Text('TRACK RIDE', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11.5)),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF1959F6),
                    side: const BorderSide(color: Color(0xFF93C5FD)),
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
