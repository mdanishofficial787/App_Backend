import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

class DriverDetailsScreen extends StatelessWidget {
  final Map<String, dynamic> rideData;

  const DriverDetailsScreen({super.key, required this.rideData});

  @override
  Widget build(BuildContext context) {
    // 1. Resolve Driver Info
    final driver = rideData['driverDetails'] ?? rideData['driver'] ?? {};
    final driverName = (driver['name'] ?? driver['Name'] ?? 'Assigned Driver').toString();
    final driverPhone = (driver['phone'] ?? driver['PhoneNumber'] ?? driver['rawPhone'] ?? '').toString();
    final driverPhoto = (driver['profilePic'] ?? driver['driverPhoto'] ?? '').toString();
    final driverRefId = (driver['driverReferenceId'] ?? driver['driverId'] ?? 'DRV-1049').toString();
    final driverRating = (driver['rating'] ?? 4.9).toString();
    final totalRides = (driver['totalRides'] ?? 148).toString();
    final hasPhoto = driverPhoto.isNotEmpty && driverPhoto.startsWith('http');

    // 2. Resolve Vehicle Info
    final vehicle = driver['vehicle'] ?? rideData['vehicle'] ?? {};
    final vehicleMake = (vehicle['make'] ?? vehicle['vehicleMake'] ?? 'Toyota').toString();
    final vehicleModel = (vehicle['model'] ?? vehicle['vehicleModel'] ?? 'Corolla').toString();
    final vehicleVariant = (vehicle['variant'] ?? 'GLi').toString();
    final vehicleColor = (vehicle['color'] ?? vehicle['vehicleColor'] ?? 'White').toString();
    final vehiclePlate = (vehicle['registrationNumber'] ?? 'LEA-2024').toString();
    final vehicleSeats = (vehicle['numberOfSeats'] ?? '4').toString();
    final vehiclePhoto = (vehicle['frontView'] ?? '').toString();
    final hasVehiclePhoto = vehiclePhoto.isNotEmpty && vehiclePhoto.startsWith('http');

    // 3. Resolve Trip & Fare Info
    final pickup = (rideData['pickupLocation'] ?? 'Pickup Location').toString();
    final dropoff = (rideData['dropLocation'] ?? rideData['dropoffLocation'] ?? 'Destination Location').toString();
    final date = (rideData['date'] ?? '').toString();
    final time = (rideData['timeToLeave'] ?? rideData['scheduledTime'] ?? '').toString();
    final rawFare = (rideData['fareFormatted'] ?? rideData['fare'] ?? 'Rs. 9,500').toString();
    final status = (rideData['status'] ?? rideData['rawStatus'] ?? 'ACCEPTED').toString().toUpperCase();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        title: Text(
          'Driver & Vehicle Details',
          style: GoogleFonts.inter(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: const Color(0xFF0F172A),
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF0F172A)),
          onPressed: () => Navigator.of(context).pop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined, color: Color(0xFF0878F9)),
            tooltip: 'Share Ride Details',
            onPressed: () {
              Clipboard.setData(
                ClipboardData(
                  text: 'Ride & Serve Trip Update:\nDriver: $driverName ($driverPhone)\n'
                      'Vehicle: $vehicleMake $vehicleModel ($vehicleColor) • $vehiclePlate\n'
                      'Pickup: $pickup\nDestination: $dropoff',
                ),
              );
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: const Text('Trip and Driver details copied to clipboard!'),
                  backgroundColor: const Color(0xFF15803D),
                  behavior: SnackBarBehavior.floating,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              );
            },
          ),
        ],
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 500),
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
              physics: const BouncingScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // 1. Status Banner
                  _buildStatusHeader(status),
                  const SizedBox(height: 16),

                  // 2. Driver Profile Card
                  _buildDriverProfileCard(
                    context: context,
                    name: driverName,
                    phone: driverPhone,
                    photo: driverPhoto,
                    hasPhoto: hasPhoto,
                    refId: driverRefId,
                    rating: driverRating,
                    totalRides: totalRides,
                  ),
                  const SizedBox(height: 16),

                  // 3. Quick Action Buttons (Call, WhatsApp, Copy)
                  _buildQuickActionButtons(context, driverPhone, driverName),
                  const SizedBox(height: 16),

                  // 4. Vehicle Specifications Card
                  _buildVehicleCard(
                    make: vehicleMake,
                    model: vehicleModel,
                    variant: vehicleVariant,
                    color: vehicleColor,
                    plate: vehiclePlate,
                    seats: vehicleSeats,
                    photo: vehiclePhoto,
                    hasPhoto: hasVehiclePhoto,
                  ),
                  const SizedBox(height: 16),

                  // 5. Verification & Trust Assurance
                  _buildTrustBadgesCard(),
                  const SizedBox(height: 16),

                  // 6. Trip Summary & Route Card
                  _buildTripCard(
                    pickup: pickup,
                    dropoff: dropoff,
                    date: date,
                    time: time,
                    fare: rawFare,
                  ),
                  const SizedBox(height: 16),

                  // 7. Live Trip Progress Tracker
                  _buildTripProgressTracker(status),
                  const SizedBox(height: 24),

                  // 8. Return / Close Action Button
                  SizedBox(
                    height: 52,
                    child: ElevatedButton(
                      onPressed: () => Navigator.of(context).pop(),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0878F9),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                        elevation: 2,
                      ),
                      child: Text(
                        'BACK TO MAP & TRACKING',
                        style: GoogleFonts.inter(
                          fontSize: 14.5,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  // ─── STATUS HEADER BANNER ──────────────────────────────────────────
  Widget _buildStatusHeader(String status) {
    final isAccepted = status == 'ACCEPTED';
    final isStarted = status == 'STARTED';

    final Color bg = isAccepted
        ? const Color(0xFFEFF6FF)
        : (isStarted ? const Color(0xFFECFDF5) : const Color(0xFFFFFBEB));
    final Color border = isAccepted
        ? const Color(0xFFBFDBFE)
        : (isStarted ? const Color(0xFFA7F3D0) : const Color(0xFFFDE68A));
    final Color text = isAccepted
        ? const Color(0xFF1D4ED8)
        : (isStarted ? const Color(0xFF047857) : const Color(0xFFB45309));
    final IconData icon = isAccepted
        ? Icons.check_circle_rounded
        : (isStarted ? Icons.directions_car_rounded : Icons.schedule_rounded);
    final String title = isAccepted
        ? 'Driver Assigned & Ride Accepted!'
        : (isStarted ? 'Trip In Progress' : 'Awaiting Driver');
    final String subtitle = isAccepted
        ? 'Your driver is preparing for pickup and will reach your location shortly.'
        : (isStarted
            ? 'You are safely on your way to your destination.'
            : 'Driver information is being updated in real-time.');

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: border, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: text.withValues(alpha: 0.08),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: border.withValues(alpha: 0.6),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Icon(icon, color: text, size: 28),
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
                    fontWeight: FontWeight.w800,
                    color: text,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: GoogleFonts.inter(
                    fontSize: 12.5,
                    color: const Color(0xFF475569),
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ─── DRIVER PROFILE CARD ───────────────────────────────────────────
  Widget _buildDriverProfileCard({
    required BuildContext context,
    required String name,
    required String phone,
    required String photo,
    required bool hasPhoto,
    required String refId,
    required String rating,
    required String totalRides,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Avatar with verified badge
              Stack(
                children: [
                  Container(
                    width: 76,
                    height: 76,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFF0878F9), width: 3),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF0878F9).withValues(alpha: 0.2),
                          blurRadius: 8,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: CircleAvatar(
                      radius: 36,
                      backgroundColor: const Color(0xFFEFF6FF),
                      backgroundImage: hasPhoto ? NetworkImage(photo) : null,
                      child: !hasPhoto
                          ? const Icon(Icons.person, size: 42, color: Color(0xFF0878F9))
                          : null,
                    ),
                  ),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: Color(0xFF15803D),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.verified, size: 14, color: Colors.white),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 16),

              // Name, Badge & Rating
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            name,
                            style: GoogleFonts.inter(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFF0F172A),
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEFF6FF),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFFBFDBFE)),
                          ),
                          child: Text(
                            refId,
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF1D4ED8),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),

                    // Rating and total completed trips
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEF3C7),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.star_rounded, size: 15, color: Color(0xFFD97706)),
                              const SizedBox(width: 3),
                              Text(
                                rating,
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: const Color(0xFFB45309),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '•  $totalRides Rides Completed',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: const Color(0xFF64748B),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),

                    // Phone text
                    if (phone.isNotEmpty)
                      Text(
                        phone,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF334155),
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ─── QUICK ACTION BUTTONS (CALL / WHATSAPP / COPY) ─────────────────
  Widget _buildQuickActionButtons(
      BuildContext context, String phone, String driverName) {
    return Row(
      children: [
        // 1. Call Button
        Expanded(
          flex: 4,
          child: SizedBox(
            height: 48,
            child: ElevatedButton.icon(
              onPressed: () {
                if (phone.isEmpty) return;
                Clipboard.setData(ClipboardData(text: phone));
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Calling $driverName: $phone (Copied to dialer)'),
                    backgroundColor: const Color(0xFF0878F9),
                    behavior: SnackBarBehavior.floating,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                );
              },
              icon: const Icon(Icons.call_rounded, size: 18),
              label: Text(
                'Call Driver',
                style: GoogleFonts.inter(fontSize: 13.5, fontWeight: FontWeight.w700),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF15803D),
                foregroundColor: Colors.white,
                elevation: 1,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),

        // 2. Message / WhatsApp Button
        Expanded(
          flex: 4,
          child: SizedBox(
            height: 48,
            child: ElevatedButton.icon(
              onPressed: () {
                if (phone.isEmpty) return;
                Clipboard.setData(ClipboardData(text: phone));
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Messaging $driverName: $phone'),
                    backgroundColor: const Color(0xFF0878F9),
                    behavior: SnackBarBehavior.floating,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                );
              },
              icon: const Icon(Icons.chat_bubble_outline_rounded, size: 18),
              label: Text(
                'Message',
                style: GoogleFonts.inter(fontSize: 13.5, fontWeight: FontWeight.w700),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0878F9),
                foregroundColor: Colors.white,
                elevation: 1,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),

        // 3. Copy Phone
        Container(
          height: 48,
          width: 48,
          decoration: BoxDecoration(
            color: const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFCBD5E1)),
          ),
          child: IconButton(
            icon: const Icon(Icons.copy_rounded, size: 18, color: Color(0xFF475569)),
            tooltip: 'Copy Number',
            onPressed: () {
              if (phone.isNotEmpty) {
                Clipboard.setData(ClipboardData(text: phone));
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Phone number copied: $phone'),
                    backgroundColor: const Color(0xFF334155),
                    behavior: SnackBarBehavior.floating,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                );
              }
            },
          ),
        ),
      ],
    );
  }

  // ─── VEHICLE SPECIFICATIONS CARD ───────────────────────────────────
  Widget _buildVehicleCard({
    required String make,
    required String model,
    required String variant,
    required String color,
    required String plate,
    required String seats,
    required String photo,
    required bool hasPhoto,
  }) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.directions_car_rounded, color: Color(0xFF0878F9), size: 18),
              ),
              const SizedBox(width: 10),
              Text(
                'VEHICLE DETAILS',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.1,
                  color: const Color(0xFF0878F9),
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFDCFCE7),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  'Air Conditioned',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF15803D),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Main vehicle name & plate highlight
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '$make $model ${variant.isNotEmpty ? variant : ""}'.trim(),
                      style: GoogleFonts.inter(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Color: $color  •  $seats Passenger Seats',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: const Color(0xFF64748B),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),

              // License Plate Display in metallic style
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F172A),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFFACC15), width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.15),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Text(
                      'PAKISTAN',
                      style: GoogleFonts.inter(
                        fontSize: 8,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.2,
                        color: const Color(0xFF94A3B8),
                      ),
                    ),
                    Text(
                      plate.toUpperCase(),
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.5,
                        color: const Color(0xFFF8FAFC),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          if (hasPhoto) ...[
            const SizedBox(height: 14),
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.network(
                photo,
                height: 140,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => const SizedBox.shrink(),
              ),
            ),
          ],
        ],
      ),
    );
  }

  // ─── TRUST & VERIFICATION BADGES ───────────────────────────────────
  Widget _buildTrustBadgesCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF0FDF4),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFBBF7D0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.shield_rounded, color: Color(0xFF15803D), size: 18),
              const SizedBox(width: 8),
              Text(
                'Verified & Safe Ride Guarantee',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF166534),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildTrustItem(Icons.badge_outlined, 'CNIC Verified'),
              _buildTrustItem(Icons.drive_eta_outlined, 'License Valid'),
              _buildTrustItem(Icons.security_outlined, 'Background Pass'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTrustItem(IconData icon, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: const Color(0xFF15803D)),
        const SizedBox(width: 4),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 11.5,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF166534),
          ),
        ),
      ],
    );
  }

  // ─── TRIP SUMMARY & ROUTE CARD ────────────────────────────────────
  Widget _buildTripCard({
    required String pickup,
    required String dropoff,
    required String date,
    required String time,
    required String fare,
  }) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 14,
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
                'TRIP SUMMARY',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.1,
                  color: const Color(0xFF0878F9),
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0FDF4),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFF86EFAC)),
                ),
                child: Text(
                  fare,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF15803D),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Pickup Row
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                margin: const EdgeInsets.only(top: 2),
                width: 12,
                height: 12,
                decoration: const BoxDecoration(
                  color: Color(0xFF15803D),
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Pickup Location',
                      style: GoogleFonts.inter(
                        fontSize: 11.5,
                        color: const Color(0xFF64748B),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    Text(
                      pickup,
                      style: GoogleFonts.inter(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF1E293B),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          // Dotted line separator
          Container(
            margin: const EdgeInsets.only(left: 5, top: 4, bottom: 4),
            height: 20,
            width: 2,
            color: const Color(0xFFCBD5E1),
          ),

          // Dropoff Row
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                margin: const EdgeInsets.only(top: 2),
                width: 12,
                height: 12,
                decoration: const BoxDecoration(
                  color: Color(0xFFDC2626),
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Destination',
                      style: GoogleFonts.inter(
                        fontSize: 11.5,
                        color: const Color(0xFF64748B),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    Text(
                      dropoff,
                      style: GoogleFonts.inter(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF1E293B),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          if (date.isNotEmpty || time.isNotEmpty) ...[
            const SizedBox(height: 14),
            const Divider(color: Color(0xFFF1F5F9), height: 1),
            const SizedBox(height: 10),
            Row(
              children: [
                const Icon(Icons.access_time_rounded, size: 16, color: Color(0xFF64748B)),
                const SizedBox(width: 6),
                Text(
                  'Schedule: ${date.isNotEmpty ? date : "Today"} • ${time.isNotEmpty ? time : "ASAP"}',
                  style: GoogleFonts.inter(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF475569),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  // ─── LIVE TRIP PROGRESS TRACKER ───────────────────────────────────
  Widget _buildTripProgressTracker(String status) {
    final isAccepted = status == 'ACCEPTED';
    final isStarted = status == 'STARTED';
    final isCompleted = status == 'COMPLETED';

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'RIDE PROGRESS',
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.1,
              color: const Color(0xFF0878F9),
            ),
          ),
          const SizedBox(height: 16),
          _buildStepRow(
            step: 1,
            title: 'Ride Requested',
            subtitle: 'Request dispatched to verified drivers',
            isDone: true,
            isActive: false,
          ),
          _buildStepConnector(isDone: true),
          _buildStepRow(
            step: 2,
            title: 'Driver Accepted & En Route',
            subtitle: 'Driver accepted your ride & is on the way',
            isDone: isStarted || isCompleted,
            isActive: isAccepted,
          ),
          _buildStepConnector(isDone: isStarted || isCompleted),
          _buildStepRow(
            step: 3,
            title: 'Trip In Progress',
            subtitle: 'Driver picked you up and heading to destination',
            isDone: isCompleted,
            isActive: isStarted,
          ),
          _buildStepConnector(isDone: isCompleted),
          _buildStepRow(
            step: 4,
            title: 'Destination Reached',
            subtitle: 'Trip completed safely',
            isDone: isCompleted,
            isActive: false,
          ),
        ],
      ),
    );
  }

  Widget _buildStepRow({
    required int step,
    required String title,
    required String subtitle,
    required bool isDone,
    required bool isActive,
  }) {
    final Color circleColor = isDone
        ? const Color(0xFF15803D)
        : (isActive ? const Color(0xFF0878F9) : const Color(0xFFCBD5E1));
    final IconData icon = isDone
        ? Icons.check
        : (isActive ? Icons.directions_car_rounded : Icons.circle_outlined);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: circleColor,
            shape: BoxShape.circle,
            boxShadow: isActive
                ? [
                    BoxShadow(
                      color: const Color(0xFF0878F9).withValues(alpha: 0.3),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: Icon(icon, color: Colors.white, size: 16),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: GoogleFonts.inter(
                  fontSize: 13.5,
                  fontWeight: isActive || isDone ? FontWeight.w700 : FontWeight.w500,
                  color: isActive
                      ? const Color(0xFF0878F9)
                      : (isDone ? const Color(0xFF0F172A) : const Color(0xFF94A3B8)),
                ),
              ),
              Text(
                subtitle,
                style: GoogleFonts.inter(
                  fontSize: 11.5,
                  color: const Color(0xFF64748B),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStepConnector({required bool isDone}) {
    return Container(
      margin: const EdgeInsets.only(left: 13, top: 2, bottom: 2),
      height: 18,
      width: 2,
      color: isDone ? const Color(0xFF15803D) : const Color(0xFFE2E8F0),
    );
  }
}
