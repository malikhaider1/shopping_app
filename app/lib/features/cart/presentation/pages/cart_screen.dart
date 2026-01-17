import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final List<CartItem> _cartItems = [
    CartItem(
      id: '1',
      name: 'Premium Product 1',
      variant: 'Red - M',
      price: 99.99,
      quantity: 2,
      imageUrl: 'https://picsum.photos/100/100?random=1',
    ),
    CartItem(
      id: '2',
      name: 'Premium Product 2',
      variant: 'Blue - L',
      price: 149.99,
      quantity: 1,
      imageUrl: 'https://picsum.photos/100/100?random=2',
    ),
    CartItem(
      id: '3',
      name: 'Premium Product 3',
      variant: 'Black - S',
      price: 79.99,
      quantity: 1,
      imageUrl: 'https://picsum.photos/100/100?random=3',
    ),
  ];

  String _couponCode = '';
  double _discount = 0;

  double get _subtotal =>
      _cartItems.fold(0, (sum, item) => sum + (item.price * item.quantity));
  double get _shipping => _subtotal > 100 ? 0 : 9.99;
  double get _total => _subtotal - _discount + _shipping;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('My Cart'),
        actions: [
          if (_cartItems.isNotEmpty)
            TextButton(
              onPressed: () {
                setState(() => _cartItems.clear());
              },
              child: Text('Clear', style: TextStyle(color: AppColors.error)),
            ),
        ],
      ),
      body:
          _cartItems.isEmpty
              ? _buildEmptyCart()
              : Column(
                children: [
                  Expanded(
                    child: ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _cartItems.length,
                      itemBuilder:
                          (context, index) => _CartItemCard(
                            item: _cartItems[index],
                            onQuantityChanged: (quantity) {
                              setState(() {
                                if (quantity <= 0) {
                                  _cartItems.removeAt(index);
                                } else {
                                  _cartItems[index] = _cartItems[index]
                                      .copyWith(quantity: quantity);
                                }
                              });
                            },
                            onRemove: () {
                              setState(() => _cartItems.removeAt(index));
                            },
                          ),
                    ),
                  ),
                  _buildBottomSection(),
                ],
              ),
    );
  }

  Widget _buildEmptyCart() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.shopping_cart_outlined, size: 80, color: AppColors.grey),
          const SizedBox(height: 16),
          Text('Your cart is empty', style: AppTypography.h5),
          const SizedBox(height: 8),
          Text(
            'Add items to start shopping',
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

  Widget _buildBottomSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Coupon
            Row(
              children: [
                Expanded(
                  child: TextField(
                    onChanged: (value) => _couponCode = value,
                    decoration: InputDecoration(
                      hintText: 'Enter coupon code',
                      isDense: true,
                      prefixIcon: const Icon(
                        Icons.local_offer_outlined,
                        size: 20,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                ElevatedButton(
                  onPressed: () {
                    if (_couponCode.toUpperCase() == 'SAVE20') {
                      setState(() => _discount = _subtotal * 0.2);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Coupon applied! 20% off'),
                        ),
                      );
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 14,
                    ),
                  ),
                  child: const Text('Apply'),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Summary
            _SummaryRow(
              label: 'Subtotal',
              value: '\$${_subtotal.toStringAsFixed(2)}',
            ),
            if (_discount > 0)
              _SummaryRow(
                label: 'Discount',
                value: '-\$${_discount.toStringAsFixed(2)}',
                isDiscount: true,
              ),
            _SummaryRow(
              label: 'Shipping',
              value:
                  _shipping == 0 ? 'FREE' : '\$${_shipping.toStringAsFixed(2)}',
            ),
            const Divider(height: 24),
            _SummaryRow(
              label: 'Total',
              value: '\$${_total.toStringAsFixed(2)}',
              isTotal: true,
            ),
            const SizedBox(height: 16),

            // Checkout Button
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: () => context.push('/checkout'),
                child: const Text('Proceed to Checkout'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CartItemCard extends StatelessWidget {
  final CartItem item;
  final ValueChanged<int> onQuantityChanged;
  final VoidCallback onRemove;

  const _CartItemCard({
    required this.item,
    required this.onQuantityChanged,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10),
        ],
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: CachedNetworkImage(
              imageUrl: item.imageUrl,
              width: 80,
              height: 80,
              fit: BoxFit.cover,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.name, style: AppTypography.labelLarge, maxLines: 2),
                Text(item.variant, style: AppTypography.caption),
                const SizedBox(height: 8),
                Text(
                  '\$${item.price.toStringAsFixed(2)}',
                  style: AppTypography.priceRegular.copyWith(
                    color: AppColors.accent,
                  ),
                ),
              ],
            ),
          ),
          Column(
            children: [
              IconButton(
                onPressed: onRemove,
                icon: Icon(
                  Icons.delete_outline,
                  color: AppColors.error,
                  size: 20,
                ),
              ),
              Container(
                decoration: BoxDecoration(
                  color: AppColors.surfaceVariant,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      onPressed: () => onQuantityChanged(item.quantity - 1),
                      icon: const Icon(Icons.remove, size: 18),
                      constraints: const BoxConstraints(
                        minWidth: 32,
                        minHeight: 32,
                      ),
                    ),
                    Text('${item.quantity}', style: AppTypography.labelMedium),
                    IconButton(
                      onPressed: () => onQuantityChanged(item.quantity + 1),
                      icon: const Icon(Icons.add, size: 18),
                      constraints: const BoxConstraints(
                        minWidth: 32,
                        minHeight: 32,
                      ),
                    ),
                  ],
                ),
              ),
            ],
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

  const _SummaryRow({
    required this.label,
    required this.value,
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

class CartItem {
  final String id;
  final String name;
  final String variant;
  final double price;
  final int quantity;
  final String imageUrl;

  CartItem({
    required this.id,
    required this.name,
    required this.variant,
    required this.price,
    required this.quantity,
    required this.imageUrl,
  });

  CartItem copyWith({int? quantity}) {
    return CartItem(
      id: id,
      name: name,
      variant: variant,
      price: price,
      quantity: quantity ?? this.quantity,
      imageUrl: imageUrl,
    );
  }
}
