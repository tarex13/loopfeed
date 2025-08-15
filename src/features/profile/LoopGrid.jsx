import { Calendar, Tag } from 'lucide-react'

export default function LoopGrid({ loops }) {
  if (!loops.length) {
    return <div className="text-gray-500 dark:text-gray-400">No loops yet.</div>
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
      {loops.map((loop) => (
        <div
          key={loop.id}
          onClick={() => window.location.href = `/loop/${loop.id}`}
          className="cursor-pointer group border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm hover:shadow-md transition-all"
        >
          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:underline truncate">
            {loop.title || 'Untitled Loop'}
          </h3>

          {/* Tags */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-2">
            <Tag size={14} />
            {loop.tags?.length
              ? loop.tags.slice(0, 3).join(', ')
              : 'No tags'}
          </div>

          {/* Created At */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-3">
            <Calendar size={14} />
            {new Date(loop.created_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
