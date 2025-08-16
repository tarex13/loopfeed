'use client'

import { useEffect, useState, useRef } from 'react'
import { useUser } from '../store/useUser'
import { supabase } from '../lib/supabase'
import LoopScroller from '../components/LoopScroller'
import { motion } from 'framer-motion'
import {
  Flame, Shuffle, Star, PlusCircle, Clock
} from 'lucide-react'
import { useInView } from 'react-intersection-observer'
import '../assets/glass-style.css' // ← Import the glass effect CSS

const PULL_THRESHOLD = 60
const PAGE_SIZE = 12

export default function Home({setShowNav}) {
  const { user, loading: loadingUser } = useUser()
  const fetched = useRef(false)
  const [sections, setSections] = useState({})
  const [loading, setLoading] = useState(true)
  const [layout, setLayout] = useState('scroller')
  const [pullStatus, setPullStatus] = useState('')
  const touchStartY = useRef(0)
  const containerRef = useRef()

  const fetchSectionData = async ({ key, page = 1 }) => {
    let query = supabase.from('loops')
      .select('*, cards:loop_cards(type, content, position, metadata, is_upload, media_uploads:media_uploads!loop_cards_media_upload_id_fkey(thumbnail_url))')
      .eq('status', 'normal')
      .eq('visibility', 'public')

    switch (key) {
      case 'Trending Now':
        query = query
          .gte('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
          .order('remixes_count', { ascending: false })
        break
      case 'New This Week':
        query = query.order('created_at', { ascending: false })
        break
      case 'Editor’s Picks':
        query = query.in('id', ['YOUR_FEATURED_LOOP_IDS'])
        break
      case 'Surprise Me':
        query = query.order('id', { ascending: false })
        break
      case 'Remix Gems':
        query = query.order('remixes_count', { ascending: false })
        break
    }

    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data } = await query.range(from, to)
    return data || []
  }

  const loadSections = async () => {
    const initialSections = {
      ...(user ? {
        'Your Feed': {
          data: [], page: 1, loadingMore: false, hasMore: true,
          icon: <Clock size={18} />, tags: ['personalized']
        }
      } : {}),
      'Trending Now': { data: [], page: 1, loadingMore: false, hasMore: true, icon: <Flame size={18} />, tags: ['trending'] },
      'Remix Gems': { data: [], page: 1, loadingMore: false, hasMore: true, icon: <Shuffle size={18} />, tags: ['remix'] },
      'New This Week': { data: [], page: 1, loadingMore: false, hasMore: true, icon: <Clock size={18} />, tags: ['fresh'] },
      'Editor’s Picks': { data: [], page: 1, loadingMore: false, hasMore: true, icon: <Star size={18} />, tags: ['curated'] },
      'Surprise Me': { data: [], page: 1, loadingMore: false, hasMore: true, icon: <PlusCircle size={18} />, tags: ['random'] }
    }

    setSections(initialSections)

    for (const key of Object.keys(initialSections)) {
      const initialData = await fetchSectionData({ key, page: 1 })
      setSections(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          data: initialData,
          hasMore: initialData.length === PAGE_SIZE
        }
      }))
    }
  }

  const loadMoreForSection = async (key) => {
    setSections(prev => ({
      ...prev,
      [key]: { ...prev[key], loadingMore: true }
    }))

    const nextPage = sections[key].page + 1
    const moreData = await fetchSectionData({ key, page: nextPage })

    setSections(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        data: [...prev[key].data, ...moreData],
        page: nextPage,
        loadingMore: false,
        hasMore: moreData.length === PAGE_SIZE
      }
    }))
  }

  const fetchAgain = async () => {
    setLoading(true)
    await loadSections()
    setLoading(false)
  }

  useEffect(() => {
    if (!loadingUser && !fetched.current) {
      fetched.current = true
      fetchAgain()
    }
  }, [loadingUser, user])

  const onTouchStart = (e) => {
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY
    }
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error.message)
    } else {
      alert("You = Signed Out!!!")
      window.location.href = '/' // redirect to login
    }
  }

  const handleSignIn = () => {
    window.location.href = '/auth' // redirect to login
  }

  


  const onTouchMove = (e) => {
    const delta = e.touches[0].clientY - touchStartY.current
    if (delta > 0) {
      window.scrollTo(0, 0)
      setPullStatus(delta < PULL_THRESHOLD ? 'pull' : 'release')
    }
  }

  const onTouchEnd = () => {
    if (pullStatus === 'release') {
      setPullStatus('loading')
      fetchAgain().then(() => setPullStatus(''))
    } else {
      setPullStatus('')
    }
  }

  useEffect(() => {
    const el = containerRef.current
    el.addEventListener('touchstart', onTouchStart)
    el.addEventListener('touchmove', onTouchMove)
    el.addEventListener('touchend', onTouchEnd)
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [pullStatus])
  useEffect(()=>setShowNav(true), [])
  

  return (
    <div
      ref={containerRef}
      className="min-h-screen relative pb-32 text-white bg-gradient-to-br from-[#090e1a] via-[#111827] to-black"
    >
      {/* Pull-to-refresh banner */}
      <div className="fixed top-0 w-full flex justify-center z-30 pointer-events-none select-none">
        {pullStatus && (
          <div className="py-2 text-gray-400 text-sm backdrop-blur-md bg-black/40 px-4 rounded-full shadow">
            {pullStatus === 'pull' && '↓ Pull to refresh'}
            {pullStatus === 'release' && '↑ Release to refresh'}
            {pullStatus === 'loading' && '🔄 Refreshing...'}
          </div>
        )}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="max-w-screen-xl mx-auto px-4 md:px-10 pt-14 space-y-6 relative z-10">
          {/* Layout switch */}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setLayout(layout === 'scroller' ? 'grid' : 'scroller')}
              className="px-4 py-1.5 rounded-full backdrop-blur bg-white/10 text-sm text-white hover:bg-white/20 transition border border-white/10"
            >
              {layout === 'scroller' ? 'Grid View' : 'Scroller View'}
            </button>
            
            <button
              onClick={user ? handleSignOut : handleSignIn}
              className="px-4 py-1.5 rounded-full backdrop-blur bg-red-500/10 text-sm text-red-200 hover:bg-red-500/20 transition border border-white/10"
            >
              {user ? 'Sign Out ': 'Sign In'}
            </button>
          </div>
          
              <div className="Logo">
                
                <h1 className="auth-title">Loopfeed</h1>
              </div>
          {/* Section lists */}
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="space-y-4 animate-pulse">
                <div className="h-6 w-1/3 bg-gray-600/30 rounded" />
                <div className={layout === 'grid' ? 'grid grid-cols-2 md:grid-cols-4 gap-4' : 'flex gap-4 overflow-x-auto'}>
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-40 bg-gray-700/30 rounded w-full md:w-60" />
                  ))}
                </div>
              </div>
            ))
          ) : (
            Object.entries(sections).map(([title, section]) => (
              <Section
                key={title}
                title={title}
                section={section}
                layout={layout}
                onLoadMore={() => loadMoreForSection(title)}
              />
            ))
          )}
        </div>
      </motion.div>
    </div>
  )
}

function Section({ title, section, layout, onLoadMore }) {
  const [ref, inView] = useInView({ triggerOnce: true, rootMargin: '-100px' })

  return (
    <div ref={ref} className="space-y-3">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-10 py-1 px-2 backdrop-blur bg-white/5 rounded-md shadow border-l-2 border-blue-500"
      >
        <div className="flex items-center gap-2 text-xl md:text-2xl font-bold text-white">
          <div className="p-2 rounded-full bg-white/10 text-white">
            {section.icon}
          </div>
          <span>{title}</span>
          {section.tags?.length > 0 && (
            <div className="flex gap-1 ml-2">
              {section.tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 text-xs uppercase bg-white/10 text-white rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {inView && (
        <LoopScroller
          loops={section.data}
          layout={layout}
          hoverReveal={true}
          loadMore={onLoadMore}
          hasMore={section.hasMore}
          loadingMore={section.loadingMore}
        />
      )}
    </div>
  )
}
