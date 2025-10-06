// LoopCard.jsx
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getYouTubeEmbed, getVimeoEmbed, getSpotifyEmbed } from '../utils/EmbedHelpers'
import LoopContextMenu from './LoopContextMenu'

export default function LoopCard({
  loop,
  aspect = 'aspect-[4/5]',
  context = true,
  hoverReveal = true,
  compact = false
}) {
  const card = loop.loop_cards?.[0]
  const type = card?.type?.toLowerCase()
  const [signedContent, setSignedContent] = useState(card?.content)

  // Preload signed URL for uploads
  useEffect(() => {
    const fetchSignedUrl = async () => {
      if (!card?.is_upload) return;

      // video → use thumbnail
      if (card.type === 'video' && card.media_uploads?.thumbnail_url) {
        const { data, error } = await supabase.storage
          .from('media')
          .createSignedUrl(card.media_uploads.thumbnail_url, 60 * 30);

        if (!error && data?.signedUrl) {
          setSignedContent(data.signedUrl);
        }
        return;
      }

      // everything else → use content
      if (card.content) {
        const { data, error } = await supabase.storage
          .from('media')
          .createSignedUrl(card.content, 60 * 30);

        if (!error && data?.signedUrl) {
          setSignedContent(data.signedUrl);
        }
      }
    };

    fetchSignedUrl();
  }, [card]);


  // External embed helpers
  const youtube = getYouTubeEmbed(signedContent)
  const vimeo = getVimeoEmbed(signedContent)
  const spotify = getSpotifyEmbed(signedContent)

  const renderPreview = () => {
    if (!card) {
      return (
        <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
          No preview
        </div>
      )
    }

    switch (type) {
      case 'image':
        return <img src={signedContent} alt="Cover" loading="lazy" className="w-full h-full object-cover" />

      case 'video':
        if (youtube || vimeo) {
          return (
            <iframe
              src={youtube || vimeo}
              className="w-full h-full object-cover"
              allow="autoplay; fullscreen"
            />
          )
        }
        if (card.is_upload && card.media_uploads?.thumbnail_url) {
          return (
            <img
              src={signedContent}
              className="w-full h-full object-cover"
            />
          )
        }
        return (
          <video
            src={signedContent}
            loading="lazy"
            className="w-full h-full object-cover"
            muted 
           // preload="none" use only if you would not want a thumbnail url but this might also make use of unnecessary memory
            
          />
        )

      case 'song':
        if (spotify) {
          return (
            <iframe
              src={spotify}
              className="w-full h-full object-cover"
              allow="autoplay"
            />
          )
        }
        return (
          <audio
            src={signedContent}
            className="w-full h-full"
            controls
          />
        )

      case 'text':
        return (
          <div
            className={`flex items-center justify-center w-full h-full text-sm p-4 text-center backdrop-blur ${
              loop.bg_color === '#000000' ? 'text-white' : 'text-gray-800'
            }`}
            style={{
              background: loop.bg_color || 'linear-gradient(to right, #0f172a, #334155)'
            }}
          >
            {signedContent?.slice(0, 100)}…
          </div>
        )

      case 'embed': {
        const meta = card?.metadata || {}
        const title = meta.title || signedContent?.slice(0, 80)
        const site = meta.site_name || (() => {
          try {
            return new URL(signedContent).hostname.replace('www.', '')
          } catch {
            return 'Unknown site'
          }
        })()
        const image = meta.image
        return (
          <div className="w-full h-full bg-gradient-to-br from-blue-900/30 to-blue-800/10 dark:from-blue-700/40 dark:to-blue-900/10 text-white text-xs rounded flex flex-col justify-between p-3">
            {image && (
              <div className="h-32 w-full mb-2 rounded overflow-hidden">
                <img src={image} alt="link preview" className="w-full h-full object-cover rounded" />
              </div>
            )}
            <div
              className="font-medium text-sm overflow-hidden text-ellipsis leading-tight"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {title}
            </div>
            <div className="text-[0.65rem] text-blue-200 mt-2 flex justify-between items-center">
              <span className="truncate">{site}</span>
              <span className="opacity-70">🔗</span>
            </div>
          </div>
        )
      }

      case 'social':
        return <div className="card-preview-fallback">🔗 {signedContent}</div>

      default:
        return <div className="card-preview-fallback">No preview</div>
    }
  }

  const getTypeEmoji = () => {
    const map = {
      text: '📝',
      image: '🖼️',
      video: '🎬',
      song: '🎵',
      embed: '🔗',
      social: '📱'
    }
    return map[type] || '📦'
  }

  return (
    <motion.div
      whileInView={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4 }}
      className="relative h-full overflow-hidden rounded-xl border border-white/10 bg-white/5 dark:bg-white/10 shadow-lg backdrop-blur group hover:scale-[1.02] transition-transform"
    >
      {context && <LoopContextMenu loop={loop} />}

      <Link to={`/loop/${loop.id}`} className="block h-full">
        <div className={`overflow-hidden relative ${aspect}`}>
          {renderPreview()}

          {hoverReveal && (
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-black/40 text-sm flex items-center justify-center text-center px-4 text-white">
              {loop.tagline || 'No description'}
            </div>
          )}
        </div>

        <div className="p-4 space-y-1 text-center">
          <h3 className="font-semibold truncate text-white text-lg">{loop.title || 'Untitled Loop'}</h3>

          {loop.tags?.length > 0 && (
            <div className="flex justify-center flex-wrap gap-1 mt-1">
              {loop.tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 bg-white/10 text-white rounded-full uppercase"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {!compact && (
            <>
              <div className="text-xs text-gray-300 mt-1 flex justify-center gap-2 items-center">
                {getTypeEmoji()} {type || 'Unknown'} · {loop.loop_cards?.length || 0} cards
              </div>
              <div className="text-[11px] text-gray-400">
                {new Date(loop.created_at).toLocaleDateString()}
              </div>
            </>
          )}
        </div>
      </Link>
    </motion.div>
  )
}
