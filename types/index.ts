// ─── Database entity types ────────────────────────────────────────────────────

export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  role: 'customer' | 'admin'
  loyalty_points: number
  created_at: string
  updated_at: string
}

export type ProductCollection = 'anime' | 'sports' | 'streetwear' | 'ai' | 'gaming' | 'music'
export type FitType = 'regular' | 'oversized'
export type ProductSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL'
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned'
export type ReviewStatus = 'pending' | 'approved' | 'rejected'
export type LoyaltyType = 'earned' | 'redeemed' | 'expired' | 'adjustment'

export interface Product {
  id: string
  slug: string
  title: string
  description: string | null
  collection: ProductCollection
  category: string
  fit_type: FitType
  material: string
  pattern: string
  neck_style: string
  sleeve_type: string
  subject_character: string | null
  color: string
  color_map: string
  images: string[]
  bullet_points: string[]
  backend_keywords: string | null
  seo_title: string | null
  seo_description: string | null
  seo_keywords: string | null
  hsn_code: string
  is_active: boolean
  created_at: string
  updated_at: string
  variants?: ProductVariant[]
  avg_rating?: number
  review_count?: number
}

export interface ProductVariant {
  id: string
  product_id: string
  sku: string
  size: ProductSize
  price: number
  mrp: number
  stock: number
  is_active: boolean
}

export interface Address {
  id: string
  user_id: string
  full_name: string
  phone: string
  address_line1: string
  address_line2: string | null
  city: string
  state: string
  pincode: string
  is_default: boolean
  created_at: string
}

export interface Order {
  id: string
  order_number: string
  user_id: string
  address_id: string
  status: OrderStatus
  subtotal: number
  shipping_cost: number
  discount: number
  total: number
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  shiprocket_order_id: string | null
  shiprocket_shipment_id: string | null
  tracking_number: string | null
  tracking_url: string | null
  loyalty_points_earned: number
  loyalty_points_redeemed: number
  notes: string | null
  created_at: string
  updated_at: string
  items?: OrderItem[]
  address?: Address
}

export interface OrderItem {
  id: string
  order_id: string
  variant_id: string
  product_title: string
  size: string
  quantity: number
  price: number
  total: number
  variant?: ProductVariant & { product?: Product }
}

export interface Review {
  id: string
  product_id: string
  user_id: string
  user_name: string
  rating: number
  title: string | null
  body: string | null
  images: string[]
  status: ReviewStatus
  created_at: string
}

export interface LoyaltyTransaction {
  id: string
  user_id: string
  order_id: string | null
  type: LoyaltyType
  points: number
  description: string | null
  created_at: string
}

export interface CartItem {
  id: string
  user_id: string
  variant_id: string
  quantity: number
  created_at: string
}

// ─── Enriched / composed types ────────────────────────────────────────────────

export interface CartItemEnriched extends CartItem {
  variant: ProductVariant & { product: Product }
}

export interface ProductWithVariants extends Product {
  variants: ProductVariant[]
}

// ─── API response wrappers ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// ─── Product filters ──────────────────────────────────────────────────────────

export interface ProductFilters {
  collection?: ProductCollection
  category?: string
  fit_type?: FitType
  min_price?: number
  max_price?: number
  size?: ProductSize
  search?: string
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'popular'
  page?: number
  limit?: number
}

// ─── Razorpay ─────────────────────────────────────────────────────────────────

export interface RazorpayOrderResponse {
  id: string
  entity: string
  amount: number
  amount_paid: number
  amount_due: number
  currency: string
  receipt: string
  status: string
  created_at: number
}

export interface RazorpayPaymentSuccess {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

export interface CreateRazorpayOrderInput {
  amount: number
  currency?: string
  receipt: string
  notes?: Record<string, string>
}

// ─── Cloudinary ───────────────────────────────────────────────────────────────

export interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  width: number
  height: number
  format: string
  bytes: number
  resource_type: string
}

export type CloudinaryTransformPreset = 'thumbnail' | 'card' | 'detail' | 'zoom'

// ─── Shiprocket ───────────────────────────────────────────────────────────────

export interface ShiprocketOrderItem {
  name: string
  sku: string
  units: number
  selling_price: number
  discount: number
  tax: number
  hsn: number
}

export interface ShiprocketCreateOrderInput {
  order_id: string
  order_date: string
  pickup_location: string
  billing_customer_name: string
  billing_last_name: string
  billing_address: string
  billing_city: string
  billing_pincode: string
  billing_state: string
  billing_country: string
  billing_email: string
  billing_phone: string
  shipping_is_billing: boolean
  order_items: ShiprocketOrderItem[]
  payment_method: 'Prepaid' | 'COD'
  sub_total: number
  length: number
  breadth: number
  height: number
  weight: number
}

export interface ShiprocketTrackingResponse {
  tracking_data: {
    shipment_status: number
    shipment_track: Array<{
      date: string
      activity: string
      location: string
      'sr-status': string
    }>
    track_url: string
  }
}

// ─── Checkout ─────────────────────────────────────────────────────────────────

export interface CheckoutSession {
  items: CartItemEnriched[]
  address: Address
  subtotal: number
  shipping_cost: number
  discount: number
  total: number
  loyalty_points_to_redeem: number
}

// ─── Admin dashboard ──────────────────────────────────────────────────────────

export interface DashboardStats {
  total_revenue: number
  total_orders: number
  total_customers: number
  pending_orders: number
  low_stock_count: number
  avg_order_value: number
  revenue_today: number
  orders_today: number
}

export interface RevenueDataPoint {
  date: string
  revenue: number
  orders: number
}

export interface TopProduct {
  product_id: string
  title: string
  image: string
  total_sold: number
  total_revenue: number
}

// ─── Collection metadata ──────────────────────────────────────────────────────

export interface CollectionMeta {
  slug: ProductCollection
  title: string
  tagline: string
  description: string
  accentColor: string
  bgGradient: string
  keywords: string[]
}

// ─── Form input types ─────────────────────────────────────────────────────────

export interface AddressFormData {
  full_name: string
  phone: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  pincode: string
  is_default: boolean
}

export interface ReviewFormData {
  rating: number
  title?: string
  body?: string
  images?: File[]
}

export interface ProductFormData {
  slug: string
  title: string
  description: string
  collection: ProductCollection
  category: string
  fit_type: FitType
  material: string
  pattern: string
  neck_style: string
  sleeve_type: string
  subject_character?: string
  color: string
  color_map: string
  images: string[]
  bullet_points: string[]
  backend_keywords?: string
  hsn_code: string
  is_active: boolean
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  email: string | null
  profile: Profile | null
}

// ─── Loyalty ─────────────────────────────────────────────────────────────────

export interface LoyaltyRedemptionResult {
  points_redeemed: number
  discount_amount: number
  remaining_points: number
}
