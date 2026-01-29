'use client'

import { useState } from 'react'
import { InventoryItemInsert, InventoryCategory } from '@/types/database'
import { getRandomQuote } from '@/lib/ralph-quotes'

interface AddItemModalProps {
  onClose: () => void
  onAdd: (item: InventoryItemInsert) => void
}

export default function AddItemModal({ onClose, onAdd }: AddItemModalProps) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState<InventoryCategory>('liquor')
  const [parLevel, setParLevel] = useState('')
  const [cost, setCost] = useState('')
  const [unitType, setUnitType] = useState('bottle')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onAdd({
      code,
      name,
      category,
      par_level: parseInt(parLevel) || 0,
      current_count: 0,
      cost_per_unit: parseFloat(cost) || 0,
      unit_type: unitType
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-slide-in" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-red-100 rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors"
        >
          ×
        </button>

        <h3 className="text-xl font-bold text-gray-800 mb-2">➕ Make a New Bottle Friend!</h3>
        <p className="text-gray-500 text-sm italic mb-6">"{getRandomQuote('success')}"</p>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-1 text-sm">
                🏷️ Product Code Thingy
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Like a name tag!"
                className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1 text-sm">
                🍾 What's It Called?
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My bottle's name is..."
                className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1 text-sm">
                📁 What Kind of Friend?
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as InventoryCategory)}
                className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none bg-white"
              >
                <option value="liquor">🍾 Liquor</option>
                <option value="beer">🍺 Beer</option>
                <option value="wine">🍷 Wine</option>
                <option value="food">🍔 Food</option>
                <option value="supplies">📦 Supplies</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-1 text-sm">
                  📊 Par Level
                </label>
                <input
                  type="number"
                  value={parLevel}
                  onChange={(e) => setParLevel(e.target.value)}
                  placeholder="How many we want"
                  className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1 text-sm">
                  💰 Cost Per Unit
                </label>
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="$$$"
                  className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1 text-sm">
                📦 Unit Type
              </label>
              <select
                value={unitType}
                onChange={(e) => setUnitType(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none bg-white"
              >
                <option value="bottle">🍾 Bottle</option>
                <option value="case">📦 Case</option>
                <option value="keg">🛢️ Keg</option>
                <option value="bag">👜 Bag</option>
                <option value="box">📦 Box</option>
                <option value="each">1️⃣ Each</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all transform hover:-translate-y-1"
          >
            🎉 Add My New Friend!
          </button>
        </form>
      </div>
    </div>
  )
}
