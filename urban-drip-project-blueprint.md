# Urban Drip — Full Stack E-Commerce Application Blueprint

> **Brand:** Urban Drip | **Domain:** urbandrip.net | **Tagline:** "Wear the legend. Live the drip."
> **Verticals:** Anime Streetwear | Gymwear & Activewear | Sports Clothing (Pickleball)

---

## Tech Stack

| Layer | Technology | Purpose | Cost |
|-------|-----------|---------|------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS | SSR storefront + admin panel | Free (Vercel) |
| Backend | Next.js API Routes (Route Handlers) | REST API — no separate server | Free (Vercel) |
| Database | PostgreSQL via Supabase | Users, products, orders, reviews, loyalty | Free tier |
| Auth | Supabase Auth | Email, Google, Phone OTP login | Free (included) |
| Payments | Razorpay | UPI, cards, net banking | 2% per txn |
| Images | Cloudinary | Product image CDN + auto-optimization | Free (25 GB) |
| Shipping | Shiprocket API | Label generation, tracking, rate calc | ~₹50-80/order |
| Deployment | Vercel (frontend + API) + Supabase (DB) | Hosting | Free |

**Total monthly fixed cost: ₹0/mo**

---

## Project Structure

```
urban-drip/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (fonts, theme, navbar, footer)
│   ├── page.tsx                  # Homepage
│   ├── globals.css               # Tailwind + custom styles
│   │
│   ├── (storefront)/             # Customer-facing pages
│   │   ├── products/
│   │   │   ├── page.tsx          # Product listing (grid, filters, search)
│   │   │   └── [slug]/
│   │   │       └── page.tsx      # Product detail page
│   │   ├── collections/
│   │   │   └── [collection]/
│   │   │       └── page.tsx      # Collection page (Anime, Gym, Pickleball)
│   │   ├── cart/
│   │   │   └── page.tsx          # Shopping cart
│   │   ├── checkout/
│   │   │   └── page.tsx          # Checkout + Razorpay
│   │   └── account/
│   │       ├── page.tsx          # Account dashboard
│   │       ├── orders/
│   │       │   └── page.tsx      # Order history + tracking
│   │       ├── addresses/
│   │       │   └── page.tsx      # Saved addresses
│   │       └── loyalty/
│   │           └── page.tsx      # Loyalty points
│   │
│   ├── (auth)/                   # Auth pages
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   │
│   ├── (admin)/                  # Admin panel (protected)
│   │   ├── layout.tsx            # Admin sidebar layout
│   │   ├── dashboard/page.tsx    # Overview — revenue, orders, top SKUs
│   │   ├── products/
│   │   │   ├── page.tsx          # Product list + CRUD
│   │   │   └── [id]/page.tsx     # Edit product + variants
│   │   ├── orders/
│   │   │   ├── page.tsx          # All orders + status
│   │   │   └── [id]/page.tsx     # Order detail + Shiprocket
│   │   ├── inventory/page.tsx    # Size-wise stock view
│   │   ├── reviews/page.tsx      # Review moderation
│   │   └── customers/page.tsx    # Customer list + loyalty
│   │
│   └── api/                      # API Route Handlers
│       ├── products/
│       │   ├── route.ts          # GET all, POST new
│       │   └── [id]/route.ts     # GET one, PUT, DELETE
│       ├── orders/
│       │   ├── route.ts          # GET all, POST new order
│       │   └── [id]/route.ts     # GET one, PATCH status
│       ├── cart/
│       │   └── route.ts          # GET, POST, PUT, DELETE cart items
│       ├── auth/
│       │   └── callback/route.ts # Supabase auth callback
│       ├── payments/
│       │   ├── create/route.ts   # Create Razorpay order
│       │   └── webhook/route.ts  # Razorpay webhook verification
│       ├── shipping/
│       │   ├── rates/route.ts    # Get Shiprocket rates
│       │   └── track/route.ts    # Get tracking info
│       ├── reviews/
│       │   └── route.ts          # GET, POST, PATCH (moderate)
│       ├── loyalty/
│       │   └── route.ts          # GET points, POST redeem
│       └── upload/
│           └── route.ts          # Cloudinary image upload
│
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── MobileMenu.tsx
│   │   └── AdminSidebar.tsx
│   ├── product/
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProductGallery.tsx
│   │   ├── SizeSelector.tsx
│   │   ├── AddToCartButton.tsx
│   │   └── ReviewSection.tsx
│   ├── cart/
│   │   ├── CartItem.tsx
│   │   ├── CartSummary.tsx
│   │   └── CartDrawer.tsx
│   ├── checkout/
│   │   ├── AddressForm.tsx
│   │   ├── PaymentButton.tsx
│   │   └── OrderConfirmation.tsx
│   ├── admin/
│   │   ├── StatsCard.tsx
│   │   ├── RevenueChart.tsx
│   │   ├── OrdersTable.tsx
│   │   └── InventoryGrid.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       ├── Badge.tsx
│       ├── Skeleton.tsx
│       └── Toast.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client
│   │   ├── server.ts             # Server Supabase client
│   │   └── admin.ts              # Service role client (API routes)
│   ├── razorpay.ts               # Razorpay SDK init + helpers
│   ├── cloudinary.ts             # Cloudinary upload + URL helpers
│   ├── shiprocket.ts             # Shiprocket API client
│   └── utils.ts                  # Formatters, validators, helpers
│
├── hooks/
│   ├── useCart.ts                 # Cart state management
│   ├── useAuth.ts                # Auth state + user info
│   └── useProducts.ts            # Product fetching + filtering
│
├── types/
│   └── index.ts                  # TypeScript interfaces
│
├── public/
│   ├── fonts/                    # Custom brand fonts
│   ├── logo.svg
│   └── og-image.jpg              # Social share image
│
├── middleware.ts                  # Auth protection for /admin routes
├── tailwind.config.ts
├── next.config.ts
├── package.json
├── tsconfig.json
└── .env.local                    # Environment variables (never commit)
```

---

## Database Schema (Supabase PostgreSQL)

### users (extends Supabase auth.users)
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  loyalty_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### products
```sql
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  collection TEXT NOT NULL, -- 'anime', 'gymwear', 'pickleball'
  category TEXT NOT NULL,   -- 'tshirt', 'hoodie', 'shorts', etc.
  fit_type TEXT DEFAULT 'regular', -- 'regular', 'oversized'
  material TEXT DEFAULT 'Cotton',
  pattern TEXT DEFAULT 'Graphic Print',
  neck_style TEXT DEFAULT 'Round Neck',
  sleeve_type TEXT DEFAULT 'Half Sleeve',
  subject_character TEXT,   -- 'Itachi', 'Vegeta', etc.
  color TEXT DEFAULT 'Black',
  color_map TEXT DEFAULT 'Black',
  images TEXT[] DEFAULT '{}', -- Cloudinary URLs
  bullet_points TEXT[] DEFAULT '{}',
  backend_keywords TEXT,
  hsn_code TEXT DEFAULT '61051010',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### product_variants
```sql
CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE NOT NULL,
  size TEXT NOT NULL,       -- 'XS', 'S', 'M', 'L', 'XL', '2XL'
  price DECIMAL(10,2) NOT NULL,
  mrp DECIMAL(10,2) NOT NULL,
  stock INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(product_id, size)
);
```

### addresses
```sql
CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### orders
```sql
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,  -- UD-20260422-001
  user_id UUID REFERENCES profiles(id),
  address_id UUID REFERENCES addresses(id),
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'
  )),
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  shiprocket_order_id TEXT,
  shiprocket_shipment_id TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  loyalty_points_earned INTEGER DEFAULT 0,
  loyalty_points_redeemed INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### order_items
```sql
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id),
  product_title TEXT NOT NULL,
  size TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL
);
```

### reviews
```sql
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  user_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT,
  images TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### loyalty_transactions
```sql
CREATE TABLE public.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  type TEXT NOT NULL CHECK (type IN ('earned', 'redeemed', 'expired', 'adjustment')),
  points INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### cart_items (for persistent cart)
```sql
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, variant_id)
);
```

---

## Environment Variables (.env.local)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Razorpay
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_key_id

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name

# Shiprocket
SHIPROCKET_EMAIL=your_email
SHIPROCKET_PASSWORD=your_password

# App
NEXT_PUBLIC_APP_URL=https://urbandrip.net
```

---

## Design System — Urban Drip Brand

### Colors
```css
:root {
  --ud-black:    #0A0A0A;
  --ud-dark:     #141414;
  --ud-gray:     #1C1C1C;
  --ud-muted:    #A0A0A0;
  --ud-white:    #F5F5F5;
  --ud-accent:   #FF3B3B;   /* Primary accent — bold red */
  --ud-gold:     #D4AF37;   /* Premium / loyalty */
  --ud-neon:     #00FF88;   /* Success, CTAs */
  --ud-purple:   #8B5CF6;   /* Anime collection */
  --ud-blue:     #3B82F6;   /* Gymwear collection */
  --ud-orange:   #F97316;   /* Pickleball collection */
}
```

### Typography
- Display: **Bebas Neue** or **Oswald** (headings, hero text)
- Body: **DM Sans** or **Plus Jakarta Sans** (readable, modern)
- Accent: **Space Mono** (prices, badges, technical details)

### Design Direction
- **Dark theme primary** — black/charcoal backgrounds, high contrast
- **Anime-inspired** — bold typography, sharp angles, glitch effects on hover
- **Mobile-first** — 80%+ of Indian e-commerce traffic is mobile
- **Japanese influence** — subtle kanji/katakana decorative elements
- **Social proof heavy** — ratings, order count, trending badges

---

## Build Phases

### Phase 1: Foundation (Days 1-3)
- [x] Finalize tech stack
- [ ] Initialize Next.js project with TypeScript + Tailwind
- [ ] Set up Supabase project + create all database tables
- [ ] Configure Supabase Auth (email + Google + phone OTP)
- [ ] Set up Cloudinary account + upload helper
- [ ] Create environment variables
- [ ] Set up project on GitHub

### Phase 2: Backend API Routes (Days 4-10)
- [ ] Products API (CRUD + search + filter)
- [ ] Auth middleware + admin role check
- [ ] Cart API (add, update, remove, get)
- [ ] Orders API (create, update status, get history)
- [ ] Razorpay integration (create order, verify payment, webhook)
- [ ] Shiprocket integration (create shipment, get tracking)
- [ ] Reviews API (submit, moderate, get by product)
- [ ] Loyalty API (earn points, redeem, get balance)
- [ ] Cloudinary upload API

### Phase 3: Storefront UI (Days 10-18)
- [ ] Root layout (Navbar, Footer, fonts, theme)
- [ ] Homepage (hero, featured products, collections, testimonials)
- [ ] Product listing page (grid, filters, search, sort, pagination)
- [ ] Product detail page (gallery, size selector, reviews, add to cart)
- [ ] Collection pages (Anime, Gymwear, Pickleball)
- [ ] Cart page / drawer
- [ ] Checkout flow (address → payment → confirmation)
- [ ] User account (orders, addresses, loyalty)
- [ ] Auth pages (login, register, forgot password)
- [ ] Mobile responsive — every page

### Phase 4: Admin Panel (Days 18-24)
- [ ] Admin layout (sidebar navigation)
- [ ] Dashboard (revenue chart, order stats, top SKUs, low stock alerts)
- [ ] Product management (add/edit/delete, manage variants, upload images)
- [ ] Order management (list, update status, Shiprocket labels)
- [ ] Inventory view (size-wise stock, bulk update)
- [ ] Review moderation (approve/reject queue)
- [ ] Customer management (list, loyalty overview)

### Phase 5: SEO + Performance (Days 24-27)
- [ ] Meta tags + Open Graph for all pages
- [ ] JSON-LD structured data (Product, Organization)
- [ ] Sitemap.xml generation
- [ ] robots.txt
- [ ] Image optimization via Cloudinary (auto WebP, lazy load)
- [ ] Google Analytics 4 + Meta Pixel integration
- [ ] Core Web Vitals optimization

### Phase 6: Deploy + Go Live (Days 27-30)
- [ ] Push to GitHub
- [ ] Deploy to Vercel
- [ ] Point urbandrip.net DNS to Vercel
- [ ] Razorpay production keys
- [ ] Shiprocket production keys
- [ ] End-to-end testing
- [ ] Seed product catalog
- [ ] Go live

---

## Key Integration Details

### Razorpay Payment Flow
1. Customer clicks "Pay Now"
2. Frontend calls `/api/payments/create` → creates Razorpay order
3. Razorpay checkout popup opens
4. Customer completes payment (UPI/Card/Net Banking)
5. Razorpay sends webhook to `/api/payments/webhook`
6. Backend verifies signature, marks order as confirmed
7. Auto-create Shiprocket shipment

### Cloudinary Image Strategy
- Upload: Admin uploads high-res image via dashboard
- Storage: Cloudinary stores original
- Delivery: URL transforms handle everything
  - Thumbnail: `w_200,h_200,c_fill,f_auto,q_auto`
  - Product card: `w_400,h_500,c_fill,f_auto,q_auto`
  - Product page: `w_800,f_auto,q_auto`
  - Zoom: `w_1200,f_auto,q_auto`

### Shiprocket Shipping Flow
1. Order confirmed → auto-create Shiprocket order
2. Generate shipping label + AWB
3. Pickup scheduled
4. Tracking updates via Shiprocket API
5. Customer gets tracking link in order history

### Loyalty System Rules
- Earn: 1 point per ₹10 spent (₹499 order = 49 points)
- Redeem: 100 points = ₹50 discount
- Points expire after 12 months
- Bonus: 50 points on first order, 25 points on review

---

## Pricing Rules (Default)

| Fit Type | Sizes | Selling Price | MRP |
|----------|-------|--------------|-----|
| Regular Fit | XS, S, M, L, XL, 2XL | ₹499 | ₹999 |
| Oversized | S, M, L, XL, 2XL | ₹599 | ₹1,299 |

---

## SEO Keywords Reference

### Anime Streetwear
anime tshirt, naruto tshirt, itachi tshirt, one piece tshirt, dragon ball z tshirt, jujutsu kaisen tshirt, demon slayer tshirt, anime graphic tee, oversized anime tshirt, anime hoodie, manga print tshirt, anime streetwear india, attack on titan merch

### Gymwear & Activewear
gym tshirt, workout tshirt, dri fit tshirt, compression shorts, gym wear men india, sports shorts, running shorts, training tshirt, gym joggers, athletic wear, performance tshirt, quick dry tshirt, moisture wicking tshirt

### Pickleball
pickleball tshirt, pickleball clothing india, pickleball apparel, pickleball court wear, pickleball outfit, racket sports clothing

---

*Last updated: April 22, 2026*
*Brand: Urban Drip | urbandrip.net*
