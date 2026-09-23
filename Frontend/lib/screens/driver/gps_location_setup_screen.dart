import 'dart:convert';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '/theme/app_theme.dart';

class GpsLocationSetupScreen extends StatefulWidget {
  const GpsLocationSetupScreen({super.key});

  @override
  State<GpsLocationSetupScreen> createState() => _GpsLocationSetupScreenState();
}

class _GpsLocationSetupScreenState extends State<GpsLocationSetupScreen> {
  final String _apiKey = 'pk.215498a4e99268cde5c380624d981804';

  final _locationController = TextEditingController();
  final _mapController = MapController();

  LatLng _currentCenter = const LatLng(
    33.5973319,
    73.0479039,
  ); // Default to Rawalpindi
  Timer? _debounceTimer;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    // Initial reverse geocode for default location
    _fetchAddress(_currentCenter);
  }

  @override
  void dispose() {
    _locationController.dispose();
    _mapController.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }

  // --- API Calls ---

  // Reverse Geocoding: LatLng -> Address
  Future<void> _fetchAddress(LatLng position) async {
    setState(() => _isLoading = true);
    try {
      final url =
          'https://us1.locationiq.com/v1/reverse?key=$_apiKey&lat=${position.latitude}&lon=${position.longitude}&format=json';
      final response = await http.get(Uri.parse(url));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (mounted) {
          setState(() {
            _locationController.text =
                data['display_name'] ?? 'Unknown location';
            _isLoading = false;
          });
        }
      } else {
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
      debugPrint('Error fetching address: $e');
    }
  }

  // Forward Geocoding: Address -> LatLng
  Future<void> _searchLocation(String query) async {
    if (query.trim().isEmpty) return;

    FocusScope.of(context).unfocus();
    setState(() => _isLoading = true);

    try {
      final url =
          'https://us1.locationiq.com/v1/search?key=$_apiKey&q=${Uri.encodeComponent(query)}&format=json';
      final response = await http.get(Uri.parse(url));

      if (response.statusCode == 200) {
        final data = json.decode(response.body) as List;
        if (data.isNotEmpty) {
          final firstResult = data[0];
          final lat = double.parse(firstResult['lat'].toString());
          final lon = double.parse(firstResult['lon'].toString());

          final newLocation = LatLng(lat, lon);

          if (mounted) {
            setState(() {
              _currentCenter = newLocation;
              _locationController.text = firstResult['display_name'] ?? query;
              _isLoading = false;
            });
            _mapController.move(newLocation, 14.0);
          }
        } else {
          if (mounted) setState(() => _isLoading = false);
          _showError('Location not found');
        }
      } else {
        if (mounted) setState(() => _isLoading = false);
        _showError('Failed to search location');
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
      debugPrint('Error searching location: $e');
    }
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message, style: GoogleFonts.inter(color: Colors.white)),
        backgroundColor: AppColors.error,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _onConfirmLocation() {
    FocusScope.of(context).unfocus();
    Navigator.of(context).pop(_locationController.text);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      resizeToAvoidBottomInset: false,
      body: Stack(
        children: [
          // FlutterMap Background
          Positioned.fill(
            child: FlutterMap(
              mapController: _mapController,
              options: MapOptions(
                initialCenter: _currentCenter,
                initialZoom: 14.0,
                onPositionChanged: (MapCamera camera, bool hasGesture) {
                  if (hasGesture) {
                    setState(() {
                      _currentCenter = camera.center;
                    });

                    // Debounce reverse geocoding
                    _debounceTimer?.cancel();
                    _debounceTimer = Timer(
                      const Duration(milliseconds: 800),
                      () {
                        _fetchAddress(_currentCenter);
                      },
                    );
                  }
                },
              ),
              children: [
                TileLayer(
                  urlTemplate:
                      'https://tiles.locationiq.com/v3/streets/r/{z}/{x}/{y}.png?key=$_apiKey',
                  userAgentPackageName: 'com.example.driver_app',
                ),
              ],
            ),
          ),

          // Center Pin (Fixed in center of screen)
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Tooltip
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.black87,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    'Drag the map to pinpoint your\nlocation',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      fontWeight: FontWeight.w500,
                      color: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                // Map Pin
                const Icon(
                  Icons.location_on,
                  size: 42,
                  color: AppColors.primaryBlue,
                ),
                // Shadow under pin
                Container(
                  width: 12,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ],
            ),
          ),

          // Back Button
          Positioned(
            top: MediaQuery.of(context).padding.top + 10,
            left: 10,
            child: IconButton(
              icon: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.1),
                      blurRadius: 4,
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.arrow_back,
                  color: Colors.black87,
                  size: 20,
                ),
              ),
              onPressed: () => Navigator.pop(context),
            ),
          ),

          // Loading Indicator Overlay
          if (_isLoading)
            Positioned(
              top: MediaQuery.of(context).padding.top + 20,
              right: 20,
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 4)],
                ),
                child: const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: AppColors.primaryBlue,
                  ),
                ),
              ),
            ),

          // Bottom Sheet Card
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(24),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.1),
                    blurRadius: 16,
                    offset: const Offset(0, -4),
                  ),
                ],
              ),
              child: SafeArea(
                top: false,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'CURRENT LOCATION',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textSecondary,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Location Input
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: AppColors.borderMedium,
                          width: 1.2,
                        ),
                      ),
                      child: TextField(
                        controller: _locationController,
                        style: GoogleFonts.inter(
                          fontSize: 13.5,
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w500,
                        ),
                        onSubmitted:
                            _searchLocation, // Geocode search when hitting Enter
                        decoration: InputDecoration(
                          hintText: 'Enter Location',
                          hintStyle: GoogleFonts.inter(
                            fontSize: 13.5,
                            color: AppColors.textMuted,
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 14,
                          ),
                          border: InputBorder.none,
                          suffixIcon: IconButton(
                            icon: const Icon(
                              Icons.search,
                              color: AppColors.primaryBlue,
                              size: 20,
                            ),
                            onPressed: () =>
                                _searchLocation(_locationController.text),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Use My Current Location
                    InkWell(
                      onTap: () {
                        // Dummy action since we don't have location permissions setup
                        _showError(
                          'Location permissions required for this feature.',
                        );
                      },
                      child: Row(
                        children: [
                          const Icon(
                            Icons.my_location_rounded,
                            size: 18,
                            color: AppColors.primaryBlue,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Use my current location',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: AppColors.primaryBlue,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 28),

                    // Confirm Button
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        onPressed: _onConfirmLocation,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryBlue,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'CONFIRM LOCATION & CONTINUE',
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Icon(Icons.arrow_forward_rounded, size: 16),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
