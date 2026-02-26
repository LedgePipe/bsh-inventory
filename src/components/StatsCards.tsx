'use client'

import { InventoryItem } from '@/types/database'

interface StatsCardsProps {
  items: InventoryItem[]
}

export default function StatsCards({ items }: StatsCardsProps) {
  const total = items.length
  const low = items.filter(item =>
    item.par_level > 0 && ((item.current_count + (item.partial_count || 0)) / item.par_level) < 0.5
  ).length
  const mid = items.filter(item =>
    item.par_level > 0 &&
    ((item.current_count + (item.partial_count || 0)) / item.par_level) >= 0.5 &&
    ((item.current_count + (item.partial_count || 0)) / item.par_level) < 0.75
  ).length
  const ok = items.filter(item =>
    item.par_level === 0 || ((item.current_count + (item.partial_count || 0)) / item.par_level) >= 0.75
  ).length

  const totalValue = items.reduce((sum, item) =>
    sum + ((item.current_count + (item.partial_count || 0)) * item.cost_per_unit), 0
  )

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <StatCard
        label="🍾 Total Items"
        value={total}
        subtitle={'"Products in inventory"'}
        gradient="from-amber-500 to-orange-500"
      />
      <StatCard
        label="🚨 Low Stock"
        value={low}
        subtitle={'"Below 50% of par"'}
        gradient="from-red-500 to-pink-500"
      />
      <StatCard
        label="⚠️ Getting Low"
        value={mid}
        subtitle={'"50-75% of par level"'}
        gradient="from-yellow-500 to-amber-500"
      />
      <StatCard
        label="✅ Well Stocked"
        value={ok}
        subtitle={'"75%+ of par level"'}
        gradient="from-green-500 to-emerald-500"
      />
      <StatCard
        label="💰 Total Value"
        value={`$${totalValue.toFixed(2)}`}
        subtitle={'"Current inventory value"'}
        gradient="from-purple-500 to-indigo-500"
      />
    </div>
  )
}

function StatCard({ label, value, subtitle, gradient }: {
  label: string
  value: string | number
  subtitle: string
  gradient: string
}) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 border-t-4 border-transparent relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
        {value}
      </p>
      <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
    </div>
  )
}
