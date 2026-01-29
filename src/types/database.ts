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
