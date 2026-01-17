import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';

class AddressScreen extends StatelessWidget {
  const AddressScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final addresses = [
      AddressData(
        id: '1',
        label: 'Home',
        name: 'John Doe',
        phone: '+1 (555) 123-4567',
        address: '123 Main St, Apt 4, New York, NY 10001',
        isDefault: true,
      ),
      AddressData(
        id: '2',
        label: 'Office',
        name: 'John Doe',
        phone: '+1 (555) 987-6543',
        address: '456 Business Ave, Suite 200, New York, NY 10002',
        isDefault: false,
      ),
    ];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('My Addresses')),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: addresses.length,
        itemBuilder:
            (context, index) => _AddressCard(
              address: addresses[index],
              onEdit: () {},
              onDelete: () {},
              onSetDefault: () {},
            ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {},
        icon: const Icon(Icons.add),
        label: const Text('Add Address'),
      ),
    );
  }
}

class _AddressCard extends StatelessWidget {
  final AddressData address;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  final VoidCallback onSetDefault;

  const _AddressCard({
    required this.address,
    required this.onEdit,
    required this.onDelete,
    required this.onSetDefault,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        border:
            address.isDefault
                ? Border.all(color: AppColors.accent, width: 2)
                : null,
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  address.label,
                  style: AppTypography.labelSmall.copyWith(
                    color: AppColors.primary,
                  ),
                ),
              ),
              if (address.isDefault) ...[
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.success.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    'Default',
                    style: AppTypography.labelSmall.copyWith(
                      color: AppColors.success,
                    ),
                  ),
                ),
              ],
              const Spacer(),
              PopupMenuButton<String>(
                onSelected: (value) {
                  switch (value) {
                    case 'edit':
                      onEdit();
                      break;
                    case 'delete':
                      onDelete();
                      break;
                    case 'default':
                      onSetDefault();
                      break;
                  }
                },
                itemBuilder:
                    (context) => [
                      const PopupMenuItem(value: 'edit', child: Text('Edit')),
                      if (!address.isDefault)
                        const PopupMenuItem(
                          value: 'default',
                          child: Text('Set as Default'),
                        ),
                      const PopupMenuItem(
                        value: 'delete',
                        child: Text('Delete'),
                      ),
                    ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(address.name, style: AppTypography.labelLarge),
          const SizedBox(height: 4),
          Text(address.phone, style: AppTypography.bodySmall),
          const SizedBox(height: 4),
          Text(
            address.address,
            style: AppTypography.bodySmall.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

class AddressData {
  final String id;
  final String label;
  final String name;
  final String phone;
  final String address;
  final bool isDefault;

  AddressData({
    required this.id,
    required this.label,
    required this.name,
    required this.phone,
    required this.address,
    required this.isDefault,
  });
}
