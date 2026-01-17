import 'package:flutter/material.dart';
import 'package:carousel_slider/carousel_slider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';

class BannerCarousel extends StatefulWidget {
  const BannerCarousel({super.key});

  @override
  State<BannerCarousel> createState() => _BannerCarouselState();
}

class _BannerCarouselState extends State<BannerCarousel> {
  int _currentIndex = 0;

  final List<BannerItem> _banners = [
    BannerItem(
      id: '1',
      imageUrl: 'https://picsum.photos/800/400?random=1',
      title: 'Summer Sale',
      subtitle: 'Up to 50% off',
      gradient: [AppColors.accent, AppColors.accentDark],
    ),
    BannerItem(
      id: '2',
      imageUrl: 'https://picsum.photos/800/400?random=2',
      title: 'New Collection',
      subtitle: 'Just Arrived',
      gradient: [AppColors.secondary, AppColors.secondaryDark],
    ),
    BannerItem(
      id: '3',
      imageUrl: 'https://picsum.photos/800/400?random=3',
      title: 'Flash Deal',
      subtitle: 'Limited Time Only',
      gradient: [AppColors.primary, AppColors.primaryDark],
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        CarouselSlider.builder(
          itemCount: _banners.length,
          options: CarouselOptions(
            height: 180,
            viewportFraction: 0.92,
            enlargeCenterPage: true,
            autoPlay: true,
            autoPlayInterval: const Duration(seconds: 5),
            autoPlayAnimationDuration: const Duration(milliseconds: 800),
            onPageChanged: (index, reason) {
              setState(() => _currentIndex = index);
            },
          ),
          itemBuilder: (context, index, realIndex) {
            final banner = _banners[index];
            return Container(
              margin: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                gradient: LinearGradient(
                  colors: banner.gradient,
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                boxShadow: [
                  BoxShadow(
                    color: banner.gradient.first.withOpacity(0.3),
                    blurRadius: 15,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Stack(
                children: [
                  // Background Pattern
                  Positioned(
                    right: -50,
                    bottom: -50,
                    child: Icon(
                      Icons.shopping_bag_rounded,
                      size: 200,
                      color: Colors.white.withOpacity(0.1),
                    ),
                  ),

                  // Content
                  Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          banner.title,
                          style: AppTypography.h3.copyWith(
                            color: AppColors.white,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          banner.subtitle,
                          style: AppTypography.bodyLarge.copyWith(
                            color: AppColors.white.withOpacity(0.8),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.white,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            'Shop Now',
                            style: AppTypography.buttonSmall.copyWith(
                              color: banner.gradient.first,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        ),

        // Indicators
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            _banners.length,
            (index) => AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              margin: const EdgeInsets.symmetric(horizontal: 4),
              width: _currentIndex == index ? 24 : 8,
              height: 8,
              decoration: BoxDecoration(
                color:
                    _currentIndex == index
                        ? AppColors.accent
                        : AppColors.lightGrey,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class BannerItem {
  final String id;
  final String imageUrl;
  final String title;
  final String subtitle;
  final List<Color> gradient;

  BannerItem({
    required this.id,
    required this.imageUrl,
    required this.title,
    required this.subtitle,
    required this.gradient,
  });
}
