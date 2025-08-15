// components/FolderContextMenu.jsx
import { useRef, useEffect, useState } from 'react'
import {
  MoreVertical, Trash2, Link as LinkIcon, Globe, EyeOff, Pencil
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import EditFolderModal from './EditFolderModal'

export default function FolderContextMenu({ folder, onRefresh }) {
  const [open, setOpen] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const menuRef = useRef()
  console.log(folder)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDelete = async () => {
    const confirmed = confirm('Are you sure you want to delete this folder?')
    if (!confirmed) return
    await supabase.from('folders').delete().eq('id', folder.id)
    if (onRefresh) onRefresh()
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/folder/${folder.id}`
    navigator.clipboard.writeText(url)
    alert('Link copied to clipboard')
    setOpen(false)
  }

  const handleToggleVisibility = async () => {
    const newVisibility = folder.visibility === 'public' ? 'private' : 'public'
    await supabase.from('folders').update({ visibility: newVisibility }).eq('id', folder.id)
    if (onRefresh) onRefresh()
    setOpen(false)
  }

  return (
    <div className="relative inline-block text-left z-30" ref={menuRef}>
      <button
        onClick={(e) => {e.stopPropagation();setOpen(!open)}}
        className="p-1 rounded-full bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1a1a1f] border border-gray-200 dark:border-gray-700 rounded shadow z-30">
          <ul className="text-sm divide-y divide-gray-100 dark:divide-gray-700">
            <MenuItem icon={<Pencil size={14} />} label="Edit" onClick={(e) => {e.stopPropagation();setShowEdit(true)}} />
            <MenuItem
              icon={folder.visibility === 'public' ? <EyeOff size={14} /> : <Globe size={14} />}
              label={folder.visibility === 'public' ? 'Make Private' : 'Make Public'}
              onClick={(e)=>{e.stopPropagation();handleToggleVisibility()}}
            />
            <MenuItem icon={<LinkIcon size={14} />} label="Copy Link" onClick={(e)=>{e.stopPropagation(); handleCopyLink()}} />
            <MenuItem icon={<Trash2 size={14} />} label="Delete" onClick={(e)=>{e.stopPropagation();handleDelete()}} danger />
          </ul>
        </div>
      )}

      {showEdit && (
        <EditFolderModal
          folder={folder}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false)
            if (onRefresh) onRefresh()
          }}
        />
      )}
    </div>
  )
}

function MenuItem({ icon, label, onClick, danger = false }) {
  return (
    <li>
      <button
        onClick={onClick}
        className={`flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition ${
          danger ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-100'
        }`}
      >
        {icon}
        {label}
      </button>
    </li>
  )
}
