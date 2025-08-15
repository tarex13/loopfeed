import { useState } from 'react';
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

export default function StepCards() {
  const { cards, setField, addChangedCard } = useCreateLoopStore();

  const [type, setType] = useState('text');
  const [provider, setProvider] = useState('');
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [error, setError] = useState(null);
  const [editIndex, setEditIndex] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ===== File validation (no upload here) =====
  const handleFileSelect = (file) => {
    //console.log(file);
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File too large. Max ${MAX_FILE_SIZE_MB}MB allowed.`);
      return;
    }

    if (type === 'image' && !ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError('Unsupported image type.');
      return;
    }
    if (type === 'video' && !ALLOWED_VIDEO_TYPES.includes(file.type)) {
      setError('Unsupported video type.');
      return;
    }
    if (type === 'song' && !ALLOWED_AUDIO_TYPES.includes(file.type)) {
      setError('Unsupported audio type.');
      return;
    }

    setError(null);
    setFile(file);
    setPreview(URL.createObjectURL(file)); // preview blob
    setContent(null); // will set after publish
  };

  const fetchMetadata = async (url) => {
    try {
      const res = await fetch('/api/fetch-metadata', {
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
    setPreview(val);
    setMetadata(null);
    setError(null);

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
    if (type === 'embed') {
      await fetchMetadata(val);
    }
    if (type === 'social') {
      const supported = ['tiktok.com', 'instagram.com', 'twitter.com', 'x.com'];
      if (!supported.some((d) => val.includes(d))) {
        setError('Unsupported social link.');
      }
    }
  };

  const handleAddOrUpdateCard = () => {
    if ((!content && !file) || error) return;
    
    const newCard = {
      localId: editIndex !== null ? cards[editIndex].localId : nanoid(),
      type,
      content: content || null,
      file: file || null,
      preview: preview || null,
      metadata,
      provider,
      is_upload: provider === 'Upload',
    };

    if (editIndex !== null) {
      const oldCard = cards[editIndex];

      // Compare old vs new to see if anything actually changed
      const changed =
        oldCard.type !== newCard.type ||
        oldCard.content !== newCard.content ||
        oldCard.is_upload !== newCard.is_upload ||
        (oldCard.file?.name !== newCard.file?.name) ||
        JSON.stringify(oldCard.metadata) !== JSON.stringify(newCard.metadata);

      const updated = [...cards];
      updated[editIndex] = newCard;
      setField('cards', updated);

      if (changed) addChangedCard(newCard.localId);
    } else {
      setField('cards', [...cards, newCard]);
    }

    // reset form
    setContent('');
    setFile(null);
    setPreview(null);
    setMetadata(null);
    setProvider('');
    setError(null);
    setEditIndex(null);
  };


  const handleEdit = (i) => {
    const c = cards[i];
    setType(c.type);
    //console.log(c)
    setFileName(c.file_name);
    setContent(c.content);
    setFile(c.file || null);
    setPreview(c.preview || (c.is_upload && c.file ? URL.createObjectURL(c.file) : c.content));
    setMetadata(c.metadata || null);
    setProvider(c.is_upload ? 'Upload' : '');
    setEditIndex(i);
  };

  const handleRemove = (index) => {
    const updated = [...cards];
    updated.splice(index, 1);
    setField('cards', updated);
    if (editIndex === index) {
      setEditIndex(null);
      setContent('');
      setPreview(null);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = parseInt(active.id);
      const newIndex = parseInt(over.id);
      setField('cards', arrayMove(cards, oldIndex, newIndex));
    }
  };

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
            setPreview(null);
            setProvider('');
            setMetadata(null);
            setError(null);
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

      {/* Provider */}
      {providerOptions[type] && (
        <div>
          <label className="block text-sm font-semibold mb-1">Provider</label>
          <select
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value);
              setContent('');
              setFile(null);
              setError(null);
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
            <LoopCardPreview type={type} url={preview} metadata={metadata} />
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

      {/* List */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold mb-2">Your Cards</h3>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={cards.map((_, i) => i.toString())} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {cards.map((card, i) => (
                <SortableItem key={i} id={i.toString()}>
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
