import { Link } from 'react-router-dom'
import { Folder, Lock, Globe } from 'lucide-react'
import { motion } from 'framer-motion'

export default function FolderCard({ folder }) {
  //console.log(folder);
  const isPublic = folder.is_public
  const loopCount = folder.loop_count ?? 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.02 }}
      className="rounded-2xl border border-blue-500 hover:shadow-lg transition-shadow p-5 group"
    >
      <Link to={`/folder/${folder.id}`} className="block space-y-2">
        {/* Folder Icon + Loop Count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex ">
              <Folder className="text-blue-500" size={36} />
              
                <span className="absolute -top-2 -right-2 text-[10px] font-medium bg-blue-500 text-white rounded-full px-2 py-0.5 shadow">
                  {loopCount}
                </span>
            </div>
          </div>
        </div>

        {/* Folder Name */}
        <h3 className="text-lg font-semibold text-white truncate">{folder.name}</h3>

        {/* Privacy Info */}
        <div className="flex items-center gap-1 text-sm text-gray-400">
          {isPublic ? <Globe size={14} /> : <Lock size={14} />}
          {isPublic ? 'Public' : 'Private'}
        </div>
        <div className="text-sm text-gray-500">Created on {new Date(folder.created_at).toLocaleDateString()}</div>
      </Link>
    </motion.div>
  )
}
