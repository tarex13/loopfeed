// lib/uploadToSupabase.js
import { supabase } from './supabase'

export async function uploadToSupabase(file, folder = 'cards') {
  const ext = file.name.split('.').pop()
  const filePath = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`

  const { error } = await supabase.storage.from(folder).upload(filePath, file)

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(folder).getPublicUrl(filePath)
  return data.publicUrl
}
