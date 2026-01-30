'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { BeerUnitType } from '@/types/database'

interface AddBeerItemModalProps {
  distributorId: string
  onClose: () => void
  onSuccess: () => void
}

export default function AddBeerItemModal({ distributorId, onClose, onSuccess }: AddBeerItemModalProps) {
  const [productName, setProductName] = useState('')
  const [unitType, setUnitType] = useState<BeerUnitType>('cases')
  const [parLevel, setParLevel] = useState(0)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productName.trim()) {
      toast.error('Please enter a product name')
      return
    }

    setLoading(true)

    const { error } = await supabase
      .from('beer_items')
      .insert({
        distributor_id: distributorId,
        product_name: productName.trim(),
        unit_type: unitType,
        par_level: parLevel,
      })

    setLoading(false)

    if (error) {
      toast.error('Failed to add beer item')
      console.error(error)
    } else {
      toast.success('Beer item added!')
      onSuccess()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">🍺 Add Beer Item</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g., Bud Light"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit Type
            </label>
            <select
              value={unitType}
              onChange={(e) => setUnitType(e.target.value as BeerUnitType)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
            >
              <option value="cases">Cases</option>
              <option value="kegs">Kegs</option>
              <option value="sixtels">Sixtels</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Par Level
            </label>
            <input
              type="number"
              min="0"
              value={parLevel}
              onChange={(e) => setParLevel(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
