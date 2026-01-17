import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';

class OrdersScreen extends StatelessWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final orders = [
      OrderData(
        id: 'ORD-12345',
        status: 'Delivered',
        date: 'Jan 15, 2026',
        total: 263.98,
        itemCount: 3,
      ),
      OrderData(
        id: 'ORD-12344',
        status: 'Shipped',
        date: 'Jan 12, 2026',
        total: 149.99,
        itemCount: 1,
      ),
      OrderData(
        id: 'ORD-12343',
        status: 'Processing',
        date: 'Jan 10, 2026',
        total: 89.99,
        itemCount: 2,
      ),
      OrderData(
        id: 'ORD-12342',
        status: 'Cancelled',
        date: 'Jan 5, 2026',
        total: 199.99,
        itemCount: 1,
      ),
    ];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('My Orders')),
      body:
          orders.isEmpty
              ? _buildEmptyOrders(context)
              : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: orders.length,
                itemBuilder:
                    (context, index) => _OrderCard(
                      order: orders[index],
                      onTap: () => context.push('/order/${orders[index].id}'),
                    ),
              ),
    );
  }

  Widget _buildEmptyOrders(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.receipt_long_outlined, size: 80, color: AppColors.grey),
          const SizedBox(height: 16),
          Text('No orders yet', style: AppTypography.h5),
          const SizedBox(height: 8),
          Text(
            'Your order history will appear here',
            style: AppTypography.bodyMedium.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => context.go('/home'),
            child: const Text('Start Shopping'),
          ),
        ],
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  final OrderData order;
  final VoidCallback onTap;

  const _OrderCard({required this.order, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(order.id, style: AppTypography.labelLarge),
                _StatusChip(status: order.status),
              ],
            ),
            const SizedBox(height: 8),
            Text(order.date, style: AppTypography.caption),
            const Divider(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${order.itemCount} items',
                  style: AppTypography.bodyMedium,
                ),
                Text(
                  '\$${order.total.toStringAsFixed(2)}',
                  style: AppTypography.priceRegular,
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: onTap,
                    child: const Text('View Details'),
                  ),
                ),
                if (order.status == 'Delivered') ...[
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {},
                      child: const Text('Reorder'),
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String status;

  const _StatusChip({required this.status});

  @override
  Widget build(BuildContext context) {
    Color color;
    switch (status.toLowerCase()) {
      case 'delivered':
        color = AppColors.success;
        break;
      case 'shipped':
        color = AppColors.info;
        break;
      case 'processing':
        color = AppColors.warning;
        break;
      case 'cancelled':
        color = AppColors.error;
        break;
      default:
        color = AppColors.grey;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status,
        style: AppTypography.labelSmall.copyWith(color: color),
      ),
    );
  }
}

class OrderData {
  final String id;
  final String status;
  final String date;
  final double total;
  final int itemCount;

  OrderData({
    required this.id,
    required this.status,
    required this.date,
    required this.total,
    required this.itemCount,
  });
}
