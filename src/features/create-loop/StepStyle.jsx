import { useEffect, useState } from 'react'
import { useCreateLoopStore } from './useCreateLoopStore'
import { supabase } from '../../lib/supabase'
import { motion } from 'framer-motion'
import './../../assets/step-style.css'
import { HeadphoneOff, Headphones } from 'lucide-react'

const themePresets = {
  lofi: {
    label: 'Lofi',
    font: 'Typewriter',
    bgColor: '#111827',
    fontColor: 'text-white',
    musicTag: 'lofi'
  },
  bold: {
    label: 'Bold',
    font: 'Serif',
    bgColor: '#000000',
    fontColor: 'text-yellow-200',
    musicTag: 'intense'
  },
  minimal: {
    label: 'Minimal',
    font: 'Default',
    bgColor: '#ffffff',
    fontColor: 'text-black',
    musicTag: 'ambient'
  },
  soft: {
    label: 'Soft',
    font: 'Default',
    bgColor: '#f5d0fe',
    fontColor: 'text-black',
    musicTag: 'soft'
  }
}

const fonts = ['Default', 'Serif', 'Typewriter']
const bgColors = ['#ffffff', '#000000', '#fef3c7', '#f5d0fe', '#e0f2fe']

export default function StepStyle() {
  const { theme, font, bgColor, setField, music } = useCreateLoopStore()
  const [tracks, setTracks] = useState([])
  const [showMute, setShowMute] = useState(false)
  const [selectedTrackId, setSelectedTrackId] = useState(null)
  const [customizing, setCustomizing] = useState(false)
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    const fetchTracks = async () => {
      const { data } = await supabase.from('ambient_tracks').select('*');
      
      // Assuming 'music' is a URL string you want to compare against
      setTracks(data || []);
    
      
      const matchingTrack = data?.find(item => item.url === music); 
      if (matchingTrack) {
        setSelectedTrackId(matchingTrack.id);
      }
    };

    fetchTracks();
  }, []); 


  const applyTheme = (key) => {
    const preset = themePresets[key]
    const track = tracks.find(t => t.tags?.includes(preset.musicTag)) || null

    setField('theme', key)
    setField('font', preset.font)
    setField('bgColor', preset.bgColor)
    

    if (track) {
      playTrack(track)
    } else {
      setSelectedTrackId(null)
      setField('music', '')
    }
    setCustomizing(false)
  }

  const playTrack = (track) => {
    const currentAudio = document.getElementById(`audio-${track.id}`)
    if (!showMute) setShowMute(true);

    // If same track, unselect and stop
    if (selectedTrackId === track.id) {
      currentAudio.pause()
      currentAudio.currentTime = 0
      setSelectedTrackId(null)
      setField('music', '')
      return
    }

    // Stop previous track
    if (selectedTrackId !== null) {
      const prevAudio = document.getElementById(`audio-${selectedTrackId}`)
      if (prevAudio) {
        prevAudio.pause()
        prevAudio.currentTime = 0
      }
    }

    currentAudio.volume = muted ? 0 : 1
    currentAudio.play()
    setSelectedTrackId(track.id)
    setField('music', track.url)
  }

  const toggleMute = (e) => {
    e.stopPropagation()
    const audio = document.getElementById(`audio-${selectedTrackId}`)
    if (audio) {
      const newMute = !muted
      audio.volume = newMute ? 0 : 1
      setMuted(newMute)
    }
  }

  return (
    <div className="step-style-container">
      {/* Theme Selector */}
      <div>
        <h3 className="section-title">✨ Choose a Theme</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(themePresets).map(([key, value]) => (
            <motion.button
              key={key}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => applyTheme(key)}
              className={`theme-card ${
                theme === key
                  ? `${value.fontColor} ring-2 ring-white`
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              style={{ backgroundColor: theme === key ? value.bgColor : undefined }}
            >
              <div className="font-bold capitalize">{value.label}</div>
              <div className="text-xs mt-1 opacity-70">{value.font} font</div>
              <div
                className="h-6 mt-2 rounded bg-white/20"
                style={{ backgroundColor: value.bgColor }}
              />
            </motion.button>
          ))}
        </div>
        <button
          onClick={() => setCustomizing(prev => !prev)}
          className="mt-4 text-sm underline hover:text-gray-300"
        >
          {customizing ? '← Back to Presets' : '🎨 Customize Instead'}
        </button>
      </div>

      {/* Manual Controls */}
      {customizing && (
        <>
          <div>
            <h3 className="section-subtitle">Font Style</h3>
            <select
              value={font}
              onChange={(e) => setField('font', e.target.value)}
              className="custom-select"
            >
              {fonts.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div>
            <h3 className="section-subtitle">Background Color</h3>
            <div className="flex gap-3 flex-wrap">
              {bgColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setField('bgColor', color)}
                  className={`w-8 h-8 rounded-full border-2 transition ${
                    bgColor === color ? 'ring-2 ring-white' : 'border-white/20'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Ambient Music Picker */}
      <div>
        <h3 className="section-title">🎵 Choose Ambient Music</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tracks.map((track) => (
            <motion.div
              whileHover={{ scale: 1.015 }}
              key={track.id}
              className={`audio-card cursor-pointer ${
                selectedTrackId === track.id
                  ? 'bg-white text-black border-white'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              onClick={() => playTrack(track)}
            >
              <div className="font-medium text-sm flex justify-between items-center">
                {track.name}
                {showMute && (selectedTrackId === track.id) && (
                  <button
                    className="text-xs bg-black/20 hover:bg-black/30 rounded px-2 py-0.5"
                    onClick={toggleMute}
                  >
                    {muted ?  <Headphones /> : <HeadphoneOff />}
                  </button>
                )}
              </div>
              <audio
                id={`audio-${track.id}`}
                src={track.url}
                preload="metadata"
                style={{ display: 'none' }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
