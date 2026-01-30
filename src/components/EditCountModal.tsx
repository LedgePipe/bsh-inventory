'use client'

import { useState } from 'react'
import { InventoryItemWithUpdater } from '@/types/database'

interface EditCountModalProps {
  item: InventoryItemWithUpdater
  onClose: () => void
  onSave: (itemId: string, newCount: number, newPartial: number) => void
}

export default function EditCountModal({ item, onClose, onSave }: EditCountModalProps) {
  const [count, setCount] = useState(item.current_count.toString())
  const [partial, setPartial] = useState((item.partial_count || 0).toString())

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave(item.id, parseInt(count) || 0, parseFloat(partial) || 0)
  }

  function adjustCount(delta: number) {
    const newCount = Math.max(0, (parseInt(count) || 0) + delta)
    setCount(newCount.toString())
  }

  const newCount = parseInt(count) || 0
  const newPartial = parseFloat(partial) || 0
  const oldTotal = item.current_count + (item.partial_count || 0)
  const newTotal = newCount + newPartial
  const diff = newTotal - oldTotal

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-slide-in" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-red-100 rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors"
        >
          ×
        </button>

        <h3 className="text-xl font-bold text-gray-800 mb-2">🔢 Update Count</h3>
        <p className="text-gray-500 text-sm mb-4">Enter full bottles + partial (tenths)</p>

        {/* Item info */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-100 border-l-4 border-slate-500 rounded-xl p-4 mb-6">
          <p className="font-bold text-slate-700">{item.code}</p>
          <p className="text-gray-700">{item.name}</p>
          <p className="text-sm text-gray-500 mt-1">
            Par: <strong>{item.par_level}</strong> | Current: <strong>{oldTotal.toFixed(1)}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Full bottles */}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">
              🍾 Full Bottles
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => adjustCount(-1)}
                className="w-12 h-12 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-2xl font-bold transition-colors"
              >
                -
              </button>
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                className="flex-1 px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-slate-400 focus:outline-none text-center text-3xl font-bold"
                min="0"
                required
              />
              <button
                type="button"
                onClick={() => adjustCount(1)}
                className="w-12 h-12 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl text-2xl font-bold transition-colors"
              >
                +
              </button>
            </div>
            {/* Quick adjust buttons */}
            <div className="flex gap-2 mt-3 justify-center">
              {[-5, -1, 1, 5].map(delta => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => adjustCount(delta)}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                    delta > 0
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  {delta > 0 ? '+' : ''}{delta}
                </button>
              ))}
            </div>
          </div>

          {/* Partial bottle */}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">
              ½ Partial Bottle (tenths)
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setPartial(val.toString())}
                  className={`py-2 rounded-lg text-sm font-bold transition-colors ${
                    parseFloat(partial) === val
                      ? 'bg-slate-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  .{(val * 10).toFixed(0)}
                </button>
              ))}
            </div>
          </div>

          {/* Total and diff */}
          <div className="bg-slate-50 rounded-xl p-4 mb-4 text-center">
            <div className="text-sm text-gray-500 mb-1">New Total</div>
            <div className="text-3xl font-bold text-slate-700">{newTotal.toFixed(1)}</div>
            {diff !== 0 && (
              <div className={`text-sm mt-2 ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {diff > 0 ? `➕ +${diff.toFixed(1)}` : `➖ ${diff.toFixed(1)}`}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white font-bold rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all transform hover:-translate-y-1"
          >
            💾 Save Count
          </button>
        </form>
      </div>
    </div>
  )
}
