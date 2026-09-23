import 'package:flutter/material.dart';
import 'package:ride_and_serve/screens/customer/homescreen.dart';
import 'package:ride_and_serve/screens/driver/driver_auth_landing_screen.dart';

enum AccountType { customer, driver }

class AccountTypeScreen extends StatefulWidget {
  const AccountTypeScreen({super.key});

  @override
  State<AccountTypeScreen> createState() => _AccountTypeScreenState();
}

class _AccountTypeScreenState extends State<AccountTypeScreen> {
  AccountType _selectedAccount = AccountType.customer;

  void _continue() {
    if (_selectedAccount == AccountType.customer) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const Homescreen()),
      );
    } else {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => const DriverAuthLandingScreen(),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F9FE),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  const SizedBox(height: 20),

                  // =================================================
                  // LOGO
                  // =================================================
                  SizedBox(
                    width: 160,
                    height: 90,
                    child: Image.asset(
                      'assets/images/rns_logo.png',
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) {
                        return const Icon(
                          Icons.directions_car,
                          size: 70,
                          color: Color(0xFF102A52),
                        );
                      },
                    ),
                  ),

                  const SizedBox(height: 12),

                  // =================================================
                  // TAGLINE
                  // =================================================
                  const Text(
                    'Ride, Serve, Connect.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF096CFA),
                      letterSpacing: 0.5,
                    ),
                  ),

                  const SizedBox(height: 28),

                  // =================================================
                  // WELCOME
                  // =================================================
                  const Text(
                    'Welcome!',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF171A1F),
                    ),
                  ),

                  const SizedBox(height: 8),

                  const Text(
                    'Choose your account type to continue',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 15,
                      color: Color(0xFF565E6D),
                    ),
                  ),

                  const SizedBox(height: 32),

                  // =================================================
                  // CUSTOMER + DRIVER CARDS
                  // =================================================
                  Row(
                    children: [
                      Expanded(
                        child: _AccountCard(
                          title: 'Customer',
                          subtitle: 'Book rides & travel safely',
                          icon: Icons.groups_outlined,
                          selected: _selectedAccount == AccountType.customer,
                          onTap: () {
                            setState(() {
                              _selectedAccount = AccountType.customer;
                            });
                          },
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _AccountCard(
                          title: 'Driver',
                          subtitle: 'Drive & earn on schedule',
                          icon: Icons.person_outline,
                          selected: _selectedAccount == AccountType.driver,
                          onTap: () {
                            setState(() {
                              _selectedAccount = AccountType.driver;
                            });
                          },
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 36),

                  // =================================================
                  // CONTINUE BUTTON
                  // =================================================
                  SizedBox(
                    width: double.infinity,
                    height: 54,
                    child: ElevatedButton(
                      onPressed: _continue,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0878F9),
                        foregroundColor: Colors.white,
                        elevation: 3,
                        shadowColor: const Color(0x330878F9),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: const Text(
                        'CONTINUE',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.8,
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // =================================================
                  // TERMS
                  // =================================================
                  Wrap(
                    alignment: WrapAlignment.center,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      const Text(
                        'By continuing, you agree to our ',
                        style: TextStyle(fontSize: 13, color: Color(0xFF565E6D)),
                      ),
                      GestureDetector(
                        onTap: () {},
                        child: const Text(
                          'Terms',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF0878F9),
                          ),
                        ),
                      ),
                      const Text(
                        ' & ',
                        style: TextStyle(fontSize: 13, color: Color(0xFF565E6D)),
                      ),
                      GestureDetector(
                        onTap: () {},
                        child: const Text(
                          'Privacy Policy',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF0878F9),
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// =============================================================
// ACCOUNT CARD
// =============================================================

class _AccountCard extends StatelessWidget {
  final String title;
  final String? subtitle;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  const _AccountCard({
    required this.title,
    this.subtitle,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        height: 195,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? const Color(0xFF0878F9) : const Color(0xFFE2E8F0),
            width: selected ? 2.5 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: selected
                  ? const Color(0x1A0878F9)
                  : Colors.black.withValues(alpha: 0.04),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Stack(
          children: [
            // ===================================================
            // CHECK MARK IN CORNER
            // ===================================================
            if (selected)
              Positioned(
                top: 0,
                right: 0,
                child: Container(
                  width: 24,
                  height: 24,
                  decoration: const BoxDecoration(
                    color: Color(0xFF0878F9),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.check, color: Colors.white, size: 16),
                ),
              ),

            // ===================================================
            // CENTERED ICON + TITLE
            // ===================================================
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: selected
                          ? const Color(0xFFEBF3FF)
                          : const Color(0xFFF1F5F9),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      icon,
                      size: 38,
                      color: selected
                          ? const Color(0xFF0878F9)
                          : const Color(0xFF64748B),
                    ),
                  ),

                  const SizedBox(height: 14),

                  FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      title,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: selected
                            ? const Color(0xFF0878F9)
                            : const Color(0xFF1E293B),
                        letterSpacing: 0.3,
                      ),
                    ),
                  ),

                  if (subtitle != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      subtitle!,
                      textAlign: TextAlign.center,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
