import { supabase } from '../lib/supabase'
import {
  getYouTubeEmbed,
  getVimeoEmbed,
  getSpotifyEmbed,
  getAppleMusicEmbed,
  getSoundCloudEmbed,
  isValidAudio
} from '../utils/EmbedHelpers'
import SocialEmbed from './SocialEmbed'
import { useState, useRef, useEffect } from 'react'

export default function LoopCardPreview({ type, url: origUrl, metadata, backgroundColor, loop, card }) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [url, setUrl] = useState(origUrl)
  
  const embedWrapper =
    'aspect-[4/5] relative h-full rounded-xl overflow-hidden flex items-center justify-center bg-black/10 backdrop-blur-md shadow-inner dark:bg-white/10'
  
  const textColor = loop?.bg_color === '#000000' ? 'text-white' : 'text-gray-600'

  const cleanText = (text) =>
    text?.replace(/&#?\w+;/g, decodeEntities).trim()

  const toggleAudio = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const getSignedUrl = async () => {
    //console.log(url);
    const { data, error } = await supabase.storage
      .from('media')
      .createSignedUrl(url, 60 * 30); // 30 min expiration

    if (!error) {
      setUrl(data.signedUrl);
    }
  }

  useEffect(()=>{
    if(card?.is_upload){
      getSignedUrl()
    } }, [card?.is_upload])
  return (
    <div
      className={embedWrapper}
      style={{
        background: backgroundColor || 'linear-gradient(to right, #0f172a, #334155)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
      }}
    >
      <div className="w-full h-full relative flex items-center justify-center overflow-auto vertical-loop-scroller p-4 text-center">

        {/* TEXT */}
        {type === 'text' && (
          <blockquote className={`text-xl sm:text-2xl absolute top-0 overflow-y-auto font-medium leading-relaxed ${textColor} whitespace-pre-wrap px-4`}>
            “{cleanText(url)}”
          </blockquote>
        )}

        {/* IMAGE */}
        {type === 'image' && (
          <img
            src={url}
            alt="preview"
            className="max-h-full max-w-full object-contain rounded shadow"
          />
        )}

        {/* VIDEO */}
        {type === 'video' && (
          getYouTubeEmbed(url) ? (
            <iframe
              src={getYouTubeEmbed(url)}
              className="w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
              sandbox="allow-same-origin allow-scripts"
              title="YouTube"
            />
          ) : getVimeoEmbed(url) ? (
            <iframe
              src={getVimeoEmbed(url)}
              className="w-full h-full"
              allow="autoplay"
              allowFullScreen
              sandbox="allow-same-origin allow-scripts"
              title="Vimeo"
            />
          ) : (
            <video src={url} controls className="w-full h-full object-contain rounded" />
          )
        )}

        {/* SONG */}
        {type === 'song' && (
          card.is_upload ? (
            <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl p-6 text-white space-y-4">
              <div className="flex items-center space-x-3">
                {/* Music Note SVG */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 19V6l12-2v13"/>
                  <circle cx="6" cy="18" r="3"/>
                  <circle cx="18" cy="16" r="3"/>
                </svg>
                <span className="text-lg font-semibold">Uploaded Audio</span>
              </div>
              <button
                onClick={toggleAudio}
                className="px-4 py-2 bg-white text-purple-700 font-bold rounded-full shadow hover:bg-gray-100 transition"
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <audio ref={audioRef} src={url} onEnded={() => setIsPlaying(false)} />
            </div>
          ) : getSpotifyEmbed(url) ? (
            <iframe
              src={getSpotifyEmbed(url)}
              className="aspect-video w-full max-w-[95%] max-h-full"
              allow="autoplay; clipboard-write; encrypted-media"
              sandbox="allow-same-origin allow-scripts"
              title="Spotify"
            />
          ) : getAppleMusicEmbed(url) ? (
            <iframe
              src={getAppleMusicEmbed(url)}
              className="w-full h-full"
              allow="autoplay *; encrypted-media *"
              sandbox="allow-same-origin allow-scripts allow-popups"
              title="Apple Music"
            />
          ) : getSoundCloudEmbed(url) ? (
            <iframe
              src={getSoundCloudEmbed(url)}
              className="w-full h-28"
              allow="autoplay"
              sandbox="allow-same-origin allow-scripts"
              title="SoundCloud"
            />
          ) : isValidAudio(url) ? (
            <audio controls src={url} className="w-full" />
          ) : (
            <p className="text-sm text-red-400">Unsupported audio format</p>
          )
        )}

        {/* SOCIAL */}
        {type === 'social' && <SocialEmbed url={url} metadata={metadata} />}

        {/* EMBED */}
        {type === 'embed' && metadata && (
          <div className="w-full flex flex-col items-center justify-center text-center px-5 py-6 backdrop-blur-md rounded-xl overflow-hidden shadow-inner space-y-3">
            {metadata.image && (
              <img
                src={metadata.image}
                alt="Preview"
                className="max-h-40 w-auto rounded object-contain shadow"
              />
            )}

            <h4 className={`text-base font-semibold ${textColor} leading-snug line-clamp-2`}>
              {cleanText(metadata.title) || 'Untitled'}
            </h4>

            {metadata.description && (
              <p className={`text-sm ${textColor} line-clamp-4 leading-relaxed`}>
                {cleanText(metadata.description)}
              </p>
            )}

            {metadata.url && (
              <a
                href={metadata.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 underline font-medium"
              >
                {metadata.site || 'Visit link'}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function decodeEntities(entity) {
  const map = {
    '&#x2b05;': '⬅',
    '&#xfe0f;': '',
    '&#064;': '@',
    '&#x1f1f2;': '🇲',
    '&#x1f1e6;': '🇦',
    '&#x1f929;': '🤩',
    '&#x1f3a5;': '🎥',
    '&amp;': '&',
    '&quot;': '"',
    '&#39;': "'"
  }
  return map[entity] || entity
}
