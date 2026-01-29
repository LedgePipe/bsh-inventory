'use client'

import { InventoryItem } from '@/types/database'

interface StatsCardsProps {
  items: InventoryItem[]
}

export default function StatsCards({ items }: StatsCardsProps) {
  const total = items.length
  const low = items.filter(item =>
    item.par_level > 0 && (item.current_count / item.par_level) < 0.5
  ).length
  const mid = items.filter(item =>
    item.par_level > 0 &&
    (item.current_count / item.par_level) >= 0.5 &&
    (item.current_count / item.par_level) < 0.75
  ).length
  const ok = items.filter(item =>
    item.par_level === 0 || (item.current_count / item.par_level) >= 0.75
  ).length

  const totalValue = items.reduce((sum, item) =>
    sum + (item.current_count * item.cost_per_unit), 0
  )

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <StatCard
        label="🍾 Total Items"
        value={total}
        subtitle="Products in inventory"
        gradient="from-amber-500 to-orange-500"
      />
      <StatCard
        label="🚨 Low Stock"
        value={low}
        subtitle="Below 50% of par"
        gradient="from-red-500 to-pink-500"
        pulse={low > 0}
      />
      <StatCard
        label="⚠️ Getting Low"
        value={mid}
        subtitle="50-75% of par"
        gradient="from-yellow-400 to-orange-400"
      />
      <StatCard
        label="✅ Well Stocked"
        value={ok}
        subtitle="75%+ of par level"
        gradient="from-green-400 to-emerald-500"
      />
      <StatCard
        label="💰 Total Value"
        value={`$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        subtitle="Current inventory value"
        gradient="from-blue-500 to-purple-500"
        isLarge
      />
    </div>
  )
}

interface StatCardProps {
  label: string
  value: number | string
  subtitle: string
  gradient: string
  pulse?: boolean
  isLarge?: boolean
}

function StatCard({ label, value, subtitle, gradient, pulse, isLarge }: StatCardProps) {
  return (
    <div className={`card-ralph bg-white rounded-2xl shadow-lg p-4 text-center relative overflow-hidden ${isLarge ? 'col-span-2 md:col-span-1' : ''}`}>
      {/* Top gradient bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />

      <p className="text-gray-500 text-sm font-medium">{label}</p>
      <h3 className={`text-3xl font-bold my-2 bg-gradient-to-r ${gradient} bg-clip-text text-transparent ${pulse ? 'animate-pulse' : ''}`}>
        {value}
      </h3>
      <p className="text-xs text-gray-400 italic">"{subtitle}"</p>
    </div>
  )
}
