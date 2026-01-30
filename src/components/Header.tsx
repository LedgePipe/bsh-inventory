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
    { href: '/', label: 'LIQUOR', emoji: '🍾', description: 'Spirits & Bottles' },
    { href: '/inventory', label: 'BEER/WINE/MORE', emoji: '🍺', description: 'Pepsi & Glassware' },
  ]

  return (
    <header className="bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg sticky top-0 z-50">
      {/* Top bar with logo and user info */}
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg md:text-xl font-bold">🏠 BSH Inventory</h1>
          <span className="text-xs opacity-70 hidden sm:inline">Bradshaw Social House</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm opacity-90 hidden sm:flex items-center gap-1">
            {roleEmoji[displayRole]} {displayName}
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs capitalize ml-1">
              {displayRole}
            </span>
          </span>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
          >
            👋 Logout
          </button>
        </div>
      </div>

      {/* Main Navigation - Large and Prominent */}
      <nav className="bg-gradient-to-r from-amber-700 to-orange-700 border-t border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold text-center transition-all ${
                  pathname === link.href
                    ? 'bg-white text-amber-600 shadow-lg scale-105'
                    : 'bg-white/10 hover:bg-white/20 text-white border-2 border-white/30'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl">{link.emoji}</span>
                  <div className="text-left">
                    <div className="text-sm sm:text-base">{link.label}</div>
                    <div className={`text-xs ${pathname === link.href ? 'text-amber-500' : 'opacity-70'} hidden sm:block`}>
                      {link.description}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  )
}
