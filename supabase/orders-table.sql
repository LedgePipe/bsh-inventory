-- Orders table to track order history
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  order_type TEXT NOT NULL CHECK (order_type IN ('beer', 'wine', 'pepsi', 'glassware', 'liquor')),
  distributor_id UUID REFERENCES distributors(id),
  distributor_name TEXT,
  items JSONB NOT NULL,
  total_items INTEGER NOT NULL,
  status TEXT DEFAULT 'generated' CHECK (status IN ('generated', 'sent', 'received', 'cancelled')),
  notes TEXT,
  email_sent_at TIMESTAMPTZ,
  email_recipients TEXT[]
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view orders"
  ON orders FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert orders"
  ON orders FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update orders"
  ON orders FOR UPDATE TO authenticated USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Index for faster queries
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_order_type ON orders(order_type);
