// LoopViewer.jsx
import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Share2,
  Volume2,
  VolumeX,
  FolderPlus,
  Lock,
  LucideLockOpen
} from 'lucide-react'
import { MdGroup, MdGroupAdd } from "react-icons/md";
import {IoMdVolumeOff} from 'react-icons/io'
import WhisperModal from '../components/WhisperModal'
import AddToFolderMenu from '../components/AddToFolderMenu'
import CreateFolderModal from '../components/CreateFolderModal'
import LoopCardPreview from '../components/LoopCardPreview'
import { useUser } from '../store/useUser'
import Loading from '../components/Loading'

export default function LoopViewer({ setShowNav }) {
  const { id } = useParams()
  const { user } = useUser()
  const navigate = useNavigate()
  

  const [loop, setLoop] = useState(null)
  const [cards, setCards] = useState([])
  const [showCollaborators, setShowCollaborators] = useState(false)
  const [index, setIndex] = useState(0)
  const [muted, setMuted] = useState(true)
  const [showWhisper, setShowWhisper] = useState(false)
  const [showFolderMenu, setShowFolderMenu] = useState(false)
  const [folders, setFolders] = useState([])
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [canView, setCanView] = useState(false)

  const timerRef = useRef(null)

  useEffect(() => setShowNav(false), [])

  useEffect(() => {
    const fetchLoop = async () => {
      const { data: loopData } = await supabase
        .from('loops')
        .select('*')
        .eq('id', id)
        .single()

      //const res = await supabase.storage.listBuckets();
      //console.log(res);

      const { data: cardData } = await supabase
        .from('loop_cards')
        .select('*')
        .eq('loop_id', id)
        .order('position')

      const { data: collabs } = await supabase
        .from('loop_collaborators')
        .select('collaborator_id, role, status, users: collaborator_id (id, username, avatar_url)')
        .eq('loop_id', id)
        .eq('status', 'accepted')

      const collaborators = collabs?.map(c => ({
        id: c.user_id,
        username: c.users?.username || 'Unknown',
        name: c.users?.full_name || '',
        avatar: c.users?.avatar_url || '',
        role: c.role
      })) || []




      setLoop({ ...loopData, collaborators })

      setCards(cardData || [])

      const viewerId = user?.id
      const isOwner = viewerId === loopData.user_id
      const isCollab = collaborators.includes(viewerId)
      const isPublic = loopData.visibility === 'public'

      setCanView(isOwner || isCollab || isPublic)

      if (loopData.is_remix) {
        const { data: remixInfo, error: remixError } = await supabase
          .from('remixes')
          .select('original_loop_id, profiles:remixed_by(username)')
          .eq('remix_loop_id', loopData.id)
          .single()

        if (remixInfo) {
          const { data: originalLoop, error: originalLoopError } = await supabase
            .from('loops')
            .select('id, title, user_id')
            .eq('id', remixInfo.original_loop_id)
            .single()

          const { data: originalOwner, error: ownerError } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', originalLoop.user_id)
            .single()

          setLoop(prev => ({
            ...prev,
            original_loop_id: originalLoop.id,
            original_loop_title: originalLoop.title,
            owner_username: originalOwner.username
          }))
        }
      }
    }

    fetchLoop()
  }, [id, user])

  useEffect(() => {
    if (loop?.autoplay && cards.length > 1) {
      timerRef.current = setInterval(() => {
        setIndex(i => (i + 1) % cards.length)
      }, 8000)
    }
    return () => clearInterval(timerRef.current)
  }, [loop?.autoplay, cards.length])

  const current = cards[index]
  const canEdit =
    user && (user.id === loop?.user_id || loop?.collaborators?.includes(user.id))

  const handleShare = async () => {
    if (!navigator.share) return alert('Sharing not supported')
    try {
      await navigator.share({ title: loop.title, url: window.location.href })
    } catch (e) {
      console.error(e)
    }
  }

  const fetchFolders = async () => {
    const { data } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', user.id)
    setFolders(data || [])
  }

  const handleSaveToFolder = async folderId => {
    await supabase
      .from('folder_loops')
      .insert({ loop_id: loop.id, folder_id: folderId })
    setShowFolderMenu(false)
    alert('Loop saved to folder!')
  }
  const textColor = loop?.bg_color ? loop.bg_color === '#000000' ? 'text-white' : 'text-gray-600' : 'text-white';

  if (!loop) return <Loading />
  if (!canView)
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center text-center px-4 text-gray-600 dark:text-gray-300">
        <Lock className="w-12 h-12 mb-4" />
        <p>This loop is private.</p>
        <p className="text-sm mt-1">Only visible to its creator or collaborators.</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 border rounded"
        >
          ← Back
        </button>
      </div>
    )

  const bg = loop.bg_color || 'linear-gradient(to right, #0f172a, #334155)'
  const font = loop.font || 'Default'
  const theme = loop.theme || 'minimal'

  const fontClass = {
    Default: 'font-sans',
    Serif: 'font-serif',
    Typewriter: 'font-mono'
  }[font]

  return (
    <div
      className={`w-full h-screen flex flex-col items-center justify-center relative ${fontClass} transition-all duration-500`}
      style={{background: bg ? bg : 'linear-gradient(to right, #0f172a, #334155)',}}
    >
      {loop.music && <audio src={loop.music} autoPlay loop muted={muted} />}

      {/* Top Nav */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => {
            setShowNav(true)
            navigate('/')
          }}
          className="p-2 rounded-full bg-white/80 dark:bg-black/50 shadow"
        >
          <ArrowLeft className={`w-5 h-5 dark:text-white text-black`} />
        </button>
      </div>

      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <button
          onClick={handleShare}
          className="p-2 rounded-full bg-white/80 dark:bg-black/50 shadow"
        >
          <Share2 className={`w-5 h-5 dark:text-white text-black`} />
        </button>
        {loop.music ? (<button
          onClick={() => setMuted(!muted)}
          className="p-2 rounded-full bg-white/80 dark:bg-black/50 shadow"
        >
          {muted ? <VolumeX className={`w-5 h-5 dark:text-white text-black`} /> : <Volume2 className={`w-5 h-5 ${loop.bg_color ? loop.bg_color === '#000000' ? 'text-white' : 'text-gray-600' : 'text-white'}`} />}
        </button>) : (<button
          className="p-2 rounded-full bg-white/80 dark:bg-black/40 shadow"
        ><IoMdVolumeOff className={`w-5 h-5 cursor-not-allowed dark:text-white text-black`} /></button>)}
      </div>

      {/* Viewer */}
      <div className="flex items-center justify-center gap-4 w-full max-w-6xl px-4 ">
        <button
          onClick={() => setIndex((index - 1 + cards.length) % cards.length)}
          className="p-2 rounded-full bg-white/80 dark:bg-black/40 text-black dark:text-white shadow border"
        >
          ← Prev
        </button>

        <div className="h-[80vh] aspect-[4/5] rounded-xl overflow-hidden shadow-lg flex border-2 items-center justify-center border-2 border-white/20 bg-black/20 backdrop-blur-md">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
              className="w-full h-full flex items-center justify-center shadow-xl rounded-2xl border-2 border-white/20 bg-black/20 backdrop-blur-md"
            >
              <LoopCardPreview
                type={current?.type?.toLowerCase()}
                url={current?.content}
                backgroundColor={bg}
                metadata={current?.metadata}
                loop={loop}
                card={current}
              />
            </motion.div>
            
          </AnimatePresence>
        {loop.is_remix && loop.original_loop_id && loop.owner_username && (
          <div className="absolute bg-zinc-700 text-white p-1 bottom-2 right-3 text-xs opacity-80" style={{}}>
            Original <a href={`/loop/${loop.original_loop_id}`} className="underline hover:text-blue-400">loop</a> 
            {' '}by <a href={`/u/${loop.owner_username}`} className="underline hover:text-blue-400">@{loop.owner_username}</a>
          </div>
        )}
        </div>

        <button
          onClick={() => setIndex((index + 1) % cards.length)}
          className="p-2 rounded-full bg-white/80 dark:bg-black/40 text-black dark:text-white shadow border"
        >
          Next →
        </button>
      </div>

      {/* Bottom */}
      <div className="text-xs text-gray-500 mt-2">
        Card {index + 1} of {cards.length}
      </div>

      <div className="absolute bottom-4 flex gap-3 flex-wrap justify-center z-10">
        <button
          onClick={() => alert('TODO: Remix logic')}
          className="px-4 py-2 bg-black border-2 border-gray-500 text-white rounded-full shadow hover:bg-gray-800"
        >
          ♻️ Remix
        </button>
        {canEdit && (
          <button
            onClick={() => navigate(`/edit/${loop.id}`)}
            className={`px-4 py-2 border rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ${textColor}`}
          >
            ✏️ Edit
          </button>
        )}



        {!canEdit && <button
          onClick={() => setShowWhisper(true)}
          className={`px-4 py-2 border rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ${textColor}`}
        >
          💬 Whisper
        </button>}
        {loop.collaborators?.length > 0 && (
          <button
            onClick={() => setShowCollaborators(prev => !prev)}
            className={`px-4 py-2 border flex items-center gap-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ${textColor}`}
          >
            <MdGroup /> {showCollaborators ? 'Hide' : 'View'} Collaborators
          </button>
        )}

        <div className="relative">
          <button
            onClick={() => {
              setShowFolderMenu(!showFolderMenu)
              fetchFolders()
            }}
            className={`px-4 py-2 border rounded-full flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 ${textColor}`}
          >
            <FolderPlus size={16} /> Add to Folder
          </button>
          {showFolderMenu && (
            <AddToFolderMenu
              loopId={loop.id}
              userId={user?.id}
              onClose={() => setShowFolderMenu(false)}
              onSelect={handleSaveToFolder}
            />
          )}
        </div>
</div>
<AnimatePresence>
  {showCollaborators && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-4 p-4 rounded-xl shadow-lg absolute bottom-[10vh] shadow-sm shadow-zinc-400/40 left-1/2 -translate-x-1/2 w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 backdrop-blur-md text-sm"
    >
      <h4 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-3">Collaborators</h4>

      <ul className="space-y-3 divide-y divide-zinc-200 dark:divide-zinc-700">
        {loop.collaborators.map((collab) => (
          <li key={collab.id} className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              {/* Avatar or initials fallback */}
              {collab.avatar ? (
                <img
                  src={collab.avatar}
                  alt={collab.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-zinc-300 dark:bg-zinc-700 text-xs flex items-center justify-center text-zinc-700 dark:text-white font-bold">
                  {collab.display_name?.[0]?.toUpperCase() || collab.username?.[0]?.toUpperCase()}
                </div>
              )}

              {/* Name + link */}
              <div className="flex flex-col">
                <a
                  href={`/u/${collab.username}`}
                  className="font-medium text-zinc-800 dark:text-zinc-100 hover:underline hover:text-blue-500 dark:hover:text-blue-400"
                >
                  {collab.display_name || collab.username}
                </a>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">@{collab.username}</span>
              </div>
            </div>

            {/* Role + status badge */}
            <div className="flex items-center gap-2">
              {collab.role && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 shadow- shadow-zinc-400 dark:border-zinc-600">
                  {collab.role}
                </span>
              )}
              {/*collab.status && (
                <span
                  className={`
                    text-xs px-2 py-0.5 rounded-full border
                    ${
                      collab.status === 'accepted'
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700'
                        : collab.status === 'pending'
                        ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700'
                        : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700'
                    }
                  `}
                >
                  {collab.status}
                </span>
              )*/}
            </div>
          </li>
        ))}
      </ul>
    </motion.div>
  )}
</AnimatePresence>



      {showWhisper && (
        <WhisperModal
          loopId={loop.id}
          recipientId={loop.user_id}
          onClose={() => setShowWhisper(false)}
        />
      )}
      {showFolderModal && (
        <CreateFolderModal
          onClose={() => setShowFolderModal(false)}
          onCreated={async () => {
            await fetchFolders()
            setShowFolderModal(false)
          }}
        />
      )}
    </div>
  )
}
