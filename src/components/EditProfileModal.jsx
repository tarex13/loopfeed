import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function EditProfileModal({ current, onClose }) {
  const [displayName, setDisplayName] = useState(current.display_name || '')
  const [username, setUsername] = useState(current.username || '')
  const [bio, setBio] = useState(current.bio || '')

  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const fetchAuthData = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (error) {
        console.error('Failed to load auth user:', error)
        return
      }

      setEmail(data.user.email || '')
      setPhone(data.user.phone || '')
    }

    fetchAuthData()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage('')

    try {
      // 1. Update profile info (display name, username, bio)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          username,
          bio
        })
        .eq('id', current.id)

      if (profileError) throw profileError

      // 2. Update auth user info (email / phone / password)
      const updates = {}
      if (email && email !== current.email) updates.email = email
      if (phone && phone !== current.phone) updates.phone = phone
      if (password.length >= 6) updates.password = password

      if (Object.keys(updates).length > 0) {
        const { error: authError } = await supabase.auth.updateUser(updates)
        if (authError) throw authError
        onClose(false)
      }
      onClose(true)
    } catch (err) {
      setMessage(err.message || 'Failed to update profile.')
    }

    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-[#0d0d10] p-6 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">✏️ Edit Profile</h2>

        <input
          placeholder="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full p-2 border rounded bg-white dark:bg-transparent shadow-lg rounded-lg dark:text-white border-gray-300 dark:border-gray-800"
        />

        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 border rounded bg-white dark:bg-transparent shadow-lg rounded-lg dark:text-white border-gray-300 dark:border-gray-800"
        />

        <textarea
          placeholder="Bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          className="w-full p-2 border rounded bg-white dark:bg-transparent shadow-lg rounded-lg dark:text-white border-gray-300 dark:border-gray-800"
        />

        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded bg-white dark:bg-transparent shadow-lg rounded-lg dark:text-white border-gray-300 dark:border-gray-800"
        />

        <input
          placeholder="Phone Number"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full p-2 border rounded bg-white dark:bg-transparent shadow-lg rounded-lg dark:text-white border-gray-300 dark:border-gray-800"
        />

        <input
          placeholder="New Password (min 6 chars)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded bg-white dark:bg-transparent shadow-lg rounded-lg dark:text-white border-gray-300 dark:border-gray-800"
        />

        {message && (
          <p className="text-red-500 text-sm">{message}</p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={()=>onClose(true)}
            className="px-4 py-2 rounded text-sm bg-gray-200 dark:bg-gray-900 text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded text-sm bg-black text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
