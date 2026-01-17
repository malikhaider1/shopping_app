import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';

class ProductDetailScreen extends StatefulWidget {
  final String productId;

  const ProductDetailScreen({super.key, required this.productId});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  int _selectedImageIndex = 0;
  String? _selectedSize;
  String? _selectedColor;
  int _quantity = 1;
  bool _isFavorite = false;

  final List<String> _images = [
    'https://picsum.photos/400/400?random=1',
    'https://picsum.photos/400/400?random=2',
    'https://picsum.photos/400/400?random=3',
    'https://picsum.photos/400/400?random=4',
  ];

  final List<String> _sizes = ['S', 'M', 'L', 'XL', 'XXL'];
  final List<Color> _colors = [
    Colors.black,
    Colors.white,
    Colors.red,
    Colors.blue,
    Colors.green,
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          // Custom App Bar with Images
          SliverAppBar(
            expandedHeight: 400,
            pinned: true,
            backgroundColor: AppColors.white,
            leading: GestureDetector(
              onTap: () => context.pop(),
              child: Container(
                margin: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.white,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 8,
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.arrow_back,
                  color: AppColors.textPrimary,
                ),
              ),
            ),
            actions: [
              GestureDetector(
                onTap: () {
                  setState(() => _isFavorite = !_isFavorite);
                },
                child: Container(
                  margin: const EdgeInsets.all(8),
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.white,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 8,
                      ),
                    ],
                  ),
                  child: Icon(
                    _isFavorite ? Icons.favorite : Icons.favorite_outline,
                    color:
                        _isFavorite ? AppColors.accent : AppColors.textPrimary,
                  ),
                ),
              ),
              GestureDetector(
                onTap: () {},
                child: Container(
                  margin: const EdgeInsets.all(8),
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.white,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 8,
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.share_outlined,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Column(
                children: [
                  Expanded(
                    child: PageView.builder(
                      itemCount: _images.length,
                      onPageChanged: (index) {
                        setState(() => _selectedImageIndex = index);
                      },
                      itemBuilder:
                          (context, index) => CachedNetworkImage(
                            imageUrl: _images[index],
                            fit: BoxFit.cover,
                          ),
                    ),
                  ),
                  // Image Indicators
                  Container(
                    padding: const EdgeInsets.all(16),
                    color: AppColors.white,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(
                        _images.length,
                        (index) => GestureDetector(
                          onTap:
                              () => setState(() => _selectedImageIndex = index),
                          child: Container(
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            width: 50,
                            height: 50,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color:
                                    _selectedImageIndex == index
                                        ? AppColors.accent
                                        : AppColors.lightGrey,
                                width: 2,
                              ),
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(6),
                              child: CachedNetworkImage(
                                imageUrl: _images[index],
                                fit: BoxFit.cover,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Product Info
          SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: AppColors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Brand & Name
                  Text(
                    'BRAND NAME',
                    style: AppTypography.overline.copyWith(
                      color: AppColors.accent,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text('Premium Product Title', style: AppTypography.h4),
                  const SizedBox(height: 8),

                  // Rating
                  Row(
                    children: [
                      ...List.generate(
                        5,
                        (index) => Icon(
                          index < 4
                              ? Icons.star_rounded
                              : Icons.star_half_rounded,
                          color: AppColors.star,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text('4.5', style: AppTypography.labelLarge),
                      const SizedBox(width: 4),
                      Text('(128 reviews)', style: AppTypography.bodySmall),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Price
                  Row(
                    children: [
                      Text('\$99.99', style: AppTypography.priceLarge),
                      const SizedBox(width: 12),
                      Text('\$149.99', style: AppTypography.priceStrikethrough),
                      const SizedBox(width: 12),
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
                          '33% OFF',
                          style: AppTypography.labelSmall.copyWith(
                            color: AppColors.success,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Size Selection
                  Text('Size', style: AppTypography.labelLarge),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    children:
                        _sizes
                            .map(
                              (size) => GestureDetector(
                                onTap:
                                    () => setState(() => _selectedSize = size),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 20,
                                    vertical: 12,
                                  ),
                                  decoration: BoxDecoration(
                                    color:
                                        _selectedSize == size
                                            ? AppColors.primary
                                            : AppColors.white,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color:
                                          _selectedSize == size
                                              ? AppColors.primary
                                              : AppColors.lightGrey,
                                    ),
                                  ),
                                  child: Text(
                                    size,
                                    style: TextStyle(
                                      color:
                                          _selectedSize == size
                                              ? AppColors.white
                                              : AppColors.textPrimary,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ),
                            )
                            .toList(),
                  ),
                  const SizedBox(height: 24),

                  // Color Selection
                  Text('Color', style: AppTypography.labelLarge),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 12,
                    children:
                        _colors
                            .asMap()
                            .entries
                            .map(
                              (entry) => GestureDetector(
                                onTap:
                                    () => setState(
                                      () =>
                                          _selectedColor = entry.key.toString(),
                                    ),
                                child: Container(
                                  width: 40,
                                  height: 40,
                                  decoration: BoxDecoration(
                                    color: entry.value,
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color:
                                          _selectedColor == entry.key.toString()
                                              ? AppColors.accent
                                              : AppColors.lightGrey,
                                      width: 3,
                                    ),
                                  ),
                                  child:
                                      _selectedColor == entry.key.toString()
                                          ? Icon(
                                            Icons.check,
                                            color:
                                                entry.value == Colors.white
                                                    ? Colors.black
                                                    : Colors.white,
                                            size: 20,
                                          )
                                          : null,
                                ),
                              ),
                            )
                            .toList(),
                  ),
                  const SizedBox(height: 24),

                  // Quantity
                  Row(
                    children: [
                      Text('Quantity', style: AppTypography.labelLarge),
                      const Spacer(),
                      Container(
                        decoration: BoxDecoration(
                          color: AppColors.surfaceVariant,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            IconButton(
                              onPressed:
                                  _quantity > 1
                                      ? () => setState(() => _quantity--)
                                      : null,
                              icon: const Icon(Icons.remove),
                            ),
                            Text('$_quantity', style: AppTypography.labelLarge),
                            IconButton(
                              onPressed: () => setState(() => _quantity++),
                              icon: const Icon(Icons.add),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Description
                  Text('Description', style: AppTypography.labelLarge),
                  const SizedBox(height: 8),
                  Text(
                    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
                    style: AppTypography.bodyMedium.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),
        ],
      ),

      // Bottom Action Bar
      bottomSheet: Container(
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
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.lightGrey),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.shopping_cart_outlined),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: SizedBox(
                  height: 56,
                  child: ElevatedButton(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Added to cart!')),
                      );
                    },
                    child: Text(
                      'Add to Cart - \$${(99.99 * _quantity).toStringAsFixed(2)}',
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
