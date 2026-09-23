import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_theme.dart';

class CapsuleDropdownField extends StatelessWidget {
  final String label;
  final String hintText;
  final String? selectedValue;
  final List<String> items;
  final ValueChanged<String?> onChanged;
  final Widget? prefixIcon;
  final bool showLabelOutside;

  const CapsuleDropdownField({
    super.key,
    required this.label,
    required this.hintText,
    required this.selectedValue,
    required this.items,
    required this.onChanged,
    this.prefixIcon,
    this.showLabelOutside = true,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (showLabelOutside) ...[
          Padding(
            padding: const EdgeInsets.only(left: 4.0, bottom: 5.0),
            child: Text(
              label.toUpperCase(),
              style: GoogleFonts.inter(
                fontSize: 10.5,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
                letterSpacing: 0.5,
              ),
            ),
          ),
        ],
        InkWell(
          onTap: () => _showPickerBottomSheet(context),
          borderRadius: BorderRadius.circular(28),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(28),
              border: Border.all(
                color: AppColors.textPrimary.withValues(alpha: 0.85),
                width: 1.2,
              ),
            ),
            child: Row(
              children: [
                if (prefixIcon != null) ...[
                  Padding(
                    padding: const EdgeInsets.only(right: 10.0),
                    child: prefixIcon,
                  ),
                ],
                Expanded(
                  child: Text(
                    selectedValue ?? hintText,
                    style: GoogleFonts.inter(
                      fontSize: 13.5,
                      fontWeight: selectedValue != null
                          ? FontWeight.w500
                          : FontWeight.w400,
                      color: selectedValue != null
                          ? AppColors.textPrimary
                          : AppColors.textMuted,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const Icon(
                  Icons.keyboard_arrow_down_rounded,
                  color: AppColors.textSecondary,
                  size: 22,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  void _showPickerBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) {
        return Container(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(context).size.height * 0.55,
          ),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 12),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.borderMedium,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      label,
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, size: 20),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1, color: AppColors.borderLight),
              Expanded(
                child: ListView.separated(
                  itemCount: items.length,
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  separatorBuilder: (context, index) =>
                      const Divider(height: 1, indent: 16, endIndent: 16),
                  itemBuilder: (context, index) {
                    final item = items[index];
                    final isSelected = item == selectedValue;

                    return ListTile(
                      title: Text(
                        item,
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: isSelected
                              ? FontWeight.w600
                              : FontWeight.w400,
                          color: isSelected
                              ? AppColors.primaryBlue
                              : AppColors.textPrimary,
                        ),
                      ),
                      trailing: isSelected
                          ? const Icon(
                              Icons.check_circle_rounded,
                              color: AppColors.primaryBlue,
                              size: 20,
                            )
                          : null,
                      onTap: () {
                        onChanged(item);
                        Navigator.pop(ctx);
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
