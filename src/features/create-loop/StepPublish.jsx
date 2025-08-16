// StepPublish.jsx
import { useCreateLoopStore } from './useCreateLoopStore'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../store/useUser'
import { useState } from 'react'
import { MdGroupAdd } from "react-icons/md";


export default function StepPublish({ setStep }) {
  const loop = useCreateLoopStore()
  const { user } = useUser()
  const [saving, setSaving] = useState(false)
  const [savingDraft, setSavingDraft] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const { collaborators, setField } = useCreateLoopStore()

  // File upload constraints
  const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
  const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm']
  const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3']

  const sanitizeFileName = (name) => {
    return name.replace(/\s+/g, '-').replace(/[^\w.-]/g, '')
  }

  // Helper to delete old media files + db rows
  async function deleteOldMedia(loopId) {
    if (!loopId) return

    // Get old cards with media_upload_ids and storage paths
    const { data: oldCards } = await supabase
      .from('loop_cards')
      .select('id, media_upload_id')
      .eq('loop_id', loopId)

    if (oldCards?.length) {
      const mediaIds = oldCards.map(c => c.media_upload_id).filter(Boolean)
      if (mediaIds.length) {
        // Get file URLs from media_uploads
        const { data: oldMedia } = await supabase
          .from('media_uploads')
          .select('id, file_url')
          .in('id', mediaIds)

        if (oldMedia?.length) {
          const pathsToDelete = oldMedia.map(m => m.file_url)
          if (pathsToDelete.length) {
            await supabase.storage.from('media').remove(pathsToDelete)
          }
          await supabase.from('media_uploads').delete().in('id', mediaIds)
        }
      }
    }

    // Delete old loop_cards for this loop
    await supabase.from('loop_cards').delete().eq('loop_id', loopId)
  }

  function dataURLtoBlob(dataURL) {
    const [header, base64] = dataURL.split(',');
    const mime = header.match(/:(.*?);/)[1];
    const binary = atob(base64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
    return new Blob([array], { type: mime });
  }


  const handleSearch = async (e) => {
    e.preventDefault()
    const trimmedInput = searchInput.trim()
    if (!trimmedInput) return

    try {
      const res = await fetch('/.netlify/functions/search-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          search: trimmedInput,
          current_user_id: user?.id,
          existing_collaborator_ids: collaborators.map(c => c.id)
        })
      })
      const result = await res.json()
      if (!res.ok || !result.results?.length) {
        alert(result.error || 'User not found')
      } else {
        setField('collaborators', [...collaborators, ...result.results])
      }
    } catch (err) {
      console.error('Search error:', err)
      alert('An unexpected error occurred')
    }
    setSearchInput('')
  }

  const removeCollaborator = (id) => {
    setField('collaborators', collaborators.filter(c => c.id !== id))
  }

  const saveLoop = async ({ isDraft = false }) => {
    if (!loop.cards.length) { alert('Add at least one card.'); setStep(1); return }
    if (loop.title.trim() === '') { alert('Please add Loop Title'); setStep(0); return }
    if (loop.tagline.trim() === '') { alert('Please add Loop TagLine'); setStep(0); return }
    if (!user || !user.id) return alert('You must be logged in.')

    setSaving(true)
    setSavingDraft(isDraft)

    let loopId = loop.id
    let loopData = null
    let isNewLoop = false

    const updatedCards = []
    const uploadedArtifacts = [] // { path, mediaId } for cleanup if needed

    try {
      // ---------------------------
      // STEP 0 — Cleanup old media & cards on edit (delete old files only once)
      // ---------------------------
      if (loopId) {
        await deleteOldMedia(loopId)
      }

      // ---------------------------
      // STEP 1 — Upload files for current cards
      // ---------------------------
      for (let i = 0; i < loop.cards.length; i++) {
        const card = loop.cards[i]

        if (card.file instanceof File) {
          const mime = card.file.type
          if (![...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_AUDIO_TYPES].includes(mime)) {
            alert(`File type ${mime || 'unknown'} is not allowed.`)
            setSaving(false)
            return
          }
          if (card.file.size > MAX_FILE_SIZE) {
            alert(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)} MB limit.`)
            setSaving(false)
            return
          }

          const safeName = sanitizeFileName(card.file.name || `upload-${i}`)
          const path = `loop_media/${user.id}/${Date.now()}-${safeName}`

          const { error: storageError } = await supabase.storage
            .from('media')
            .upload(path, card.file, { cacheControl: '3600', upsert: false })

          if (storageError) {
            console.error('Storage upload error:', storageError)
            alert('Error uploading file: ' + storageError.message)
            // Cleanup any already uploaded files this session
            for (const a of uploadedArtifacts) {
              try { await supabase.storage.from('media').remove([a.path]) } catch {}
              try { await supabase.from('media_uploads').delete().eq('id', a.mediaId) } catch {}
            }
            setSaving(false)
            return
          }

        //  const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(path)
        //const publicUrl = publicUrlData?.publicUrl || null////

          updatedCards.push({
            ...card,
            content: path,
            storage_path: path,
            media_upload_id: null
          })
        } else {
          updatedCards.push(card)
        }
      }

      // ---------------------------
      // STEP 2 — Insert or update loop
      // ---------------------------
      const firstCard = updatedCards[0]
      const coverUrl = ['image', 'video'].includes(firstCard?.type) ? firstCard.content : null

      if (loopId) {
        const { error: updateError } = await supabase.from('loops')
          .update({
            title: loop.title,
            autoplay: loop.autoplay,
            tags: loop.tags,
            tagline: loop.tagline,
            theme: loop.theme,
            font: loop.font,
            bg_color: loop.bgColor,
            music: loop.music,
            visibility: isDraft ? 'unlisted' : loop.visibility,
            status: isDraft ? 'draft' : 'normal',
            cover_url: coverUrl
          })
          .eq('id', loopId)

        if (updateError) throw new Error('Error updating loop: ' + updateError.message)
        loopData = { id: loopId }
      } else {
        const { data, error: insertError } = await supabase.from('loops')
          .insert([{
            title: loop.title,
            autoplay: loop.autoplay,
            tags: loop.tags,
            tagline: loop.tagline,
            theme: loop.theme,
            font: loop.font,
            bg_color: loop.bgColor,
            is_remix: loop.isRemix,
            music: loop.music,
            user_id: user.id,
            visibility: isDraft ? 'unlisted' : loop.visibility,
            status: isDraft ? 'draft' : 'normal',
            cover_url: coverUrl
          }])
          .select()
          .single()

        if (insertError) throw new Error('Error saving loop: ' + insertError.message)
        loopData = data
        loopId = data.id
        isNewLoop = true
      }

      // ---------------------------
      // STEP 3 — Insert cards with loop_card_ids
      // ---------------------------
      const cardInserts = updatedCards.map((card, idx) => ({
        loop_id: loopId,
        type: card.type,
        content: card.content,
        position: idx,
        provider: card.provider,
        is_cover: idx === 0,
        metadata: card.metadata || null
      }))

      const { data: insertedCards, error: cardError } = await supabase
        .from('loop_cards')
        .insert(cardInserts)
        .select()

      if (cardError) throw new Error('Error saving cards: ' + cardError.message)

      // ---------------------------
      // STEP 4 — Insert media_uploads for cards with files
      // ---------------------------
      for (let i = 0; i < updatedCards.length; i++) {
        const card = updatedCards[i]
        if (card.storage_path) {
          const { data: mediaInsert, error: mediaInsertError } = await supabase
            .from('media_uploads')
            .insert({
              user_id: user.id,
              file_name: card.file.name,
              file_url: card.storage_path,
              file_type: card.file.type,
              size_bytes: card.file.size,
              loop_card_id: insertedCards[i].id,
              thumbnail_url: null, // we will update this next if needed
              thumbnail_range: card.thumbnailRange || null,
            })
            .select()
            .single()

          if (mediaInsertError) throw new Error('Error recording upload: ' + mediaInsertError.message)

          let thumbnailUrl = null

          // If video, generate thumbnail and upload to media bucket in the same folder structure
          if (card.file.type.startsWith("video/") && card.thumbnail) {
            try {
              const thumbBlob = dataURLtoBlob(card.thumbnail); // convert base64 -> Blob
              const thumbName = card.storage_path
                .replace(/^loop_media\//, '') 
                .replace(/\.[^/.]+$/, '_thumb.jpg'); 
              const thumbPath = `thumbnails/${thumbName}`;

              const { error: thumbError } = await supabase.storage
                .from('media')
                .upload(thumbPath, thumbBlob, { cacheControl: '3600', upsert: true });

              if (thumbError) throw thumbError;

              thumbnailUrl = `loop_media/thumbnails/${thumbName}`;

              await supabase
                .from('media_uploads')
                .update({ thumbnail_url: thumbnailUrl })
                .eq('id', mediaInsert.id);

            } catch (err) {
              console.error("Thumbnail upload failed:", err);
            }
          }


          // Update loop_card with media_upload_id
          await supabase
            .from('loop_cards')
            .update({ media_upload_id: mediaInsert.id })
            .eq('id', insertedCards[i].id)

          uploadedArtifacts.push({ path: card.storage_path, mediaId: mediaInsert.id })
        }
      }



      // ---------------------------
      // STEP 5 — Manage collaborators
      // ---------------------------
      if (loop.id) {
        await supabase.from('loop_collaborators').delete().eq('loop_id', loopId)
      }

      if (collaborators.length) {
        const inserts = collaborators.map((c) => ({
          loop_id: loopId,
          collaborator_id: c.id,
          added_by: user.id,
        }))
        await supabase.from('loop_collaborators').insert(inserts)
      }

      // ---------------------------
      // STEP 6 — Handle remixes
      // ---------------------------
      if (isNewLoop && loop.isRemix === true && loop.originalLoopId && !isDraft) {
        await supabase.from('remixes').insert([{
          original_loop_id: loop.originalLoopId,
          remix_loop_id: loopId,
          remixed_by: user.id
        }])
      }

      setSaving(false)
      if (isDraft) {
        alert('💾 Draft saved!')
        window.location.href = `/folder/drafts`
      } else {
        alert(loop.id ? 'Loop updated!' : 'Loop published!')
        window.location.href = `/loop/${loopId}`
      }
    } catch (err) {
      console.error('Unexpected save error:', err)
      for (const a of uploadedArtifacts) {
        try { await supabase.storage.from('media').remove([a.path]) } catch {}
        try { await supabase.from('media_uploads').delete().eq('id', a.mediaId) } catch {}
      }
      alert(err.message || 'Unexpected error saving loop. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Visibility */}
      <div>
        <h3 className="font-semibold mb-2">Visibility</h3>
        <div className="flex gap-4">
          {['public', 'private', 'unlisted'].map((v) => (
            <label key={v} className="flex items-center gap-2">
              <input
                type="radio"
                checked={loop.visibility === v}
                onChange={() => setField('visibility', v)}
              />
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </label>
          ))}
        </div>
      </div>

      {/* Collaborator Search UI */}
      <div className="border-b-2 border-t-2 border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-md dark:shadow-lg max-w-xl mx-auto">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <MdGroupAdd /> Add Collaborators
        </h3>

        <form onSubmit={handleSearch} className="flex gap-3 flex-wrap">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by username"
            className="flex-grow min-w-[180px] border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg
                        focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-gray-100 focus:border-black dark:focus:border-white
                        text-gray-900 dark:text-gray-100 transition"
          />
          <button
            type="submit"
            className={`bg-black ${searchInput.trim() === '' ? 'dark:bg-gray-500 cursor-not-allowed' : 'dark:bg-gray-300'}  dark:text-black text-white px-6 py-2 rounded-lg
                        hover:bg-gray-800 dark:hover:bg-gray-300 transition font-semibold shadow-sm
                        flex-shrink-0`}
          >
            Add
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-3">
          {collaborators.map((c) => (
            <div
              key={c.id}
              className="border border-gray-300 dark:border-gray-700 rounded-lg p-3 flex items-center gap-3 max-w-[200px]"
            >
              {c.avatar ? (
                <img
                  src={c.avatar}
                  alt={c.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center text-white font-bold">
                  {c.username?.[0]?.toUpperCase() || "?"}
                </div>
              )}

              <div className="flex-1 truncate">
                <div className="font-semibold truncate">{c.username}</div>
                <div className="text-sm truncate text-gray-500 dark:text-gray-400">
                  {c.name || ""}
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeCollaborator(c.id)}
                className="ml-auto text-red-600 hover:text-red-700 dark:hover:text-red-500 font-semibold text-lg"
                aria-label={`Remove collaborator ${c.username}`}
              >
                ×
              </button>
            </div>

          ))}
        </div>
      </div>

      {/* Publish Buttons */}
      <div className="flex justify-between gap-3">
        <button
          disabled={saving}
          onClick={() => saveLoop({ isDraft: true })}
          className="flex-grow bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-lg font-semibold hover:bg-gray-400 dark:hover:bg-gray-600 transition"
        >
          {savingDraft ? 'Saving...' : 'Save Draft'}
        </button>
        <button
          disabled={saving}
          onClick={() => saveLoop({ isDraft: false })}
          className="flex-grow bg-black dark:bg-white dark:text-black text-white px-4 py-3 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-300 transition"
        >
          {saving ? 'Publishing...' : 'Publish'}
        </button>
      </div>
    </div>
  )
}
