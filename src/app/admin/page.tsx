'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { Profile } from '@/types/database'
import toast, { Toaster } from 'react-hot-toast'

interface UserRow {
  id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
}

interface Recipient {
  id: string
  email: string
  name: string | null
  active: boolean
  created_at: string
}

interface Submission {
  id: string
  submission_type: string
  submitted_at: string
  items_data: Record<string, unknown>
  notification_sent: boolean
  submitter: { email: string; full_name: string | null }
}

interface Snapshot {
  id: string
  created_at: string
  snapshot_type?: string
  created_by?: string
  [key: string]: unknown
}

export default function AdminPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'users' | 'notifications' | 'activity'>('users')

  // Users
  const [users, setUsers] = useState<UserRow[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('staff')
  const [inviting, setInviting] = useState(false)

  // Notifications
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [newRecipientEmail, setNewRecipientEmail] = useState('')
  const [newRecipientName, setNewRecipientName] = useState('')

  // Activity
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])

  const fetchUsers = useCallback(async () => {
    const res = await fetch('/api/admin/users')
    if (res.ok) {
      const data = await res.json()
      setUsers(data.users)
    }
  }, [])

  const fetchRecipients = useCallback(async () => {
    const res = await fetch('/api/admin/notification-settings')
    if (res.ok) {
      const data = await res.json()
      setRecipients(data.recipients)
    }
  }, [])

  const fetchActivity = useCallback(async () => {
    const res = await fetch('/api/admin/activity')
    if (res.ok) {
      const data = await res.json()
      setSubmissions(data.submissions)
      setSnapshots(data.snapshots)
    }
  }, [])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (!p || p.role !== 'admin') { router.push('/'); return }

      setProfile(p)
      setLoading(false)
    }
    init()
  }, [router])

  useEffect(() => {
    if (!profile) return
    if (activeTab === 'users') fetchUsers()
    else if (activeTab === 'notifications') fetchRecipients()
    else if (activeTab === 'activity') fetchActivity()
  }, [activeTab, profile, fetchUsers, fetchRecipients, fetchActivity])

  const handleRoleChange = async (userId: string, newRole: string) => {
    const res = await fetch('/api/admin/update-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: newRole }),
    })
    if (res.ok) {
      toast.success('Role updated')
      fetchUsers()
    } else {
      toast.error('Failed to update role')
    }
  }

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    if (res.ok) {
      toast.success('User deleted')
      fetchUsers()
    } else {
      const data = await res.json()
      toast.error(data.error || 'Failed to delete user')
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) return
    setInviting(true)
    const res = await fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    })
    setInviting(false)
    if (res.ok) {
      toast.success(`Invite sent to ${inviteEmail}`)
      setInviteEmail('')
      fetchUsers()
    } else {
      const data = await res.json()
      toast.error(data.error || 'Failed to invite user')
    }
  }

  const handleAddRecipient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRecipientEmail) return
    const res = await fetch('/api/admin/notification-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', email: newRecipientEmail, name: newRecipientName }),
    })
    if (res.ok) {
      toast.success('Recipient added')
      setNewRecipientEmail('')
      setNewRecipientName('')
      fetchRecipients()
    } else toast.error('Failed to add recipient')
  }

  const handleRemoveRecipient = async (id: string) => {
    if (!confirm('Remove this recipient?')) return
    const res = await fetch('/api/admin/notification-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove', id }),
    })
    if (res.ok) { toast.success('Removed'); fetchRecipients() }
  }

  const handleToggleRecipient = async (id: string) => {
    const res = await fetch('/api/admin/notification-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle', id }),
    })
    if (res.ok) fetchRecipients()
  }

  const formatDate = (d: string) => new Date(d).toLocaleString('en-US', {
    timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })

  const getItemCount = (items: Record<string, unknown>) => {
    if (Array.isArray(items)) return items.length
    return Object.keys(items).length
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
    </div>
  }

  if (!profile) return null

  const tabs = [
    { key: 'users' as const, label: '👥 Users', },
    { key: 'notifications' as const, label: '🔔 Notifications' },
    { key: 'activity' as const, label: '📊 Activity' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <Header user={profile} profile={profile} />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">👑 Admin Dashboard</h2>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === t.key
                  ? 'bg-amber-500 text-white shadow'
                  : 'bg-white text-slate-600 hover:bg-amber-50 border border-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Invite Form */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">✉️ Invite New User</h3>
              <form onSubmit={handleInvite} className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm text-slate-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Role</label>
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {inviting ? 'Sending...' : 'Send Invite'}
                </button>
              </form>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800">All Users ({users.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Email</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Name</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Role</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Joined</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm text-slate-800">{u.email}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{u.full_name || '—'}</td>
                        <td className="px-4 py-3">
                          <select
                            value={u.role}
                            onChange={e => handleRoleChange(u.id, e.target.value)}
                            className="text-sm px-2 py-1 border border-slate-300 rounded-lg bg-white"
                          >
                            <option value="staff">👤 Staff</option>
                            <option value="manager">📋 Manager</option>
                            <option value="admin">👑 Admin</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">{formatDate(u.created_at)}</td>
                        <td className="px-4 py-3 text-right">
                          {u.id !== profile.id && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.email)}
                              className="text-red-500 hover:text-red-700 text-sm font-medium"
                            >
                              🗑️ Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">➕ Add Notification Recipient</h3>
              <form onSubmit={handleAddRecipient} className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm text-slate-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={newRecipientEmail}
                    onChange={e => setNewRecipientEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Name (optional)</label>
                  <input
                    type="text"
                    value={newRecipientName}
                    onChange={e => setNewRecipientName(e.target.value)}
                    placeholder="Name"
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <button type="submit" className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors">
                  Add
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800">📧 Notification Recipients</h3>
                <p className="text-sm text-slate-500 mt-1">These people receive email notifications when counts are submitted.</p>
              </div>
              <div className="divide-y divide-slate-100">
                {recipients.map(r => (
                  <div key={r.id} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleRecipient(r.id)}
                        className={`w-10 h-6 rounded-full transition-colors relative ${r.active ? 'bg-green-500' : 'bg-slate-300'}`}
                      >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${r.active ? 'left-5' : 'left-1'}`} />
                      </button>
                      <div>
                        <span className="text-sm font-medium text-slate-800">{r.email}</span>
                        {r.name && <span className="text-sm text-slate-500 ml-2">({r.name})</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveRecipient(r.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      ✕ Remove
                    </button>
                  </div>
                ))}
                {recipients.length === 0 && (
                  <div className="px-4 py-8 text-center text-slate-400">No recipients configured</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800">📝 Recent Count Submissions</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Who</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Type</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Items</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">When</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Notified</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {submissions.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm text-slate-800">
                          {s.submitter.full_name || s.submitter.email}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-800 uppercase">
                            {s.submission_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{getItemCount(s.items_data)} items</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{formatDate(s.submitted_at)}</td>
                        <td className="px-4 py-3 text-sm">{s.notification_sent ? '✅' : '❌'}</td>
                      </tr>
                    ))}
                    {submissions.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No submissions yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800">📸 Recent Snapshots</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {snapshots.map(s => (
                  <div key={s.id} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50">
                    <div className="text-sm text-slate-800">
                      {s.snapshot_type && <span className="font-medium uppercase mr-2">{s.snapshot_type}</span>}
                      Snapshot
                    </div>
                    <div className="text-sm text-slate-500">{formatDate(s.created_at)}</div>
                  </div>
                ))}
                {snapshots.length === 0 && (
                  <div className="px-4 py-8 text-center text-slate-400">No snapshots yet</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
