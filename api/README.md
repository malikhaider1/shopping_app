# Shopping App API

Hono API for the Shopping App, hosted on Cloudflare Workers.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a D1 database:
```bash
wrangler d1 create shopping-db
```

3. Update `wrangler.toml` with the database ID returned from the above command.

4. Generate database migrations:
```bash
npm run db:generate
```

5. Apply migrations locally:
```bash
npm run db:migrate
```

## Environment Variables (Secrets)

Set these using `wrangler secret put <SECRET_NAME>`:

- `JWT_SECRET` - Secret key for JWT signing
- `GOOGLE_CLIENT_ID` - Google OAuth Web Client ID
- `ONESIGNAL_APP_ID` - OneSignal App ID
- `ONESIGNAL_API_KEY` - OneSignal REST API Key

Example:
```bash
wrangler secret put JWT_SECRET
# Enter your secret when prompted
```

## Development

```bash
npm run dev
```

## Deployment

```bash
npm run deploy
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/google` - Google OAuth sign-in
- `POST /api/v1/auth/guest/init` - Initialize guest user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/link-guest` - Link guest to Google account

### Users
- `GET /api/v1/users/me` - Get profile
- `PUT /api/v1/users/me` - Update profile
- `GET/POST/PUT/DELETE /api/v1/users/me/addresses` - Address management

### Products
- `GET /api/v1/products` - List products
- `GET /api/v1/products/:id` - Product details
- `GET /api/v1/products/:id/reviews` - Product reviews
- `POST /api/v1/products/:id/reviews` - Submit review
- `GET /api/v1/products/featured` - Featured products
- `GET /api/v1/products/bestsellers` - Bestsellers
- `GET /api/v1/products/new-arrivals` - New arrivals

### Categories
- `GET /api/v1/categories` - List categories (hierarchical)
- `GET /api/v1/categories/:id` - Category details
- `GET /api/v1/categories/:id/products` - Products in category

### Cart
- `GET /api/v1/cart` - Get cart
- `POST /api/v1/cart/items` - Add to cart
- `PUT /api/v1/cart/items/:id` - Update quantity
- `DELETE /api/v1/cart/items/:id` - Remove item
- `DELETE /api/v1/cart` - Clear cart
- `POST /api/v1/cart/merge` - Merge guest cart
- `POST /api/v1/cart/coupon` - Apply coupon

### Wishlist
- `GET /api/v1/wishlist` - Get wishlist
- `POST /api/v1/wishlist/items` - Add to wishlist
- `DELETE /api/v1/wishlist/items/:id` - Remove item
- `POST /api/v1/wishlist/merge` - Merge guest wishlist
- `POST /api/v1/wishlist/items/:id/move-to-cart` - Move to cart

### Orders
- `GET /api/v1/orders` - List orders
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders/:id` - Order details
- `PUT /api/v1/orders/:id/cancel` - Cancel order
- `POST /api/v1/orders/:id/return` - Initiate return
- `POST /api/v1/orders/:id/reorder` - Reorder

### Banners
- `GET /api/v1/banners` - All active banners
- `GET /api/v1/banners/:type` - Banners by type

### Notifications
- `POST /api/v1/notifications/register` - Register device
- `GET /api/v1/notifications` - Notification history
- `PUT /api/v1/notifications/:id/read` - Mark as read
- `PUT /api/v1/notifications/read-all` - Mark all as read
- `GET/PUT /api/v1/notifications/preferences` - Preferences

### Admin
- `POST /api/v1/admin/login` - Admin login
- `GET /api/v1/admin/dashboard/stats` - Dashboard stats
- Full CRUD for: products, categories, orders, users, banners, coupons, reviews
