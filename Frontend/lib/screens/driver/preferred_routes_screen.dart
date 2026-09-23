import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import '/theme/app_theme.dart';
import '../../services/driver_api_service.dart'; // Import API service

class PreferredRoutesScreen extends StatefulWidget {
  final String? driverId;
  const PreferredRoutesScreen({super.key, this.driverId});

  @override
  State<PreferredRoutesScreen> createState() => _PreferredRoutesScreenState();
}

class _PreferredRoutesScreenState extends State<PreferredRoutesScreen> {
  final _startPointController = TextEditingController();
  final _endPointController = TextEditingController();
  final _timeController = TextEditingController();
  bool _isSubmitting = false;

  @override
  void dispose() {
    _startPointController.dispose();
    _endPointController.dispose();
    _timeController.dispose();
    super.dispose();
  }

  Future<void> _onSavePreferences() async {
    FocusScope.of(context).unfocus();

    // Validation: Start point is required
    final startPoint = _startPointController.text.trim();
    if (startPoint.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Start Point is required',
            style: GoogleFonts.inter(fontSize: 13, color: Colors.white),
          ),
          backgroundColor: Colors.red.shade800,
          duration: const Duration(seconds: 2),
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      // Send to the backend
      await DriverApiService.savePreferredRoutes(
        driverId: widget.driverId ?? '', // Handle fallback if null
        startPoint: startPoint,
        endPoint: _endPointController.text.trim(),
        time: _timeController.text.trim(),
      );

      if (!mounted) return;
      setState(() => _isSubmitting = false);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Preferences Saved!',
            style: GoogleFonts.inter(fontSize: 13, color: Colors.white),
          ),
          backgroundColor: AppColors.success,
          duration: const Duration(seconds: 2),
        ),
      );

      // Optionally pop the screen after saving
      // Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      setState(() => _isSubmitting = false);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            e.toString(),
            style: GoogleFonts.inter(fontSize: 13, color: Colors.white),
          ),
          backgroundColor: Colors.red.shade800,
          duration: const Duration(seconds: 3),
        ),
      );
    }
  }

  Future<Iterable<String>> _searchLocation(String query) async {
    if (query.trim().isEmpty) return const Iterable<String>.empty();

    try {
      const String apiKey = 'pk.215498a4e99268cde5c380624d981804';
      // Added limit=5 so we don't overwhelm the user with too many options
      final url =
          'https://us1.locationiq.com/v1/search?key=$apiKey&q=${Uri.encodeComponent(query)}&format=json&countrycodes=pk&limit=5';
      final response = await http.get(Uri.parse(url));

      if (response.statusCode == 200) {
        final data = json.decode(response.body) as List;
        return data
            .map((item) {
              final String fullName = item['display_name'].toString();
              // The API returns a very long comma-separated string.
              // We split it and just take the first two parts (e.g. "Kamran Market, Rawalpindi")
              final parts = fullName.split(', ');
              if (parts.length > 1) {
                return '${parts[0]}, ${parts[1]}';
              }
              return fullName;
            })
            .toSet()
            .toList(); // toSet() removes duplicate names
      }
    } catch (e) {
      debugPrint('Error searching location: $e');
    }
    return const Iterable<String>.empty();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      behavior: HitTestBehavior.opaque,
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(
              Icons.arrow_back,
              size: 22,
              color: AppColors.textPrimary,
            ),
            onPressed: () => Navigator.pop(context),
          ),
          title: Text(
            'Preferred Routes',
            style: GoogleFonts.inter(
              fontSize: 16.5,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          centerTitle: false,
        ),
        body: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 420),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Illustration Placeholder (Driver & Customer graphic)
                    Container(
                      width: double.infinity,
                      height: 180,
                      decoration: BoxDecoration(
                        color: const Color(0xFFD4E5FF),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            Icons.directions_car_rounded,
                            size: 64,
                            color: AppColors.primaryBlue,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'DRIVER',
                            style: GoogleFonts.inter(
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              color: AppColors.primaryBlue,
                              letterSpacing: 1.2,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Divider with Text
                    Row(
                      children: [
                        Expanded(
                          child: Divider(
                            color: Colors.grey.shade300,
                            thickness: 1,
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: Text(
                            'Preferred Routes',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ),
                        Expanded(
                          child: Divider(
                            color: Colors.grey.shade300,
                            thickness: 1,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Start Point
                    Text(
                      'Start Point',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 6),
                    _buildAutocompleteField(
                      controller: _startPointController,
                      hintText: 'Start Point',
                      icon: Icons.location_on_outlined,
                    ),
                    const SizedBox(height: 16),

                    // End Point
                    Text(
                      'End Point',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 6),
                    _buildAutocompleteField(
                      controller: _endPointController,
                      hintText: 'End Point',
                      icon: Icons.location_on_outlined,
                    ),
                    const SizedBox(height: 16),

                    // Time
                    Text(
                      'Time',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 6),
                    _buildInputField(
                      controller: _timeController,
                      hintText: 'Select Time',
                      icon: Icons.access_time_rounded,
                      onTapIcon: () async {
                        final TimeOfDay? time = await showTimePicker(
                          context: context,
                          initialTime: TimeOfDay.now(),
                        );
                        if (time != null) {
                          setState(() {
                            _timeController.text = time.format(context);
                          });
                        }
                      },
                      readOnly: true, // Prevent keyboard for time picker
                    ),
                    const SizedBox(height: 36),

                    // Save Preferences Button
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        onPressed: _isSubmitting ? null : _onSavePreferences,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryBlue,
                          foregroundColor: Colors.white,
                          disabledBackgroundColor: AppColors.primaryBlue
                              .withValues(alpha: 0.6),
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        child: _isSubmitting
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    Colors.white,
                                  ),
                                ),
                              )
                            : Text(
                                'Save Preferences',
                                style: GoogleFonts.inter(
                                  fontSize: 14.5,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
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
        ),
      ),
    );
  }

  Widget _buildInputField({
    required TextEditingController controller,
    required String hintText,
    required IconData icon,
    required VoidCallback onTapIcon,
    bool readOnly = false,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.borderMedium, width: 1.2),
      ),
      child: TextField(
        controller: controller,
        readOnly: readOnly,
        onTap: readOnly ? onTapIcon : null,
        style: GoogleFonts.inter(fontSize: 13.5, color: AppColors.textPrimary),
        decoration: InputDecoration(
          hintText: hintText,
          hintStyle: GoogleFonts.inter(
            fontSize: 13.5,
            color: AppColors.textMuted,
          ),
          prefixIcon: IconButton(
            icon: Icon(icon, size: 20, color: AppColors.primaryBlue),
            onPressed: onTapIcon,
          ),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 12,
            vertical: 14,
          ),
          border: InputBorder.none,
        ),
      ),
    );
  }

  Widget _buildAutocompleteField({
    required TextEditingController controller,
    required String hintText,
    required IconData icon,
  }) {
    return Autocomplete<String>(
      optionsBuilder: (TextEditingValue textEditingValue) async {
        if (textEditingValue.text.isEmpty) {
          return const Iterable<String>.empty();
        }
        return await _searchLocation(textEditingValue.text);
      },
      onSelected: (String selection) {
        controller.text = selection;
      },
      fieldViewBuilder: (context, fieldController, focusNode, onFieldSubmitted) {
        // We sync the controller via onChanged and onSelected instead of a listener
        // to prevent listener memory leaks and sync issues.
        if (controller.text.isNotEmpty && fieldController.text.isEmpty) {
          fieldController.text = controller.text;
        }

        return Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.borderMedium, width: 1.2),
          ),
          child: TextField(
            controller: fieldController,
            focusNode: focusNode,
            onChanged: (val) => controller.text = val,
            onSubmitted: (value) => onFieldSubmitted(),
            style: GoogleFonts.inter(
              fontSize: 13.5,
              color: AppColors.textPrimary,
            ),
            decoration: InputDecoration(
              hintText: hintText,
              hintStyle: GoogleFonts.inter(
                fontSize: 13.5,
                color: AppColors.textMuted,
              ),
              prefixIcon: Icon(icon, size: 20, color: AppColors.primaryBlue),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 12,
                vertical: 14,
              ),
              border: InputBorder.none,
            ),
          ),
        );
      },
      optionsViewBuilder: (context, onSelected, options) {
        return Align(
          alignment: Alignment.topLeft,
          child: Material(
            elevation: 4.0,
            borderRadius: BorderRadius.circular(10),
            child: SizedBox(
              height: 200.0,
              width:
                  MediaQuery.of(context).size.width -
                  48, // accounts for horizontal padding
              child: ListView.builder(
                padding: EdgeInsets.zero,
                itemCount: options.length,
                itemBuilder: (BuildContext context, int index) {
                  final String option = options.elementAt(index);
                  return ListTile(
                    title: Text(option, style: GoogleFonts.inter(fontSize: 13)),
                    onTap: () {
                      onSelected(option);
                    },
                  );
                },
              ),
            ),
          ),
        );
      },
    );
  }
}
