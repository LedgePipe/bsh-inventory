'use client'

import { useState } from 'react'
import { InventoryItemWithUpdater } from '@/types/database'
import BottleFillSelector from './BottleFillSelector'

interface PartialEdit {
  itemId: string
  partials: number[]  // Array of partial values
  itemName: string
}

interface LiquorPartialsTabProps {
  items: InventoryItemWithUpdater[]
  editedPartials: Map<string, PartialEdit>
  onPartialChange: (itemId: string, partials: number[], itemName: string) => void
}

// Mini bottle SVG for display
function MiniBottle({ fillLevel }: { fillLevel: number }) {
  const fillPercent = fillLevel * 100

  return (
    <svg viewBox="0 0 40 80" className="w-6 h-10">
      <defs>
        <clipPath id={`mini-bottle-${fillLevel}-${Math.random()}`}>
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
          clipPath={`url(#mini-bottle-${fillLevel}-${Math.random()})`}
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

  const handlePartialsSelected = (partials: number[]) => {
    if (selectorOpen) {
      onPartialChange(selectorOpen.id, partials, selectorOpen.name)
    }
  }

  // Get partials array for an item (from edits or from DB)
  const getPartials = (item: InventoryItemWithUpdater): number[] => {
    const edited = editedPartials.get(item.id)
    if (edited) return edited.partials
    // Try to parse from partials_breakdown if it exists
    const breakdown = (item as any).partials_breakdown
    if (breakdown && Array.isArray(breakdown)) return breakdown
    // Fallback: if there's a partial_count, return it as single item array
    if (item.partial_count && item.partial_count > 0) return [item.partial_count]
    return []
  }

  return (
    <div>
      <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
        <h2 className="text-xl font-bold text-gray-800">🍾 Partial Bottles</h2>
        <p className="text-sm text-gray-500">Tap to add multiple partials per item (one per service area)</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {liquorItems.map((item) => {
          const partials = getPartials(item)
          const hasEdit = editedPartials.has(item.id)
          const total = partials.reduce((sum, p) => sum + p, 0)

          return (
            <div
              key={item.id}
              className={`bg-white rounded-xl shadow-lg p-4 transition-all hover:shadow-xl cursor-pointer ${
                hasEdit ? 'ring-2 ring-slate-500' : ''
              }`}
              onClick={() => handleSelectPartial(item)}
            >
              <div className="flex items-start gap-3">
                {/* Item info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-700 truncate">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.code}</p>

                  {/* Stats row */}
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      Full: {item.current_count}
                    </span>
                    {partials.length > 0 && (
                      <span className={`text-xs px-2 py-1 rounded font-bold ${
                        hasEdit ? 'bg-slate-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {partials.length} partial{partials.length > 1 ? 's' : ''} = {total.toFixed(1)}
                      </span>
                    )}
                  </div>

                  {/* Mini bottles display */}
                  {partials.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {partials.map((p, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <MiniBottle fillLevel={p} />
                          <span className="text-[10px] text-gray-500">.{(p * 10).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {partials.length === 0 && (
                    <p className="mt-2 text-xs text-gray-400 italic">No partials - tap to add</p>
                  )}
                </div>

                {/* Tap indicator */}
                <div className="flex-shrink-0 text-slate-400 mt-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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
          partials={getPartials(selectorOpen)}
          onChange={handlePartialsSelected}
          itemName={selectorOpen.name}
          onClose={() => setSelectorOpen(null)}
        />
      )}
    </div>
  )
}
