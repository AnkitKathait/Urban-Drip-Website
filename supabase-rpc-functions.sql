-- Run this in Supabase SQL Editor after creating your tables.
-- These are atomic helper functions called by the API routes.

-- ─── Decrement stock (prevents going below 0) ─────────────────────────────────
CREATE OR REPLACE FUNCTION decrement_stock(p_variant_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE product_variants
  SET stock = GREATEST(0, stock - p_quantity)
  WHERE id = p_variant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Increment loyalty points ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_loyalty_points(p_user_id UUID, p_points INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET loyalty_points = loyalty_points + p_points,
      updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Decrement loyalty points (prevents going below 0) ────────────────────────
CREATE OR REPLACE FUNCTION decrement_loyalty_points(p_user_id UUID, p_points INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET loyalty_points = GREATEST(0, loyalty_points - p_points),
      updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Auto-create profile on signup ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Row Level Security policies ──────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants     ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews              ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items           ENABLE ROW LEVEL SECURITY;

-- profiles: users read/update own, admins read all
CREATE POLICY "profiles: own read"   ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles: own update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- products: anyone can read active, admins manage all
CREATE POLICY "products: public read" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "products: admin all"   ON products FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- product_variants: anyone can read active
CREATE POLICY "variants: public read" ON product_variants FOR SELECT USING (is_active = true);
CREATE POLICY "variants: admin all"   ON product_variants FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- addresses: users manage own
CREATE POLICY "addresses: own all" ON addresses FOR ALL USING (auth.uid() = user_id);

-- orders: users read own, admins all
CREATE POLICY "orders: own read"  ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "orders: own insert" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "orders: admin all" ON orders FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- order_items: users read via order
CREATE POLICY "order_items: read via order" ON order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.user_id = auth.uid()));
CREATE POLICY "order_items: admin all" ON order_items FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- reviews: public read approved, authenticated insert
CREATE POLICY "reviews: public read"   ON reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "reviews: auth insert"   ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews: admin all"     ON reviews FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- loyalty_transactions: users read own
CREATE POLICY "loyalty: own read"   ON loyalty_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "loyalty: admin all"  ON loyalty_transactions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- cart_items: users manage own
CREATE POLICY "cart: own all" ON cart_items FOR ALL USING (auth.uid() = user_id);
