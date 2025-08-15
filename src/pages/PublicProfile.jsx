{/** Merged to ProfilePage */}
import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import LoopGrid from '../features/profile/LoopGrid'
import FolderGrid from '../features/profile/FolderGrid'
import { Loader2 } from 'lucide-react'

export default function PublicProfile() {
  const { username } = useParams()
  const [profile, setProfile] = useState(null)
  const [loops, setLoops] = useState([])
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)

      // Get user by username
      const { data: user } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()

      if (!user) {
        setProfile(null)
        setLoading(false)
        return
      }

      setProfile(user)

      const [{ data: loops }, { data: folders }] = await Promise.all([
        supabase.from('loops')
          .select('*, loop_cards(type, content)')
          .eq('user_id', user.id)
          .eq('visibility', 'public'),
        supabase.from('folders')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_public', true)
      ])

      setLoops(loops || [])
      setFolders(folders || [])
      setLoading(false)
    }

    loadProfile()
  }, [username])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-80 text-gray-500">
        <Loader2 className="animate-spin mr-2" /> Loading profile...
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-80 text-gray-500 dark:text-gray-400">
        This user does not exist.
      </div>
    )
  }

  const renderAvatar = () => {
    if (profile.avatar_url) {
      return (
        <img
          src={profile.avatar_url}
          alt="Avatar"
          className="w-14 h-14 rounded-full object-cover border border-gray-300 dark:border-gray-700 shadow-sm"
        />
      )
    }

    const initial = (profile.username || 'U')[0].toUpperCase()

    return (
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center font-semibold text-xl border border-gray-300 dark:border-gray-700 shadow-md transition-transform duration-300 ease-out hover:scale-105 hover:shadow-lg relative overflow-hidden
                  bg-gradient-to-br from-white/60 to-gray-200/80 dark:from-gray-700/60 dark:to-gray-900/80 backdrop-blur-md"
      >
        <span className="opacity-0 animate-fade-in text-gray-800 dark:text-white">{initial}</span>
      </div>
    )
  }



  return (
    <div className="max-w-screen-xl mx-auto px-4 md:px-10 pt-14 pb-32 space-y-14">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex gap-4 items-center">
          {renderAvatar()}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">@{profile.username}</h1>
            {profile.bio && (
              <p className="text-gray-600 dark:text-gray-400 max-w-xl text-sm mt-1">{profile.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Public Loops */}
      <section>
        <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Public Loops</h2>
        {loops.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400">This user hasn’t shared any loops publicly.</div>
        ) : (
          <LoopGrid loops={loops} />
        )}
      </section>

      {/* Public Folders */}
      <section>
        <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Public Folders</h2>
        {folders.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400">No public folders yet.</div>
        ) : (
          <FolderGrid folders={folders} />
        )}
      </section>
    </div>
  )
}
