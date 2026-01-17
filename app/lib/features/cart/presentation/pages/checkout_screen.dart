import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  int _currentStep = 0;
  String _selectedAddress = '0';
  String _selectedPayment = 'cod';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Checkout')),
      body: Stepper(
        currentStep: _currentStep,
        onStepContinue: () {
          if (_currentStep < 2) {
            setState(() => _currentStep++);
          } else {
            _placeOrder();
          }
        },
        onStepCancel: () {
          if (_currentStep > 0) {
            setState(() => _currentStep--);
          }
        },
        controlsBuilder: (context, details) {
          return Padding(
            padding: const EdgeInsets.only(top: 16),
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: details.onStepContinue,
                    child: Text(_currentStep == 2 ? 'Place Order' : 'Continue'),
                  ),
                ),
                if (_currentStep > 0) ...[
                  const SizedBox(width: 12),
                  TextButton(
                    onPressed: details.onStepCancel,
                    child: const Text('Back'),
                  ),
                ],
              ],
            ),
          );
        },
        steps: [
          Step(
            title: const Text('Delivery Address'),
            content: _buildAddressStep(),
            isActive: _currentStep >= 0,
            state: _currentStep > 0 ? StepState.complete : StepState.indexed,
          ),
          Step(
            title: const Text('Payment Method'),
            content: _buildPaymentStep(),
            isActive: _currentStep >= 1,
            state: _currentStep > 1 ? StepState.complete : StepState.indexed,
          ),
          Step(
            title: const Text('Review Order'),
            content: _buildReviewStep(),
            isActive: _currentStep >= 2,
          ),
        ],
      ),
    );
  }

  Widget _buildAddressStep() {
    final addresses = [
      {
        'id': '0',
        'label': 'Home',
        'address': '123 Main St, Apt 4, New York, NY 10001',
      },
      {
        'id': '1',
        'label': 'Office',
        'address': '456 Business Ave, Suite 200, New York, NY 10002',
      },
    ];

    return Column(
      children: [
        ...addresses.map(
          (addr) => RadioListTile(
            value: addr['id']!,
            groupValue: _selectedAddress,
            onChanged: (value) => setState(() => _selectedAddress = value!),
            title: Text(addr['label']!, style: AppTypography.labelLarge),
            subtitle: Text(addr['address']!, style: AppTypography.bodySmall),
            contentPadding: EdgeInsets.zero,
          ),
        ),
        const SizedBox(height: 8),
        OutlinedButton.icon(
          onPressed: () {},
          icon: const Icon(Icons.add),
          label: const Text('Add New Address'),
        ),
      ],
    );
  }

  Widget _buildPaymentStep() {
    final payments = [
      {'id': 'cod', 'label': 'Cash on Delivery', 'icon': Icons.money},
      {'id': 'card', 'label': 'Credit/Debit Card', 'icon': Icons.credit_card},
      {'id': 'upi', 'label': 'UPI', 'icon': Icons.account_balance},
    ];

    return Column(
      children:
          payments
              .map(
                (payment) => RadioListTile(
                  value: payment['id'] as String,
                  groupValue: _selectedPayment,
                  onChanged:
                      (value) => setState(() => _selectedPayment = value!),
                  title: Row(
                    children: [
                      Icon(payment['icon'] as IconData, size: 20),
                      const SizedBox(width: 12),
                      Text(
                        payment['label'] as String,
                        style: AppTypography.labelLarge,
                      ),
                    ],
                  ),
                  contentPadding: EdgeInsets.zero,
                ),
              )
              .toList(),
    );
  }

  Widget _buildReviewStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Order Summary', style: AppTypography.labelLarge),
        const SizedBox(height: 12),
        _ReviewRow('Subtotal', '\$329.97'),
        _ReviewRow('Shipping', 'FREE'),
        _ReviewRow('Discount', '-\$65.99', isDiscount: true),
        const Divider(),
        _ReviewRow('Total', '\$263.98', isTotal: true),
        const SizedBox(height: 16),
        Text('Delivery Address', style: AppTypography.labelLarge),
        const SizedBox(height: 8),
        Text(
          '123 Main St, Apt 4, New York, NY 10001',
          style: AppTypography.bodySmall,
        ),
        const SizedBox(height: 16),
        Text('Payment Method', style: AppTypography.labelLarge),
        const SizedBox(height: 8),
        Text('Cash on Delivery', style: AppTypography.bodySmall),
      ],
    );
  }

  void _placeOrder() {
    showDialog(
      context: context,
      builder:
          (context) => AlertDialog(
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: AppColors.success.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.check_rounded,
                    size: 40,
                    color: AppColors.success,
                  ),
                ),
                const SizedBox(height: 16),
                Text('Order Placed!', style: AppTypography.h5),
                const SizedBox(height: 8),
                Text(
                  'Your order #ORD-12345 has been placed',
                  style: AppTypography.bodySmall,
                  textAlign: TextAlign.center,
                ),
              ],
            ),
            actions: [
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    context.go('/orders');
                  },
                  child: const Text('View Orders'),
                ),
              ),
            ],
          ),
    );
  }
}

class _ReviewRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isTotal;
  final bool isDiscount;

  const _ReviewRow(
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
