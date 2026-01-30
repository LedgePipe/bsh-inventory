'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getRandomQuote } from '@/lib/ralph-quotes'
import { InventoryItem, InventoryItemInsert, InventoryItemWithUpdater, InventoryLogInsert, Profile } from '@/types/database'
import { toast } from 'sonner'
import LoginForm from '@/components/LoginForm'
import Header from '@/components/Header'
import StatsCards from '@/components/StatsCards'
import InventoryTable from '@/components/InventoryTable'
import AddItemModal from '@/components/AddItemModal'
import EditCountModal from '@/components/EditCountModal'
import UploadCSVModal from '@/components/UploadCSVModal'
import GenerateOrderModal from '@/components/inventory/GenerateOrderModal'

interface LiquorOrderItem {
  id: string
  productName: string
  currentCount: number
  parLevel: number
  orderQty: number
}

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [items, setItems] = useState<InventoryItemWithUpdater[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItemWithUpdater | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderItems, setOrderItems] = useState<LiquorOrderItem[]>([])

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
        fetchInventory()
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
        fetchInventory()
        toast.success(`🎉 ${getRandomQuote('welcome')}`)
      }
    })

    // Real-time subscription for inventory changes
    const realtimeChannel = supabase
      .channel('inventory_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory_items' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            fetchInventory() // Refresh to get joined data
            toast('📦 New item added by another user')
          } else if (payload.eventType === 'UPDATE') {
            fetchInventory() // Refresh to get joined data
            toast('🔄 Inventory updated by another user')
          } else if (payload.eventType === 'DELETE') {
            setItems(prev => prev.filter(item => item.id !== payload.old.id))
            toast('🗑️ Item removed by another user')
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
      supabase.removeChannel(realtimeChannel)
    }
  }, [])

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (data) setProfile(data)
    if (error) console.error('Error fetching profile:', error)
  }

  async function fetchInventory() {
    const { data, error } = await supabase
      .from('inventory_items')
      .select(`
        *,
        updater:profiles!inventory_items_updated_by_fkey(email, full_name)
      `)
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (data) setItems(data as InventoryItemWithUpdater[])
    if (error) {
      console.error('Error fetching inventory:', error)
      toast.error(`😱 ${getRandomQuote('error')}`)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setItems([])
    toast(`👋 Signed out`)
  }

  async function handleAddItem(item: InventoryItemInsert) {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert(item)
      .select()
      .single()

    if (data) {
      setItems([...items, data])
      setShowAddModal(false)
      toast.success(`✅ ${item.name} added successfully`)
    }
    if (error) {
      toast.error(`⚠️ ${getRandomQuote('error')}`)
      console.error(error)
    }
  }

  async function handleUpdateCount(itemId: string, newCount: number, newPartial: number = 0) {
    const item = items.find(i => i.id === itemId)
    if (!item) return

    const now = new Date().toISOString()
    const { error } = await supabase
      .from('inventory_items')
      .update({
        current_count: newCount,
        partial_count: newPartial,
        updated_at: now,
        updated_by: user?.id
      })
      .eq('id', itemId)

    if (!error) {
      // Also create a log entry
      const oldTotal = item.current_count + (item.partial_count || 0)
      const newTotal = newCount + newPartial
      await supabase.from('inventory_logs').insert({
        item_id: itemId,
        user_id: user?.id || '',
        previous_count: item.current_count,
        new_count: newCount,
        action: 'count_update'
      })

      // Update local state with new count and updater info
      setItems(items.map(i => i.id === itemId ? {
        ...i,
        current_count: newCount,
        partial_count: newPartial,
        updated_at: now,
        updated_by: user?.id,
        updater: profile ? { email: profile.email, full_name: profile.full_name } : null
      } : i))
      setEditingItem(null)

      const diff = newTotal - oldTotal
      if (diff > 0) {
        toast.success(`➕ Added ${diff.toFixed(1)} units`)
      } else if (diff < 0) {
        toast(`➖ Removed ${Math.abs(diff).toFixed(1)} units`)
      } else {
        toast.success(`✅ Count confirmed`)
      }

      // Check if now low
      if (item.par_level > 0 && (newTotal / item.par_level) < 0.5) {
        setTimeout(() => {
          toast.warning(`⚠️ ${item.name} is below par level`)
        }, 1000)
      }
    } else {
      toast.error(`⚠️ ${getRandomQuote('error')}`)
    }
  }

  async function handleDeleteItem(itemId: string) {
    const item = items.find(i => i.id === itemId)
    if (!item) return

    if (!confirm(`Delete ${item.name}?\n\nThis action cannot be undone.`)) {
      return
    }

    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', itemId)

    if (!error) {
      setItems(items.filter(i => i.id !== itemId))
      toast(`🗑️ ${item.name} removed`)
    } else {
      toast.error(`⚠️ ${getRandomQuote('error')}`)
    }
  }

  async function handleBulkUpload(newItems: InventoryItemInsert[]) {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert(newItems)
      .select()

    if (data) {
      setItems([...items, ...data])
      setShowUploadModal(false)
      toast.success(`✅ Imported ${data.length} items`)
    }
    if (error) {
      toast.error(`⚠️ ${getRandomQuote('error')}`)
      console.error(error)
    }
  }

  function checkLowStock() {
    const lowItems = items.filter(item => {
      const total = item.current_count + (item.partial_count || 0)
      return item.par_level > 0 && (total / item.par_level) < 0.5
    })

    if (lowItems.length > 0) {
      toast.warning(`🚨 ${lowItems.length} items below par level`, {
        duration: 5000
      })

      // Send browser notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`🚨 ${lowItems.length} items low stock`, {
          body: `${getRandomQuote('lowStock')}\n${lowItems.slice(0, 3).map(i => i.name).join(', ')}`,
        })
      }
    } else {
      toast.success(`✅ All items at or above par level`)
    }
  }

  function handleGenerateOrder() {
    // Map items to order format, calculating total and order qty
    const orderData: LiquorOrderItem[] = items
      .filter(item => item.category === 'liquor') // Only liquor items
      .map(item => {
        const total = item.current_count + (item.partial_count || 0)
        return {
          id: item.id,
          productName: item.name,
          currentCount: total,
          parLevel: item.par_level,
          orderQty: Math.max(0, Math.ceil(item.par_level - total)),
        }
      })

    setOrderItems(orderData)
    setShowOrderModal(true)
  }

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600 italic">"{getRandomQuote('loading')}"</p>
        </div>
      </div>
    )
  }

  // Login screen
  if (!user) {
    return <LoginForm />
  }

  // Main app
  return (
    <main className="min-h-screen pb-8">
      <Header
        user={user}
        profile={profile}
        onLogout={handleLogout}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <StatsCards items={items} />

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-center">
            {(profile?.role === 'admin' || profile?.role === 'manager') && (
              <>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="btn-ralph bg-gradient-to-r from-slate-600 to-slate-700 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2"
                >
                  📤 Import CSV
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn-ralph bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-200"
                >
                  ➕ Add Item
                </button>
              </>
            )}

            <button
              onClick={checkLowStock}
              className="btn-ralph bg-gradient-to-r from-slate-500 to-slate-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2"
            >
              🔔 Check Low Stock
            </button>

            <button
              onClick={handleGenerateOrder}
              className="btn-ralph bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2"
            >
              📦 Generate Order
            </button>

            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="🔍 Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-slate-400 focus:outline-none transition-colors"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-slate-400 focus:outline-none bg-white"
            >
              <option value="all">🏷️ All Categories</option>
              <option value="liquor">🍾 Liquor</option>
              <option value="beer">🍺 Beer</option>
              <option value="wine">🍷 Wine</option>
              <option value="food">🍔 Food</option>
              <option value="supplies">📦 Supplies</option>
            </select>
          </div>
        </div>

        {/* Inventory Table */}
        <InventoryTable
          items={filteredItems}
          userRole={profile?.role || 'staff'}
          onEditCount={(item) => setEditingItem(item)}
          onDelete={handleDeleteItem}
        />
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddItemModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddItem}
        />
      )}

      {showUploadModal && (
        <UploadCSVModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleBulkUpload}
        />
      )}

      {editingItem && (
        <EditCountModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleUpdateCount}
        />
      )}

      {showOrderModal && profile && (
        <GenerateOrderModal
          orderType="liquor"
          items={orderItems}
          userId={user.id}
          userName={profile.full_name || profile.email || 'Unknown'}
          onClose={() => setShowOrderModal(false)}
        />
      )}
    </main>
  )
}
