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
