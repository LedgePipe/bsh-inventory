'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getRandomQuote } from '@/lib/ralph-quotes'
import { InventoryItem, Profile } from '@/types/database'
import { toast } from 'sonner'
import LoginForm from '@/components/LoginForm'
import Header from '@/components/Header'
import StatsCards from '@/components/StatsCards'
import InventoryTable from '@/components/InventoryTable'
import AddItemModal from '@/components/AddItemModal'
import EditCountModal from '@/components/EditCountModal'
import UploadCSVModal from '@/components/UploadCSVModal'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)

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

    return () => subscription.unsubscribe()
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
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (data) setItems(data)
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
    toast.info(`👋 ${getRandomQuote('delete')}`)
  }

  async function handleAddItem(item: Partial<InventoryItem>) {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert([item])
      .select()
      .single()

    if (data) {
      setItems([...items, data])
      setShowAddModal(false)
      toast.success(`🎉 ${item.name} is my new friend! ${getRandomQuote('success')}`)
    }
    if (error) {
      toast.error(`😱 ${getRandomQuote('error')}`)
      console.error(error)
    }
  }

  async function handleUpdateCount(itemId: string, newCount: number) {
    const item = items.find(i => i.id === itemId)
    if (!item) return

    const { error } = await supabase
      .from('inventory_items')
      .update({
        current_count: newCount,
        updated_at: new Date().toISOString(),
        updated_by: user?.id
      })
      .eq('id', itemId)

    if (!error) {
      // Also create a log entry
      await supabase.from('inventory_logs').insert({
        item_id: itemId,
        user_id: user?.id,
        previous_count: item.current_count,
        new_count: newCount,
        action: 'count_update'
      })

      setItems(items.map(i => i.id === itemId ? { ...i, current_count: newCount } : i))
      setEditingItem(null)

      const diff = newCount - item.current_count
      if (diff > 0) {
        toast.success(`➕ Added ${diff} bottles! ${getRandomQuote('success')}`)
      } else if (diff < 0) {
        toast.info(`➖ ${Math.abs(diff)} bottles went bye-bye!`)
      } else {
        toast.success(`✅ Same number! I counted good!`)
      }

      // Check if now low
      if (item.par_level > 0 && (newCount / item.par_level) < 0.5) {
        setTimeout(() => {
          toast.warning(`⚠️ Uh oh! ${item.name} needs more friends!`)
        }, 1000)
      }
    } else {
      toast.error(`😱 ${getRandomQuote('error')}`)
    }
  }

  async function handleDeleteItem(itemId: string) {
    const item = items.find(i => i.id === itemId)
    if (!item) return

    if (!confirm(`Say bye-bye to ${item.name}? 👋\n\n"${getRandomQuote('delete')}"`)) {
      return
    }

    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', itemId)

    if (!error) {
      setItems(items.filter(i => i.id !== itemId))
      toast.info(`👋 ${item.name} moved to a farm upstate!`)
    } else {
      toast.error(`😱 ${getRandomQuote('error')}`)
    }
  }

  async function handleBulkUpload(newItems: Partial<InventoryItem>[]) {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert(newItems)
      .select()

    if (data) {
      setItems([...items, ...data])
      setShowUploadModal(false)
      toast.success(`🎉 Made ${data.length} new friends! ${getRandomQuote('success')}`)
    }
    if (error) {
      toast.error(`😱 ${getRandomQuote('error')}`)
      console.error(error)
    }
  }

  function checkLowStock() {
    const lowItems = items.filter(item =>
      item.par_level > 0 && (item.current_count / item.par_level) < 0.5
    )

    if (lowItems.length > 0) {
      toast.warning(`🚨 Found ${lowItems.length} bottles that need friends! ${getRandomQuote('lowStock')}`, {
        duration: 5000
      })

      // Send browser notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`🚨 ${lowItems.length} items are low!`, {
          body: `${getRandomQuote('lowStock')}\n${lowItems.slice(0, 3).map(i => i.name).join(', ')}`,
        })
      }
    } else {
      toast.success(`✅ All bottles have enough friends! ${getRandomQuote('success')}`)
    }
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
                  className="btn-ralph bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2"
                >
                  📤 Upload Friends (CSV)
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn-ralph bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-200"
                >
                  ➕ Make a New Friend!
                </button>
              </>
            )}

            <button
              onClick={checkLowStock}
              className="btn-ralph bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-800 px-4 py-2 rounded-xl font-semibold flex items-center gap-2"
            >
              🔔 Check for Uh-Ohs
            </button>

            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="🔍 I'm looking for my friend..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none transition-colors"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none bg-white"
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
    </main>
  )
}
