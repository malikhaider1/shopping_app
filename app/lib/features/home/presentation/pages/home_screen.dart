import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:carousel_slider/carousel_slider.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../widgets/home_section_header.dart';
import '../widgets/product_card.dart';
import '../widgets/category_chip.dart';
import '../widgets/banner_carousel.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          // App Bar
          SliverAppBar(
            floating: true,
            pinned: true,
            expandedHeight: 60,
            backgroundColor: AppColors.white,
            surfaceTintColor: Colors.transparent,
            title: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.shopping_bag_rounded,
                    color: AppColors.white,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  'BRAND',
                  style: AppTypography.h5.copyWith(
                    letterSpacing: 2,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
            actions: [
              IconButton(
                onPressed: () => context.push('/search'),
                icon: const Icon(Icons.search_rounded),
              ),
              IconButton(
                onPressed: () {},
                icon: Stack(
                  children: [
                    const Icon(Icons.notifications_outlined),
                    Positioned(
                      top: 0,
                      right: 0,
                      child: Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: AppColors.accent,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          // Search Bar
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: GestureDetector(
                onTap: () => context.push('/search'),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 14,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceVariant,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.search, color: AppColors.grey),
                      const SizedBox(width: 12),
                      Text(
                        'Search products...',
                        style: AppTypography.bodyMedium.copyWith(
                          color: AppColors.textHint,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Banner Carousel
          const SliverToBoxAdapter(child: BannerCarousel()),

          // Categories Section
          SliverToBoxAdapter(
            child: Column(
              children: [
                HomeSectionHeader(
                  title: 'Categories',
                  onSeeAll: () => context.push('/categories'),
                ),
                SizedBox(
                  height: 100,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    children: const [
                      CategoryChip(
                        name: 'Electronics',
                        icon: Icons.devices_rounded,
                        color: Color(0xFF6366F1),
                      ),
                      CategoryChip(
                        name: 'Fashion',
                        icon: Icons.checkroom_rounded,
                        color: Color(0xFFEC4899),
                      ),
                      CategoryChip(
                        name: 'Home',
                        icon: Icons.home_rounded,
                        color: Color(0xFF22C55E),
                      ),
                      CategoryChip(
                        name: 'Beauty',
                        icon: Icons.face_rounded,
                        color: Color(0xFFF59E0B),
                      ),
                      CategoryChip(
                        name: 'Sports',
                        icon: Icons.sports_basketball_rounded,
                        color: Color(0xFF3B82F6),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Featured Products
          SliverToBoxAdapter(
            child: HomeSectionHeader(
              title: 'Featured Products',
              onSeeAll: () => context.push('/products?title=Featured'),
            ),
          ),
          SliverToBoxAdapter(
            child: SizedBox(
              height: 280,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: 5,
                itemBuilder:
                    (context, index) => Padding(
                      padding: const EdgeInsets.only(right: 12),
                      child: ProductCard(
                        productId: 'product-$index',
                        name: 'Premium Product ${index + 1}',
                        price: 99.99 + (index * 20),
                        originalPrice: 149.99 + (index * 20),
                        imageUrl: 'https://picsum.photos/200/200?random=$index',
                        rating: 4.5,
                        reviewCount: 128,
                      ),
                    ),
              ),
            ),
          ),

          // New Arrivals
          SliverToBoxAdapter(
            child: HomeSectionHeader(
              title: 'New Arrivals',
              onSeeAll: () => context.push('/products?title=New+Arrivals'),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            sliver: SliverGrid(
              delegate: SliverChildBuilderDelegate(
                (context, index) => ProductCard(
                  productId: 'new-$index',
                  name: 'New Product ${index + 1}',
                  price: 79.99 + (index * 15),
                  originalPrice: null,
                  imageUrl:
                      'https://picsum.photos/200/200?random=${index + 10}',
                  rating: 4.0 + (index * 0.2),
                  reviewCount: 50 + (index * 10),
                  isNew: true,
                ),
                childCount: 4,
              ),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.65,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
              ),
            ),
          ),

          // Best Sellers
          SliverToBoxAdapter(
            child: HomeSectionHeader(
              title: 'Best Sellers',
              onSeeAll: () => context.push('/products?title=Best+Sellers'),
            ),
          ),
          SliverToBoxAdapter(
            child: SizedBox(
              height: 280,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: 5,
                itemBuilder:
                    (context, index) => Padding(
                      padding: const EdgeInsets.only(right: 12),
                      child: ProductCard(
                        productId: 'bestseller-$index',
                        name: 'Best Seller ${index + 1}',
                        price: 129.99 + (index * 25),
                        originalPrice: 179.99 + (index * 25),
                        imageUrl:
                            'https://picsum.photos/200/200?random=${index + 20}',
                        rating: 4.8,
                        reviewCount: 500 + (index * 100),
                        isBestSeller: true,
                      ),
                    ),
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 100)),
        ],
      ),
    );
  }
}
