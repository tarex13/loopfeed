export default function WhisperCard({ whisper }) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-xl bg-white dark:bg-gray-900 shadow-sm">
      <div className="text-sm text-gray-800 dark:text-white whitespace-pre-wrap">
        {whisper.message}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex justify-between items-center">
        <span>From: {whisper.sender_email || 'Anonymous'}</span>
        <span>{new Date(whisper.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  )
}
