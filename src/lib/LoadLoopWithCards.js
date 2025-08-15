// lib/loadLoopWithCards.js
import { supabase } from './supabase'

export const loadLoopWithCards = async (id) => {
  const { data: loop, error: loopError } = await supabase.from('loops').select('*').eq('id', id).single()
  const { data: cards, error: cardsError } = await supabase
    .from('loop_cards')
    .select(`
      *,
      media_uploads:media_uploads!loop_cards_media_upload_id_fkey (
        file_name
      )
    `)
    .eq('loop_id', id)
    .order('position')


  if (loopError || cardsError) throw new Error('Failed to load loop')

  return { loop, cards }
}
