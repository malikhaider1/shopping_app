import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';

class OrderDetailScreen extends StatelessWidget {
  final String orderId;

  const OrderDetailScreen({super.key, required this.orderId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: Text('Order $orderId')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Order Status Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.success.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.success,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.check, color: AppColors.white),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Delivered',
                          style: AppTypography.labelLarge.copyWith(
                            color: AppColors.success,
                          ),
                        ),
                        Text(
                          'Your order has been delivered',
                          style: AppTypography.bodySmall,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Order Timeline
            Text('Order Timeline', style: AppTypography.h6),
            const SizedBox(height: 16),
            _TimelineItem(
              title: 'Order Placed',
              date: 'Jan 15, 2026 - 10:30 AM',
              isCompleted: true,
              isFirst: true,
            ),
            _TimelineItem(
              title: 'Confirmed',
              date: 'Jan 15, 2026 - 11:00 AM',
              isCompleted: true,
            ),
            _TimelineItem(
              title: 'Shipped',
              date: 'Jan 16, 2026 - 09:00 AM',
              isCompleted: true,
            ),
            _TimelineItem(
              title: 'Out for Delivery',
              date: 'Jan 17, 2026 - 08:00 AM',
              isCompleted: true,
            ),
            _TimelineItem(
              title: 'Delivered',
              date: 'Jan 17, 2026 - 02:30 PM',
              isCompleted: true,
              isLast: true,
            ),
            const SizedBox(height: 24),

            // Order Items
            Text('Order Items', style: AppTypography.h6),
            const SizedBox(height: 12),
            _OrderItemCard(
              name: 'Premium Product 1',
              variant: 'Red - M',
              price: 99.99,
              quantity: 2,
              imageUrl: 'https://picsum.photos/80/80?random=1',
            ),
            _OrderItemCard(
              name: 'Premium Product 2',
              variant: 'Blue - L',
              price: 149.99,
              quantity: 1,
              imageUrl: 'https://picsum.photos/80/80?random=2',
            ),
            const SizedBox(height: 24),

            // Delivery Address
            Text('Delivery Address', style: AppTypography.h6),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.white,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('John Doe', style: AppTypography.labelLarge),
                  const SizedBox(height: 4),
                  Text(
                    '123 Main St, Apt 4\nNew York, NY 10001\n+1 (555) 123-4567',
                    style: AppTypography.bodySmall,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Payment Summary
            Text('Payment Summary', style: AppTypography.h6),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.white,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  _SummaryRow('Subtotal', '\$349.97'),
                  _SummaryRow('Shipping', 'FREE'),
                  _SummaryRow('Discount', '-\$85.99', isDiscount: true),
                  const Divider(height: 24),
                  _SummaryRow('Total', '\$263.98', isTotal: true),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.money, size: 16, color: AppColors.grey),
                      const SizedBox(width: 8),
                      Text(
                        'Paid via Cash on Delivery',
                        style: AppTypography.caption,
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Actions
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {},
                    icon: const Icon(Icons.help_outline),
                    label: const Text('Need Help?'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {},
                    icon: const Icon(Icons.refresh),
                    label: const Text('Reorder'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _TimelineItem extends StatelessWidget {
  final String title;
  final String date;
  final bool isCompleted;
  final bool isFirst;
  final bool isLast;

  const _TimelineItem({
    required this.title,
    required this.date,
    required this.isCompleted,
    this.isFirst = false,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Column(
          children: [
            if (!isFirst)
              Container(
                width: 2,
                height: 20,
                color: isCompleted ? AppColors.success : AppColors.lightGrey,
              ),
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                color: isCompleted ? AppColors.success : AppColors.lightGrey,
                shape: BoxShape.circle,
              ),
              child:
                  isCompleted
                      ? const Icon(
                        Icons.check,
                        size: 14,
                        color: AppColors.white,
                      )
                      : null,
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 20,
                color: isCompleted ? AppColors.success : AppColors.lightGrey,
              ),
          ],
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: AppTypography.labelMedium),
              Text(date, style: AppTypography.caption),
            ],
          ),
        ),
      ],
    );
  }
}

class _OrderItemCard extends StatelessWidget {
  final String name;
  final String variant;
  final double price;
  final int quantity;
  final String imageUrl;

  const _OrderItemCard({
    required this.name,
    required this.variant,
    required this.price,
    required this.quantity,
    required this.imageUrl,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Image.network(
              imageUrl,
              width: 60,
              height: 60,
              fit: BoxFit.cover,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: AppTypography.labelMedium),
                Text(variant, style: AppTypography.caption),
                Text('Qty: $quantity', style: AppTypography.caption),
              ],
            ),
          ),
          Text(
            '\$${(price * quantity).toStringAsFixed(2)}',
            style: AppTypography.priceRegular,
          ),
        ],
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isTotal;
  final bool isDiscount;

  const _SummaryRow(
    this.label,
    this.value, {
    this.isTotal = false,
    this.isDiscount = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style:
                isTotal ? AppTypography.labelLarge : AppTypography.bodyMedium,
          ),
          Text(
            value,
            style:
                isTotal
                    ? AppTypography.priceLarge
                    : isDiscount
                    ? AppTypography.bodyMedium.copyWith(
                      color: AppColors.success,
                    )
                    : AppTypography.bodyMedium,
          ),
        ],
      ),
    );
  }
}
