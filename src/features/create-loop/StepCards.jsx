import { useState, useEffect, useRef } from 'react';
import { useCreateLoopStore } from './useCreateLoopStore';
import { nanoid } from 'nanoid';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import LoopCardPreview from '../../components/LoopCardPreview';
import {
  isTrustedImageHost,
  getYouTubeEmbed,
  getVimeoEmbed,
  getSpotifyEmbed,
  getAppleMusicEmbed,
  getSoundCloudEmbed,
  isValidAudio,
} from '../../utils/EmbedHelpers';

// ===== CONFIG =====
const providerOptions = {
  song: ['Spotify', 'Apple Music', 'SoundCloud', 'Upload'],
  video: ['YouTube', 'Vimeo', 'Upload'],
  image: ['Cloudinary', 'Unsplash', 'Upload'],
};

const linkExamples = {
  Spotify: 'https://open.spotify.com/track/...',
  'Apple Music': 'https://music.apple.com/...',
  SoundCloud: 'https://soundcloud.com/...',
  YouTube: 'https://youtube.com/watch?v=...',
  Vimeo: 'https://vimeo.com/123456789',
};

const MAX_FILE_SIZE_MB = 20;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];

// ===== PREVIEW VALIDATION =====
const isValidVideo = (url) => getYouTubeEmbed(url) || getVimeoEmbed(url);
const isValidSong = (url) =>
  getSpotifyEmbed(url) || getAppleMusicEmbed(url) || getSoundCloudEmbed(url) || isValidAudio(url);

// ===== UTILITY: GENERATE VIDEO THUMBNAIL =====
const generateVideoThumbnail = (videoUrl, time = 0, scale = 0.5) =>
  new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';

    const drawCanvas = () => {
      const canvas = document.createElement('canvas');
      canvas.width = (video.videoWidth || 640) * scale;
      canvas.height = (video.videoHeight || 360) * scale;
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg'));
    };

    video.addEventListener('loadedmetadata', () => {
      // clamp requested time
      const validTime = Math.min(Math.max(0, time), video.duration - 0.1);
      
      // wait for seeked frame
      const onSeeked = () => {
        drawCanvas();
        video.removeEventListener('seeked', onSeeked);
      };

      video.addEventListener('seeked', onSeeked);

      try {
        video.currentTime = validTime;
      } catch {
        // fallback if seeking fails
        drawCanvas();
      }
    });

    video.onerror = (err) => reject(err);
  });



export default function StepCards() {
  const { cards, setField, addChangedCard } = useCreateLoopStore();

  const [type, setType] = useState('text');
  const [provider, setProvider] = useState('');
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [autoThumbnail, setAutoThumbnail] = useState(null);
  const [customThumbnail, setCustomThumbnail] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [error, setError] = useState(null);
  const [range, setRange] = useState(0);
  const [editIndex, setEditIndex] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Revoke old blob previews
  useEffect(() => {
    return () => {
      if (preview && typeof preview === 'string' && preview.startsWith('blob:')) {
        try { URL.revokeObjectURL(preview); } catch {}
      }
    };
  }, [preview]);

  const handleFileSelect = async (f) => {
    if (!f) return;

    if (preview && preview.startsWith('blob:')) {
      try { URL.revokeObjectURL(preview); } catch {}
    }

    if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File too large. Max ${MAX_FILE_SIZE_MB}MB allowed.`);
      return;
    }

    if (type === 'image' && !ALLOWED_IMAGE_TYPES.includes(f.type)) {
      setError('Unsupported image type.');
      return;
    }
    if (type === 'video' && !ALLOWED_VIDEO_TYPES.includes(f.type)) {
      setError('Unsupported video type.');
      return;
    }
    if (type === 'song' && !ALLOWED_AUDIO_TYPES.includes(f.type)) {
      setError('Unsupported audio type.');
      return;
    }

    const blobUrl = URL.createObjectURL(f);
    setError(null);
    setFile(f);
    setContent(null);
    setFileName(f.name || null);
    setPreview(blobUrl);
    setCustomThumbnail(null);
    setVideoDuration(0); // reset; LoopCardPreview will set it

    if (type === 'video' && provider === 'Upload') {
      try {
        const thumb = await generateVideoThumbnail(blobUrl);
        setAutoThumbnail(thumb);
      } catch (err) {
        console.error('Thumbnail generation failed', err);
        setAutoThumbnail(null);
      }
    }
  };

  const handleEdit = (i) => {
    const c = cards[i];

    setType(c.type);
    setFileName(c.file_name || c.file?.name || '');
    setContent(c.content || '');
    setFile(c.file || null);

    if (preview && preview.startsWith('blob:')) {
      try { URL.revokeObjectURL(preview); } catch {}
    }

    const newPreview =
      c.is_upload && c.file ? URL.createObjectURL(c.file) : c.preview || c.content || null;

    setPreview(newPreview);
    setAutoThumbnail(c.type === 'video' && c.is_upload && c.file ? newPreview : null);
    setCustomThumbnail(c.thumbnail);
    setRange(c.thumbnailRange || 0);
    setMetadata(c.metadata || null);
    setProvider(c.is_upload ? 'Upload' : '');
    setEditIndex(i);
    setVideoDuration(0);
  };

  const fetchMetadata = async (url) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const res = await fetch(`${supabaseUrl}/functions/v1/fetch-metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error('Metadata fetch failed');
      const data = await res.json();
      setMetadata(data);
    } catch (err) {
      console.error(err);
      setError('Could not fetch metadata.');
    }
  };

  const handleContentChange = async (val) => {
    setContent(val);
    setFile(null);
    setFileName(null);
    setPreview(val);
    setMetadata(null);
    setError(null);
    setVideoDuration(0);

    if (!val) return;

    if (type === 'image' && !isTrustedImageHost(val)) {
      setError('Untrusted image source. Please upload or use a trusted service.');
    }
    if (type === 'video' && !isValidVideo(val)) {
      setError('Unsupported video link. Use YouTube, Vimeo, or upload.');
    }
    if (type === 'song' && !isValidSong(val)) {
      setError('Unsupported song link. Use Spotify, Apple Music, SoundCloud, or upload.');
    }
    if (type === 'embed') await fetchMetadata(val);
    if (type === 'social') {
      const supported = ['tiktok.com', 'instagram.com', 'twitter.com', 'x.com'];
      if (!supported.some((d) => val.includes(d))) setError('Unsupported social link.');
    }
  };

  const handleAddOrUpdateCard = () => {
    if ((!content && !file) || error) return;

    const chosenThumbnail = customThumbnail || autoThumbnail || preview;

    const newCard = {
      localId: editIndex !== null ? cards[editIndex].localId : nanoid(),
      type,
      content: content || null,
      file: file || null,
      preview: preview || null,
      thumbnail: chosenThumbnail,
      thumbnailRange: range,
      metadata,
      provider,
      is_upload: provider === 'Upload',
    };

    if (editIndex !== null) {
      const oldCard = cards[editIndex];
      const changed =
        oldCard.type !== newCard.type ||
        oldCard.content !== newCard.content ||
        oldCard.is_upload !== newCard.is_upload ||
        oldCard.thumbnailRange !== newCard.thumbnailRange ||
        oldCard.file?.name !== newCard.file?.name ||
        JSON.stringify(oldCard.metadata) !== JSON.stringify(newCard.metadata);

      const updated = [...cards];
      updated[editIndex] = newCard;
      setField('cards', updated);
      if (changed) addChangedCard(newCard.localId);
    } else {
      setField('cards', [...cards, newCard]);
    }

    setContent('');
    setFile(null);
    setPreview(null);
    setAutoThumbnail(null);
    setCustomThumbnail(null);
    setMetadata(null);
    setProvider('');
    setRange(0);
    setError(null);
    setEditIndex(null);
    setVideoDuration(0);
  };

  const handleRemove = (index) => {
    const updated = [...cards];
    const removed = cards[index];
    if (removed.preview?.startsWith('blob:')) {
      try { URL.revokeObjectURL(removed.preview); } catch {}
    }
    updated.splice(index, 1);
    setField('cards', updated);
    if (editIndex === index) {
      setEditIndex(null);
      setContent('');
      setPreview(null);
      setCustomThumbnail(null);
      setAutoThumbnail(null);
      setVideoDuration(0);
    }
  };

  const debounce = (fn, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  };

  const debouncedGenerateThumbnail = debounce(async (videoUrl, t) => {
    try {
      const thumb = await generateVideoThumbnail(videoUrl, t);
      setCustomThumbnail(thumb);
    } catch (err) {
      console.error(err);
    }
  }, 100);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active?.id && over?.id && active.id !== over.id) {
      const oldIndex = cards.findIndex((c) => c.localId === active.id);
      const newIndex = cards.findIndex((c) => c.localId === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        setField('cards', arrayMove(cards, oldIndex, newIndex));
      }
    }
  };

  function calculateStep(duration) {
    if (!Number.isFinite(duration) || duration <= 0) return 0.1;
    const baseStep = 0.1;
    const maxStep = 5;
    const step = baseStep * Math.ceil(Math.log10(duration + 1));
    return Math.min(step, maxStep);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Type selector */}
      <div>
        <label className="block text-sm font-semibold mb-1">Card Type</label>
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setContent('');
            setFile(null);
            setFileName(null);
            setPreview(null);
            setProvider('');
            setMetadata(null);
            setError(null);
            setVideoDuration(0);
          }}
          className="w-full px-4 py-2 rounded border focus:ring focus:outline-none dark:bg-[#0d0d10] dark:text-white"
        >
          <option value="text">📝 Quote / Thought</option>
          <option value="image">🖼️ Image</option>
          <option value="video">🎥 Video</option>
          <option value="song">🎵 Song</option>
          <option value="embed">🌐 Link</option>
          <option value="social">📱 Social</option>
        </select>
      </div>

      {/* Provider selector */}
      {providerOptions[type] && (
        <div>
          <label className="block text-sm font-semibold mb-1">Provider</label>
          <select
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value);
              setContent('');
              setFile(null);
              setFileName(null);
              setError(null);
              setPreview(null);
              setVideoDuration(0);
            }}
            className="w-full px-4 py-2 rounded border focus:ring focus:outline-none dark:bg-[#0d0d10] dark:text-white"
          >
            <option value="">Select a provider</option>
            {providerOptions[type].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          {provider && linkExamples[provider] && (
            <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
              Example: <code>{linkExamples[provider]}</code>
            </p>
          )}
        </div>
      )}

      {/* Content input */}
      <div>
        <label className="block text-sm font-semibold mb-1">Card Content *</label>
        {['image', 'video', 'song'].includes(type) && provider === 'Upload' && (
          <input
            type="file"
            accept={
              type === 'image'
                ? ALLOWED_IMAGE_TYPES.join(',')
                : type === 'video'
                ? ALLOWED_VIDEO_TYPES.join(',')
                : ALLOWED_AUDIO_TYPES.join(',')
            }
            onChange={(e) => handleFileSelect(e.target.files[0])}
            className="mb-2 block"
          />
        )}

        {provider !== 'Upload' && (
          <input
            type="text"
            maxLength="750"
            value={typeof content === 'string' ? (fileName ? fileName : content) : ''}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Paste a link or write your thought"
            className="w-full px-4 py-2 rounded border focus:ring focus:outline-none dark:bg-[#0d0d10] dark:text-white"
          />
        )}

        {error && <div className="text-sm text-red-600 mt-2">{error}</div>}

        {preview && !error && (
          <div className="mt-3">
            <LoopCardPreview
              type={type}
              url={preview}
              metadata={metadata}
              onLoadedMetadata={(d) => setVideoDuration(d)}
              loop={null}
              card={{ is_upload: provider === 'Upload' }}
            />
          </div>
        )}

        {type === 'video' && provider === 'Upload' && preview && Number.isFinite(videoDuration) && videoDuration > 0 && (
         
          <div className="mt-3"> 
            <input
              type="range"
              min="0"
              value={range}
              max={videoDuration}
              step={calculateStep(videoDuration)}
              onChange={(e) => {
                const t = parseFloat(e.target.value);
                setRange(t); // immediate update for UI
                debouncedGenerateThumbnail(preview, t);
              }}
            />
            {customThumbnail && (
              <img src={customThumbnail} alt="Custom thumbnail" className="mt-2 w-32 h-auto rounded border" />
            )}
          </div>
        )}

        <button
          onClick={handleAddOrUpdateCard}
          disabled={!!error || (!content && !file)}
          className="mt-4 bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition disabled:opacity-50"
        >
          {editIndex !== null ? '✏️ Update Card' : '➕ Add Card'}
        </button>
      </div>

      {/* Cards list */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold mb-2">Your Cards</h3>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={cards.map((c) => c.localId)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {cards.map((card, i) => (
                <SortableItem key={card.localId} id={card.localId}>
                  {({ attributes, listeners }) => (
                    <div className="flex justify-between items-start w-full px-4 py-2 rounded border shadow dark:bg-[#0d0d10]">
                      <div {...attributes} {...listeners} className="cursor-grab pr-2 select-none">⠿</div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 mb-1">{card.type}</div>
                        <div className="text-sm text-gray-800 dark:text-gray-100 truncate max-w-xs">
                          {card.is_upload && card.file ? card.file.name : (card.file_name || card.content)}
                        </div>
                      </div>
                      <div className="ml-4 flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(i); }}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemove(i); }}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </SortableItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
