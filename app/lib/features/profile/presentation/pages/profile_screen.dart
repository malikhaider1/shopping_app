import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            backgroundColor: AppColors.primary,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppColors.primary, AppColors.primaryDark],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
                child: SafeArea(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 20),
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: AppColors.white, width: 3),
                          image: const DecorationImage(
                            image: NetworkImage(
                              'https://picsum.photos/100/100?random=user',
                            ),
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'John Doe',
                        style: AppTypography.h5.copyWith(
                          color: AppColors.white,
                        ),
                      ),
                      Text(
                        'john.doe@gmail.com',
                        style: AppTypography.bodySmall.copyWith(
                          color: AppColors.white.withOpacity(0.8),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  // Quick Stats
                  Row(
                    children: [
                      _StatCard(
                        icon: Icons.shopping_bag_outlined,
                        label: 'Orders',
                        value: '12',
                      ),
                      const SizedBox(width: 12),
                      _StatCard(
                        icon: Icons.favorite_outline,
                        label: 'Wishlist',
                        value: '5',
                      ),
                      const SizedBox(width: 12),
                      _StatCard(
                        icon: Icons.star_outline,
                        label: 'Reviews',
                        value: '8',
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Menu Items
                  _MenuSection(
                    title: 'Account',
                    items: [
                      _MenuItem(
                        icon: Icons.person_outline,
                        title: 'Edit Profile',
                        onTap: () {},
                      ),
                      _MenuItem(
                        icon: Icons.location_on_outlined,
                        title: 'Addresses',
                        onTap: () => context.push('/addresses'),
                      ),
                      _MenuItem(
                        icon: Icons.payment_outlined,
                        title: 'Payment Methods',
                        onTap: () {},
                      ),
                    ],
                  ),
                  _MenuSection(
                    title: 'Orders',
                    items: [
                      _MenuItem(
                        icon: Icons.receipt_long_outlined,
                        title: 'My Orders',
                        onTap: () => context.go('/orders'),
                      ),
                      _MenuItem(
                        icon: Icons.star_outline,
                        title: 'My Reviews',
                        onTap: () {},
                      ),
                    ],
                  ),
                  _MenuSection(
                    title: 'Settings',
                    items: [
                      _MenuItem(
                        icon: Icons.notifications_outlined,
                        title: 'Notifications',
                        onTap: () {},
                      ),
                      _MenuItem(
                        icon: Icons.language_outlined,
                        title: 'Language',
                        trailing: 'English',
                        onTap: () {},
                      ),
                      _MenuItem(
                        icon: Icons.dark_mode_outlined,
                        title: 'Dark Mode',
                        hasSwitch: true,
                        onTap: () {},
                      ),
                    ],
                  ),
                  _MenuSection(
                    title: 'Support',
                    items: [
                      _MenuItem(
                        icon: Icons.help_outline,
                        title: 'Help & FAQ',
                        onTap: () {},
                      ),
                      _MenuItem(
                        icon: Icons.chat_outlined,
                        title: 'Contact Us',
                        onTap: () {},
                      ),
                      _MenuItem(
                        icon: Icons.info_outline,
                        title: 'About',
                        onTap: () {},
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () => context.go('/login'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.error,
                        side: const BorderSide(color: AppColors.error),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      icon: const Icon(Icons.logout),
                      label: const Text('Logout'),
                    ),
                  ),
                  const SizedBox(height: 32),
                  Text('Version 1.0.0', style: AppTypography.caption),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10),
          ],
        ),
        child: Column(
          children: [
            Icon(icon, color: AppColors.accent),
            const SizedBox(height: 8),
            Text(value, style: AppTypography.h5),
            Text(label, style: AppTypography.caption),
          ],
        ),
      ),
    );
  }
}

class _MenuSection extends StatelessWidget {
  final String title;
  final List<_MenuItem> items;

  const _MenuSection({required this.title, required this.items});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Text(
            title,
            style: AppTypography.labelLarge.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            children:
                items
                    .map(
                      (item) => Column(
                        children: [
                          ListTile(
                            leading: Icon(
                              item.icon,
                              color: AppColors.textSecondary,
                            ),
                            title: Text(
                              item.title,
                              style: AppTypography.bodyMedium,
                            ),
                            trailing:
                                item.hasSwitch
                                    ? Switch(value: false, onChanged: (v) {})
                                    : item.trailing != null
                                    ? Text(
                                      item.trailing!,
                                      style: AppTypography.bodySmall,
                                    )
                                    : const Icon(
                                      Icons.chevron_right,
                                      color: AppColors.grey,
                                    ),
                            onTap: item.onTap,
                          ),
                          if (items.indexOf(item) < items.length - 1)
                            const Divider(height: 1, indent: 56),
                        ],
                      ),
                    )
                    .toList(),
          ),
        ),
      ],
    );
  }
}

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? trailing;
  final bool hasSwitch;
  final VoidCallback onTap;

  const _MenuItem({
    required this.icon,
    required this.title,
    this.trailing,
    this.hasSwitch = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) => const SizedBox.shrink();
}
