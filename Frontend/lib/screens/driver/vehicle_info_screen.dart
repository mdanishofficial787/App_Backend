import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import '../../theme/app_theme.dart';
import '../../widgets/driver/capsule_dropdown_field.dart';
import '../../widgets/driver/capsule_input_field.dart';
import '../../widgets/driver/step_progress_bar.dart';
import '../../widgets/driver/success_dialog.dart';
import '../../widgets/driver/document_upload_tile.dart';
import '../../services/driver_api_service.dart';

class VehicleInfoScreen extends StatefulWidget {
  final VoidCallback onBack;
  final VoidCallback onReset;
  final ScrollController? scrollController;
  final String driverToken;

  const VehicleInfoScreen({
    super.key,
    required this.onBack,
    required this.onReset,
    required this.driverToken,
    this.scrollController,
  });

  @override
  State<VehicleInfoScreen> createState() => _VehicleInfoScreenState();
}

class _VehicleInfoScreenState extends State<VehicleInfoScreen> {
  final _formKey = GlobalKey<FormState>();
  late final ScrollController _scrollController;

  String? _selectedMake;
  String? _selectedModel;
  String? _selectedVariant;
  String? _selectedColor;

  final _seatingCapacityController = TextEditingController(text: '5');
  final _numberPlateController = TextEditingController(text: 'ISB-1234');

  XFile? _registrationBookFrontFile;
  XFile? _registrationBookBackFile;
  XFile? _frontViewFile;

  bool _isSubmitting = false;

  final List<String> _makes = [
    'Toyota',
    'Honda',
    'Suzuki',
    'Hyundai',
    'KIA',
    'Changan',
    'MG',
    'Haval',
    'Nissan',
    'Daihatsu',
  ];

  final Map<String, List<String>> _modelsByMake = {
    'Toyota': [
      'Corolla',
      'Yaris',
      'Fortuner',
      'Prius',
      'Aqua',
      'Hilux',
      'Passo',
    ],
    'Honda': ['Civic', 'City', 'BR-V', 'HR-V', 'Accord', 'Vezel'],
    'Suzuki': [
      'Cultus',
      'Alto',
      'Wagon R',
      'Swift',
      'Bolan',
      'Every',
      'Mehran',
    ],
    'Hyundai': ['Elantra', 'Tucson', 'Sonata', 'Santa Fe', 'Porter'],
    'KIA': ['Sportage', 'Picanto', 'Stonic', 'Sorento', 'Carnival'],
    'Changan': ['Alsvin', 'Karvaan', 'Oshan X7'],
    'MG': ['HS', 'ZS EV', 'MG 4', 'MG GT'],
    'Haval': ['H6', 'Jolion', 'H6 HEV'],
    'Nissan': ['Dayz', 'Note', 'Juke', 'Clippper'],
    'Daihatsu': ['Mira', 'Move', 'Cast', 'Hijet'],
  };

  final List<String> _variants = [
    '1.3 GLi / Standard',
    '1.6 Altis / Special',
    '1.8 Grande / Top',
    '1.5 Oriel / Turbo',
    '1.2 VXL / AGS',
    '1.0 VXR / Manual',
    'Automatic / CVT',
    'Manual / 5-Speed',
    'Hybrid / EV',
  ];

  final List<String> _colors = [
    'White',
    'Super White',
    'Metallic Silver',
    'Attitude Black',
    'Gun Metallic / Grey',
    'Phantom Brown',
    'Crimson Red',
    'Royal Blue',
    'Sand Beige',
  ];

  @override
  void initState() {
    super.initState();
    _scrollController = widget.scrollController ?? ScrollController();
    _selectedMake = 'Toyota';
    _selectedModel = 'Corolla';
    _selectedVariant = '1.3 GLi / Standard';
    _selectedColor = 'Super White';
  }

  @override
  void dispose() {
    if (widget.scrollController == null) {
      _scrollController.dispose();
    }
    _seatingCapacityController.dispose();
    _numberPlateController.dispose();
    super.dispose();
  }

  List<String> get _currentModels {
    if (_selectedMake != null && _modelsByMake.containsKey(_selectedMake)) {
      return _modelsByMake[_selectedMake]!;
    }
    return ['Corolla', 'Civic', 'Alto', 'Cultus', 'Sportage', 'Elantra'];
  }

  Future<XFile?> _pickImage(ImageSource source) async {
    final XFile? file = await ImagePicker().pickImage(
      source: source,
      imageQuality: 85,
    );
    return file;
  }

  void _showImagePickerModal(String title, Function(XFile) onSelected) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.borderMedium,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 14),
                Text(
                  'Upload $title',
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 16),
                ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.primaryBlueLight,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.camera_alt_rounded,
                      color: AppColors.primaryBlue,
                    ),
                  ),
                  title: Text(
                    'Capture Photo with Camera',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  onTap: () async {
                    Navigator.pop(ctx);
                    final file = await _pickImage(ImageSource.camera);
                    if (file != null) {
                      onSelected(file);
                      _showSnackbar('$title captured successfully!');
                    }
                  },
                ),
                ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.primaryBlueLight,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.photo_library_rounded,
                      color: AppColors.primaryBlue,
                    ),
                  ),
                  title: Text(
                    'Select from Gallery',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  onTap: () async {
                    Navigator.pop(ctx);
                    final file = await _pickImage(ImageSource.gallery);
                    if (file != null) {
                      onSelected(file);
                      _showSnackbar('$title selected successfully!');
                    }
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showSnackbar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          message,
          style: GoogleFonts.inter(fontSize: 13, color: Colors.white),
        ),
        backgroundColor: AppColors.textPrimary,
        duration: const Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  Future<void> _submitApplication() async {
    if (_isSubmitting) return;

    final missing = <String>[];
    if (_selectedMake == null) missing.add('Vehicle Make');
    if (_selectedModel == null) missing.add('Vehicle Model');
    if (_selectedVariant == null) missing.add('Variant');
    if (_seatingCapacityController.text.trim().isEmpty) {
      missing.add('Seating Capacity');
    }
    if (_numberPlateController.text.trim().isEmpty) {
      missing.add('Registration/Number Plate');
    }
    if (_selectedColor == null) missing.add('Vehicle Color');
    if (_registrationBookFrontFile == null) {
      missing.add('Vehicle ID Front Side');
    }
    if (_registrationBookBackFile == null) missing.add('Vehicle ID Back Side');
    if (_frontViewFile == null) missing.add('Front View photo');

    if (missing.isNotEmpty) {
      _showSnackbar('Please complete: ${missing.join(', ')}');
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      await DriverApiService.registerVehicle(
        token: widget.driverToken,
        vehicleMake: _selectedMake!,
        vehicleModel: _selectedModel!,
        variant: _selectedVariant!,
        numberOfSeats: _seatingCapacityController.text.trim(),
        registrationNumber: _numberPlateController.text.trim(),
        vehicleColor: _selectedColor!,
        registrationBook: _registrationBookFrontFile!,
        frontView: _frontViewFile!,
      );

      if (!mounted) return;
      SuccessDialog.show(context, onDone: widget.onReset);
    } on ApiException catch (e) {
      _showSnackbar(e.message);
    } catch (e) {
      debugPrint('REGISTRATION ERROR: $e');
      _showSnackbar('Something went wrong. Please try again.');
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, size: 22),
          onPressed: widget.onBack,
        ),
        title: Text(
          'Driver Registration',
          style: GoogleFonts.inter(
            fontSize: 17,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: StepProgressBar(
            currentStep: 2,
            onStepTapped: (step) {
              if (step == 1) {
                widget.onBack();
              }
            },
          ),
        ),
      ),
      body: RawScrollbar(
        controller: _scrollController,
        thumbVisibility: true,
        trackVisibility: true,
        thickness: 5.0,
        radius: const Radius.circular(8),
        thumbColor: AppColors.primaryBlue.withValues(alpha: 0.6),
        trackColor: AppColors.borderLight.withValues(alpha: 0.4),
        trackRadius: const Radius.circular(8),
        padding: const EdgeInsets.only(right: 2),
        child: SingleChildScrollView(
          controller: _scrollController,
          physics: const AlwaysScrollableScrollPhysics(
            parent: BouncingScrollPhysics(),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CapsuleDropdownField(
                  label: 'VEHICLE MAKE',
                  hintText: 'Select make...',
                  selectedValue: _selectedMake,
                  items: _makes,
                  onChanged: (val) {
                    setState(() {
                      _selectedMake = val;
                      _selectedModel = null;
                    });
                  },
                ),
                const SizedBox(height: 12),

                CapsuleDropdownField(
                  label: 'VEHICLE MODEL',
                  hintText: 'Select model...',
                  selectedValue: _selectedModel,
                  items: _currentModels,
                  onChanged: (val) {
                    setState(() => _selectedModel = val);
                  },
                ),
                const SizedBox(height: 12),

                CapsuleDropdownField(
                  label: 'VARIANT',
                  hintText: 'Select variant...',
                  selectedValue: _selectedVariant,
                  items: _variants,
                  onChanged: (val) {
                    setState(() => _selectedVariant = val);
                  },
                ),
                const SizedBox(height: 12),

                CapsuleInputField(
                  label: 'SEATING CAPACITY',
                  hintText: 'e.g. 5',
                  controller: _seatingCapacityController,
                  showLabelInside: false,
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 12),

                CapsuleInputField(
                  label: 'REGISTRATION / NUMBER PLATE',
                  hintText: 'E.G. ISB-1234',
                  controller: _numberPlateController,
                  showLabelInside: false,
                  keyboardType: TextInputType.text,
                ),
                const SizedBox(height: 12),

                CapsuleDropdownField(
                  label: 'VEHICLE COLOR',
                  hintText: 'Select color...',
                  selectedValue: _selectedColor,
                  items: _colors,
                  onChanged: (val) {
                    setState(() => _selectedColor = val);
                  },
                ),
                const SizedBox(height: 18),

                Text(
                  'VEHICLE IDENTIFICATION CARD',
                  style: GoogleFonts.inter(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                    letterSpacing: 0.8,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Please upload clear photos of both sides of your vehicle identification card.',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w400,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: DocumentUploadTile(
                        label: '',
                        uploadPrompt: 'Front Side',
                        isUploaded: _registrationBookFrontFile != null,
                        fileName: 'Front_Side.jpg',
                        onTap: () =>
                            _showImagePickerModal('Front Side', (file) {
                              setState(() => _registrationBookFrontFile = file);
                            }),
                        onClear: () =>
                            setState(() => _registrationBookFrontFile = null),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: DocumentUploadTile(
                        label: '',
                        uploadPrompt: 'Back Side',
                        isUploaded: _registrationBookBackFile != null,
                        fileName: 'Back_Side.jpg',
                        onTap: () => _showImagePickerModal('Back Side', (file) {
                          setState(() => _registrationBookBackFile = file);
                        }),
                        onClear: () =>
                            setState(() => _registrationBookBackFile = null),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                Text(
                  'Upload Vehicle Images',
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Please upload clear photos of your vehicle from the following perspectives.',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w400,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 14),

                Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          flex: 1,
                          child: DocumentUploadTile(
                            label: '',
                            uploadPrompt: 'Front View',
                            isUploaded: _frontViewFile != null,
                            fileName: 'Front_View.jpg',
                            onTap: () =>
                                _showImagePickerModal('Front View', (file) {
                                  setState(() => _frontViewFile = file);
                                }),
                            onClear: () =>
                                setState(() => _frontViewFile = null),
                          ),
                        ),
                        const SizedBox(width: 12),
                        const Spacer(flex: 1),
                      ],
                    ),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        width: 50,
                        height: 50,
                        decoration: BoxDecoration(
                          color: AppColors.primaryBlue,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primaryBlue.withValues(
                                alpha: 0.3,
                              ),
                              blurRadius: 8,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: const Center(
                          child: Icon(
                            Icons.assignment,
                            color: Colors.white,
                            size: 24,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 28),

                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _isSubmitting ? null : _submitApplication,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryBlue,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shadowColor: AppColors.primaryBlue.withValues(alpha: 0.4),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(28),
                      ),
                    ),
                    child: _isSubmitting
                        ? const SizedBox(
                            height: 22,
                            width: 22,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.4,
                              color: Colors.white,
                            ),
                          )
                        : Text(
                            'SAVE & CONTINUE',
                            style: GoogleFonts.inter(
                              fontSize: 14.5,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.8,
                              color: Colors.white,
                            ),
                          ),
                  ),
                ),
                const SizedBox(height: 28),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
