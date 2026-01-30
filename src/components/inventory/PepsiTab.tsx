'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'
import { PepsiItem, PepsiItemWithCounter, UserRole, EditedCount } from '@/types/database'

interface PepsiTabProps {
  userRole: UserRole
  userId: string
  onCountChange: (itemId: string, newCount: number, productName: string, parLevel: number) => void
  editedCounts: Map<string, EditedCount>
}

export default function PepsiTab({ userRole, userId, onCountChange, editedCounts }: PepsiTabProps) {
  const [items, setItems] = useState<PepsiItemWithCounter[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPar, setEditingPar] = useState<string | null>(null)

  const supabase = createClientComponentClient()

  async function fetchData() {
    const { data, error } = await supabase
      .from('pepsi_items')
      .select('*')
      .order('product_name')

    if (error) {
      console.error('Error fetching pepsi items:', error)
      toast.error('Failed to load Pepsi items')
    } else {
      setItems(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()

    const channel = supabase
      .channel('pepsi_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pepsi_items' }, () => {
        fetchData()
        toast('🥤 Pepsi inventory updated')
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleParChange = async (itemId: string, newPar: number) => {
    const { error } = await supabase
      .from('pepsi_items')
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
    return <div className="text-center py-12 text-xl">🥤 Loading Pepsi inventory...</div>
  }

  return (
    <div>
      <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
        <h2 className="text-xl font-bold text-gray-800">🥤 Pepsi Bag-in-Box Products</h2>
        <p className="text-sm text-gray-500">Fixed supplier list - count in bags</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-100 to-cyan-100 border-b-2 border-blue-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Product</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Par (bags)</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Current</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Order Qty</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase hidden md:table-cell">Last Counted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => {
                const editedCount = editedCounts.get(item.id)
                const currentCount = editedCount ? editedCount.newCount : item.current_count
                const orderQty = Math.max(0, item.par_level - currentCount)
                const status = getStatus(currentCount, item.par_level)

                return (
                  <tr key={item.id} className={`hover:bg-blue-50 transition-colors ${editedCount ? 'bg-yellow-50' : ''}`}>
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
                          className={`font-medium ${userRole === 'admin' ? 'cursor-pointer hover:text-blue-600' : ''}`}
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
                        className="w-20 px-2 py-1 border-2 border-blue-300 rounded-lg text-center font-bold focus:border-blue-500 focus:outline-none"
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
