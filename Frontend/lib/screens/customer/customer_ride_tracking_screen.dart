import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '/api_config.dart';
import 'package:ride_and_serve/screens/customer/driver_details_screen.dart';

class CustomerRideTrackingScreen extends StatefulWidget {
  final String? initialRideId;
  final String? customerName;
  final String? customerPhone;

  const CustomerRideTrackingScreen({
    super.key,
    this.initialRideId,
    this.customerName,
    this.customerPhone,
  });

  @override
  State<CustomerRideTrackingScreen> createState() =>
      _CustomerRideTrackingScreenState();
}

class _CustomerRideTrackingScreenState extends State<CustomerRideTrackingScreen> {
  bool _isLoading = true;
  String? _errorMessage;
  Map<String, dynamic>? _rideData;
  io.Socket? _socket;
  io.Socket? _backendSocket;
  Timer? _pollingTimer;

  @override
  void initState() {
    super.initState();
    _fetchActiveRide();
    _initSocket();
    _startPolling();
  }

  @override
  void dispose() {
    _socket?.disconnect();
    _socket?.dispose();
    _backendSocket?.disconnect();
    _backendSocket?.dispose();
    _pollingTimer?.cancel();
    super.dispose();
  }

  void _startPolling() {
    _pollingTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      _fetchActiveRide(silent: true);
    });
  }

  void _initSocket() {
    try {
      // Connect to local backend socket
      _backendSocket = io.io(
        kBaseUrl,
        io.OptionBuilder()
            .setTransports(['websocket', 'polling'])
            .disableAutoConnect()
            .build(),
      );

      _backendSocket?.connect();
      _backendSocket?.onConnect((_) {
        debugPrint("Customer socket connected to $kBaseUrl");
      });

      void handleRideUpdate(dynamic data) {
        debugPrint("Customer socket received event: $data");
        if (!mounted || data == null) return;
        try {
          Map<String, dynamic> updateMap =
              data is Map<String, dynamic> ? data : jsonDecode(data.toString());

          final updatedRideId = updateMap['rideId'] ??
              updateMap['requestId'] ??
              updateMap['_id'];
          final currentRideId = _rideData?['_id'] ?? _rideData?['requestId'];
          final newStatus = (updateMap['status'] ?? updateMap['rawStatus'] ?? '').toString().toUpperCase();
          final isAcceptedEvent = newStatus == 'ACCEPTED' || newStatus == 'STARTED';

          // Update if it's the current ride, if no ride is tracked yet, or if it's an acceptance event
          if (currentRideId == null ||
              updatedRideId == null ||
              updatedRideId.toString() == currentRideId.toString() ||
              isAcceptedEvent) {
            final oldStatus = (_rideData?['status'] ?? '').toString().toUpperCase();
            
            setState(() {
              if (_rideData == null) {
                _rideData = updateMap;
              } else {
                _rideData = {
                  ..._rideData!,
                  ...updateMap,
                  if (updateMap['driverDetails'] != null)
                    'driverDetails': updateMap['driverDetails'],
                  if (updateMap['driver'] != null)
                    'driver': updateMap['driver'],
                };
              }
              _isLoading = false;
              _errorMessage = null;
            });

            // Show driver accepted notification dialog and snackbar
            if (isAcceptedEvent && oldStatus != 'ACCEPTED' && oldStatus != 'STARTED') {
              final driver = updateMap['driverDetails'] ?? updateMap['driver'] ?? {};
              _showDriverAcceptedDialog(driver);

              ScaffoldMessenger.of(context).hideCurrentSnackBar();
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Row(
                    children: [
                      const Icon(Icons.check_circle_rounded, color: Colors.white, size: 22),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          "Driver accepted your ride! Driver details are updated.",
                          style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                  backgroundColor: const Color(0xFF15803D),
                  behavior: SnackBarBehavior.floating,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10)),
                  duration: const Duration(seconds: 4),
                ),
              );
            }
          }
        } catch (e) {
          debugPrint("Error handling customer socket event: $e");
        }
      }

      final fareEvents = [
        'fare_updated',
        'fare-updated',
        'fareUpdate',
        'fare:updated',
        'fare:update',
        'fare_change',
        'fare-change',
        'ride_fare_updated',
        'ride_fare_update',
        'ride_updated',
        'ride:updated',
        'ride-updated',
        'ride_status_updated',
        'update_fare',
        'update-fare',
        'ride:fare:updated',
      ];

      final acceptEvents = [
        'ride_accepted',
        'ride:accepted',
        'driver_accepted',
        'driver_assigned',
        'ride_assigned',
        'ride:assigned',
        'ride_status_updated',
        'ride_updated',
        'ride:updated',
      ];

      for (final ev in fareEvents) {
        _backendSocket?.on(ev, handleRideUpdate);
      }
      for (final ev in acceptEvents) {
        _backendSocket?.on(ev, handleRideUpdate);
      }

      // Also connect to dispatch server if separate
      if (kDispatchBaseUrl != kBaseUrl) {
        _socket = io.io(
          kDispatchBaseUrl,
          io.OptionBuilder()
              .setTransports(['websocket', 'polling'])
              .disableAutoConnect()
              .build(),
        );
        _socket?.connect();
        for (final ev in fareEvents) {
          _socket?.on(ev, handleRideUpdate);
        }
        for (final ev in acceptEvents) {
          _socket?.on(ev, handleRideUpdate);
        }
      }
    } catch (e) {
      debugPrint("Socket init error: $e");
    }
  }

  /// Interactive modal dialog displaying driver information immediately when ride is accepted
  void _showDriverAcceptedDialog(Map<dynamic, dynamic> driverData) {
    if (!mounted) return;

    final name = driverData['name'] ?? driverData['Name'] ?? 'Your Driver';
    final phone = driverData['phone'] ?? driverData['PhoneNumber'] ?? driverData['rawPhone'] ?? '';
    final photo = driverData['profilePic'] ?? driverData['driverPhoto'] ?? '';
    final hasPhoto = photo.toString().isNotEmpty && photo.toString().startsWith('http');
    final vehicle = driverData['vehicle'];

    String vehicleDesc = 'Standard Vehicle';
    if (vehicle != null && vehicle is Map) {
      final make = vehicle['make'] ?? '';
      final model = vehicle['model'] ?? '';
      final color = vehicle['color'] ?? '';
      final plate = vehicle['registrationNumber'] ?? '';
      vehicleDesc = '$make $model ${color.isNotEmpty ? "($color)" : ""} • $plate'.trim();
    }

    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        child: Container(
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header Icon
              Container(
                width: 64,
                height: 64,
                decoration: const BoxDecoration(
                  color: Color(0xFFDCFCE7),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check_circle_rounded, color: Color(0xFF15803D), size: 36),
              ),
              const SizedBox(height: 14),

              Text(
                'Ride Accepted!',
                style: GoogleFonts.inter(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'A driver has accepted your ride request',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: const Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 18),

              // Driver Card Inside Dialog
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 28,
                      backgroundColor: const Color(0xFFE2E8F0),
                      backgroundImage: hasPhoto ? NetworkImage(photo.toString()) : null,
                      child: !hasPhoto
                          ? const Icon(Icons.person, size: 30, color: Color(0xFF64748B))
                          : null,
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            name.toString(),
                            style: GoogleFonts.inter(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF0F172A),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Row(
                            children: [
                              const Icon(Icons.star_rounded, color: Color(0xFFF59E0B), size: 16),
                              const SizedBox(width: 4),
                              Text(
                                '4.9 • Verified Driver',
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: const Color(0xFFD97706),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            vehicleDesc,
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: const Color(0xFF475569),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // View Full Profile Button
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.of(ctx).pop();
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => DriverDetailsScreen(
                          rideData: _rideData ?? {'driverDetails': driverData},
                        ),
                      ),
                    );
                  },
                  icon: const Icon(Icons.person_pin_rounded, size: 20),
                  label: Text(
                    'VIEW ALL DRIVER DETAILS',
                    style: GoogleFonts.inter(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.5,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0878F9),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 1,
                  ),
                ),
              ),
              const SizedBox(height: 10),

              // Action Buttons
              Row(
                children: [
                  if (phone.toString().isNotEmpty) ...[
                    Expanded(
                      child: SizedBox(
                        height: 44,
                        child: OutlinedButton.icon(
                          onPressed: () {
                            Clipboard.setData(ClipboardData(text: phone.toString()));
                            Navigator.of(ctx).pop();
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Driver number copied: $phone'),
                                backgroundColor: const Color(0xFF0878F9),
                                behavior: SnackBarBehavior.floating,
                              ),
                            );
                          },
                          icon: const Icon(Icons.call, size: 16, color: Color(0xFF15803D)),
                          label: const Text('Call Driver', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5, color: Color(0xFF15803D))),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Color(0xFF86EFAC)),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                  ],
                  Expanded(
                    child: SizedBox(
                      height: 44,
                      child: OutlinedButton(
                        onPressed: () => Navigator.of(ctx).pop(),
                        style: OutlinedButton.styleFrom(
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          side: const BorderSide(color: Color(0xFFCBD5E1)),
                        ),
                        child: Text(
                          'View Live Map',
                          style: GoogleFonts.inter(
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF334155),
                            fontSize: 12.5,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _fetchActiveRide({bool silent = false}) async {
    if (!silent) {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });
    }

    try {
      final rideId = widget.initialRideId ?? _rideData?['_id'];
      http.Response? response;

      // 1. If rideId known, fetch directly
      if (rideId != null && rideId.isNotEmpty) {
        response = await http
            .get(Uri.parse('$kBaseUrl/api/rides/$rideId'))
            .timeout(const Duration(seconds: 5));
      }

      // 2. Otherwise fetch latest active customer ride
      if (response == null || response.statusCode != 200) {
        final queryParams = <String, String>{};
        if (widget.customerName != null) {
          queryParams['customerName'] = widget.customerName!;
        }
        if (widget.customerPhone != null) {
          queryParams['phone'] = widget.customerPhone!;
        }
        final uri = Uri.parse('$kBaseUrl/api/rides/active/customer')
            .replace(queryParameters: queryParams.isNotEmpty ? queryParams : null);
        response = await http.get(uri).timeout(const Duration(seconds: 5));
      }

      // 3. Fallback to dispatcher server
      if (response.statusCode != 200 && kDispatchBaseUrl != kBaseUrl) {
        final fallbackUri = Uri.parse('$kDispatchBaseUrl/api/requests');
        final fbRes = await http.get(fallbackUri).timeout(const Duration(seconds: 5));
        if (fbRes.statusCode == 200) {
          final data = jsonDecode(fbRes.body);
          final list = data is List
              ? data
              : (data['requests'] ?? data['data'] ?? []);
          if (list is List && list.isNotEmpty) {
            final latest = list.firstWhere(
              (item) => item['status'] == 'ACCEPTED' || item['status'] == 'ASSIGNED',
              orElse: () => list.first,
            );
            if (mounted) {
              final oldStatus = (_rideData?['status'] ?? '').toString().toUpperCase();
              final newStatus = (latest['status'] ?? latest['rawStatus'] ?? '').toString().toUpperCase();
              final isAccepted = newStatus == 'ACCEPTED' || newStatus == 'STARTED';

              setState(() {
                _rideData = latest is Map<String, dynamic> ? latest : null;
                _isLoading = false;
                _errorMessage = null;
              });

              if (isAccepted && oldStatus != 'ACCEPTED' && oldStatus != 'STARTED') {
                final driver = latest['driverDetails'] ?? latest['driver'] ?? {};
                _showDriverAcceptedDialog(driver);
              }

              return;
            }
          }
        }
      }

      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);
        final data = json['data'] ?? json['ride'] ?? json;
        if (mounted && data is Map<String, dynamic>) {
          final oldStatus = (_rideData?['status'] ?? '').toString().toUpperCase();
          final newStatus = (data['status'] ?? data['rawStatus'] ?? '').toString().toUpperCase();
          final isAccepted = newStatus == 'ACCEPTED' || newStatus == 'STARTED';

          setState(() {
            _rideData = data;
            _isLoading = false;
            _errorMessage = null;
          });

          if (isAccepted && oldStatus != 'ACCEPTED' && oldStatus != 'STARTED') {
            final driver = data['driverDetails'] ?? data['driver'] ?? {};
            _showDriverAcceptedDialog(driver);
          }
        }
      } else {
        if (!silent && mounted) {
          setState(() {
            _isLoading = false;
            _errorMessage = "No active ride found. Book a ride to track.";
          });
        }
      }
    } catch (e) {
      debugPrint("Error fetching active ride: $e");
      if (!silent && mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = "Could not load ride details. Please retry.";
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'Active Ride Status',
          style: GoogleFonts.inter(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: const Color(0xFF0F172A),
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF0F172A)),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Color(0xFF0878F9)),
            onPressed: () => _fetchActiveRide(),
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: SafeArea(
        child: _isLoading
            ? const Center(
                child: CircularProgressIndicator(color: Color(0xFF0878F9)),
              )
            : _errorMessage != null && _rideData == null
                ? _buildErrorView()
                : _buildRideDetailsView(),
      ),
    );
  }

  Widget _buildErrorView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                color: Color(0xFFF1F5F9),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.directions_car_outlined,
                size: 64,
                color: Color(0xFF94A3B8),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'No Active Ride',
              style: GoogleFonts.inter(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: const Color(0xFF1E293B),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _errorMessage ?? 'You do not have any active ride right now.',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF64748B)),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => _fetchActiveRide(),
              icon: const Icon(Icons.refresh),
              label: const Text('Check Again'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0878F9),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRideDetailsView() {
    final ride = _rideData ?? {};
    final status = (ride['status'] ?? ride['rawStatus'] ?? 'PENDING')
        .toString()
        .toUpperCase();
    final isAccepted = status == 'ACCEPTED' || status == 'STARTED';
    String rawFare = (ride['fareFormatted'] ?? ride['fare'] ?? '').toString().trim();
    String fare = 'Rs. 9,500';
    if (rawFare.isNotEmpty) {
      if (!rawFare.toLowerCase().startsWith('rs') && !rawFare.startsWith('PKR')) {
        final numVal = num.tryParse(rawFare.replaceAll(RegExp(r'[^0-9.]'), ''));
        if (numVal != null) {
          fare = 'Rs. ${numVal.toInt().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}';
        } else {
          fare = 'Rs. $rawFare';
        }
      } else {
        fare = rawFare;
      }
    }
    final pickup = ride['pickupLocation'] ?? 'Pickup location';
    final drop = ride['dropLocation'] ?? ride['dropoffLocation'] ?? 'Destination';
    final date = ride['date'] ?? '';
    final time = ride['timeToLeave'] ?? '';

    // Driver details
    final driver = ride['driverDetails'] ?? ride['driver'] ?? {};
    final driverName = driver['name'] ?? driver['Name'] ?? (isAccepted ? 'Assigned Driver' : null);
    final driverPhone = driver['phone'] ?? driver['PhoneNumber'] ?? driver['rawPhone'];
    final driverPhoto = driver['profilePic'] ?? driver['driverPhoto'];
    final driverRef = driver['driverReferenceId'] ?? '';
    final vehicle = driver['vehicle'];

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      physics: const BouncingScrollPhysics(),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 1. Status Banner
              _buildStatusHeader(status, isAccepted),
              const SizedBox(height: 16),

              // 2. Driver Details Card (Prominently displayed when accepted)
              if (isAccepted && driverName != null) ...[
                _buildDriverCard(
                  driverName: driverName,
                  driverPhone: driverPhone,
                  driverPhoto: driverPhoto,
                  driverRef: driverRef,
                  vehicle: vehicle,
                ),
                const SizedBox(height: 16),
              ] else if (!isAccepted) ...[
                _buildWaitingForDriverCard(),
                const SizedBox(height: 16),
              ],

              // 3. Route & Locations Card
              _buildRouteCard(pickup: pickup, drop: drop, date: date, time: time),
              const SizedBox(height: 16),

              // 4. Price / Fare Card
              _buildFareCard(fare: fare),
              const SizedBox(height: 24),

              // 5. Action Buttons
              if (isAccepted && driverPhone != null && driverPhone.toString().isNotEmpty)
                _buildContactActions(driverPhone.toString(), driverName ?? 'Driver'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusHeader(String status, bool isAccepted) {
    Color bg;
    Color border;
    Color text;
    IconData icon;
    String title;
    String sub;

    switch (status) {
      case 'ACCEPTED':
        bg = const Color(0xFFEFF6FF);
        border = const Color(0xFFBFDBFE);
        text = const Color(0xFF1D4ED8);
        icon = Icons.verified_user_rounded;
        title = 'Ride Accepted!';
        sub = 'Your driver has accepted and will pick you up shortly.';
        break;
      case 'STARTED':
        bg = const Color(0xFFECFDF5);
        border = const Color(0xFFA7F3D0);
        text = const Color(0xFF047857);
        icon = Icons.directions_car_rounded;
        title = 'Trip In Progress';
        sub = 'You are on your way to your destination.';
        break;
      case 'COMPLETED':
        bg = const Color(0xFFF0FDF4);
        border = const Color(0xFFBBF7D0);
        text = const Color(0xFF15803D);
        icon = Icons.check_circle_rounded;
        title = 'Trip Completed';
        sub = 'Thank you for riding with Ride & Serve!';
        break;
      default:
        bg = const Color(0xFFFFFBEB);
        border = const Color(0xFFFDE68A);
        text = const Color(0xFFB45309);
        icon = Icons.schedule_rounded;
        title = 'Finding Nearby Driver...';
        sub = 'Your request has been dispatched to drivers.';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: border, width: 1.5),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: border.withValues(alpha: 0.5),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Icon(icon, color: text, size: 26),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: text,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  sub,
                  style: GoogleFonts.inter(
                    fontSize: 12.5,
                    color: const Color(0xFF475569),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDriverCard({
    required String driverName,
    dynamic driverPhone,
    dynamic driverPhoto,
    String? driverRef,
    dynamic vehicle,
  }) {
    final photoUrl = driverPhoto?.toString() ?? '';
    final hasPhoto = photoUrl.isNotEmpty && photoUrl.startsWith('http');
    final phoneStr = driverPhone?.toString() ?? 'N/A';

    String? vehicleText;
    if (vehicle != null && vehicle is Map) {
      final make = vehicle['make'] ?? '';
      final model = vehicle['model'] ?? '';
      final color = vehicle['color'] ?? '';
      final plate = vehicle['registrationNumber'] ?? '';
      vehicleText = '$make $model ${color.isNotEmpty ? '($color)' : ''} • $plate'.trim();
    }

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                'YOUR DRIVER',
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.2,
                  color: const Color(0xFF0878F9),
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.star, size: 14, color: Color(0xFFD97706)),
                    const SizedBox(width: 4),
                    Text(
                      '4.9',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF92400E),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Driver Photo + Name + Phone row
          Row(
            children: [
              // Driver Profile Picture
              ClipRRect(
                borderRadius: BorderRadius.circular(35),
                child: Container(
                  width: 70,
                  height: 70,
                  color: const Color(0xFFE2E8F0),
                  child: hasPhoto
                      ? Image.network(
                          photoUrl,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => const Icon(
                            Icons.person,
                            size: 40,
                            color: Color(0xFF94A3B8),
                          ),
                        )
                      : const Icon(
                          Icons.person,
                          size: 40,
                          color: Color(0xFF94A3B8),
                        ),
                ),
              ),
              const SizedBox(width: 16),

              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      driverName,
                      style: GoogleFonts.inter(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF0F172A),
                      ),
                    ),
                    if (driverRef != null && driverRef.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        'ID: $driverRef',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: const Color(0xFF64748B),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(Icons.phone, size: 14, color: Color(0xFF0878F9)),
                        const SizedBox(width: 6),
                        Text(
                          phoneStr,
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF1E293B),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),

          // Vehicle info if available
          if (vehicleText != null && vehicleText.isNotEmpty) ...[
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Divider(height: 1, color: Color(0xFFF1F5F9)),
            ),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(
                    Icons.directions_car,
                    size: 20,
                    color: Color(0xFF475569),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Assigned Vehicle',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF64748B),
                        ),
                      ),
                      Text(
                        vehicleText,
                        style: GoogleFonts.inter(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF1E293B),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            height: 44,
            child: ElevatedButton.icon(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => DriverDetailsScreen(rideData: _rideData ?? {}),
                  ),
                );
              },
              icon: const Icon(Icons.person_pin_rounded, size: 18),
              label: Text(
                'VIEW FULL DRIVER & VEHICLE PROFILE',
                style: GoogleFonts.inter(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.4,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0878F9),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                elevation: 0,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWaitingForDriverCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          const SizedBox(
            width: 28,
            height: 28,
            child: CircularProgressIndicator(
              strokeWidth: 2.5,
              color: Color(0xFF0878F9),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Waiting for Driver Acceptance',
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF1E293B),
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  'When a driver accepts your ride, their profile picture, phone number, and vehicle info will show here.',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: const Color(0xFF64748B),
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRouteCard({
    required String pickup,
    required String drop,
    required String date,
    required String time,
  }) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'TRIP ROUTE',
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.2,
              color: const Color(0xFF64748B),
            ),
          ),
          const SizedBox(height: 14),

          // Pickup
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                margin: const EdgeInsets.only(top: 2),
                width: 14,
                height: 14,
                decoration: const BoxDecoration(
                  color: Color(0xFF16A34A),
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Pickup Location',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: const Color(0xFF94A3B8),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      pickup,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF0F172A),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          Padding(
            padding: const EdgeInsets.only(left: 6),
            child: Container(
              height: 20,
              width: 2,
              color: const Color(0xFFCBD5E1),
            ),
          ),

          // Dropoff
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                margin: const EdgeInsets.only(top: 2),
                width: 14,
                height: 14,
                decoration: const BoxDecoration(
                  color: Color(0xFFDC2626),
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Drop-off Location',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: const Color(0xFF94A3B8),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      drop,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF0F172A),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          if (date.isNotEmpty || time.isNotEmpty) ...[
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Divider(height: 1, color: Color(0xFFF1F5F9)),
            ),
            Row(
              children: [
                const Icon(Icons.event_outlined, size: 16, color: Color(0xFF64748B)),
                const SizedBox(width: 8),
                Text(
                  'Scheduled: $date ${time.isNotEmpty ? "at $time" : ""}',
                  style: GoogleFonts.inter(
                    fontSize: 12.5,
                    color: const Color(0xFF475569),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildFareCard({required String fare}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFFDCFCE7),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.account_balance_wallet_outlined,
              color: Color(0xFF16A34A),
              size: 24,
            ),
          ),
          const SizedBox(width: 14),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Ride Price',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: const Color(0xFF64748B),
                  fontWeight: FontWeight.w600,
                ),
              ),
              Text(
                'Fixed Fare',
                style: GoogleFonts.inter(
                  fontSize: 11,
                  color: const Color(0xFF94A3B8),
                ),
              ),
            ],
          ),
          const Spacer(),
          Text(
            fare,
            style: GoogleFonts.inter(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: const Color(0xFF15803D),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContactActions(String phone, String name) {
    return Row(
      children: [
        // Call button
        Expanded(
          child: SizedBox(
            height: 50,
            child: ElevatedButton.icon(
              onPressed: () {
                Clipboard.setData(ClipboardData(text: phone));
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Driver number copied: $phone'),
                    backgroundColor: const Color(0xFF0878F9),
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              },
              icon: const Icon(Icons.call, size: 18),
              label: const Text(
                'CALL DRIVER',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0878F9),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                elevation: 0,
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),

        // Copy / Info button
        SizedBox(
          height: 50,
          child: OutlinedButton.icon(
            onPressed: () {
              Clipboard.setData(ClipboardData(text: phone));
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Driver phone ($phone) copied to clipboard'),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            },
            icon: const Icon(Icons.copy, size: 18),
            label: const Text('COPY', style: TextStyle(fontWeight: FontWeight.w700)),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFF0878F9),
              side: const BorderSide(color: Color(0xFF0878F9), width: 1.4),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
