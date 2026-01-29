'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'
import { GlasswareItem, GlasswareItemWithCounter, UserRole, EditedCount } from '@/types/database'

interface GlasswareTabProps {
  userRole: UserRole
  userId: string
  onCountChange: (itemId: string, newCount: number, productName: string, parLevel: number) => void
  editedCounts: Map<string, EditedCount>
}

export default function GlasswareTab({ userRole, userId, onCountChange, editedCounts }: GlasswareTabProps) {
  const [items, setItems] = useState<GlasswareItemWithCounter[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPar, setEditingPar] = useState<string | null>(null)
  const [showAddItem, setShowAddItem] = useState(false)
  const [newItemName, setNewItemName] = useState('')

  const supabase = createClientComponentClient()

  async function fetchData() {
    const { data, error } = await supabase
      .from('glassware_items')
      .select(`
        *,
        counter:profiles!glassware_items_last_counted_by_fkey(email, full_name)
      `)
      .order('product_name')

    if (error) {
      console.error('Error fetching glassware items:', error)
    } else {
      setItems(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()

    const channel = supabase
      .channel('glassware_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'glassware_items' }, () => {
        fetchData()
        toast.info('🥃 Glassware inventory updated')
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleParChange = async (itemId: string, newPar: number) => {
    const { error } = await supabase
      .from('glassware_items')
      .update({ par_level: newPar })
      .eq('id', itemId)

    if (error) {
      toast.error('Failed to update par level')
    } else {
      toast.success('Par level updated')
      fetchData()
    }
    setEditingPar(null)
  }

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      toast.error('Please enter a name')
      return
    }

    const { error } = await supabase
      .from('glassware_items')
      .insert({ product_name: newItemName.trim(), par_level: 0 })

    if (error) {
      toast.error('Failed to add item')
    } else {
      toast.success('Item added')
      setNewItemName('')
      setShowAddItem(false)
      fetchData()
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Delete this item?')) return

    const { error } = await supabase
      .from('glassware_items')
      .delete()
      .eq('id', itemId)

    if (error) {
      toast.error('Failed to delete item')
    } else {
      toast.success('Item deleted')
      fetchData()
    }
  }

  const getStatus = (current: number, par: number) => {
    if (par === 0) return { class: 'bg-gray-100 text-gray-600', text: 'No Par' }
    const percent = (current / par) * 100
    if (percent < 50) return { class: 'bg-red-100 text-red-700', text: '🚨 Low' }
    if (percent < 75) return { class: 'bg-yellow-100 text-yellow-700', text: '⚠️ Watch' }
    return { class: 'bg-green-100 text-green-700', text: '✅ Good' }
  }

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return <div className="text-center py-12 text-xl">🥃 Loading glassware inventory...</div>
  }

  return (
    <div>
      <div className="bg-white rounded-xl shadow-lg p-4 mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">🥃 Glassware Inventory</h2>
          <p className="text-sm text-gray-500">Track your glass inventory</p>
        </div>
        {userRole === 'admin' && (
          <button
            onClick={() => setShowAddItem(true)}
            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition"
          >
            ➕ Add Glassware Type
          </button>
        )}
      </div>

      {/* Add Item Form */}
      {showAddItem && (
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Enter glassware name..."
              className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddItem()
                if (e.key === 'Escape') { setShowAddItem(false); setNewItemName('') }
              }}
            />
            <button
              onClick={handleAddItem}
              className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600"
            >
              Add
            </button>
            <button
              onClick={() => { setShowAddItem(false); setNewItemName('') }}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-100 to-slate-100 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Item</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Par</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Current</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Order Qty</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase hidden md:table-cell">Last Counted</th>
                {userRole === 'admin' && (
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => {
                const editedCount = editedCounts.get(item.id)
                const currentCount = editedCount ? editedCount.newCount : item.current_count
                const orderQty = Math.max(0, item.par_level - currentCount)
                const status = getStatus(currentCount, item.par_level)

                return (
                  <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${editedCount ? 'bg-yellow-50' : ''}`}>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-800">{item.product_name}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {userRole === 'admin' && editingPar === item.id ? (
                        <input
                          type="number"
                          defaultValue={item.par_level}
                          className="w-16 px-2 py-1 border rounded text-center"
                          autoFocus
                          onBlur={(e) => handleParChange(item.id, parseInt(e.target.value) || 0)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleParChange(item.id, parseInt((e.target as HTMLInputElement).value) || 0)
                            if (e.key === 'Escape') setEditingPar(null)
                          }}
                        />
                      ) : (
                        <span
                          className={`font-medium ${userRole === 'admin' ? 'cursor-pointer hover:text-gray-600' : ''}`}
                          onClick={() => userRole === 'admin' && setEditingPar(item.id)}
                        >
                          {item.par_level}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min="0"
                        value={editedCount ? editedCount.newCount : ''}
                        placeholder={String(item.current_count)}
                        onChange={(e) => {
                          const val = e.target.value === '' ? item.current_count : parseInt(e.target.value)
                          onCountChange(item.id, val, item.product_name, item.par_level)
                        }}
                        className="w-20 px-2 py-1 border-2 border-gray-300 rounded-lg text-center font-bold focus:border-gray-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold text-lg ${orderQty > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {orderQty}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${status.class}`}>
                        {status.text}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-500 hidden md:table-cell">
                      {item.counter && (
                        <span>{item.counter.full_name || item.counter.email?.split('@')[0]}</span>
                      )}
                      <br />
                      <span className="text-xs">{formatTimeAgo(item.last_counted_at)}</span>
                    </td>
                    {userRole === 'admin' && (
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                        >
                          🗑️
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
