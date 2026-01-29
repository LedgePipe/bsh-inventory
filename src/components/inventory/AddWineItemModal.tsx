'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'

interface AddWineItemModalProps {
  distributorId: string
  onClose: () => void
  onSuccess: () => void
}

export default function AddWineItemModal({ distributorId, onClose, onSuccess }: AddWineItemModalProps) {
  const [productName, setProductName] = useState('')
  const [bottleSize, setBottleSize] = useState('750ml')
  const [parLevel, setParLevel] = useState(0)
  const [loading, setLoading] = useState(false)

  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productName.trim()) {
      toast.error('Please enter a product name')
      return
    }

    setLoading(true)

    const { error } = await supabase
      .from('wine_items')
      .insert({
        distributor_id: distributorId,
        product_name: productName.trim(),
        bottle_size: bottleSize,
        par_level: parLevel,
      })

    setLoading(false)

    if (error) {
      toast.error('Failed to add wine item')
      console.error(error)
    } else {
      toast.success('Wine item added!')
      onSuccess()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">🍷 Add Wine Item</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g., Pinot Grigio"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bottle Size
            </label>
            <select
              value={bottleSize}
              onChange={(e) => setBottleSize(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
            >
              <option value="375ml">375ml (Half)</option>
              <option value="750ml">750ml (Standard)</option>
              <option value="1L">1L</option>
              <option value="1.5L">1.5L (Magnum)</option>
              <option value="3L">3L (Box)</option>
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
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
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
              className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
