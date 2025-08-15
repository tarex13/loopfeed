// components/LoopContextMenu.jsx
import { useState, useRef, useEffect } from 'react'
import {
  MoreVertical, Edit, Share2, FolderPlus, Trash2, Repeat2, LogIn
} from 'lucide-react'
import { useUser } from '../store/useUser'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AddToFolderMenu from './AddToFolderMenu'

export default function LoopContextMenu({ loop = {} }) {
  const { user } = useUser()
  const navigate = useNavigate()

  const [showFolderMenu, setShowFolderMenu] = useState(false)
  const [open, setOpen] = useState(false)
  const menuRef = useRef()
  const folderMenuRef = useRef()
  const [folderMenuPos, setFolderMenuPos] = useState(null)

  const handleOpenFolderMenu = () => {
    if (!menuRef.current) return

    const rect = menuRef.current.getBoundingClientRect()
    setFolderMenuPos({
      top: rect.top + window.scrollY - 30, // 10px above the menu
      left: rect.left + window.scrollX + 70,
    })
    setShowFolderMenu(true)
  }
  const isOwner = user?.id === loop?.user_id
  const isCollab = loop?.collaborators?.includes(user?.email)

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      const clickedOutsideContext = menuRef.current && !menuRef.current.contains(e.target)
      const clickedOutsideFolder = folderMenuRef.current && !folderMenuRef.current.contains(e.target)

      if (clickedOutsideContext && clickedOutsideFolder) {
        setOpen(false)
        setShowFolderMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleShare = async () => {
    if (!navigator.share) return alert('Sharing not supported')
    try {
      await navigator.share({
        title: loop?.title || 'Loop',
        url: `${window.location.origin}/loop/${loop?.id}`,
      })
    } catch (e) {
      console.error(e)
    }
    setOpen(false)
  }

  const handleDelete = async () => {
    const confirmed = confirm('Are you sure you want to delete this loop?')
    if (!confirmed) return
    await supabase.from('loops').update({ status: 'trashed' }).eq('id', loop.id)
    window.location.reload()
  }

  const handleRemix = () => {
    navigate(`/remix/${loop.id}`)
  }

  const handleEdit = () => {
    navigate(`/edit/${loop.id}`)
  }

  const handleAddToFolder = () => {
    alert('Open add-to-folder tooltip/modal here')
  }

  return (
    <div className="absolute top-2 left-2 z-30" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={(e) => {e.stopPropagation();setOpen(prev => !prev)}}
        className="p-1.5 rounded-full bg-white/80 dark:bg-black/40 backdrop-blur-md shadow hover:bg-gray-100 dark:hover:bg-gray-700 transition"
      >
        <MoreVertical size={18} className="text-gray-800 dark:text-white" />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="mt-2 w-44 absolute left-0 bg-white dark:bg-[#1a1a1f] border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden z-30">
          <ul className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
            {(isOwner || isCollab) && (
              <MenuItem icon={<Edit size={14} />} label="Edit" onClick={handleEdit} />
            )}
            <MenuItem icon={<Repeat2 size={14} />} label="Remix" onClick={handleRemix} />
            <MenuItem icon={<Share2 size={14} />} label="Share" onClick={handleShare} />
            {user ? (
                <>
                
                    <MenuItem
                        icon={<FolderPlus size={14} />}
                        label="Add to Folder"
                        onClick={handleOpenFolderMenu}
                        />

                        {showFolderMenu && folderMenuPos && (
                        <AddToFolderMenu
                            ref={folderMenuRef}
                            loopId={loop.id}
                            userId={user?.id}
                            position={folderMenuPos}
                            onClose={() => setShowFolderMenu(false)}
                        />
                        
                        )}
                </>
            ) : (
              <MenuItem icon={<LogIn size={14} />} label="Login to Save" onClick={() => navigate('/auth')} />
            )}
            {isOwner && (
              <MenuItem
                icon={<Trash2 size={14} />}
                label="Delete"
                onClick={handleDelete}
                danger
              />
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

function MenuItem({ icon, label, onClick, danger = false }) {
  return (
    <li>
      <button
        onClick={() => {
          onClick?.()
        }}
        className={`flex items-center w-full px-4 py-2 gap-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition ${
          danger ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-100'
        }`}
      >
        <span className="w-4 h-4">{icon}</span>
        {label}
      </button>
    </li>
  )
}
