import { useState, useEffect } from 'react'
import { useUser } from '../store/useUser'
import { supabase } from '../lib/supabase'

export default function Settings() {
  const { user } = useUser()
  const [profile, setProfile] = useState({ display_name: '', avatar_url: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (data) setProfile(data)
    }
    load()
  }, [user])

  const save = async () => {
    setLoading(true)
    await supabase.from('user_profiles').upsert({
      id: user.id,
      ...profile,
    })
    setLoading(false)
    alert('Saved!')
  }

  const deleteAccount = async () => {
    const confirm = window.confirm('This will permanently delete your account. Continue?')
    if (!confirm) return
    await supabase.rpc('delete_user', { uid: user.id }) // you'll create this function
    alert('Account deleted. Logging out.')
    window.location.href = '/'
  }

  return (
    <div className="p-4 space-y-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">Settings</h1>

      <label className="block">
        <span>Display Name</span>
        <input
          className="w-full border rounded px-3 py-2"
          value={profile.display_name}
          onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
        />
      </label>

      <label className="block">
        <span>Avatar URL</span>
        <input
          className="w-full border rounded px-3 py-2"
          value={profile.avatar_url}
          onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
        />
      </label>

      <button onClick={save} disabled={loading} className="bg-black text-white px-4 py-2 rounded">
        {loading ? 'Saving...' : 'Save'}
      </button>

      <hr />

      <button onClick={deleteAccount} className="text-red-600 text-sm underline">
        Delete my account
      </button>
    </div>
  )
}
