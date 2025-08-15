import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Music2, Video, Image as ImageIcon, Text
} from 'lucide-react'
import { getYouTubeEmbed, getVimeoEmbed, getSpotifyEmbed } from '../utils/EmbedHelpers'
import { useState, useEffect, useRef } from 'react'
import { useInView } from 'react-intersection-observer'
import LoopContextMenu from './LoopContextMenu'
import '../assets/glass-style.css'
import {CiLink} from 'react-icons/ci'
import { supabase } from '../lib/supabase'

export default function LoopScroller({ loops = [], layout = 'scroller', hoverReveal = false, loadMore, hasMore, loadingMore }) {
  const [hoveredId, setHoveredId] = useState(null)
  const [signedUrls, setSignedUrls] = useState({}) // { [loopId]: { url, expiresAt } }
  const signedUrlsRef = useRef(signedUrls)
  const [ref, inView] = useInView({ threshold: 0.5 })

  // keep ref in sync so effect that depends only on `loops` can read latest cache without extra deps
  useEffect(() => { signedUrlsRef.current = signedUrls }, [signedUrls])

  useEffect(() => {
    if (inView && hasMore && !loadingMore) loadMore?.()
  }, [inView, hasMore, loadingMore, loadMore])

  if (!loops || loops.length === 0) return null

  const typeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'video': return <Video size={14} />
      case 'image': return <ImageIcon size={14} />
      case 'song': return <Music2 size={14} />
      case 'text': return <Text size={14} />
      default: return <CiLink size={14} />
    }
  }

  // Fetch signed URLs for all loops that need them (runs whenever `loops` changes)
  useEffect(() => {
    let mounted = true

    const fetchSignedUrlsForLoops = async () => {
      // gather loops that actually need a signed url
      const toFetch = []
      for (const loop of loops) {
        const card = Array.isArray(loop.cards) ? loop.cards[0] : null
        if (!card || !card.is_upload || !card.content) continue

        const existing = signedUrlsRef.current[loop.id]
        // keep a short buffer so we refresh if the expiry is almost here (5 minutes)
        if (existing && existing.expiresAt > Date.now() + 5 * 60 * 1000) continue

        toFetch.push({ loopId: loop.id, path: card.content })
      }

      if (!toFetch.length) return

      // parallel requests, but we handle errors per-loop
      const results = await Promise.allSettled(
        toFetch.map(async ({ loopId, path }) => {
          try {
            // IMPORTANT: `path` must be the storage **path** (e.g. 'loop_media/..'), not a full public URL.
            const { data, error } = await supabase.storage.from('media').createSignedUrl(path, 60 * 30)
            if (error || !data?.signedUrl) {
              console.error('createSignedUrl error for', path, error)
              return null
            }
            return { loopId, url: data.signedUrl, expiresAt: Date.now() + 30 * 60 * 1000 }
          } catch (err) {
            console.error('Unexpected signed url error', err)
            return null
          }
        })
      )

      if (!mounted) return

      const updates = {}
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) {
          updates[r.value.loopId] = { url: r.value.url, expiresAt: r.value.expiresAt }
        }
      }
      if (Object.keys(updates).length) {
        setSignedUrls(prev => ({ ...prev, ...updates }))
      }
    }

    fetchSignedUrlsForLoops()
    return () => { mounted = false }
  }, [loops])

  const renderCover = (loop) => {
    const card = Array.isArray(loop.cards) ? loop.cards[0] : null
    if (!card) {
      return (
        <img src={loop.cover_url || '/default-loop.jpg'} alt="default" className="w-full h-full object-cover" />
      )
    }

    // get cached signed url if this is an upload
    const cached = signedUrls[loop.id]
    const signed = cached?.url
    const content = card?.is_upload ? (signed || null) : card?.content
    console.log(signed, cached, card)

    const type = card?.type?.toLowerCase()
    const youtube = getYouTubeEmbed(content)
    const vimeo = getVimeoEmbed(content)
    const spotify = getSpotifyEmbed(content)

    // If upload but signed URL not ready yet show spinner / placeholder
    if (card.is_upload && !signed) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100/20">
          <div className="text-xs text-white">Loading…</div>
        </div>
      )
    }

    if (type === 'image') {
      return <img src={content} alt="cover" className="w-full h-full object-cover" />
    }

    if (type === 'video') {
      if (youtube) return <iframe src={youtube} title="YouTube" className="w-full h-full object-cover" allow="autoplay" />
      if (vimeo) return <iframe src={vimeo} title="Vimeo" className="w-full h-full object-cover" allow="autoplay" />
      return <video src={content} className="w-full h-full object-cover" muted loop playsInline />
    }

    if (type === 'song') {
      if (spotify) {
        return (
          <iframe
            src={spotify}
            style={{ height: '100%', transform: 'translateY(0px)' }}
            width="100%"
            height="100"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="overflow-hidden"
          />
        )
      }
      return (
        <div className="flex items-center justify-center w-full h-full text-white text-sm p-4 backdrop-blur bg-black/30">
          🎵 {content?.slice(0, 32)}...
        </div>
      )
    }

    if (type === 'text') {
      return (
        <div className={`flex items-center justify-center w-full h-full text-sm p-4 text-center backdrop-blur ${loop.bg_color ? loop.bg_color === '#000000' ? 'text-white' : 'text-gray-600' : 'text-white'}`} style={{background: loop.bg_color ? loop.bg_color : 'linear-gradient(to right, #0f172a, #334155)'}}>
          {content?.slice(0, 100)}…
        </div>
      )
    }

    if (type === 'social') {
      return (
        <div className="flex items-center justify-center w-full h-full text-blue-200 text-xs p-4 text-center backdrop-blur bg-blue-800/40">
          🔗 {content}
        </div>
      )
    }

    if (type === 'embed') {
      const meta = card?.metadata || {}
      const title = meta.title || content?.slice(0, 80)
      const site = meta.site_name || (() => {
        try { return new URL(content).hostname } catch { return 'Unknown site' }
      })()
      const image = meta.image

      return (
        <div className="w-full h-full bg-blue-900/30 dark:bg-blue-800/20 backdrop-blur-sm rounded overflow-hidden text-white text-xs flex flex-col justify-between p-3">
          {image && (
            <div className="h-20 w-full mb-2 rounded overflow-hidden">
              <img src={image} alt="link preview" className="w-full h-full object-cover rounded" />
            </div>
          )}

          <div className="font-semibold text-sm" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>{title}</div>

          <div className="text-[0.65rem] text-blue-200 mt-2 flex justify-between items-center">
            <span className="truncate">{site}</span>
            <span>🔗</span>
          </div>
        </div>
      )
    }

    return (
      <img src={loop.cover_url || '/default-loop.jpg'} alt="default" className="w-full h-full object-cover" />
    )
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } }
      }}
      className={layout === 'grid' ? 'grid grid-cols-2 md:grid-cols-4 gap-4' : 'flex gap-5 overflow-x-auto scrollbar-hide px-1 pb-2 vertical-loop-scroller'}
    >
      {loops.map((loop) => (
        <div key={loop.id} className="relative w-[240px] shrink-0">
          <div className="loop-card-base"></div>

          <motion.div
            variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}
            whileHover={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 100 }}
            onMouseEnter={() => setHoveredId(loop.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="loop-card-glass"
          >
            {hoveredId === loop.id && <LoopContextMenu loop={loop} />}

            <Link className="relative z-10" to={`/loop/${loop.id}`}>
              <div className="relative h-40 items-center flex">
                {renderCover(loop)}

                <div className="absolute top-2 border right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
                  {loop.cards_count ?? loop.cards?.length ?? '∞'} {loop.cards?.length == 1 ? 'card' : 'cards'}
                </div>

                {hoverReveal && (
                  <div className={`absolute inset-0 flex items-center justify-center text-white px-3 text-sm text-center transition-opacity duration-200 ${hoveredId === loop.id ? 'opacity-100' : 'opacity-0'} backdrop-blur-sm bg-black/50`}>
                    <div>
                      <p className="font-semibold">{loop.title}</p>
                      <p className="text-xs opacity-80 mt-1">{loop.tagline || 'No tagline provided'}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 space-y-1 text-center border-t border-white/10">
                <p className="text-sm font-semibold text-white truncate">{loop.title || 'Untitled Loop'}</p>
                {loop.tagline && <p className="text-xs text-gray-300 truncate">{loop.tagline}</p>}
                {loop.cards?.length > 0 && (
                  <div className="flex justify-center items-center gap-1 text-xs text-gray-300 mt-1">
                    <span className="flex items-center gap-1 bg-white/10 text-white px-2 py-0.5 rounded-full">
                      {typeIcon(loop.cards[0]?.type)}
                      {loop.cards[0]?.type}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          </motion.div>
        </div>
      ))}

      {hasMore && !loadingMore && (<div ref={ref} className="w-12" />)}
      {loadingMore && (<div className="w-60 flex items-center justify-center text-sm text-gray-400">🔄 Loading more...</div>)}
      {!hasMore && (<div className="loop-card-glass w-60 min-w-[200px] flex border border-gray-600 rounded-lg items-center justify-center text-sm text-gray-500 italic">End of Loop!</div>)}
    </motion.div>
  )
}
