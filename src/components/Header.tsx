'use client'

import { Profile } from '@/types/database'

interface HeaderProps {
  user: any
  profile: Profile | null
  onLogout: () => void
}

export default function Header({ user, profile, onLogout }: HeaderProps) {
  const roleEmoji = {
    admin: '👑',
    manager: '📋',
    staff: '👤'
  }

  return (
    <header className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-4 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            🍾 BSH Inventory
            <span className="text-sm font-normal opacity-80 hidden sm:inline">Bradshaw Social House</span>
          </h1>
          <p className="text-sm opacity-80 flex items-center gap-2">
            {roleEmoji[profile?.role || 'staff']} {profile?.full_name || user?.email}
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs capitalize">
              {profile?.role || 'staff'}
            </span>
          </p>
        </div>

        <button
          onClick={onLogout}
          className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-semibold transition-colors flex items-center gap-2 border-2 border-white/30"
        >
          <span className="hidden sm:inline">Sign Out</span> 👋
        </button>
      </div>
    </header>
  )
}
