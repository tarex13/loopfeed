import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { loadLoopWithCards } from '../lib/LoadLoopWithCards'
import CreateLoopPage from '../features/create-loop/CreateLoopPage'
import { useCreateLoopStore } from '../features/create-loop/useCreateLoopStore'

import { useUser } from '../store/useUser'
import Loading from '../components/Loading'
export default function RemixLoopPage() {
  const { id } = useParams()
  const setField = useCreateLoopStore((s) => s.setField)

  const { user, loading } = useUser()
  useEffect(() => {
    async function load() {
      const { loop, cards } = await loadLoopWithCards(id)
      if(loading) return <Loading />
      if(!user) return alert("You Cannot Remix This Loop(Logged out)")
      setField('title', loop.title + ' (Remix)')
      setField('autoplay', loop.autoplay)
      setField('tags', loop.tags)
      setField('tagline', loop.tagline)
      setField('theme', loop.theme)
      setField('isRemix', true)
      setField('font', loop.font)
      setField('bgColor', loop.bg_color)
      setField('music', loop.music)
      setField('cards', cards.map((c) => ({ type: c.type, content: c.content, file_name: c.media_uploads.file_name, metadata: c.metadata })))
    }
    load()
  }, [id])

  return <CreateLoopPage isRemix={true} />
}
