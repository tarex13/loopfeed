import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { loadLoopWithCards } from '../lib/LoadLoopWithCards'
import CreateLoopPage from '../features/create-loop/CreateLoopPage'
import { useCreateLoopStore } from '../features/create-loop/useCreateLoopStore'

import { useUser } from '../store/useUser'
import Loading from '../components/Loading'
import { supabase } from '../lib/supabase'
export default function RemixLoopPage() {
  const { id } = useParams()
  const setField = useCreateLoopStore((s) => s.setField)

  const { user, loading } = useUser()
  const getSignedUrl = async (url) => {
    //console.log(url);
    const { data, error } = await supabase.storage
      .from('media')
      .createSignedUrl(url, 60 * 30); // 30 min expiration

    if (!error) {
      return (data.signedUrl);
    }
  }
  useEffect(() => {
    async function load() {
      const { loop, cards } = await loadLoopWithCards(id, ", size_bytes, thumbnail_url, thumbnail_range")
      if(loading) return <Loading />
      if(!user) return alert("You Cannot Remix This Loop(Logged out)")
      console.log(cards)
      const cardsWithUrls = await Promise.all(
        cards.map(async (c) => ({
          type: c.type,
          mime_type: c.media_uploads?.file_type,
          size_bytes: c.media_uploads?.size_bytes,
          file_name: c.media_uploads?.file_name,
          content: c.is_upload ? await getSignedUrl(c.content) : c.content,
          metadata: c.metadata
        }))
      );
      setField('title', loop.title + ' (Remix)')
      setField('autoplay', loop.autoplay)
      setField('originalLoopId', id)
      setField('tags', loop.tags)
      setField('tagline', loop.tagline)
      setField('theme', loop.theme)
      setField('isRemix', true)
      setField('font', loop.font)
      setField('bgColor', loop.bg_color)
      setField('music', loop.music)
      setField('cards', cardsWithUrls);
    }
    load()
  }, [id])

  return <CreateLoopPage isRemix={true} />
}
