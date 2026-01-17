import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  void _onGoogleSignIn(BuildContext context) {
    // TODO: Implement Google Sign In
    context.go('/home');
  }

  void _onContinueAsGuest(BuildContext context) {
    // TODO: Initialize guest user
    context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [AppColors.primary, AppColors.primaryDark],
            stops: [0.0, 0.6],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Top Section with Logo
              Expanded(
                flex: 2,
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                            width: 100,
                            height: 100,
                            decoration: BoxDecoration(
                              color: AppColors.white,
                              borderRadius: BorderRadius.circular(25),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.2),
                                  blurRadius: 20,
                                  offset: const Offset(0, 10),
                                ),
                              ],
                            ),
                            child: const Icon(
                              Icons.shopping_bag_rounded,
                              size: 50,
                              color: AppColors.accent,
                            ),
                          )
                          .animate()
                          .fadeIn(duration: 600.ms)
                          .scale(delay: 200.ms, duration: 400.ms),
                      const SizedBox(height: 24),
                      Text(
                        'Welcome to BRAND',
                        style: AppTypography.h3.copyWith(
                          color: AppColors.white,
                        ),
                      ).animate().fadeIn(delay: 400.ms, duration: 600.ms),
                      const SizedBox(height: 8),
                      Text(
                        'Your premium shopping destination',
                        style: AppTypography.bodyMedium.copyWith(
                          color: AppColors.white.withOpacity(0.7),
                        ),
                      ).animate().fadeIn(delay: 600.ms, duration: 600.ms),
                    ],
                  ),
                ),
              ),

              // Bottom Section with Login Options
              Container(
                padding: const EdgeInsets.all(24),
                decoration: const BoxDecoration(
                  color: AppColors.white,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const SizedBox(height: 16),

                    // Google Sign In Button
                    SizedBox(
                          width: double.infinity,
                          height: 56,
                          child: ElevatedButton.icon(
                            onPressed: () => _onGoogleSignIn(context),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.white,
                              foregroundColor: AppColors.textPrimary,
                              elevation: 2,
                              side: const BorderSide(
                                color: AppColors.lightGrey,
                              ),
                            ),
                            icon: Image.network(
                              'https://www.google.com/favicon.ico',
                              width: 24,
                              height: 24,
                              errorBuilder:
                                  (context, error, stackTrace) =>
                                      const Icon(Icons.g_mobiledata, size: 24),
                            ),
                            label: const Text('Continue with Google'),
                          ),
                        )
                        .animate()
                        .fadeIn(delay: 400.ms, duration: 500.ms)
                        .slideY(begin: 0.3, end: 0),

                    const SizedBox(height: 16),

                    // Divider
                    Row(
                      children: [
                        const Expanded(child: Divider()),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Text('or', style: AppTypography.bodySmall),
                        ),
                        const Expanded(child: Divider()),
                      ],
                    ).animate().fadeIn(delay: 500.ms, duration: 500.ms),

                    const SizedBox(height: 16),

                    // Continue as Guest Button
                    SizedBox(
                          width: double.infinity,
                          height: 56,
                          child: OutlinedButton(
                            onPressed: () => _onContinueAsGuest(context),
                            child: const Text('Continue as Guest'),
                          ),
                        )
                        .animate()
                        .fadeIn(delay: 600.ms, duration: 500.ms)
                        .slideY(begin: 0.3, end: 0),

                    const SizedBox(height: 24),

                    // Terms and Privacy
                    Text(
                      'By continuing, you agree to our Terms of Service and Privacy Policy',
                      style: AppTypography.caption,
                      textAlign: TextAlign.center,
                    ).animate().fadeIn(delay: 700.ms, duration: 500.ms),

                    const SizedBox(height: 16),
                  ],
                ),
              ).animate().fadeIn(duration: 600.ms).slideY(begin: 0.2, end: 0),
            ],
          ),
        ),
      ),
    );
  }
}
