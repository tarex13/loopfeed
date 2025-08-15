// components/EditFolderModal.jsx
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function EditFolderModal({ folder, onClose, onSaved }) {
  const [name, setName] = useState(folder.name || '')
  const [visibility, setVisibility] = useState(folder.visibility || 'private')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return

    setSaving(true)

    const { error } = await supabase.from('folders').update({
      name,
      visibility
    }).eq('id', folder.id)

    setSaving(false)

    if (error) {
      alert('Error updating folder')
      return
    }

    if (onSaved) onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50  z-50 flex items-center justify-center">
      <div className="bg-white z-50  dark:bg-gray-900 p-6 rounded-xl shadow-xl w-full max-w-md space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">✏️ Edit Folder</h2>

        <input
          className="w-full p-2 border rounded bg-white dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-700"
          placeholder="Folder name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={visibility === 'public'}
              onChange={() => setVisibility('public')}
            />
            Public
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={visibility === 'private'}
              onChange={() => setVisibility('private')}
            />
            Private
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            disabled={saving}
            onClick={handleSave}
            className="px-4 py-2 rounded text-sm bg-black text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
