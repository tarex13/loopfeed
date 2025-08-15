import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useUser } from '../store/useUser'
import { Link } from 'react-router-dom'

export default function WhisperInbox() {
  const { user } = useUser()
  const [messages, setMessages] = useState([])

  useEffect(() => {
    if (!user) return
    const fetch = async () => {
      const { data } = await supabase
        .from('whispers')
        .select('*, loops(title)')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })

      setMessages(data || [])
    }
    fetch()
  }, [user])

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Your Whispers</h1>

      {messages.length === 0 && (
        <div className="text-gray-500">No whispers received yet.</div>
      )}

      <div className="space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className="border p-4 rounded bg-white dark:bg-gray-900">
            <div className="text-sm text-gray-500 mb-1">
              On{' '}
              <Link to={`/loop/${msg.loop_id}`} className="underline">
                {msg.loops?.title || 'a loop'}
              </Link>{' '}
              — {new Date(msg.created_at).toLocaleString()}
            </div>
            <div className="text-md text-gray-800 dark:text-gray-100">{msg.message}</div>
            <button
              onClick={() => alert('Thanks. This whisper will be reviewed.')}
              className="text-xs text-red-500 underline mt-2"
            >
              Report
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
