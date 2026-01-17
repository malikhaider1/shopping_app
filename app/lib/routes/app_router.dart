import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/presentation/pages/splash_screen.dart';
import '../features/auth/presentation/pages/onboarding_screen.dart';
import '../features/auth/presentation/pages/login_screen.dart';
import '../features/home/presentation/pages/main_screen.dart';
import '../features/home/presentation/pages/home_screen.dart';
import '../features/products/presentation/pages/product_list_screen.dart';
import '../features/products/presentation/pages/product_detail_screen.dart';
import '../features/cart/presentation/pages/cart_screen.dart';
import '../features/cart/presentation/pages/checkout_screen.dart';
import '../features/wishlist/presentation/pages/wishlist_screen.dart';
import '../features/orders/presentation/pages/orders_screen.dart';
import '../features/orders/presentation/pages/order_detail_screen.dart';
import '../features/profile/presentation/pages/profile_screen.dart';
import '../features/profile/presentation/pages/address_screen.dart';
import '../features/search/presentation/pages/search_screen.dart';

final GlobalKey<NavigatorState> _rootNavigatorKey = GlobalKey<NavigatorState>();
final GlobalKey<NavigatorState> _shellNavigatorKey =
    GlobalKey<NavigatorState>();

class AppRouter {
  static final GoRouter router = GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/splash',
    debugLogDiagnostics: true,
    routes: [
      // Splash & Onboarding
      GoRoute(
        path: '/splash',
        name: 'splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/onboarding',
        name: 'onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),

      // Main Shell with Bottom Navigation
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) => MainScreen(child: child),
        routes: [
          GoRoute(
            path: '/home',
            name: 'home',
            pageBuilder:
                (context, state) => const NoTransitionPage(child: HomeScreen()),
          ),
          GoRoute(
            path: '/categories',
            name: 'categories',
            pageBuilder:
                (context, state) => const NoTransitionPage(
                  child: ProductListScreen(title: 'Categories'),
                ),
          ),
          GoRoute(
            path: '/wishlist',
            name: 'wishlist',
            pageBuilder:
                (context, state) =>
                    const NoTransitionPage(child: WishlistScreen()),
          ),
          GoRoute(
            path: '/orders',
            name: 'orders',
            pageBuilder:
                (context, state) =>
                    const NoTransitionPage(child: OrdersScreen()),
          ),
          GoRoute(
            path: '/profile',
            name: 'profile',
            pageBuilder:
                (context, state) =>
                    const NoTransitionPage(child: ProfileScreen()),
          ),
        ],
      ),

      // Product Routes
      GoRoute(
        path: '/products',
        name: 'products',
        builder: (context, state) {
          final categoryId = state.uri.queryParameters['categoryId'];
          final title = state.uri.queryParameters['title'] ?? 'Products';
          return ProductListScreen(title: title, categoryId: categoryId);
        },
      ),
      GoRoute(
        path: '/product/:id',
        name: 'productDetail',
        builder: (context, state) {
          final productId = state.pathParameters['id']!;
          return ProductDetailScreen(productId: productId);
        },
      ),

      // Cart & Checkout
      GoRoute(
        path: '/cart',
        name: 'cart',
        builder: (context, state) => const CartScreen(),
      ),
      GoRoute(
        path: '/checkout',
        name: 'checkout',
        builder: (context, state) => const CheckoutScreen(),
      ),

      // Orders
      GoRoute(
        path: '/order/:id',
        name: 'orderDetail',
        builder: (context, state) {
          final orderId = state.pathParameters['id']!;
          return OrderDetailScreen(orderId: orderId);
        },
      ),

      // Profile Sub-routes
      GoRoute(
        path: '/addresses',
        name: 'addresses',
        builder: (context, state) => const AddressScreen(),
      ),

      // Search
      GoRoute(
        path: '/search',
        name: 'search',
        builder: (context, state) => const SearchScreen(),
      ),
    ],

    // Error Page
    errorBuilder:
        (context, state) => Scaffold(
          body: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 48, color: Colors.red),
                const SizedBox(height: 16),
                Text('Page not found: ${state.uri.path}'),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => context.go('/home'),
                  child: const Text('Go Home'),
                ),
              ],
            ),
          ),
        ),
  );
}
