-- BSH Inventory Database Schema
-- "I'm helping with databases!" - Ralph Wiggum

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- INVENTORY ITEMS TABLE
-- ============================================
CREATE TABLE public.inventory_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'liquor' CHECK (category IN ('liquor', 'beer', 'wine', 'food', 'supplies')),
  par_level INTEGER NOT NULL DEFAULT 0,
  current_count INTEGER NOT NULL DEFAULT 0,
  cost_per_unit DECIMAL(10,2) DEFAULT 0,
  unit_type TEXT DEFAULT 'bottle',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Everyone can view inventory
CREATE POLICY "Anyone can view inventory" ON public.inventory_items
  FOR SELECT USING (true);

-- Managers and admins can insert
CREATE POLICY "Managers and admins can insert" ON public.inventory_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Staff can update counts, managers/admins can update everything
CREATE POLICY "Users can update inventory" ON public.inventory_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'staff')
    )
  );

-- Only admins can delete
CREATE POLICY "Only admins can delete" ON public.inventory_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- INVENTORY LOGS TABLE (audit trail)
-- ============================================
CREATE TABLE public.inventory_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  previous_count INTEGER NOT NULL,
  new_count INTEGER NOT NULL,
  action TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

-- Everyone can view logs
CREATE POLICY "Anyone can view logs" ON public.inventory_logs
  FOR SELECT USING (true);

-- Authenticated users can insert logs
CREATE POLICY "Authenticated users can insert logs" ON public.inventory_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update inventory and create log
CREATE OR REPLACE FUNCTION public.update_inventory_count(
  p_item_id UUID,
  p_new_count INTEGER,
  p_notes TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_old_count INTEGER;
BEGIN
  -- Get current count
  SELECT current_count INTO v_old_count
  FROM public.inventory_items
  WHERE id = p_item_id;

  -- Update the item
  UPDATE public.inventory_items
  SET
    current_count = p_new_count,
    updated_at = NOW(),
    updated_by = auth.uid()
  WHERE id = p_item_id;

  -- Create log entry
  INSERT INTO public.inventory_logs (item_id, user_id, previous_count, new_count, action, notes)
  VALUES (p_item_id, auth.uid(), v_old_count, p_new_count, 'count_update', p_notes);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_inventory_items_category ON public.inventory_items(category);
CREATE INDEX idx_inventory_items_code ON public.inventory_items(code);
CREATE INDEX idx_inventory_logs_item_id ON public.inventory_logs(item_id);
CREATE INDEX idx_inventory_logs_created_at ON public.inventory_logs(created_at DESC);

-- ============================================
-- SAMPLE DATA (optional - comment out if not needed)
-- ============================================
-- INSERT INTO public.inventory_items (code, name, category, par_level, current_count, cost_per_unit, unit_type) VALUES
-- ('TITO-750', 'Tito''s Vodka 750ml', 'liquor', 6, 4, 19.99, 'bottle'),
-- ('JACK-750', 'Jack Daniel''s 750ml', 'liquor', 4, 2, 24.99, 'bottle'),
-- ('PATRON-750', 'Patron Silver 750ml', 'liquor', 3, 1, 44.99, 'bottle'),
-- ('BUD-CASE', 'Budweiser (Case 24)', 'beer', 10, 8, 22.99, 'case'),
-- ('CHARD-750', 'Kendall Jackson Chardonnay', 'wine', 6, 5, 14.99, 'bottle');
