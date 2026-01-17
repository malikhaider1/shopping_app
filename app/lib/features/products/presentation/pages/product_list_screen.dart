import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../presentation/widgets/product_card.dart';

class ProductListScreen extends StatefulWidget {
  final String title;
  final String? categoryId;

  const ProductListScreen({super.key, required this.title, this.categoryId});

  @override
  State<ProductListScreen> createState() => _ProductListScreenState();
}

class _ProductListScreenState extends State<ProductListScreen> {
  bool _isGridView = true;
  String _sortBy = 'newest';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(widget.title),
        actions: [
          IconButton(
            onPressed: () => context.push('/search'),
            icon: const Icon(Icons.search_rounded),
          ),
          IconButton(
            onPressed: () {
              setState(() => _isGridView = !_isGridView);
            },
            icon: Icon(
              _isGridView ? Icons.view_list_rounded : Icons.grid_view_rounded,
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter & Sort Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: AppColors.white,
            child: Row(
              children: [
                // Filter Button
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _showFilterSheet,
                    icon: const Icon(Icons.tune_rounded, size: 18),
                    label: const Text('Filter'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                // Sort Button
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _showSortSheet,
                    icon: const Icon(Icons.sort_rounded, size: 18),
                    label: const Text('Sort'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Product Count
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('24 Products', style: AppTypography.bodySmall),
                Text(
                  'Sorted by: ${_getSortLabel(_sortBy)}',
                  style: AppTypography.bodySmall,
                ),
              ],
            ),
          ),

          // Products Grid/List
          Expanded(child: _isGridView ? _buildGridView() : _buildListView()),
        ],
      ),
    );
  }

  Widget _buildGridView() {
    return GridView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.65,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
      ),
      itemCount: 10,
      itemBuilder:
          (context, index) => ProductCard(
            productId: 'product-$index',
            name: 'Product ${index + 1}',
            price: 99.99 + (index * 15),
            originalPrice: index % 2 == 0 ? 149.99 + (index * 15) : null,
            imageUrl: 'https://picsum.photos/200/200?random=${index + 30}',
            rating: 4.0 + (index % 10) / 10,
            reviewCount: 50 + (index * 10),
          ),
    );
  }

  Widget _buildListView() {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: 10,
      itemBuilder:
          (context, index) => _ProductListItem(
            productId: 'product-$index',
            name: 'Product ${index + 1}',
            price: 99.99 + (index * 15),
            originalPrice: index % 2 == 0 ? 149.99 + (index * 15) : null,
            imageUrl: 'https://picsum.photos/200/200?random=${index + 40}',
            rating: 4.0 + (index % 10) / 10,
            reviewCount: 50 + (index * 10),
          ),
    );
  }

  void _showFilterSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder:
          (context) => DraggableScrollableSheet(
            initialChildSize: 0.7,
            minChildSize: 0.5,
            maxChildSize: 0.9,
            expand: false,
            builder:
                (context, scrollController) =>
                    _FilterSheet(scrollController: scrollController),
          ),
    );
  }

  void _showSortSheet() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder:
          (context) => _SortSheet(
            currentSort: _sortBy,
            onSort: (value) {
              setState(() => _sortBy = value);
              Navigator.pop(context);
            },
          ),
    );
  }

  String _getSortLabel(String sortBy) {
    switch (sortBy) {
      case 'price_asc':
        return 'Price: Low to High';
      case 'price_desc':
        return 'Price: High to Low';
      case 'rating':
        return 'Top Rated';
      case 'popular':
        return 'Popular';
      default:
        return 'Newest';
    }
  }
}

class _ProductListItem extends StatelessWidget {
  final String productId;
  final String name;
  final double price;
  final double? originalPrice;
  final String imageUrl;
  final double rating;
  final int reviewCount;

  const _ProductListItem({
    required this.productId,
    required this.name,
    required this.price,
    this.originalPrice,
    required this.imageUrl,
    required this.rating,
    required this.reviewCount,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/product/$productId'),
      child: Container(
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
              child: Image.network(
                imageUrl,
                width: 100,
                height: 100,
                fit: BoxFit.cover,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name, style: AppTypography.labelLarge, maxLines: 2),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(
                        Icons.star_rounded,
                        size: 14,
                        color: AppColors.star,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '$rating ($reviewCount)',
                        style: AppTypography.caption,
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Text(
                        '\$${price.toStringAsFixed(2)}',
                        style: AppTypography.priceLarge,
                      ),
                      if (originalPrice != null) ...[
                        const SizedBox(width: 8),
                        Text(
                          '\$${originalPrice!.toStringAsFixed(2)}',
                          style: AppTypography.priceStrikethrough,
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            IconButton(
              onPressed: () {},
              icon: const Icon(
                Icons.favorite_outline_rounded,
                color: AppColors.grey,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FilterSheet extends StatelessWidget {
  final ScrollController scrollController;

  const _FilterSheet({required this.scrollController});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Filter', style: AppTypography.h5),
              TextButton(onPressed: () {}, child: const Text('Reset')),
            ],
          ),
        ),
        const Divider(),
        Expanded(
          child: ListView(
            controller: scrollController,
            padding: const EdgeInsets.all(16),
            children: [
              Text('Price Range', style: AppTypography.labelLarge),
              const SizedBox(height: 12),
              // Price slider would go here
              const SizedBox(height: 24),
              Text('Categories', style: AppTypography.labelLarge),
              // Category checkboxes would go here
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Apply Filters'),
            ),
          ),
        ),
      ],
    );
  }
}

class _SortSheet extends StatelessWidget {
  final String currentSort;
  final ValueChanged<String> onSort;

  const _SortSheet({required this.currentSort, required this.onSort});

  @override
  Widget build(BuildContext context) {
    final options = [
      ('newest', 'Newest'),
      ('popular', 'Popular'),
      ('price_asc', 'Price: Low to High'),
      ('price_desc', 'Price: High to Low'),
      ('rating', 'Top Rated'),
    ];

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Text('Sort By', style: AppTypography.h5),
        ),
        ...options.map(
          (option) => ListTile(
            title: Text(option.$2),
            trailing:
                currentSort == option.$1
                    ? const Icon(Icons.check_rounded, color: AppColors.accent)
                    : null,
            onTap: () => onSort(option.$1),
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}
