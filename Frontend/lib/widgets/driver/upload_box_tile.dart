import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '/theme/app_theme.dart';
import 'dashed_border.dart';

class UploadBoxTile extends StatelessWidget {
  final String title;
  final String? subtitle;
  final bool isUploaded;
  final String? fileName;
  final VoidCallback onTap;
  final VoidCallback? onClear;
  final double height;
  final double? width;

  const UploadBoxTile({
    super.key,
    required this.title,
    this.subtitle = '(Upload Image)',
    this.isUploaded = false,
    this.fileName,
    required this.onTap,
    this.onClear,
    this.height = 96,
    this.width,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () {
        // Unfocus any open keyboard when tapping upload
        FocusScope.of(context).unfocus();
        onTap();
      },
      borderRadius: BorderRadius.circular(14),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          DashedBorder(
            borderRadius: 14,
            dashLength: 5,
            dashGap: 3,
            color: isUploaded
                ? AppColors.primaryBlue
                : AppColors.dashedBlue.withValues(alpha: 0.8),
            strokeWidth: 1.3,
            backgroundColor: const Color(0xFFF9FBFF),
            child: Container(
              width: width ?? double.infinity,
              height: height,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              child: isUploaded
                  ? Stack(
                      children: [
                        Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(
                                Icons.check_circle_rounded,
                                color: AppColors.primaryBlue,
                                size: 28,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                fileName ?? '$title Uploaded',
                                style: GoogleFonts.inter(
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.primaryBlue,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        ),
                        if (onClear != null)
                          Positioned(
                            top: -2,
                            right: -2,
                            child: GestureDetector(
                              onTap: onClear,
                              child: Container(
                                padding: const EdgeInsets.all(2),
                                decoration: BoxDecoration(
                                  color: AppColors.error.withValues(alpha: 0.1),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  Icons.close_rounded,
                                  size: 16,
                                  color: AppColors.error,
                                ),
                              ),
                            ),
                          ),
                      ],
                    )
                  : Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.cloud_upload_outlined,
                          size: 26,
                          color: AppColors.primaryBlue,
                        ),
                        const SizedBox(height: 5),
                        Text(
                          title,
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        if (subtitle != null && subtitle!.isNotEmpty) ...[
                          const SizedBox(height: 1),
                          Text(
                            subtitle!,
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              fontWeight: FontWeight.w400,
                              color: AppColors.textSecondary,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ],
                    ),
            ),
          ),
          // Camera badge in bottom right corner (matching the reference designs)
          Positioned(
            bottom: -3,
            right: -3,
            child: Container(
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.borderLight, width: 1),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.08),
                    blurRadius: 3,
                    offset: const Offset(0, 1),
                  ),
                ],
              ),
              child: const Center(
                child: Icon(
                  Icons.camera_alt_outlined,
                  size: 12,
                  color: AppColors.primaryBlue,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
