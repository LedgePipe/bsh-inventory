'use client'

import { Profile } from '@/types/database'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  user: Profile | { email?: string }
  profile?: Profile | null
  onLogout?: () => void
}

export default function Header({ user, profile, onLogout }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()

  const roleEmoji: Record<string, string> = {
    admin: '👑',
    manager: '📋',
    staff: '👤'
  }

  // Use profile if provided, otherwise try to get role from user
  const userProfile = profile || (user as Profile)
  const displayRole = userProfile?.role || 'staff'
  const displayName = userProfile?.full_name || userProfile?.email || (user as { email?: string })?.email

  const handleLogout = async () => {
    if (onLogout) {
      onLogout()
    } else {
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    }
  }

  const navLinks = [
    { href: '/', label: '🍾 Liquor', emoji: '🍾' },
    { href: '/inventory', label: '🍺 Beer/Wine/More', emoji: '🍺' },
  ]

  return (
    <header className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-4 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              🏠 BSH Inventory
              <span className="text-sm font-normal opacity-80 hidden sm:inline">Bradshaw Social House</span>
            </h1>
            <p className="text-sm opacity-80 flex items-center gap-2">
              {roleEmoji[displayRole]} {displayName}
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs capitalize">
                {displayRole}
              </span>
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-semibold transition-colors flex items-center gap-2 border-2 border-white/30"
          >
            <span className="hidden sm:inline">Sign Out</span> 👋
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex gap-2 mt-2 overflow-x-auto pb-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                pathname === link.href
                  ? 'bg-white text-amber-600 shadow-lg'
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
