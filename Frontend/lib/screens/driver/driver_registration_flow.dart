import 'package:flutter/material.dart';
import 'personal_info_screen.dart';
import 'vehicle_info_screen.dart';

class DriverRegistrationFlow extends StatefulWidget {
  const DriverRegistrationFlow({super.key});

  @override
  State<DriverRegistrationFlow> createState() => _DriverRegistrationFlowState();
}

class _DriverRegistrationFlowState extends State<DriverRegistrationFlow> {
  final PageController _pageController = PageController();
  int _currentStep = 1;

  String? _driverToken;

  void _goToStep2(String token) {
    setState(() {
      _driverToken = token;
      _currentStep = 2;
    });
    _pageController.animateToPage(
      1,
      duration: const Duration(milliseconds: 350),
      curve: Curves.easeInOutCubic,
    );
  }

  void _goToStep1() {
    _pageController.animateToPage(
      0,
      duration: const Duration(milliseconds: 350),
      curve: Curves.easeInOutCubic,
    );
    setState(() => _currentStep = 1);
  }

  void _resetFlow() {
    _goToStep1();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: _currentStep == 1,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop && _currentStep == 2) {
          _goToStep1();
        }
      },
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: PageView(
            controller: _pageController,
            physics: const NeverScrollableScrollPhysics(),
            onPageChanged: (index) {
              setState(() => _currentStep = index + 1);
            },
            children: [
              PersonalInfoScreen(
                onContinue: _goToStep2,
                onBack: () {
                  if (Navigator.canPop(context)) {
                    Navigator.pop(context);
                  }
                },
              ),
              VehicleInfoScreen(
                onBack: _goToStep1,
                onReset: _resetFlow,
                driverToken: _driverToken ?? '',
              ),
            ],
          ),
        ),
      ),
    );
  }
}
