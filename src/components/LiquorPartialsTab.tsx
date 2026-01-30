'use client'

import { useState } from 'react'
import { InventoryItemWithUpdater } from '@/types/database'
import BottleFillSelector from './BottleFillSelector'

interface PartialEdit {
  itemId: string
  partial: number
  itemName: string
}

interface LiquorPartialsTabProps {
  items: InventoryItemWithUpdater[]
  editedPartials: Map<string, PartialEdit>
  onPartialChange: (itemId: string, partial: number, itemName: string) => void
}

// Mini bottle SVG for display
function MiniBottle({ fillLevel }: { fillLevel: number }) {
  const fillPercent = fillLevel * 100

  return (
    <svg viewBox="0 0 40 80" className="w-8 h-12">
      <defs>
        <clipPath id={`mini-bottle-${fillLevel}`}>
          <path d="M15 10 L15 5 Q15 2 17 2 L23 2 Q25 2 25 5 L25 10 L28 15 Q30 18 30 22 L30 70 Q30 75 25 75 L15 75 Q10 75 10 70 L10 22 Q10 18 12 15 Z" />
        </clipPath>
      </defs>
      <path
        d="M15 10 L15 5 Q15 2 17 2 L23 2 Q25 2 25 5 L25 10 L28 15 Q30 18 30 22 L30 70 Q30 75 25 75 L15 75 Q10 75 10 70 L10 22 Q10 18 12 15 Z"
        fill="#f1f5f9"
        stroke="#94a3b8"
        strokeWidth="2"
      />
      {fillLevel > 0 && (
        <rect
          x="10"
          y={75 - (fillPercent * 0.55)}
          width="20"
          height={fillPercent * 0.55}
          fill="#475569"
          clipPath={`url(#mini-bottle-${fillLevel})`}
        />
      )}
    </svg>
  )
}

export default function LiquorPartialsTab({ items, editedPartials, onPartialChange }: LiquorPartialsTabProps) {
  const [selectorOpen, setSelectorOpen] = useState<InventoryItemWithUpdater | null>(null)

  // Filter to only liquor items
  const liquorItems = items.filter(item => item.category === 'liquor')

  const handleSelectPartial = (item: InventoryItemWithUpdater) => {
    setSelectorOpen(item)
  }

  const handlePartialSelected = (partial: number) => {
    if (selectorOpen) {
      onPartialChange(selectorOpen.id, partial, selectorOpen.name)
    }
  }

  return (
    <div>
      <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
        <h2 className="text-xl font-bold text-gray-800">🍾 Partial Bottles</h2>
        <p className="text-sm text-gray-500">Tap the bottle to set the fill level for partial bottles</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {liquorItems.map((item) => {
          const editedPartial = editedPartials.get(item.id)
          const currentPartial = editedPartial ? editedPartial.partial : (item.partial_count || 0)
          const hasEdit = editedPartial !== undefined

          return (
            <div
              key={item.id}
              className={`bg-white rounded-xl shadow-lg p-4 transition-all hover:shadow-xl cursor-pointer ${
                hasEdit ? 'ring-2 ring-slate-500' : ''
              }`}
              onClick={() => handleSelectPartial(item)}
            >
              <div className="flex items-center gap-4">
                {/* Bottle visual */}
                <div className="flex-shrink-0">
                  <MiniBottle fillLevel={currentPartial} />
                </div>

                {/* Item info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-700 truncate">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.code}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      Full: {item.current_count}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded font-bold ${
                      hasEdit ? 'bg-slate-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      Partial: .{(currentPartial * 10).toFixed(0)}
                    </span>
                  </div>
                </div>

                {/* Tap indicator */}
                <div className="flex-shrink-0 text-slate-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {liquorItems.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">🍾</div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">No liquor items</h3>
          <p className="text-gray-500">Add liquor items to track partial bottles</p>
        </div>
      )}

      {/* Bottle fill selector modal */}
      {selectorOpen && (
        <BottleFillSelector
          value={editedPartials.get(selectorOpen.id)?.partial ?? (selectorOpen.partial_count || 0)}
          onChange={handlePartialSelected}
          itemName={selectorOpen.name}
          onClose={() => setSelectorOpen(null)}
        />
      )}
    </div>
  )
}
