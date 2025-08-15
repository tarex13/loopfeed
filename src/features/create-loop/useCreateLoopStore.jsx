// useCreateLoopStore.js
import { create } from 'zustand'

export const useCreateLoopStore = create((set) => ({
  title: '',
  tags: [],
  tagline: '',
  autoplay: false,
  visibility: 'public',
  isRemix: false,
  loopDragged: null,
  collaborators: [],
  cards: [], // { type, content (preview or URL), file (File obj), is_upload, media_upload_id, metadata }
  changedCards: [],
  theme: 'default',
  music: null,
  addChangedCard: (value) => set((state) => {
    if (state.changedCards.includes(value)) return state;
    return { ...state, changedCards: [...state.changedCards, value] }
  }),
  setField: (field, value) => set((state) => ({ ...state, [field]: value })),
  setLoopDragged: (loop) => set({ loopDragged: loop }),
  addCard: (card) => set((state) => ({ cards: [...state.cards, card] })),
  updateCard: (index, updatedCard) => set((state) => {
    const newCards = [...state.cards];
    newCards[index] = { ...newCards[index], ...updatedCard };
    return { cards: newCards };
  }),
  removeCard: (index) =>
    set((state) => ({
      cards: state.cards.filter((_, i) => i !== index),
    })),
  reset: () => set({
    title: '',
    tags: [],
    tagline: '',
    autoplay: false,
    visibility: 'public',
    isRemix: false,
    loopDragged: null,
    changedCards: [],
    collaborators: [],
    cards: [],
    theme: 'default',
    music: null
  })
}))
