import { useEffect, useRef, useState } from 'react'

export default function TikTokEmbed({ url, fallback }) {
  const ref = useRef(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const loadTikTokSDK = () => {
      if (window.tiktokEmbedLoaded) {
        window.tiktokEmbedLoaded()
        setLoaded(true)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://www.tiktok.com/embed.js'
      script.async = true
      script.onload = () => {
        if (window.tiktokEmbedLoaded) {
          window.tiktokEmbedLoaded()
          setLoaded(true)
        }
      }
      document.body.appendChild(script)
    }

    loadTikTokSDK()
  }, [url])

  return (
    <div ref={ref} className="aspect-[4/5] w-full flex justify-center items-center bg-black/5 dark:bg-white/5 backdrop-blur-md rounded-lg overflow-hidden">
      <blockquote className="tiktok-embed" cite={url} data-video-id="" style={{ margin: 0 }}>
        <a href={url}></a>
      </blockquote>
      {!loaded && fallback}
    </div>
  )
}
