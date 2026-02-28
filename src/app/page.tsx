'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getRandomQuote } from '@/lib/messages'
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
import LiquorPartialsTab from '@/components/LiquorPartialsTab'
import EditItemModal from '@/components/EditItemModal'

interface LiquorOrderItem {
  id: string
  productName: string
  currentCount: number
  parLevel: number
  orderQty: number
}

interface PartialEdit {
  itemId: string
  partials: number[]
  itemName: string
}

type LiquorTabType = 'full' | 'partials'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [items, setItems] = useState<InventoryItemWithUpdater[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItemWithUpdater | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [activeTab, setActiveTab] = useState<LiquorTabType>('full')
  const [editedPartials, setEditedPartials] = useState<Map<string, PartialEdit>>(new Map())
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItemWithUpdater | null>(null)

  const [bulkMode, setBulkMode] = useState(false)
  const [bulkCounts, setBulkCounts] = useState<Map<string, number>>(new Map())
  const [bulkSubmitting, setBulkSubmitting] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      setUser(session.user)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      if (profileData) setProfile(profileData)
      await loadItems()
    }
    setLoading(false)
  }

  async function loadItems() {
    const { data, error } = await supabase
      .from('inventory_items')
      .select(`
        *,
        updater:profiles!inventory_items_updated_by_fkey(email, full_name)
      `)
      .order('name')

    if (error) {
      console.error('Error loading items:', error)
      toast.error('Failed to load inventory')
    } else {
      setItems(data || [])
    }
  }

  async function handleAddItem(item: InventoryItemInsert) {
    const { error } = await supabase
      .from('inventory_items')
      .insert({ ...item, updated_by: user?.id })

    if (error) {
      toast.error('Failed to add item: ' + error.message)
    } else {
      toast.success('✅ Item added!')
      setShowAddModal(false)
      await loadItems()
    }
  }

  async function handleUpdateCount(itemId: string, newCount: number, notes?: string) {
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

    if (error) {
      toast.error('Failed to update count')
      return
    }

    // Create audit log
    await supabase
      .from('inventory_logs')
      .insert({
        item_id: itemId,
        user_id: user?.id,
        previous_count: item.current_count,
        new_count: newCount,
        action: 'count_update',
        notes: notes || null
      })

    toast.success(`✅ ${item.name} updated to ${newCount}`)
    setShowEditModal(false)
    setSelectedItem(null)
    await loadItems()
  }

  async function handleDeleteItem(itemId: string) {
    if (!confirm('Are you sure you want to delete this item?')) return

    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', itemId)

    if (error) {
      toast.error('Failed to delete item')
    } else {
      toast.success('🗑️ Item deleted')
      await loadItems()
    }
  }

  async function handleEditItem(values: Record<string, string | number>) {
    if (!editingItem) return
    const { error } = await supabase
      .from('inventory_items')
      .update({
        name: values.name as string,
        code: values.code as string,
        category: values.category as string,
        par_level: Number(values.par_level),
        cost_per_unit: Number(values.cost_per_unit),
        unit_type: values.unit_type as string,
        updated_at: new Date().toISOString(),
        updated_by: user?.id,
      })
      .eq('id', editingItem.id)

    if (error) {
      toast.error('Failed to update item: ' + error.message)
    } else {
      toast.success(`✅ ${values.name} updated!`)
      setEditingItem(null)
      await loadItems()
    }
  }

  function handleEditCount(item: InventoryItemWithUpdater) {
    setSelectedItem(item)
    setShowEditModal(true)
  }

  function handlePartialChange(itemId: string, partials: number[], itemName: string) {
    setEditedPartials(prev => {
      const updated = new Map(prev)
      updated.set(itemId, { itemId, partials, itemName })
      return updated
    })
  }

  async function handleSubmitPartials() {
    if (editedPartials.size === 0) {
      toast.error('No partial changes to submit')
      return
    }

    try {
      const entries = Array.from(editedPartials.entries())
      for (const [itemId, edit] of entries) {
        const totalPartial = edit.partials.reduce((sum, p) => sum + p, 0)
        const partialRounded = Math.round(totalPartial * 10) / 10

        const { error } = await supabase
          .from('inventory_items')
          .update({
            partial_count: partialRounded,
            updated_at: new Date().toISOString(),
            updated_by: user?.id
          })
          .eq('id', itemId)

        if (error) throw error

        // Audit log
        const item = items.find(i => i.id === itemId)
        await supabase
          .from('inventory_logs')
          .insert({
            item_id: itemId,
            user_id: user?.id,
            previous_count: item?.partial_count || 0,
            new_count: partialRounded,
            action: 'partial_update',
            notes: `Partials: ${edit.partials.join(', ')}`
          })
      }

      toast.success(`✅ ${editedPartials.size} partial counts updated!`)
      setEditedPartials(new Map())
      await loadItems()
    } catch (error) {
      console.error('Submit partials error:', error)
      toast.error('Failed to submit partial counts')
    }
  }

  async function handleUploadCSV(csvItems: InventoryItemInsert[]) {
    let added = 0
    let errors = 0

    for (const item of csvItems) {
      const { error } = await supabase
        .from('inventory_items')
        .insert({ ...item, updated_by: user?.id })

      if (error) {
        console.error('CSV insert error:', error)
        errors++
      } else {
        added++
      }
    }

    toast.success(`✅ Imported ${added} items${errors > 0 ? ` (${errors} errors)` : ''}`)
    setShowUploadModal(false)
    await loadItems()
  }

  function handleGenerateOrder() {
    const orderItems: LiquorOrderItem[] = items
      .filter(item => {
        if (item.par_level <= 0) return false
        const total = item.current_count + (item.partial_count || 0)
        const deficit = item.par_level - total
        // Only order if deficit is at least 0.5 (don't order partial bottles)
        return deficit >= 0.5
      })
      .map(item => {
        const total = item.current_count + (item.partial_count || 0)
        const deficit = item.par_level - total
        return {
          id: item.id,
          productName: item.name,
          currentCount: Math.round(total * 10) / 10,
          parLevel: item.par_level,
          // Always order whole bottles, round up
          orderQty: Math.ceil(deficit)
        }
      })

    if (orderItems.length === 0) {
      toast('All items are at or above par level! 🎉')
      return
    }

    setShowOrderModal(true)
  }

  function handleCheckLowStock() {
    setShowLowStockOnly(!showLowStockOnly)
  }



  function handleBulkCountChange(itemId: string, value: string) {
    const num = parseFloat(value)
    setBulkCounts(prev => {
      const updated = new Map(prev)
      if (value === '' || isNaN(num)) {
        updated.delete(itemId)
      } else {
        updated.set(itemId, num)
      }
      return updated
    })
  }

  function handleBulkKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === 'Enter') {
      e.preventDefault()
      const nextInput = document.querySelector(`[data-bulk-index="${index + 1}"]`) as HTMLInputElement
      if (nextInput) nextInput.focus()
    }
  }

  async function handleSubmitBulkCounts() {
    if (bulkCounts.size === 0) {
      toast.error('No counts entered — enter at least one count first')
      return
    }

    const confirmed = window.confirm(`Save ${bulkCounts.size} count(s)? This will update inventory.`)
    if (!confirmed) return

    setBulkSubmitting(true)
    let success = 0
    let skipped = 0
    let errors = 0

    for (const [itemId, newCount] of Array.from(bulkCounts.entries())) {
      const item = items.find(i => i.id === itemId)
      if (!item) { skipped++; continue }
      // Save even if count matches — it confirms the count was verified
      
      // Split into full bottles and partial
      const fullBottles = Math.floor(newCount)
      const partialAmount = Math.round((newCount - fullBottles) * 10) / 10

      const { error } = await supabase
        .from('inventory_items')
        .update({
          current_count: fullBottles,
          partial_count: partialAmount,
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('id', itemId)

      if (error) {
        console.error(`Failed to update ${item.name}:`, error)
        errors++
        continue
      }

      await supabase
        .from('inventory_logs')
        .insert({
          item_id: itemId,
          user_id: user?.id,
          previous_count: item.current_count,
          new_count: fullBottles,
          action: 'count_update',
          notes: `Bulk count: ${newCount} (${fullBottles} full + ${partialAmount} partial)`
        })

      success++
    }

    // Create a count_submission record
    if (success > 0) {
      await supabase
        .from('count_submissions')
        .insert({
          user_id: user?.id,
          category: 'liquor',
          item_count: success,
          notes: `Bulk count: ${success} items updated`
        })

      // Send email notification
      try {
        await fetch('/api/notify-count-submission', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'count_submission',
            category: 'liquor',
            itemCount: success,
            userName: profile?.full_name || user?.email,
          })
        })
      } catch (e) {
        console.error('Notification failed:', e)
      }
    }

    setBulkSubmitting(false)

    if (errors > 0) {
      toast.error(`${errors} item(s) failed to save`)
    }
    if (success > 0) {
      toast.success(`✅ ${success} item(s) saved! ${skipped > 0 ? `(${skipped} skipped)` : ''}`)
    }
    if (success === 0 && errors === 0) {
      toast.error('Nothing saved — try entering counts again')
    }

    setBulkMode(false)
    setBulkCounts(new Map())
    await loadItems()
  }

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    const matchesLowStock = !showLowStockOnly || (item.par_level > 0 && ((item.current_count + (item.partial_count || 0)) / item.par_level) < 0.5)
    return matchesSearch && matchesCategory && matchesLowStock
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 flex items-center justify-center">
        <div className="text-2xl text-white">🍾 Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm onLogin={checkUser} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-gray-100">
      <Header user={profile || { email: user?.email }} />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Tab Switcher - Liquor / Beer-Wine-More */}
        <div className="flex gap-2 mb-6">
          <a
            href="/"
            className="px-6 py-3 rounded-xl font-bold text-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg scale-105"
          >
            🍾 LIQUOR
            <span className="block text-xs font-normal opacity-80">Spirits & Bottles</span>
          </a>
          <a
            href="/inventory"
            className="px-6 py-3 rounded-xl font-bold text-lg bg-white text-gray-600 hover:bg-gray-100 shadow transition-all"
          >
            🍺 BEER/WINE/MORE
            <span className="block text-xs font-normal opacity-60">Pepsi & Glassware</span>
          </a>
        </div>

        {/* Stats */}
        <StatsCards items={items} />

        {/* Actions Bar */}
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold shadow hover:from-green-600 hover:to-emerald-600 transition-all"
          >
            📥 Import CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-white text-gray-700 rounded-xl font-bold shadow hover:bg-gray-100 transition-all"
          >
            ➕ Add Item
          </button>
          <button
            onClick={handleCheckLowStock}
            className={`px-4 py-2 rounded-xl font-bold shadow transition-all ${
              showLowStockOnly
                ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            ⚠️ Check Low Stock
          </button>
          <button
            onClick={() => { setBulkMode(true); setBulkCounts(new Map()) }}
            className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-bold shadow hover:from-violet-600 hover:to-purple-600 transition-all"
          >
            ⚡ Bulk Count
          </button>

          <div className="flex-1" />
          <input
            type="text"
            placeholder="🔍 Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-200 shadow focus:ring-2 focus:ring-amber-400 focus:outline-none w-64"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-6">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-200 shadow text-gray-700"
          >
            <option value="all">📦 All Categories</option>
            <option value="liquor">🍾 Liquor</option>
            <option value="beer">🍺 Beer</option>
            <option value="wine">🍷 Wine</option>
            <option value="food">🍔 Food</option>
            <option value="supplies">📦 Supplies</option>
          </select>
        </div>

        {/* Full Bottles / Partials Toggle */}
        <div className="flex mb-6">
          <button
            onClick={() => setActiveTab('full')}
            className={`flex-1 py-3 rounded-l-xl font-bold text-lg transition-all ${
              activeTab === 'full'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            🍾 Full Bottles
          </button>
          <button
            onClick={() => setActiveTab('partials')}
            className={`flex-1 py-3 rounded-r-xl font-bold text-lg transition-all ${
              activeTab === 'partials'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            ½ Partials
          </button>
        </div>

        {/* Bulk Count Mode */}
        {bulkMode && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">⚡ Bulk Count Mode</h2>
                <p className="text-gray-500 mt-1">
                  {bulkCounts.size} of {filteredItems.length} items counted
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {filteredItems.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{item.name}</p>
                      <p className="text-sm text-gray-500">Current: {item.current_count}</p>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      data-bulk-index={index}
                      placeholder="New"
                      value={bulkCounts.has(item.id) ? bulkCounts.get(item.id) : ''}
                      onChange={(e) => handleBulkCountChange(item.id, e.target.value)}
                      onKeyDown={(e) => handleBulkKeyDown(e, index)}
                      className="w-24 px-3 py-2 rounded-xl border border-gray-300 text-center font-bold focus:ring-2 focus:ring-amber-400 focus:outline-none"
                      autoFocus={index === 0}
                    />
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-200 flex gap-3 justify-end">
                <button
                  onClick={() => { setBulkMode(false); setBulkCounts(new Map()) }}
                  className="px-6 py-3 rounded-xl font-bold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitBulkCounts}
                  disabled={bulkSubmitting || bulkCounts.size === 0}
                  className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkSubmitting ? '⏳ Saving...' : `✅ Submit All (${bulkCounts.size})`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {activeTab === 'full' ? (
          <InventoryTable
            items={filteredItems}
            userRole={profile?.role || 'staff'}
            onEditCount={handleEditCount}
            onEditItem={(item) => setEditingItem(item)}
            onDelete={handleDeleteItem}
          />
        ) : (
          <LiquorPartialsTab
            items={filteredItems}
            editedPartials={editedPartials}
            onPartialChange={handlePartialChange}
          />
        )}

        {/* Sticky Bottom Bar */}
        {activeTab === 'partials' && editedPartials.size > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-4 shadow-lg z-50">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <span className="font-medium text-gray-600">
                📝 {editedPartials.size} item{editedPartials.size !== 1 ? 's' : ''} edited
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditedPartials(new Map())}
                  className="px-6 py-3 rounded-xl font-bold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all"
                >
                  Clear
                </button>
                <button
                  onClick={handleSubmitPartials}
                  className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-lg transition-all"
                >
                  ✅ Submit Partials
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Generate Order Button */}
        <div className="fixed bottom-4 right-4 z-40">
          <button
            onClick={handleGenerateOrder}
            className="px-6 py-3 rounded-xl font-bold text-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all"
          >
            🍺 Generate Order
          </button>
        </div>
      </main>

      {/* Modals */}
      {showAddModal && (
        <AddItemModal
          onAdd={handleAddItem}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {showEditModal && selectedItem && (
        <EditCountModal
          item={selectedItem}
          onSave={handleUpdateCount}
          onClose={() => { setShowEditModal(false); setSelectedItem(null) }}
        />
      )}

      {showUploadModal && (
        <UploadCSVModal
          onUpload={handleUploadCSV}
          onClose={() => setShowUploadModal(false)}
        />
      )}

      {showOrderModal && profile && (
        <GenerateOrderModal
          orderType="liquor"
          items={items
            .filter(item => item.par_level > 0 && (item.current_count + (item.partial_count || 0)) < item.par_level)
            .map(item => ({
              id: item.id,
              productName: item.name,
              currentCount: item.current_count + (item.partial_count || 0),
              parLevel: item.par_level,
              orderQty: Math.max(0, item.par_level - (item.current_count + (item.partial_count || 0)))
            }))}
          userId={profile.id}
          userName={profile.full_name || profile.email}
          onClose={() => setShowOrderModal(false)}
        />
      )}

      {editingItem && (
        <EditItemModal
          title={`Edit ${editingItem.name}`}
          fields={[
            { key: 'name', label: 'Product Name', type: 'text' },
            { key: 'code', label: 'Code', type: 'text' },
            { key: 'category', label: 'Category', type: 'select', options: [
              { value: 'liquor', label: '🍾 Liquor' },
              { value: 'beer', label: '🍺 Beer' },
              { value: 'wine', label: '🍷 Wine' },
              { value: 'food', label: '🍔 Food' },
              { value: 'supplies', label: '📦 Supplies' },
            ]},
            { key: 'par_level', label: 'Par Level', type: 'number', step: '1' },
            { key: 'cost_per_unit', label: 'Cost Per Unit ($)', type: 'number', step: '0.01' },
            { key: 'unit_type', label: 'Unit Type', type: 'text' },
          ]}
          values={{
            name: editingItem.name,
            code: editingItem.code,
            category: editingItem.category,
            par_level: editingItem.par_level,
            cost_per_unit: editingItem.cost_per_unit,
            unit_type: editingItem.unit_type,
          }}
          onSave={handleEditItem}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  )
}
