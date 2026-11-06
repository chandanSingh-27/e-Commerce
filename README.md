# ShopEase — Full-Stack MERN E-Commerce Web Application

ShopEase is a full-stack, responsive E-Commerce web application built using **React.js (Vite)**, **Node.js**, **Express.js**, and **MongoDB Atlas (Mongoose)**. Designed as a robust internship capstone project, it demonstrates clean architecture, role-based access control, secure authentication, transactional checkout with oversell prevention, and real-time inventory management.

---

## 🌟 Key Features

### User & Authentication
- **Role-Based Access Control (RBAC):** Distinct permissions for **User** and **Admin** roles.
- **Secure Password Hashing:** Powered by `bcryptjs` with pre-save hashing hooks and protected schemas (`select: false`).
- **JWT Authentication:** Stateful JSON Web Token generation with expiration checks and route guards.
- **Tamper Protection:** Public registration strictly forces the `user` role; users cannot escalate privileges via request payloads.
- **Session Protection:** Protected endpoints strictly verify the token and ownership (`req.user._id`), preventing users from accessing others' carts or orders.

### Product Catalog
- **15 Pre-Seeded Realistic Products:** Categorized under Electronics, Fashion, Home & Kitchen, Sports, and Books.
- **Search & Filtering:** Real-time search by keyword, category filtering, and price sorting (Low to High, High to Low).
- **Pagination:** Clean server-side and client-side pagination for optimal performance.
- **Stock Indicators:** Live stock quantities, dynamic out-of-stock badges, and quantity caps.
- **Soft Delete Architecture:** Soft-deleted products are hidden from the store catalog, blocked from new purchases, but permanently preserved in historical order records. Admins can restore them anytime.

### Shopping Cart & Checkout
- **Database-Persisted Cart:** Cart items sync directly with MongoDB; shopping carts survive browser refreshes and multi-device logins.
- **Combined Stock Validation:** Cart additions validate existing cart quantity + newly requested quantity against live inventory.
- **Atomic MongoDB Transactions:** Order placement uses a strict MongoDB Atlas session transaction:
  - Sequentially verifies live stock and product status.
  - Decrements product inventory conditionally (`stock >= quantity`) to prevent concurrent overselling.
  - Captures immutable price and product name snapshots in the order record.
  - Empties user cart atomically upon success.
  - Automatically rolls back all operations if any item fails or goes out of stock.

### Order Tracking & Cancellation
- **Fulfillment State Machine:** `Pending` → `Confirmed` → `Shipped` → `Delivered` | `Cancelled`.
- **Safe Inventory Restorations:** When an eligible order (`Pending` or `Confirmed`) is cancelled by an administrator, the inventory is atomically restored within a database transaction.
- **Double-Cancellation Prevention:** Uses conditional status queries (`status: { $in: ['Pending', 'Confirmed'] }`) so concurrent cancellations cannot duplicate stock restorations.

### Admin Dashboard
- **Analytics & Key Metrics:** Live overview of Total Products, Total Orders, Total Users, and Total Revenue (calculated exclusively from confirmed, shipped, and delivered orders).
- **Product Management:** Complete CRUD interface — Add products, edit existing items (using HTTP `PATCH`), soft delete, and restore deleted products.
- **Order Management:** View orders across all customers with dropdown controls to update fulfillment status.

---

## 🏗️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, React Router v6, Plain CSS (Custom Design System), Lucide React Icons |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas, Mongoose ODM |
| **Security** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `helmet`, `express-rate-limit`, `cors` |
| **Validation** | `express-validator` (centralized request validation middleware) |
| **HTTP Client** | `axios` with custom request/response interceptors |

---

## 📂 Project Structure

```text
ecommerce-app/
├── client/                     # Frontend React (Vite) Application
│   ├── src/
│   │   ├── components/         # Reusable UI components (Navbar, ProductCard, Loader, etc.)
│   │   ├── context/            # Global state (AuthContext, CartContext)
│   │   ├── pages/              # 14 routed views (Home, Products, Cart, Checkout, Admin, etc.)
│   │   ├── services/           # Axios API services
│   │   ├── App.jsx             # Route definitions and layout wrapper
│   │   ├── index.css           # Global design tokens and base styles
│   │   └── main.jsx            # Application entry point
│   ├── .env.example            # Client environment template
│   ├── index.html              # HTML shell
│   ├── package.json            # Client dependencies
│   └── vite.config.js          # Vite build configuration
├── server/                     # Backend Express REST API
│   ├── config/                 # Database connection (Mongoose Atlas)
│   ├── controllers/            # Route business logic (auth, product, cart, order, admin)
│   ├── middleware/             # auth, errorHandler, validate
│   ├── models/                 # Mongoose schemas (User, Product, Cart, Order)
│   ├── routes/                 # REST endpoints with express-validator rules
│   ├── scripts/                # Database seed script (seed.js)
│   ├── utils/                  # AppError and token generator
│   ├── .env.example            # Server environment template
│   ├── app.js                  # Express middleware setup
│   ├── package.json            # Server dependencies
│   └── server.js               # Server entry point
├── .gitignore                  # Git exclusion rules
├── package.json                # Root orchestration scripts
└── README.md                   # Project documentation
```

---

## ⚙️ Environment Configuration

### 1. Server Configuration (`server/.env`)
Create a file named `.env` inside the `server/` directory:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/ecommerce_db?retryWrites=true&w=majority
JWT_SECRET=YOUR_SUPER_SECRET_RANDOM_KEY_AT_LEAST_32_CHARACTERS_LONG
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

# Admin credentials for initial database seed
# IMPORTANT: Change all three before running the seed script!
ADMIN_NAME=Super Admin
ADMIN_EMAIL=admin@store.com
ADMIN_PASSWORD=SecureAdminPass123!
```

> [!CAUTION]
> The seed script strictly verifies administrator credentials and will **refuse to run** if `ADMIN_PASSWORD` contains placeholder strings or is left blank. Real credentials must never be committed to source control.

### 2. Client Configuration (`client/.env`)
Create a file named `.env` inside the `client/` directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 🚀 Getting Started & Installation

### Step 1: Install Dependencies
Run from the root directory to install all packages across root, backend, and frontend:
```bash
npm run install:all
```
*(Or run `npm install` individually in root, `server/`, and `client/`.)*

### Step 2: Seed the Database
Ensure your MongoDB Atlas cluster is running and your current IP address is whitelisted in MongoDB Atlas Network Access.

Run the seed script:
```bash
npm run seed
```
- First run creates the administrator user with hashed password and populates 15 realistic products.
- Re-running the seed script is non-destructive by default and will not wipe existing products.
- To completely reset catalog data, run with `--force`:
  ```bash
  node server/scripts/seed.js --force
  ```

### Step 3: Run the Development Server
Start both the Express backend and React Vite frontend concurrently:
```bash
npm run dev
```

The application will be accessible at:
- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000/api](http://localhost:5000/api)

---

## 🔑 Default Roles & Accounts

After running the database seed script:

| Role | Email | Password | Access |
|---|---|---|---|
| **Admin** | Value in `ADMIN_EMAIL` (e.g. `admin@store.com`) | Value in `ADMIN_PASSWORD` | Storefront + Admin Dashboard (`/admin`), product CRUD, order status management |
| **Customer** | Register any new account at `/register` | User chosen | Storefront, product catalog, personal cart, checkout, order history |

---

## 📡 REST API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a customer account (rate limited: 10 req/15 min)
- `POST /api/auth/login` — Authenticate and receive JWT token
- `GET /api/auth/me` — Get current logged-in user profile (Protected)
- `POST /api/auth/logout` — Logout user (Protected)

### Products (`/api/products`)
- `GET /api/products` — List active products (supports `search`, `category`, `sort`, `page`, `limit`)
- `GET /api/products/:id` — Get single product details
- `POST /api/products` — Create a new product (Admin only)
- `PATCH /api/products/:id` — Partial update of product fields (Admin only)
- `DELETE /api/products/:id` — Soft delete product (Admin only)
- `PATCH /api/products/:id/restore` — Restore soft-deleted product (Admin only)

### Cart (`/api/cart`)
- `GET /api/cart` — Fetch authenticated user's cart (filters out deleted items with warnings)
- `POST /api/cart/items` — Add product to cart (validates existing + new quantity against stock)
- `PATCH /api/cart/items/:productId` — Update item quantity in cart
- `DELETE /api/cart/items/:productId` — Remove item from cart

### Orders (`/api/orders`)
- `POST /api/orders` — Place order from cart (Mandatory MongoDB Transaction)
- `GET /api/orders/my-orders` — View logged-in customer's order history
- `GET /api/orders/:id` — View detailed order summary (Owner or Admin only)
- `GET /api/orders` — View all store orders (Admin only)
- `PATCH /api/orders/:id/status` — Advance order status or cancel (Admin only, handles stock restore)

### Admin Analytics (`/api/admin`)
- `GET /api/admin/stats` — Dashboard metrics: Total Products, Total Orders, Total Users, Total Revenue
- `GET /api/admin/users` — List registered customer accounts

---

## 🛡️ Security & Architectural Details

1. **Transactional Checkout Guarantee:**
   Because MongoDB Atlas operates as a replica set, checkout uses native Mongoose sessions and transactions. Operations inside the transaction run sequentially to ensure full rollback on any stock depletion or concurrent order conflict.
2. **Snapshot Pricing:**
   Orders do not rely on live product prices after placement. The unit price and product name are snapshotted when the order is created, guaranteeing that financial history remains accurate even if catalog prices change later.
3. **Smart Axios Interceptor:**
   The client response interceptor redirects expired sessions on protected API routes while allowing 401 credential errors on `/auth/login` and 409 errors on `/auth/register` to surface directly to the form without interrupting user state.
4. **XSS & Storage Trade-offs:**
   JWT is stored in `localStorage` for beginner readability and easy inspection during evaluation. For higher enterprise security, cookies marked `HttpOnly`, `Secure`, and `SameSite=Strict` can replace `localStorage` (instructions documented in backend controllers).

---

## 📜 Deployment Instructions

### Production Build
1. Build the React frontend:
   ```bash
   npm run build
   ```
   This generates an optimized static bundle in `client/dist/`.
2. Start the Express server in production mode:
   ```bash
   npm start
   ```

### Hosting Recommendations
- **Frontend:** Vercel, Netlify, or Render Static Sites (Set `VITE_API_BASE_URL` to the production backend URL).
- **Backend:** Render, Railway, or Heroku (Set environment variables `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, and `CLIENT_URL`).
- **Database:** MongoDB Atlas (Ensure production IP addresses or VPC peering are configured).
