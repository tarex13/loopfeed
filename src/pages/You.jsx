// Refactored and Enhanced You.jsx (Improved Consistency & Height)

{/** Merged to ProfilePage */}
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useUser } from '../store/useUser'
import { PlusCircle, Loader2, Mail, Edit3, Folder, Layers } from 'lucide-react'
import LoopCard from '../components/LoopCard'
import FolderCard from '../components/FolderCard'
import CreateFolderModal from '../components/CreateFolderModal'
import EditProfileModal from '../components/EditProfileModal'
import WhisperCard from '../components/WhsiperCard'
import FolderContextMenu from '../components/FolderContextMenu'
import { motion } from 'framer-motion'
import Loading from '../components/Loading'
import { useNavigate } from 'react-router-dom'
import { useCreateLoopStore } from '../features/create-loop/useCreateLoopStore'

export default function You() {
  const { user, loading: loadingUser } = useUser()
  const fetched = useRef(false)
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loops, setLoops] = useState([])
  const [folders, setFolders] = useState([])
  const [whispers, setWhispers] = useState([])

  const [loading, setLoading] = useState(true)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [activeDropFolder, setActiveDropFolder] = useState(null)
  const [editingBio, setEditingBio] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const {loopDragged, setLoopDragged} = useCreateLoopStore();
  useEffect(() => {
    if (loadingUser) return
    if (!loadingUser && !user) navigate("/auth")
  }, [loadingUser, user])

  useEffect(() => {
    if (!loadingUser && user && !fetched.current) {
      fetched.current = true
      fetchContent()
    }
  }, [loadingUser, user])

  const fetchContent = async () => {
    setLoading(true)
    const [{ data: loops }, { data: folders }, { data: profile }, { data: whispers }] = await Promise.all([
      supabase.from('loops').eq("status", "archived").select('*, loop_cards(type, content, metadata)').eq('user_id', user.id),
      supabase.from('folders').select('*').eq('user_id', user.id),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('whispers').select('*').eq('recipient_id', user.id).order('created_at', { ascending: false }),
    ])
    setLoops(loops || [])
    setFolders(folders || [])
    setProfile(profile || {})
    setWhispers(whispers || [])
    setLoading(false)
  }

  const handleDrop = async (loopId, folderId) => {
    await supabase.from('folder_loops').insert({ loop_id: loopId, folder_id: folderId })
    setActiveDropFolder(null)
  }

  const handleSave = async (key, value) => {
    if (profile[key] !== value) {
      await supabase.from('profiles').update({ [key]: value }).eq('id', user.id)
      fetchContent()
    }
  }

  const renderEditableField = (value, key, editing, setEditing, className = '') => (
    editing ? (
      <input
        defaultValue={value}
        autoFocus
        onBlur={(e) => {
          setEditing(false)
          handleSave(key, e.target.value)
        }}
        className={`inline-input ${className}`}
      />
    ) : (
      <span
        className={`cursor-pointer ${className}`}
        onClick={() => setEditing(true)}
      >
        {value || <span className="italic text-white/30">Add {key}…</span>}
      </span>
    )
  )

  const renderAvatarBar = () => (
    <div className="relative group w-16 h-16 shrink-0">
      <div className="absolute inset-0 rounded-full bg-white/5 border border-white/10 backdrop-blur-md group-hover:scale-105 transition-transform duration-300 shadow-inner shadow-black/20" />
      <div className="relative w-full h-full rounded-full overflow-hidden border border-white/10 bg-black/40 backdrop-blur-lg">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/80 text-2xl font-bold bg-black/30">
            {(profile?.username || user?.email || 'U')[0].toUpperCase()}
          </div>
        )}
      </div>
    </div>
  )

  if (loadingUser || loading) return <Loading />

  return (
    <div className="max-w-screen-xl mx-auto px-4 md:px-10 pt-14 pb-32 space-y-16 text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex gap-4 items-start">
          {renderAvatarBar()}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white">
              {renderEditableField(profile?.username, 'username', editingName, setEditingName)}
            </h1>
            <p className="text-gray-400 max-w-xl text-sm">
              {renderEditableField(profile?.bio, 'bio', editingBio, setEditingBio)}
            </p>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button onClick={() => setShowEditProfile(true)} className="glass-button px-4 py-2 flex items-center gap-2 text-sm">
            <Edit3 size={16} /> Edit Profile
          </button>
          <button onClick={() => setShowCreateFolder(true)} className="glass-button bg-pink-500 text-white px-4 py-2 flex items-center gap-2 text-sm hover:bg-pink-600">
            <PlusCircle size={16} /> New Folder
          </button>
        </div>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <Layers size={18} /> Your Loops
        </h2>
        {loops.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-white/70">
            You haven’t created any loops yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loops.map(loop => (
              <motion.div key={loop.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="h-[100%]" draggable onDragStart={() => setLoopDragged(loop.id)}>
                <LoopCard loop={loop} aspect="aspect-[3/4]" />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <Folder size={18} /> Your Folders
        </h2>
        {folders.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-white/70">
            No folders yet. Create one above.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {folders.map(folder => (
              <div key={folder.id} onMouseLeave={(e) => { e.preventDefault(); setActiveDropFolder(null) }} onDragOver={(e) => { e.preventDefault(); setActiveDropFolder(folder.id) }} onDrop={async () => {
                //const loopId = await navigator.clipboard.readText()
                handleDrop(loopDragged, folder.id)
              }} className={`relative glass-card transition p-4 ${activeDropFolder === folder.id ? 'ring-2 ring-blue-400' : ''}`}>
                <div className="absolute top-2 right-2 z-10">
                  <FolderContextMenu folder={folder} onRefresh={fetchContent} />
                </div>
                <FolderCard folder={folder} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <Mail size={18} /> Your Whispers
        </h2>
        {whispers.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-white/70">
            You currently have no whispers.
          </div>
        ) : (
          <div className="space-y-3">
            {whispers.map(whisper => (
              <WhisperCard key={whisper.id} whisper={whisper} />
            ))}
          </div>
        )}
      </section>

      {showCreateFolder && (
        <CreateFolderModal onClose={() => setShowCreateFolder(false)} onCreated={async () => { await fetchContent(); setShowCreateFolder(false) }} />
      )}

      {showEditProfile && (
        <EditProfileModal current={profile} onClose={() => { setShowEditProfile(false); fetchContent() }} />
      )}
    </div>
  )
}
