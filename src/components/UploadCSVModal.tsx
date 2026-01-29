'use client'

import { useState } from 'react'
import { InventoryItemInsert, InventoryCategory } from '@/types/database'
import { getRandomQuote } from '@/lib/ralph-quotes'

interface UploadCSVModalProps {
  onClose: () => void
  onUpload: (items: InventoryItemInsert[]) => void
}

export default function UploadCSVModal({ onClose, onUpload }: UploadCSVModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<InventoryItemInsert[]>([])
  const [error, setError] = useState('')

  function parseCSV(text: string): InventoryItemInsert[] {
    const lines = text.split('\n')
    const items: InventoryItemInsert[] = []

    lines.forEach((line, idx) => {
      if (idx === 0 || !line.trim()) return // Skip header and empty lines

      const parts = line.split(',').map(s => s.trim().replace(/^["']|["']$/g, ''))
      const [code, name, category, par, cost, unit] = parts

      if (code && name) {
        items.push({
          code,
          name,
          category: (category as InventoryCategory) || 'liquor',
          par_level: parseInt(par) || 0,
          current_count: 0,
          cost_per_unit: parseFloat(cost) || 0,
          unit_type: unit || 'bottle'
        })
      }
    })

    return items
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setError('')

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const items = parseCSV(text)
        setPreview(items)

        if (items.length === 0) {
          setError("Couldn't find any items in the file. Check the format!")
        }
      } catch (err) {
        setError(getRandomQuote('error'))
      }
    }
    reader.readAsText(selectedFile)
  }

  function handleUpload() {
    if (preview.length > 0) {
      onUpload(preview)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-in" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-red-100 rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors"
        >
          ×
        </button>

        <h3 className="text-xl font-bold text-gray-800 mb-2">📤 Upload My Bottle Friends!</h3>
        <p className="text-gray-500 text-sm italic mb-4">"I'm uploading! It tastes like burning!"</p>

        {/* Format info */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm">
          <p className="font-semibold text-gray-700 mb-2">📋 CSV Format:</p>
          <code className="block bg-white p-2 rounded border text-xs text-gray-600 overflow-x-auto">
            Code, Name, Category, Par Level, Cost, Unit Type
          </code>
          <p className="text-gray-500 mt-2 text-xs">
            Categories: liquor, beer, wine, food, supplies<br/>
            Units: bottle, case, keg, bag, box, each
          </p>
        </div>

        {/* File input */}
        <div className="mb-4">
          <label className="block w-full">
            <div className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-purple-400'
            }`}>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              {file ? (
                <>
                  <span className="text-4xl">📄</span>
                  <p className="mt-2 font-semibold text-green-700">{file.name}</p>
                  <p className="text-sm text-green-600">{preview.length} items found!</p>
                </>
              ) : (
                <>
                  <span className="text-4xl">📂</span>
                  <p className="mt-2 text-gray-600">Click to choose a CSV file</p>
                  <p className="text-xs text-gray-400">"The pointy end goes in the computer!"</p>
                </>
              )}
            </div>
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 mb-4 text-red-600 text-sm">
            🙈 {error}
          </div>
        )}

        {/* Preview */}
        {preview.length > 0 && (
          <div className="mb-4">
            <p className="font-semibold text-gray-700 mb-2">👀 Preview (first 5):</p>
            <div className="bg-gray-50 rounded-xl p-3 max-h-40 overflow-y-auto">
              {preview.slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex justify-between py-1 border-b border-gray-200 last:border-0 text-sm">
                  <span className="font-medium text-purple-600">{item.code}</span>
                  <span className="text-gray-700 flex-1 mx-2 truncate">{item.name}</span>
                  <span className="text-gray-500">Par: {item.par_level}</span>
                </div>
              ))}
              {preview.length > 5 && (
                <p className="text-center text-gray-400 text-xs mt-2">
                  ...and {preview.length - 5} more friends!
                </p>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={preview.length === 0}
          className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          🚀 Upload {preview.length} New Friends!
        </button>
      </div>
    </div>
  )
}
