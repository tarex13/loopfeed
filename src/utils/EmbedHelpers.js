export const isTrustedImageHost = (url) => {
  try {
    const { hostname } = new URL(url)
    return [
      'unsplash.com',
      'cdn.sanity.io',
      'imgur.com',
      'res.cloudinary.com'
    ].some(trusted => hostname.includes(trusted))
  } catch {
    return false
  }
}

// YouTube Embed
export const getYouTubeEmbed = (url) => {
  if (!url) return null
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

// Vimeo Embed
export const getVimeoEmbed = (url) => {
  if (!url) return null
  const match = url.match(/vimeo\.com\/(\d+)/)
  return match ? `https://player.vimeo.com/video/${match[1]}` : null
}

// Spotify Embed
export const getSpotifyEmbed = (url) => {
  if (!url) return null
  try {
    const { pathname } = new URL(url)
    const parts = pathname.split('/').filter(Boolean)
    if (parts[0] === 'embed') return url
    if (['track', 'album', 'playlist'].includes(parts[0])) {
      return `https://open.spotify.com/embed/${parts[0]}/${parts[1]}`
    }
  } catch {
    return null
  }
  return null
}

// Apple Music Embed
export const getAppleMusicEmbed = (url) => {
  if (!url || !url.includes('music.apple.com')) return null
  try {
    const { pathname } = new URL(url)
    if (pathname.includes('/embed')) return url
    return `https://embed.music.apple.com${pathname}`
  } catch {
    return null
  }
}

// SoundCloud Embed
export const getSoundCloudEmbed = (url) => {
  if (!url) return null
  if (url.includes('w.soundcloud.com/player')) return url
  if (!url.includes('soundcloud.com')) return null
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23000000&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false`
}

// Direct audio file
export const isValidAudio = (url) => {
  return /\.(mp3|wav|ogg|aac)$/.test(url)
}
