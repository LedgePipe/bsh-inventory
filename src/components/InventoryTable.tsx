'use client'

import { InventoryItemWithUpdater, UserRole } from '@/types/database'

interface InventoryTableProps {
  items: InventoryItemWithUpdater[]
  userRole: UserRole
  onEditCount: (item: InventoryItemWithUpdater) => void
  onDelete: (itemId: string) => void
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export default function InventoryTable({ items, userRole, onEditCount, onDelete }: InventoryTableProps) {
  const categoryEmoji: Record<string, string> = {
    liquor: '🍾',
    beer: '🍺',
    wine: '🍷',
    food: '🍔',
    supplies: '📦'
  }

  function getTotal(item: InventoryItemWithUpdater) {
    return item.current_count + (item.partial_count || 0)
  }

  function getStatus(item: InventoryItemWithUpdater) {
    if (item.par_level === 0) return { class: 'bg-gray-100 text-gray-600', text: '➖ No Par', percent: 100 }
    const total = getTotal(item)
    const percent = (total / item.par_level) * 100
    if (percent < 50) return { class: 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700', text: '🚨 Low', percent }
    if (percent < 75) return { class: 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700', text: '⚠️ Watch', percent }
    return { class: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700', text: '✅ Good', percent }
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
        <div className="text-6xl mb-4">🍾</div>
        <h3 className="text-xl font-bold text-gray-700 mb-2">No items found</h3>
        <p className="text-gray-500">Add your first inventory item to get started</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">🏷️ Code</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">🍾 Name</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">📦 Category</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">📊 Par</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">🍾 Full</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">½ Partial</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">🔢 Total</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">💭 Status</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">💰 Cost</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">🎮 Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => {
              const status = getStatus(item)
              return (
                <tr key={item.id} className="hover:bg-yellow-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-bold text-purple-600">{item.code}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-medium text-gray-800">{item.name}</span>
                      {item.updater && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          📝 {item.updater.full_name || item.updater.email.split('@')[0]} · {formatTimeAgo(item.updated_at)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-sm">
                      {categoryEmoji[item.category]} {item.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-medium">{item.par_level}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-lg">{item.current_count}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-slate-600">{item.partial_count || 0}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-lg text-slate-700">{getTotal(item).toFixed(1)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${status.class}`}>
                      {status.text} ({Math.round(status.percent)}%)
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right hidden lg:table-cell">
                    <span className="text-gray-600">${Number(item.cost_per_unit).toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onEditCount(item)}
                        className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        🔢 Count
                      </button>
                      {userRole === 'admin' && (
                        <button
                          onClick={() => onDelete(item.id)}
                          className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
                        >
                          👋
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
