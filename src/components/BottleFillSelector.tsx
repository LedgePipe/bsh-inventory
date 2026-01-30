'use client'

import { useState } from 'react'

interface BottleFillSelectorProps {
  partials: number[]  // Array of partial values
  onChange: (partials: number[]) => void
  itemName: string
  onClose: () => void
}

// SVG Bottle component with fill level
function BottleIcon({ fillLevel, size = 'normal' }: { fillLevel: number; size?: 'normal' | 'small' }) {
  const fillPercent = fillLevel * 100
  const isSmall = size === 'small'

  return (
    <svg
      viewBox="0 0 40 80"
      className={isSmall ? 'w-6 h-10' : 'w-10 h-16'}
    >
      <defs>
        <clipPath id={`bottle-clip-${fillLevel}-${size}`}>
          <path d="M15 10 L15 5 Q15 2 17 2 L23 2 Q25 2 25 5 L25 10 L28 15 Q30 18 30 22 L30 70 Q30 75 25 75 L15 75 Q10 75 10 70 L10 22 Q10 18 12 15 Z" />
        </clipPath>
      </defs>

      {/* Bottle background */}
      <path
        d="M15 10 L15 5 Q15 2 17 2 L23 2 Q25 2 25 5 L25 10 L28 15 Q30 18 30 22 L30 70 Q30 75 25 75 L15 75 Q10 75 10 70 L10 22 Q10 18 12 15 Z"
        fill="#f1f5f9"
        stroke="#94a3b8"
        strokeWidth="2"
      />

      {/* Liquid fill */}
      {fillLevel > 0 && (
        <rect
          x="10"
          y={75 - (fillPercent * 0.55)}
          width="20"
          height={fillPercent * 0.55}
          fill="#64748b"
          clipPath={`url(#bottle-clip-${fillLevel}-${size})`}
        />
      )}

      {/* Fill level label */}
      {!isSmall && (
        <text
          x="20"
          y="88"
          textAnchor="middle"
          className="fill-slate-500"
          style={{ fontSize: '10px', fontWeight: 'bold' }}
        >
          .{(fillLevel * 10).toFixed(0)}
        </text>
      )}
    </svg>
  )
}

export default function BottleFillSelector({ partials, onChange, itemName, onClose }: BottleFillSelectorProps) {
  const [localPartials, setLocalPartials] = useState<number[]>(partials)
  const fillLevels = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]

  const handleAddPartial = (level: number) => {
    setLocalPartials([...localPartials, level])
  }

  const handleRemovePartial = (index: number) => {
    setLocalPartials(localPartials.filter((_, i) => i !== index))
  }

  const handleDone = () => {
    onChange(localPartials)
    onClose()
  }

  const total = localPartials.reduce((sum, p) => sum + p, 0)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg animate-fade-in" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-gray-800 mb-2">🍾 Add Partial Bottles</h3>
        <p className="text-gray-600 mb-1 font-medium">{itemName}</p>
        <p className="text-gray-400 text-sm mb-4">Tap bottles to add partials (one per service area)</p>

        {/* Current partials display */}
        {localPartials.length > 0 && (
          <div className="bg-slate-50 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                {localPartials.length} partial{localPartials.length > 1 ? 's' : ''} added:
              </span>
              <span className="font-bold text-slate-700">
                Total: {total.toFixed(1)}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {localPartials.map((partial, index) => (
                <button
                  key={index}
                  onClick={() => handleRemovePartial(index)}
                  className="flex items-center gap-1 bg-white px-3 py-2 rounded-lg shadow-sm border border-slate-200 hover:bg-red-50 hover:border-red-300 transition group"
                >
                  <BottleIcon fillLevel={partial} size="small" />
                  <span className="font-bold text-slate-600">.{(partial * 10).toFixed(0)}</span>
                  <span className="text-red-400 opacity-0 group-hover:opacity-100 ml-1">✕</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">Tap a partial to remove it</p>
          </div>
        )}

        {/* Bottle grid - tap to ADD */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {fillLevels.map((level) => (
            <button
              key={level}
              onClick={() => handleAddPartial(level)}
              className="flex flex-col items-center p-3 rounded-xl bg-gray-50 hover:bg-slate-100 hover:scale-105 transition-all active:scale-95"
            >
              <BottleIcon fillLevel={level} />
              <span className="text-xs text-gray-500 mt-1">Tap to add</span>
            </button>
          ))}
        </div>

        {/* Visual guide */}
        <div className="bg-slate-50 rounded-xl p-3 mb-4">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Nearly Empty</span>
            <div className="flex-1 mx-3 h-1.5 bg-gradient-to-r from-gray-200 via-slate-400 to-slate-600 rounded-full"></div>
            <span>Almost Full</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleDone}
            className="flex-1 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white font-bold rounded-xl hover:from-slate-700 hover:to-slate-800 transition shadow-lg"
          >
            Done {localPartials.length > 0 && `(${localPartials.length})`}
          </button>
        </div>
      </div>
    </div>
  )
}
