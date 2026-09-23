import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class StepProgressBar extends StatelessWidget {
  final int currentStep; // 1 or 2
  final ValueChanged<int>? onStepTapped;

  const StepProgressBar({
    super.key,
    required this.currentStep,
    this.onStepTapped,
  });

  @override
  Widget build(BuildContext context) {
    final isStep1 = currentStep == 1;
    final isStep2 = currentStep == 2;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 8.0),
      child: Column(
        children: [
          Row(
            children: [
              const Spacer(flex: 1),
              // Step 1 Circle
              _buildStepCircle(
                stepNumber: 1,
                isActive: isStep1,
                isCompleted: isStep2,
                onTap: () => onStepTapped?.call(1),
              ),
              // Connecting Line
              Expanded(
                flex: 4,
                child: Container(
                  height: 2.0,
                  margin: const EdgeInsets.symmetric(horizontal: 8),
                  decoration: BoxDecoration(
                    color: isStep2
                        ? AppColors.primaryBlue
                        : AppColors.borderMedium,
                    borderRadius: BorderRadius.circular(1),
                  ),
                ),
              ),
              // Step 2 Circle
              _buildStepCircle(
                stepNumber: 2,
                isActive: isStep2,
                isCompleted: false,
                onTap: () => onStepTapped?.call(2),
              ),
              const Spacer(flex: 1),
            ],
          ),
          const SizedBox(height: 6),
          // Step Labels
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: InkWell(
                  onTap: () => onStepTapped?.call(1),
                  borderRadius: BorderRadius.circular(4),
                  child: Text(
                    'PERSONAL INFO',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 10.5,
                      fontWeight: isStep1 ? FontWeight.w800 : FontWeight.w600,
                      color: isStep1
                          ? AppColors.primaryBlue
                          : (isStep2
                                ? AppColors.primaryBlue
                                : AppColors.textMuted),
                      letterSpacing: 0.6,
                    ),
                  ),
                ),
              ),
              Expanded(
                child: InkWell(
                  onTap: () => onStepTapped?.call(2),
                  borderRadius: BorderRadius.circular(4),
                  child: Text(
                    'VEHICLE INFO',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 10.5,
                      fontWeight: isStep2 ? FontWeight.w800 : FontWeight.w600,
                      color: isStep2
                          ? AppColors.primaryBlue
                          : AppColors.textMuted,
                      letterSpacing: 0.6,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStepCircle({
    required int stepNumber,
    required bool isActive,
    required bool isCompleted,
    required VoidCallback onTap,
  }) {
    Color bgColor;
    Color borderColor;
    Color textColor;

    if (isCompleted) {
      bgColor = AppColors.primaryBlue;
      borderColor = AppColors.primaryBlue;
      textColor = Colors.white;
    } else if (isActive) {
      bgColor = AppColors.primaryBlue;
      borderColor = AppColors.primaryBlue;
      textColor = Colors.white;
    } else {
      bgColor = Colors.white;
      borderColor = AppColors.borderMedium;
      textColor = AppColors.textSecondary;
    }

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        width: 28,
        height: 28,
        decoration: BoxDecoration(
          color: bgColor,
          shape: BoxShape.circle,
          border: Border.all(color: borderColor, width: 1.5),
          boxShadow: isActive
              ? [
                  BoxShadow(
                    color:
                        (stepNumber == 1 ? Colors.black : AppColors.primaryBlue)
                            .withValues(alpha: 0.2),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Center(
          child: isCompleted
              ? const Icon(Icons.check_rounded, size: 16, color: Colors.white)
              : Text(
                  '$stepNumber',
                  style: TextStyle(
                    color: textColor,
                    fontSize: 12.5,
                    fontWeight: FontWeight.bold,
                  ),
                ),
        ),
      ),
    );
  }
}
