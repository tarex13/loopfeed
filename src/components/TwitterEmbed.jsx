import { useEffect, useRef, useState } from 'react'

export default function TwitterEmbed({ url, fallback }) {
  const ref = useRef(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const loadTwitterSDK = () => {
      if (window.twttr) {
        window.twttr.widgets.load(ref.current)
        setLoaded(true)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://platform.twitter.com/widgets.js'
      script.async = true
      script.onload = () => {
        if (window.twttr) {
          window.twttr.widgets.load(ref.current)
          setLoaded(true)
        }
      }
      document.body.appendChild(script)
    }

    loadTwitterSDK()
  }, [url])

  return (
    <div ref={ref} className="aspect-[4/5] w-full flex justify-center items-center bg-black/5 dark:bg-white/5 backdrop-blur-md rounded-lg overflow-hidden">
      <blockquote className="twitter-tweet">
        <a href={url}></a>
      </blockquote>
      {!loaded && fallback}
    </div>
  )
}
