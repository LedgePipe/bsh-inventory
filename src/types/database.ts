export type UserRole = 'admin' | 'manager' | 'staff'

export type InventoryCategory = 'liquor' | 'beer' | 'wine' | 'food' | 'supplies'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: UserRole
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: UserRole
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: UserRole
          created_at?: string
          updated_at?: string
        }
      }
      inventory_items: {
        Row: {
          id: string
          code: string
          name: string
          category: InventoryCategory
          par_level: number
          current_count: number
          cost_per_unit: number
          unit_type: string
          notes: string | null
          created_at: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          code: string
          name: string
          category?: InventoryCategory
          par_level: number
          current_count?: number
          cost_per_unit?: number
          unit_type?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          code?: string
          name?: string
          category?: InventoryCategory
          par_level?: number
          current_count?: number
          cost_per_unit?: number
          unit_type?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
          updated_by?: string | null
        }
      }
      inventory_logs: {
        Row: {
          id: string
          item_id: string
          user_id: string
          previous_count: number
          new_count: number
          action: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          item_id: string
          user_id: string
          previous_count: number
          new_count: number
          action: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          user_id?: string
          previous_count?: number
          new_count?: number
          action?: string
          notes?: string | null
          created_at?: string
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type InventoryItem = Database['public']['Tables']['inventory_items']['Row']
export type InventoryItemInsert = Database['public']['Tables']['inventory_items']['Insert']
export type InventoryLog = Database['public']['Tables']['inventory_logs']['Row']
export type InventoryLogInsert = Database['public']['Tables']['inventory_logs']['Insert']

// Extended type with updater profile info
export type InventoryItemWithUpdater = InventoryItem & {
  updater?: { email: string; full_name: string | null } | null
}

// ============================================
// Story 2: Beer, Wine, Pepsi & Glassware Types
// ============================================

export type DistributorCategory = 'beer' | 'wine'
export type BeerUnitType = 'cases' | 'kegs' | 'sixtels'
export type SubmissionType = 'beer' | 'wine' | 'pepsi' | 'glassware'

// Distributor
export interface Distributor {
  id: string
  name: string
  category: DistributorCategory
  reminder_days: string
  created_at: string
  updated_by: string | null
}

// Beer Item
export interface BeerItem {
  id: string
  distributor_id: string
  product_name: string
  unit_type: BeerUnitType
  par_level: number
  current_count: number
  last_counted_by: string | null
  last_counted_at: string | null
  created_at: string
}

export interface BeerItemWithDistributor extends BeerItem {
  distributor?: Distributor | null
  counter?: { email: string; full_name: string | null } | null
}

// Wine Item
export interface WineItem {
  id: string
  distributor_id: string
  product_name: string
  bottle_size: string
  par_level: number
  current_count: number
  last_counted_by: string | null
  last_counted_at: string | null
  created_at: string
}

export interface WineItemWithDistributor extends WineItem {
  distributor?: Distributor | null
  counter?: { email: string; full_name: string | null } | null
}

// Pepsi Item
export interface PepsiItem {
  id: string
  product_name: string
  par_level: number
  current_count: number
  last_counted_by: string | null
  last_counted_at: string | null
  created_at: string
}

export interface PepsiItemWithCounter extends PepsiItem {
  counter?: { email: string; full_name: string | null } | null
}

// Glassware Item
export interface GlasswareItem {
  id: string
  product_name: string
  par_level: number
  current_count: number
  last_counted_by: string | null
  last_counted_at: string | null
  created_at: string
}

export interface GlasswareItemWithCounter extends GlasswareItem {
  counter?: { email: string; full_name: string | null } | null
}

// Count Submission (audit trail)
export interface CountSubmission {
  id: string
  submitted_by: string
  submission_type: SubmissionType
  items_data: Record<string, unknown>
  submitted_at: string
  notification_sent: boolean
}

// Notification
export interface Notification {
  id: string
  title: string
  message: string | null
  type: string
  read_by: string[]
  created_at: string
}

// Edited counts tracking (for submit feature)
export interface EditedCount {
  itemId: string
  newCount: number
  productName: string
  parLevel: number
}
