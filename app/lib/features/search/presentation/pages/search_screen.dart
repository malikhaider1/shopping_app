import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  final List<String> _recentSearches = [
    'Shoes',
    'Electronics',
    'Watch',
    'Headphones',
  ];
  final List<String> _trendingSearches = [
    'Summer Sale',
    'New Arrivals',
    'Best Sellers',
    'Wireless Earbuds',
    'Smart Watch',
  ];
  bool _showResults = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        titleSpacing: 0,
        title: Container(
          margin: const EdgeInsets.only(right: 16),
          child: TextField(
            controller: _searchController,
            autofocus: true,
            decoration: InputDecoration(
              hintText: 'Search products...',
              isDense: true,
              filled: true,
              fillColor: AppColors.surfaceVariant,
              prefixIcon: const Icon(Icons.search, size: 20),
              suffixIcon:
                  _searchController.text.isNotEmpty
                      ? IconButton(
                        icon: const Icon(Icons.close, size: 20),
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _showResults = false);
                        },
                      )
                      : null,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
            onChanged: (value) {
              setState(() => _showResults = value.isNotEmpty);
            },
            onSubmitted: (value) {
              if (value.isNotEmpty) {
                context.push(
                  '/products?title=${Uri.encodeComponent(value)}&search=$value',
                );
              }
            },
          ),
        ),
      ),
      body: _showResults ? _buildSearchResults() : _buildSearchSuggestions(),
    );
  }

  Widget _buildSearchSuggestions() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Recent Searches
          if (_recentSearches.isNotEmpty) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Recent Searches', style: AppTypography.labelLarge),
                TextButton(
                  onPressed: () => setState(() => _recentSearches.clear()),
                  child: const Text('Clear'),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children:
                  _recentSearches
                      .map(
                        (search) => GestureDetector(
                          onTap: () {
                            _searchController.text = search;
                            setState(() => _showResults = true);
                          },
                          child: Chip(
                            label: Text(search),
                            deleteIcon: const Icon(Icons.close, size: 16),
                            onDeleted:
                                () => setState(
                                  () => _recentSearches.remove(search),
                                ),
                          ),
                        ),
                      )
                      .toList(),
            ),
            const SizedBox(height: 24),
          ],

          // Trending
          Text('Trending Now', style: AppTypography.labelLarge),
          const SizedBox(height: 12),
          ...List.generate(
            _trendingSearches.length,
            (index) => ListTile(
              leading: Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: AppColors.accent.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    '${index + 1}',
                    style: AppTypography.labelMedium.copyWith(
                      color: AppColors.accent,
                    ),
                  ),
                ),
              ),
              title: Text(_trendingSearches[index]),
              trailing: const Icon(
                Icons.trending_up,
                color: AppColors.success,
                size: 20,
              ),
              contentPadding: EdgeInsets.zero,
              onTap: () {
                _searchController.text = _trendingSearches[index];
                setState(() => _showResults = true);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchResults() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 10,
      itemBuilder:
          (context, index) => ListTile(
            leading: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.network(
                'https://picsum.photos/60/60?random=${index + 100}',
                width: 50,
                height: 50,
                fit: BoxFit.cover,
              ),
            ),
            title: Text(
              'Search Result ${index + 1}',
              style: AppTypography.labelMedium,
            ),
            subtitle: Text(
              '\$${(49.99 + index * 10).toStringAsFixed(2)}',
              style: AppTypography.priceRegular.copyWith(
                color: AppColors.accent,
                fontSize: 14,
              ),
            ),
            trailing: const Icon(Icons.chevron_right),
            contentPadding: EdgeInsets.zero,
            onTap: () => context.push('/product/search-$index'),
          ),
    );
  }
}
