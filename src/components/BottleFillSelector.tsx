'use client'

interface BottleFillSelectorProps {
  value: number
  onChange: (value: number) => void
  itemName: string
  onClose: () => void
}

// SVG Bottle component with fill level
function BottleIcon({ fillLevel, isSelected }: { fillLevel: number; isSelected: boolean }) {
  // Fill height percentage (0.0 = empty, 0.9 = almost full)
  const fillPercent = fillLevel * 100

  return (
    <svg
      viewBox="0 0 40 80"
      className={`w-10 h-16 transition-all ${isSelected ? 'scale-110' : ''}`}
    >
      {/* Bottle outline */}
      <defs>
        <clipPath id={`bottle-clip-${fillLevel}`}>
          {/* Bottle shape for clipping the fill */}
          <path d="M15 10 L15 5 Q15 2 17 2 L23 2 Q25 2 25 5 L25 10 L28 15 Q30 18 30 22 L30 70 Q30 75 25 75 L15 75 Q10 75 10 70 L10 22 Q10 18 12 15 Z" />
        </clipPath>
      </defs>

      {/* Bottle background (empty) */}
      <path
        d="M15 10 L15 5 Q15 2 17 2 L23 2 Q25 2 25 5 L25 10 L28 15 Q30 18 30 22 L30 70 Q30 75 25 75 L15 75 Q10 75 10 70 L10 22 Q10 18 12 15 Z"
        fill={isSelected ? '#e2e8f0' : '#f1f5f9'}
        stroke={isSelected ? '#475569' : '#94a3b8'}
        strokeWidth="2"
      />

      {/* Liquid fill */}
      {fillLevel > 0 && (
        <rect
          x="10"
          y={75 - (fillPercent * 0.55)}
          width="20"
          height={fillPercent * 0.55}
          fill={isSelected ? '#475569' : '#64748b'}
          clipPath={`url(#bottle-clip-${fillLevel})`}
        />
      )}

      {/* Fill level label */}
      <text
        x="20"
        y="88"
        textAnchor="middle"
        className={`text-xs font-bold ${isSelected ? 'fill-slate-700' : 'fill-slate-500'}`}
        style={{ fontSize: '10px' }}
      >
        .{(fillLevel * 10).toFixed(0)}
      </text>
    </svg>
  )
}

export default function BottleFillSelector({ value, onChange, itemName, onClose }: BottleFillSelectorProps) {
  const fillLevels = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]

  const handleSelect = (level: number) => {
    onChange(level)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg animate-fade-in" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-gray-800 mb-2">🍾 Select Fill Level</h3>
        <p className="text-gray-600 mb-1 font-medium">{itemName}</p>
        <p className="text-gray-400 text-sm mb-6">Tap the bottle that matches what you see</p>

        {/* Bottle grid */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {fillLevels.map((level) => (
            <button
              key={level}
              onClick={() => handleSelect(level)}
              className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                value === level
                  ? 'bg-slate-100 ring-2 ring-slate-500 scale-105'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <BottleIcon fillLevel={level} isSelected={value === level} />
            </button>
          ))}
        </div>

        {/* Visual guide */}
        <div className="bg-slate-50 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Empty</span>
            <div className="flex-1 mx-4 h-2 bg-gradient-to-r from-gray-200 via-slate-400 to-slate-600 rounded-full"></div>
            <span>Almost Full</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
