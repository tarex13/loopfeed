import InstagramEmbed from './InstagramEmbed'
import TwitterEmbed from './TwitterEmbed'
import TikTokEmbed from './TikTokEmbed'
import EmbedFallback from './EmbedFallback'

export default function SocialEmbed({ url, metadata }) {
  if (!url) return null

  const hostname = new URL(url).hostname

  if (hostname.includes('instagram.com')) {
    return <InstagramEmbed url={url} fallback={<EmbedFallback metadata={metadata} />} />
  }
  if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
    return <TwitterEmbed url={url} fallback={<EmbedFallback metadata={metadata} />} />
  }
  if (hostname.includes('tiktok.com')) {
    return <TikTokEmbed url={url} fallback={<EmbedFallback metadata={metadata} />} />
  }

  return <EmbedFallback metadata={metadata} />
}
