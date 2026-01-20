import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminLayout } from './components/layout/AdminLayout.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { ProductList } from './pages/ProductList.tsx';
import { OrderList } from './pages/OrderList.tsx';
import { CategoryList } from './pages/CategoryList.tsx';
import { BannerList } from './pages/BannerList.tsx';
import { CouponList } from './pages/CouponList.tsx';
import { ReviewList } from './pages/ReviewList.tsx';
import { NotificationList } from './pages/NotificationList.tsx';
import { UserList } from './pages/UserList.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';

import { AuthProvider } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage.tsx';
import { ProtectedRoute } from './components/auth/ProtectedRoute.tsx';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="products" element={<ProductList />} />
                <Route path="categories" element={<CategoryList />} />
                <Route path="orders" element={<OrderList />} />
                <Route path="users" element={<UserList />} />
                <Route path="banners" element={<BannerList />} />
                <Route path="coupons" element={<CouponList />} />
                <Route path="reviews" element={<ReviewList />} />
                <Route path="notifications" element={<NotificationList />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<Dashboard />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
