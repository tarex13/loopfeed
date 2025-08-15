// components/AddToFolderMenu.jsx
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import CreateFolderModal from './CreateFolderModal'
import { createPortal } from 'react-dom'
export default function AddToFolderMenu({ loopId, userId, onClose, position }, ref) {
  const [folders, setFolders] = useState([])
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const fetchFolders = async () => {
      const { data } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', userId)
      setFolders(data || [])
    }

    if (userId) fetchFolders()
  }, [userId])

  const handleAdd = async (folderId) => {
    await supabase.from('folder_loops').insert({
      folder_id: folderId,
      loop_id: loopId,
    })
    onClose?.()
    alert('✅ Loop saved to folder')
  }

  const Content = () => 
  (
      <>
        <AnimatePresence>
          <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className={`w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg rounded p-2 ${
                position ? 'z-[9999]' : 'absolute right-0 bottom-full mb-2 z-50'
              }`}
              ref={ref}
              style={
                position
                  ? {
                      position: 'absolute',
                      top: position.top ?? 0,
                      left: position.left ?? 0,
                    }
                  : undefined
              }
            >
            <button
              onClick={() => setShowModal(true)}
              className="w-full px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-left dark:text-white"
            >
              ➕ Create Folder
            </button>
            <hr className="my-1 border-gray-200 dark:border-gray-700" />
            {folders.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 px-3 py-2">No folders yet</p>
            ) : (
              folders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => handleAdd(folder.id)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-800 dark:text-gray-200"
                >
                  📁 {folder.name}
                </button>
              ))
            )}
          </motion.div>
        </AnimatePresence>

        {showModal && (
          <CreateFolderModal
            onClose={() => setShowModal(false)}
            onCreated={async () => {
              const { data } = await supabase
                .from('folders')
                .select('*')
                .eq('user_id', userId)
              setFolders(data || [])
              setShowModal(false)
            }}
          />
        )}
      </>
  )




  if(position){
    

    return createPortal(
      <Content position={position} />, document.body
    )
  }else{
    return <Content />
  }
}
