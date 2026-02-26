'use client'

import { useState } from 'react'

interface EditField {
  key: string
  label: string
  type: 'text' | 'number' | 'select'
  options?: { value: string; label: string }[]
  step?: string
}

interface EditItemModalProps {
  title: string
  fields: EditField[]
  values: Record<string, string | number>
  onSave: (values: Record<string, string | number>) => Promise<void>
  onClose: () => void
}

export default function EditItemModal({ title, fields, values, onSave, onClose }: EditItemModalProps) {
  const [formValues, setFormValues] = useState<Record<string, string | number>>(values)
  const [saving, setSaving] = useState(false)

  const handleChange = (key: string, value: string | number) => {
    setFormValues(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(formValues)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800">✏️ {title}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {fields.map(field => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-600 mb-1">{field.label}</label>
              {field.type === 'select' ? (
                <select
                  value={formValues[field.key] ?? ''}
                  onChange={e => handleChange(field.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  {field.options?.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  step={field.step}
                  value={formValues[field.key] ?? ''}
                  onChange={e => handleChange(field.key, field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              )}
            </div>
          ))}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : '💾 Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
