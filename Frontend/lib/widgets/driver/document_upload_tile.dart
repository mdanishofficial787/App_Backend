import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_theme.dart';
import 'dashed_border.dart';

class DocumentUploadTile extends StatelessWidget {
  final String label;
  final String uploadPrompt;
  final bool isUploaded;
  final String? fileName;
  final VoidCallback onTap;
  final VoidCallback? onClear;

  const DocumentUploadTile({
    super.key,
    required this.label,
    this.uploadPrompt = 'UPLOAD PHOTO',
    this.isUploaded = false,
    this.fileName,
    required this.onTap,
    this.onClear,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(left: 4.0, bottom: 6.0),
            child: Text(
              label.toUpperCase(),
              style: GoogleFonts.inter(
                fontSize: 10.5,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
                letterSpacing: 0.5,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: DashedBorder(
            borderRadius: 14,
            dashLength: 5,
            dashGap: 3,
            color: isUploaded
                ? AppColors.primaryBlue
                : AppColors.dashedBlue.withValues(alpha: 0.8),
            strokeWidth: 1.4,
            backgroundColor: const Color(0xFFEFF6FF),
            child: Container(
              width: double.infinity,
              height: 92,
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
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
                                size: 26,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                fileName ?? 'Uploaded',
                                style: GoogleFonts.inter(
                                  fontSize: 11.0,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.primaryBlue,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                        if (onClear != null)
                          Positioned(
                            top: -4,
                            right: -4,
                            child: IconButton(
                              icon: const Icon(
                                Icons.close_rounded,
                                size: 18,
                                color: AppColors.textSecondary,
                              ),
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                              onPressed: onClear,
                            ),
                          ),
                      ],
                    )
                  : Stack(
                      clipBehavior: Clip.none,
                      children: [
                        Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(
                                Icons.cloud_upload,
                                size: 28,
                                color: AppColors.primaryBlue,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                uploadPrompt,
                                style: GoogleFonts.inter(
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textPrimary,
                                  letterSpacing: 0.2,
                                ),
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 1),
                              Text(
                                '(Upload Image)',
                                style: GoogleFonts.inter(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w400,
                                  color: AppColors.textSecondary,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        ),
                        Positioned(
                          bottom: -6,
                          right: -4,
                          child: Container(
                            width: 22,
                            height: 22,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                            ),
                            child: const Center(
                              child: Icon(
                                Icons.camera_alt,
                                size: 14,
                                color: AppColors.primaryBlue,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
            ),
          ),
        ),
      ],
    );
  }
}
