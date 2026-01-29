'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { toast, Toaster } from 'react-hot-toast'
import Header from '@/components/Header'
import BeerTab from '@/components/inventory/BeerTab'
import WineTab from '@/components/inventory/WineTab'
import PepsiTab from '@/components/inventory/PepsiTab'
import GlasswareTab from '@/components/inventory/GlasswareTab'
import { Profile, UserRole, SubmissionType, EditedCount } from '@/types/database'

type TabType = 'beer' | 'wine' | 'pepsi' | 'glassware'

const tabs: { id: TabType; label: string; emoji: string }[] = [
  { id: 'beer', label: 'BEER', emoji: '🍺' },
  { id: 'wine', label: 'WINE', emoji: '🍷' },
  { id: 'pepsi', label: 'PEPSI', emoji: '🥤' },
  { id: 'glassware', label: 'GLASSWARE', emoji: '🥃' },
]

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<TabType>('beer')
  const [user, setUser] = useState<Profile | null>(null)
  const [userRole, setUserRole] = useState<UserRole>('staff')
  const [loading, setLoading] = useState(true)
  const [editedCounts, setEditedCounts] = useState<Map<string, EditedCount>>(new Map())
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        setUser(profile)
        setUserRole(profile.role)
      }
      setLoading(false)
    }

    loadUser()
  }, [supabase, router])

  const handleCountChange = (itemId: string, newCount: number, productName: string, parLevel: number) => {
    setEditedCounts(prev => {
      const updated = new Map(prev)
      updated.set(itemId, { itemId, newCount, productName, parLevel })
      return updated
    })
  }

  const handleClearEdits = () => {
    setEditedCounts(new Map())
  }

  const handleSubmit = async () => {
    if (editedCounts.size === 0) {
      toast.error('No changes to submit')
      return
    }

    setIsSubmitting(true)

    try {
      const countsArray = Array.from(editedCounts.values())

      // Determine which table to update based on active tab
      const tableMap: Record<TabType, string> = {
        beer: 'beer_items',
        wine: 'wine_items',
        pepsi: 'pepsi_items',
        glassware: 'glassware_items',
      }

      const tableName = tableMap[activeTab]

      // Update each item
      for (const count of countsArray) {
        const { error } = await supabase
          .from(tableName)
          .update({
            current_count: count.newCount,
            last_counted_by: user?.id,
            last_counted_at: new Date().toISOString(),
          })
          .eq('id', count.itemId)

        if (error) throw error
      }

      // Create audit submission record
      const { error: submissionError } = await supabase
        .from('count_submissions')
        .insert({
          submitted_by: user?.id,
          submission_type: activeTab as SubmissionType,
          items_data: countsArray,
          notification_sent: false,
        })

      if (submissionError) throw submissionError

      // Create in-app notification
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          title: `${user?.full_name || user?.email} submitted ${activeTab.toUpperCase()} counts`,
          message: `${countsArray.length} items updated`,
          type: 'count_submission',
        })

      if (notifError) console.error('Failed to create notification:', notifError)

      // Send email notification
      try {
        await fetch('/api/notify-count-submission', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submittedBy: user?.full_name || user?.email,
            submissionType: activeTab,
            itemsData: countsArray,
          }),
        })
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError)
      }

      toast.success(`✅ ${activeTab.toUpperCase()} counts submitted & notified!`)
      handleClearEdits()

    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Failed to submit counts')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-2xl">🍺 Loading inventory...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <Toaster position="top-right" />
      <Header user={user} />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (editedCounts.size > 0) {
                  if (confirm(`You have ${editedCounts.size} unsaved changes. Switch tabs anyway?`)) {
                    handleClearEdits()
                    setActiveTab(tab.id)
                  }
                } else {
                  setActiveTab(tab.id)
                }
              }}
              className={`px-6 py-3 rounded-xl font-bold text-lg transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-600 hover:bg-gray-100 shadow'
              }`}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>

        {/* Admin Badge */}
        {userRole === 'admin' && (
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
            👑 ADMIN MODE - You can edit par levels
          </div>
        )}

        {/* Tab Content */}
        <div className="mb-24">
          {activeTab === 'beer' && (
            <BeerTab
              userRole={userRole}
              userId={user.id}
              onCountChange={handleCountChange}
              editedCounts={editedCounts}
            />
          )}
          {activeTab === 'wine' && (
            <WineTab
              userRole={userRole}
              userId={user.id}
              onCountChange={handleCountChange}
              editedCounts={editedCounts}
            />
          )}
          {activeTab === 'pepsi' && (
            <PepsiTab
              userRole={userRole}
              userId={user.id}
              onCountChange={handleCountChange}
              editedCounts={editedCounts}
            />
          )}
          {activeTab === 'glassware' && (
            <GlasswareTab
              userRole={userRole}
              userId={user.id}
              onCountChange={handleCountChange}
              editedCounts={editedCounts}
            />
          )}
        </div>

        {/* Sticky Submit Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="text-gray-600">
              {editedCounts.size > 0 ? (
                <span className="font-medium">
                  📝 {editedCounts.size} item{editedCounts.size !== 1 ? 's' : ''} edited
                </span>
              ) : (
                <span>Enter counts above to submit</span>
              )}
            </div>
            <button
              onClick={handleSubmit}
              disabled={editedCounts.size === 0 || isSubmitting}
              className={`px-8 py-3 rounded-xl font-bold text-lg transition-all ${
                editedCounts.size === 0 || isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-lg'
              }`}
            >
              {isSubmitting ? '⏳ Submitting...' : `✅ Submit ${activeTab.toUpperCase()} Counts`}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
