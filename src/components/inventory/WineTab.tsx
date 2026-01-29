'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'
import { Distributor, WineItem, WineItemWithDistributor, UserRole, EditedCount } from '@/types/database'
import AddDistributorModal from './AddDistributorModal'
import AddWineItemModal from './AddWineItemModal'

interface WineTabProps {
  userRole: UserRole
  userId: string
  onCountChange: (itemId: string, newCount: number, productName: string, parLevel: number) => void
  editedCounts: Map<string, EditedCount>
}

export default function WineTab({ userRole, userId, onCountChange, editedCounts }: WineTabProps) {
  const [distributors, setDistributors] = useState<Distributor[]>([])
  const [items, setItems] = useState<WineItemWithDistributor[]>([])
  const [loading, setLoading] = useState(true)
  const [activeDistributor, setActiveDistributor] = useState<string | null>(null)
  const [showAddDistributor, setShowAddDistributor] = useState(false)
  const [showAddItem, setShowAddItem] = useState(false)
  const [editingPar, setEditingPar] = useState<string | null>(null)

  const supabase = createClientComponentClient()

  async function fetchData() {
    const { data: distData } = await supabase
      .from('distributors')
      .select('*')
      .eq('category', 'wine')
      .order('name')

    setDistributors(distData || [])
    if (distData && distData.length > 0 && !activeDistributor) {
      setActiveDistributor(distData[0].id)
    }

    const { data: itemData } = await supabase
      .from('wine_items')
      .select(`
        *,
        distributor:distributors(*),
        counter:profiles!wine_items_last_counted_by_fkey(email, full_name)
      `)
      .order('product_name')

    setItems(itemData || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()

    const channel = supabase
      .channel('wine_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wine_items' }, () => {
        fetchData()
        toast.info('🍷 Wine inventory updated')
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'distributors' }, () => fetchData())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleParChange = async (itemId: string, newPar: number) => {
    const { error } = await supabase.from('wine_items').update({ par_level: newPar }).eq('id', itemId)
    if (error) toast.error('Failed to update par level')
    else { toast.success('Par level updated'); fetchData() }
    setEditingPar(null)
  }

  const handleDeleteDistributor = async (distId: string) => {
    if (!confirm('Delete this distributor and all its items?')) return
    const { error } = await supabase.from('distributors').delete().eq('id', distId)
    if (error) toast.error('Failed to delete distributor')
    else { toast.success('Distributor deleted'); fetchData(); setActiveDistributor(null) }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Delete this item?')) return
    const { error } = await supabase.from('wine_items').delete().eq('id', itemId)
    if (error) toast.error('Failed to delete item')
    else { toast.success('Item deleted'); fetchData() }
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

  if (loading) return <div className="text-center py-12 text-xl">🍷 Loading wine inventory...</div>

  const filteredItems = activeDistributor ? items.filter(item => item.distributor_id === activeDistributor) : []
  const activeDistributorData = distributors.find(d => d.id === activeDistributor)

  return (
    <div>
      {/* Distributor tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {distributors.map((dist) => (
          <button
            key={dist.id}
            onClick={() => setActiveDistributor(dist.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeDistributor === dist.id
                ? 'bg-purple-500 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-100 shadow'
            }`}
          >
            {dist.name}
            <span className="ml-2 text-xs opacity-70">({dist.reminder_days})</span>
          </button>
        ))}
        {userRole === 'admin' && (
          <button
            onClick={() => setShowAddDistributor(true)}
            className="px-4 py-2 rounded-lg font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition-all"
          >
            ➕ Add Distributor
          </button>
        )}
      </div>

      {/* Active distributor header */}
      {activeDistributorData && (
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{activeDistributorData.name}</h2>
            <p className="text-sm text-gray-500">Reminder days: {activeDistributorData.reminder_days}</p>
          </div>
          {userRole === 'admin' && (
            <div className="flex gap-2">
              <button onClick={() => setShowAddItem(true)} className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200">
                ➕ Add Item
              </button>
              <button onClick={() => handleDeleteDistributor(activeDistributorData.id)} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200">
                🗑️ Remove
              </button>
            </div>
          )}
        </div>
      )}

      {/* Items table */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">🍷</div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">No items yet</h3>
          <p className="text-gray-500">{userRole === 'admin' ? 'Click "Add Item" to add wine products' : 'No wine items have been added yet'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-100 to-pink-100 border-b-2 border-purple-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Product</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Size</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Par</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Current</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Order Qty</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase hidden md:table-cell">Last Counted</th>
                  {userRole === 'admin' && <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map((item) => {
                  const editedCount = editedCounts.get(item.id)
                  const currentCount = editedCount ? editedCount.newCount : item.current_count
                  const orderQty = Math.max(0, item.par_level - currentCount)
                  const status = getStatus(currentCount, item.par_level)

                  return (
                    <tr key={item.id} className={`hover:bg-purple-50 transition-colors ${editedCount ? 'bg-yellow-50' : ''}`}>
                      <td className="px-4 py-3"><span className="font-medium text-gray-800">{item.product_name}</span></td>
                      <td className="px-4 py-3 text-center"><span className="inline-flex px-2 py-1 bg-gray-100 rounded-lg text-sm">{item.bottle_size}</span></td>
                      <td className="px-4 py-3 text-center">
                        {userRole === 'admin' && editingPar === item.id ? (
                          <input type="number" defaultValue={item.par_level} className="w-16 px-2 py-1 border rounded text-center" autoFocus
                            onBlur={(e) => handleParChange(item.id, parseInt(e.target.value) || 0)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleParChange(item.id, parseInt((e.target as HTMLInputElement).value) || 0); if (e.key === 'Escape') setEditingPar(null) }}
                          />
                        ) : (
                          <span className={`font-medium ${userRole === 'admin' ? 'cursor-pointer hover:text-purple-600' : ''}`} onClick={() => userRole === 'admin' && setEditingPar(item.id)}>{item.par_level}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input type="number" min="0" value={editedCount ? editedCount.newCount : ''} placeholder={String(item.current_count)}
                          onChange={(e) => { const val = e.target.value === '' ? item.current_count : parseInt(e.target.value); onCountChange(item.id, val, item.product_name, item.par_level) }}
                          className="w-20 px-2 py-1 border-2 border-purple-300 rounded-lg text-center font-bold focus:border-purple-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-3 text-center"><span className={`font-bold text-lg ${orderQty > 0 ? 'text-red-600' : 'text-green-600'}`}>{orderQty}</span></td>
                      <td className="px-4 py-3 text-center"><span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${status.class}`}>{status.text}</span></td>
                      <td className="px-4 py-3 text-center text-sm text-gray-500 hidden md:table-cell">
                        {item.counter && <span>{item.counter.full_name || item.counter.email?.split('@')[0]}</span>}<br />
                        <span className="text-xs">{formatTimeAgo(item.last_counted_at)}</span>
                      </td>
                      {userRole === 'admin' && (
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => handleDeleteItem(item.id)} className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">🗑️</button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddDistributor && <AddDistributorModal category="wine" onClose={() => setShowAddDistributor(false)} onSuccess={() => { setShowAddDistributor(false); fetchData() }} />}
      {showAddItem && activeDistributor && <AddWineItemModal distributorId={activeDistributor} onClose={() => setShowAddItem(false)} onSuccess={() => { setShowAddItem(false); fetchData() }} />}
    </div>
  )
}
