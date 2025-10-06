// Fully Updated Explore.jsx (With Masonry Layout + Improvements)
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Search, Sparkles, Hash, LayoutGrid, Rows3 } from 'lucide-react'
import LoopCard from '../components/LoopCard'
import Masonry from 'react-masonry-css'
import '../assets/glass-style.css'
import { useInView } from 'react-intersection-observer'

const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Most Cards', value: 'cards' },
  { label: 'A → Z', value: 'az' }
]

const TYPE_FILTERS = ['image', 'video', 'song', 'text', 'embed']

const breakpointColumnsObj = {
  default: 4,
  1100: 3,
  768: 2,
  500: 1
}

export default function Explore() {
  const [loops, setLoops] = useState([])
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('newest')
  const [selectedTypes, setSelectedTypes] = useState([])
  const [trendingTags, setTrendingTags] = useState([])
  const [selectedTags, setSelectedTags] = useState([])
  const [visibleLoops, setVisibleLoops] = useState([])
  const [layout, setLayout] = useState('grid')
  const [highlightTagIndex, setHighlightTagIndex] = useState(0)
  const PAGE_SIZE = 20

  const { ref, inView } = useInView({ threshold: 0.5 })

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('loops')
        .select('*, loop_cards(type, content, metadata, is_upload, media_uploads:media_uploads!loop_cards_media_upload_id_fkey(thumbnail_url))')
        .eq('status', 'normal')
        .eq('visibility', 'public')

      if (!error && data) {
        setLoops(data)
        setTrendingTags([...new Set(data.flatMap(l => l.tags || []))].filter(Boolean).slice(0, 10))
        setVisibleLoops(data.slice(0, PAGE_SIZE))
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (inView && visibleLoops.length < filteredLoops.length) {
      setVisibleLoops(prev => [
        ...prev,
        ...filteredLoops.slice(prev.length, prev.length + PAGE_SIZE)
      ])
    }
  }, [inView])

  useEffect(() => {
    const timer = setInterval(() => {
      setHighlightTagIndex(prev => (prev + 1) % trendingTags.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [trendingTags])

  const filteredLoops = loops
    .filter(loop => {
      const matchesQuery =
        loop.title?.toLowerCase().includes(query.toLowerCase()) ||
        loop.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase())) ||
        loop.loop_cards?.some(card => card.content?.toLowerCase().includes(query.toLowerCase()))

      const matchesTypes = selectedTypes.length === 0 || selectedTypes.includes(loop.loop_cards?.[0]?.type?.toLowerCase())
      const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => loop.tags?.includes(tag))

      return matchesQuery && matchesTypes && matchesTags
    })
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.created_at) - new Date(a.created_at)
      if (sort === 'oldest') return new Date(a.created_at) - new Date(b.created_at)
      if (sort === 'cards') return (b.loop_cards?.length || 0) - (a.loop_cards?.length || 0)
      if (sort === 'az') return a.title?.localeCompare(b.title)
      return 0
    })

  const toggleType = (type) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  return (
    <div className="px-4 md:px-10 pt-10 pb-32 max-w-screen-xl mx-auto text-white">
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles /> Explore
        </h1>

        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search loops or tags..."
              className="pl-10 pr-4 py-2 border border-white/10 rounded bg-white/5 text-sm text-white placeholder:text-white/50"
            />
          </div>
{/*           <button
            onClick={() => setLayout(layout === 'masonry' ? 'grid' : 'masonry')}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded bg-white/10 hover:bg-white/20 transition"
          >
            {layout === 'masonry' ? <LayoutGrid size={16} /> : <Rows3 size={16} />} View
          </button> */}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {TYPE_FILTERS.map(type => (
          <button
            key={type}
            onClick={() => toggleType(type)}
            className={`px-3 py-1 text-xs rounded-full border border-white/10 transition ${selectedTypes.includes(type) ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'}`}
          >
            {type.toUpperCase()}
          </button>
        ))}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="ml-auto px-2 py-1 text-sm bg-white/5 border border-white/10 rounded text-white"
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {trendingTags.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto text-sm pb-2">
          {trendingTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1 rounded-full border border-white/10 ${selectedTags.includes(tag) ? 'bg-pink-500 text-white' : 'bg-white/10 hover:bg-white/20'}`}
            >
              <Hash className="inline-block mr-1" size={14} /> {tag}
            </button>
          ))}
        </div>
      )}

      {filteredLoops.length === 0 ? (
        <div className="text-gray-400 mt-10">No loops found.</div>
      ) : layout === 'masonry' ? (
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="my-masonry-grid mt-10"
          columnClassName="my-masonry-grid_column"
        >
          {visibleLoops.map(loop => (
            <LoopCard key={loop.id} loop={loop} aspect="aspect-[3/4]" />
          ))}
        </Masonry>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-10">
          {visibleLoops.map(loop => (
            <LoopCard key={loop.id} loop={loop} aspect="aspect-[3/4]" />
          ))}
        </div>
      )}

      {visibleLoops.length < filteredLoops.length && (
        <div ref={ref} className="h-12 w-full flex items-center justify-center text-sm text-gray-400">
          🔄 Loading more…
        </div>
      )}
    </div>
  )
}