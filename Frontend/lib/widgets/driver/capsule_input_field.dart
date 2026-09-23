import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_theme.dart';

class CapsuleInputField extends StatefulWidget {
  final String label;
  final String? hintText;
  final String? initialValue;
  final TextEditingController? controller;
  final Widget? prefixIcon;
  final Widget? suffixIcon;
  final bool isPassword;
  final bool readOnly;
  final VoidCallback? onTap;
  final TextInputType keyboardType;
  final List<TextInputFormatter>? inputFormatters;
  final String? Function(String?)? validator;
  final ValueChanged<String>? onChanged;
  final bool showLabelInside;
  final String? helperText;
  final bool isRequired;

  const CapsuleInputField({
    super.key,
    required this.label,
    this.hintText,
    this.initialValue,
    this.controller,
    this.prefixIcon,
    this.suffixIcon,
    this.isPassword = false,
    this.readOnly = false,
    this.onTap,
    this.keyboardType = TextInputType.text,
    this.inputFormatters,
    this.validator,
    this.onChanged,
    this.showLabelInside = true,
    this.helperText,
    this.isRequired = false,
  });

  @override
  State<CapsuleInputField> createState() => _CapsuleInputFieldState();
}

class _CapsuleInputFieldState extends State<CapsuleInputField> {
  late bool _obscureText;
  bool _isFocused = false;
  late final FocusNode _focusNode;
  late final TextEditingController _effectiveController;

  @override
  void initState() {
    super.initState();
    _obscureText = widget.isPassword;
    _focusNode = FocusNode();
    _focusNode.addListener(() {
      setState(() {
        _isFocused = _focusNode.hasFocus;
      });
    });
    _effectiveController =
        widget.controller ??
        TextEditingController(text: widget.initialValue ?? '');
  }

  @override
  void dispose() {
    _focusNode.dispose();
    if (widget.controller == null) {
      _effectiveController.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.showLabelInside) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildOutsideLabel(),
          const SizedBox(height: 5),
          _buildPillContainer(isStacked: false),
        ],
      );
    }

    return _buildPillContainer(isStacked: true);
  }

  Widget _buildOutsideLabel() {
    return Padding(
      padding: const EdgeInsets.only(left: 4.0),
      child: Text(
        widget.label.toUpperCase(),
        style: GoogleFonts.inter(
          fontSize: 10.5,
          fontWeight: FontWeight.w700,
          color: AppColors.textPrimary,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  Widget _buildPillContainer({required bool isStacked}) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(
          color: _isFocused
              ? AppColors.primaryBlue
              : AppColors.textPrimary.withValues(alpha: 0.85),
          width: _isFocused ? 1.5 : 1.2,
        ),
        boxShadow: _isFocused
            ? [
                BoxShadow(
                  color: AppColors.primaryBlue.withValues(alpha: 0.08),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ]
            : null,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          if (widget.prefixIcon != null) ...[
            Padding(
              padding: const EdgeInsets.only(right: 10.0),
              child: widget.prefixIcon,
            ),
          ],
          Expanded(
            child: isStacked
                ? Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(top: 3.0),
                        child: Text(
                          widget.label.toUpperCase(),
                          style: GoogleFonts.inter(
                            fontSize: 9.5,
                            fontWeight: FontWeight.w800,
                            color: AppColors.textPrimary,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                      TextFormField(
                        controller: _effectiveController,
                        focusNode: _focusNode,
                        obscureText: _obscureText,
                        readOnly: widget.readOnly,
                        onTap: widget.onTap,
                        keyboardType: widget.keyboardType,
                        inputFormatters: widget.inputFormatters,
                        validator: widget.validator,
                        onChanged: widget.onChanged,
                        style: GoogleFonts.inter(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w500,
                          color: AppColors.textPrimary,
                        ),
                        decoration: InputDecoration(
                          hintText: widget.hintText,
                          hintStyle: GoogleFonts.inter(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w400,
                            color: AppColors.textMuted,
                          ),
                          isDense: true,
                          contentPadding: const EdgeInsets.only(
                            top: 1,
                            bottom: 5,
                          ),
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                        ),
                      ),
                    ],
                  )
                : TextFormField(
                    controller: _effectiveController,
                    focusNode: _focusNode,
                    obscureText: _obscureText,
                    readOnly: widget.readOnly,
                    onTap: widget.onTap,
                    keyboardType: widget.keyboardType,
                    inputFormatters: widget.inputFormatters,
                    validator: widget.validator,
                    onChanged: widget.onChanged,
                    style: GoogleFonts.inter(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w500,
                      color: AppColors.textPrimary,
                    ),
                    decoration: InputDecoration(
                      hintText: widget.hintText,
                      hintStyle: GoogleFonts.inter(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w400,
                        color: AppColors.textMuted,
                      ),
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(vertical: 10),
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                    ),
                  ),
          ),
          if (widget.isPassword)
            IconButton(
              icon: Icon(
                _obscureText
                    ? Icons.visibility_outlined
                    : Icons.visibility_off_outlined,
                size: 20,
                color: AppColors.textSecondary,
              ),
              onPressed: () {
                setState(() {
                  _obscureText = !_obscureText;
                });
              },
              splashRadius: 18,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
            )
          else if (widget.suffixIcon != null)
            widget.suffixIcon!,
        ],
      ),
    );
  }
}
