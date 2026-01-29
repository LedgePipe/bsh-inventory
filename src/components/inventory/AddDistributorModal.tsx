'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'
import { DistributorCategory } from '@/types/database'

interface AddDistributorModalProps {
  category: DistributorCategory
  onClose: () => void
  onSuccess: () => void
}

export default function AddDistributorModal({ category, onClose, onSuccess }: AddDistributorModalProps) {
  const [name, setName] = useState('')
  const [reminderDays, setReminderDays] = useState('Mon,Wed')
  const [loading, setLoading] = useState(false)

  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Please enter a distributor name')
      return
    }

    setLoading(true)

    const { error } = await supabase
      .from('distributors')
      .insert({
        name: name.trim(),
        category,
        reminder_days: reminderDays,
      })

    setLoading(false)

    if (error) {
      if (error.code === '23505') {
        toast.error('A distributor with this name already exists')
      } else {
        toast.error('Failed to add distributor')
      }
    } else {
      toast.success('Distributor added!')
      onSuccess()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          ➕ Add {category === 'beer' ? 'Beer' : 'Wine'} Distributor
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Distributor Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Adams Beverage"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reminder Days
            </label>
            <select
              value={reminderDays}
              onChange={(e) => setReminderDays(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
            >
              <option value="Daily">Daily</option>
              <option value="Mon">Monday</option>
              <option value="Tue">Tuesday</option>
              <option value="Wed">Wednesday</option>
              <option value="Thu">Thursday</option>
              <option value="Fri">Friday</option>
              <option value="Mon,Wed">Mon & Wed</option>
              <option value="Tue,Thu">Tue & Thu</option>
              <option value="Mon,Wed,Fri">Mon, Wed & Fri</option>
              <option value="Tue,Fri">Tue & Fri</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Distributor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
