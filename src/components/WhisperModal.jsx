import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function WhisperModal({ loopId, recipientId, onClose }) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async () => {
    if (!message.trim()) return

    setLoading(true)
    const { error } = await supabase.from('whispers').insert([
      {
        loop_id: loopId,
        recipient_id: recipientId,
        message,
      }
    ])

    setLoading(false)
    if (error) {
      alert('Error sending whisper.')
    } else {
      setSent(true)
      setTimeout(() => {
        onClose()
      }, 1000)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-lg font-semibold mb-2">Send a Whisper</h2>
        {sent ? (
          <div className="text-green-500">Whisper sent!</div>
        ) : (
          <>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full border p-2 rounded text-sm"
              placeholder="Say something honest or helpful..."
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={onClose}
                className="text-sm px-3 py-1 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="text-sm px-3 py-1 bg-black text-white rounded"
              >
                {loading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
