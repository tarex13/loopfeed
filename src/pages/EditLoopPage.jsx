import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useCreateLoopStore } from '../features/create-loop/useCreateLoopStore'
import { loadLoopWithCards } from '../lib/LoadLoopWithCards'
import { supabase } from '../lib/supabase'
import CreateLoopPage from '../features/create-loop/CreateLoopPage'

import { useUser } from '../store/useUser'
import { useLocation } from 'react-router-dom';

export default function EditLoopPage() {
  const { id } = useParams()
  
  const { user, loading } = useUser()
  const setField = useCreateLoopStore((s) => s.setField)
  const getSignedUrl = async (url) => {
    //console.log(url);
    const { data, error } = await supabase.storage
      .from('media')
      .createSignedUrl(url, 60 * 30); // 30 min expiration

    if (!error) {
      return (data.signedUrl);
    }
  }
  useEffect(() => {
    async function load() {
      if (loading) return;

      if (!user) {
        alert("You Cannot Edit This Loop (Logged out)");
        return;
      }

      const { loop, cards } = await loadLoopWithCards(id);

      if (loop.user_id !== user.id) {
        alert("You Cannot Edit This Loop (Not Owner)");
        return;
      }

      // ✅ Fetch collaborators
      const { data: collaborators, error } = await supabase
        .from('loop_collaborators')
        .select('collaborator_id, profiles(username, display_name)')
        .eq('loop_id', id);

      if (error) {
        console.error('Failed to load collaborators:', error);
      }
      //console.log(cards)
      // ✅ Resolve signed URLs for uploads
      console.log(cards);
      const cardsWithUrls = await Promise.all(
        cards.map(async (c) => ({
          type: c.type,
          file_name: c.media_uploads?.file_name,
          content: c.is_upload ? await getSignedUrl(c.content) : c.content,
          metadata: c.metadata
        }))
      );

      setField('id', loop.id);
      setField('title', loop.title);
      setField('tagline', loop.tagline);
      setField('autoplay', loop.autoplay);
      setField('tags', loop.tags);
      setField('theme', loop.theme);
      setField('font', loop.font);
      setField('bgColor', loop.bg_color);
      setField('visibility', loop.visibility);
      setField('music', loop.music);
      setField('cards', cardsWithUrls);

      // ✅ Add collaborators to store
      if (collaborators) {
        setField(
          'collaborators',
          collaborators.map((c) => ({
            id: c.collaborator_id,
            username: c.profiles.username,
            display_name: c.profiles.display_name
          }))
        );
      }
    }

    load();
  }, [id, loading]);


  return <CreateLoopPage isEdit />
}
