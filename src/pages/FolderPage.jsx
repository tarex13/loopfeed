import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useUser } from '../store/useUser'
import { Eye, EyeOff, Folder, User2, ArrowLeft, Share2 } from 'lucide-react'
import LoopCard from '../components/LoopCard'
import Loading from '../components/Loading'

export default function FolderPage() {
  const { id } = useParams()
  
  const { user, loading: loadingUser } = useUser()
  const navigate = useNavigate()
  const [folder, setFolder] = useState(null)
  const [loops, setLoops] = useState([])
  const [owner, setOwner] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const loadFolder = async () => {
      setLoading(true)
      const { data: folderData } = await supabase
        .from('folders')
        .select('*')
        .eq('id', id)
        .single()

      if (!folderData || (!folderData.is_public && folderData.user_id !== user?.id)) {
        setFolder(null)
        return
      }

      setFolder(folderData)

      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', folderData.user_id)
        .single()

      setOwner(userData)

      const { data: linked } = await supabase
        .from('folder_loops')
        .select('loop_id')
        .eq('folder_id', id)

      const loopIds = (linked ?? [])
        .map((x) => x.loop_id)
        .filter((id) => typeof id === 'string' && id.length > 0)
      const visibilityFilter = user?.id
        ? `visibility.eq.public,user_id.eq.${user.id}`
        : `visibility.eq.public`

      const { data: loopsData } = await supabase
        .from('loops')
        .select('*, loop_cards(type, content, metadata)')
        .in('id', loopIds)
        .or(visibilityFilter)


      setLoops(loopsData || [])
      setLoading(false);
    }

    loadFolder()
  }, [id, user])

  const togglePrivacy = async () => {
    const newVisibility = folder.visibility === 'public' ? 'private' : 'public';
    
    const { error } = await supabase
      .from('folders')
      .update({ visibility: newVisibility })
      .eq('id', folder.id);

    if (!error) {
      setFolder({ ...folder, visibility: newVisibility });
    } else {
      console.error("Error updating folder visibility:", error);
    }
  };


  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/you')
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    alert('📎 Folder link copied!')
  }

  if (loadingUser || loading) return <Loading />
  if (folder === null) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500 dark:text-gray-400">
        This folder is private or does not exist.
      </div>
    )
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 md:px-10 pt-14 pb-32 space-y-12 text-white">
      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {folder.is_public && (
          <button
            onClick={handleShare}
            className="flex items-center gap-1 text-sm text-blue-400 hover:underline"
          >
            <Share2 size={16} />
            Share
          </button>
        )}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Folder size={22} /> {folder.name}
          </h1>
          {owner && (
            <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
              <User2 size={14} />
              <a
                href={`/u/${owner.username}`}
                className="underline hover:text-blue-500"
              >
                @{owner.username}
              </a>
              {owner.display_name && (
                <span className="text-gray-500">– {owner.display_name}</span>
              )}
            </p>
          )}
        </div>
        {folder.user_id === user?.id && (
          <button
            onClick={togglePrivacy}
            className="glass-button text-sm px-4 py-2 flex items-center gap-2"
          >
            {folder.is_public ? <EyeOff size={16} /> : <Eye size={16} />}
            {folder.is_public ? 'Make Private' : 'Make Public'}
          </button>
        )}
      </div>

      {/* Loops */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
          Loops in this folder
        </h2>
        {loops.length === 0 ? (
          <div className="glass-card p-6 text-center text-white/60">
            This folder is empty.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loops.map(loop => (
              <LoopCard key={loop.id} loop={loop} aspect="aspect-[3/4]" />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
