import { useEffect, useRef, useState } from 'react'

export default function InstagramEmbed({ url, fallback }) {
  const ref = useRef(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const loadInstagramSDK = () => {
      if (window.instgrm) {
        window.instgrm.Embeds.process()
        setLoaded(true)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://www.instagram.com/embed.js'
      script.async = true
      script.onload = () => {
        if (window.instgrm) {
          window.instgrm.Embeds.process()
          setLoaded(true)
        }
      }
      document.body.appendChild(script)
    }

    loadInstagramSDK()
  }, [url])

  return (
    <div className="aspect-[4/5] w-full flex justify-center items-center relative bg-black/5 dark:bg-white/5 backdrop-blur-md rounded-lg overflow-hidden">
      <blockquote
        ref={ref}
        className="instagram-media w-full h-full"
        data-instgrm-permalink={url}
        data-instgrm-version="14"
        style={{ margin: 0 }}
      />
      {!loaded && fallback}
    </div>
  )
}
