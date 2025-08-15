import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Explore from './pages/Explore'
import Create from './pages/Create'
import You from './pages/You'
import BottomNav from './components/BottomNav'
import LoopViewer from './pages/LoopViewer'
import PublicProfile from './pages/PublicProfile'
import FolderPage from './pages/FolderPage'
import WhisperInbox from './pages/WhisperInbox'
import Settings from './pages/Settings'
import Auth from './components/Auth'
import RemixLoopPage from './pages/RemixLoopPage'
import EditLoopPage from './pages/EditLoopPage'
import { useEffect, useState } from 'react'
import { useUser } from './store/useUser'
import { supabase } from './lib/supabase'
import Loading from './components/Loading'
import ProfilePage from './pages/ProfilePage'
import TrashPage from './pages/TrashPage'
import ArchivedPage from './pages/ArchivedPage'
import DraftsPage from './pages/DraftsPage'
export default function App() {  
    const { user, loading } = useUser()
  const fetchUser = useUser((s) => s.fetchUser)
  const [showNav, setShowNav] = useState(true);
  useEffect(() => {
    fetchUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        useUser.getState().setUser(session.user)
      } else {
        useUser.getState().setUser(null)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])
  if (loading) return <Loading />;
  return (
    <div className="min-h-screen flex flex-col  dark:bg-[#0d0d10]">
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth setShowNav={setShowNav} />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/folder/:id" element={<FolderPage />} />
          <Route path="/you/whispers" element={<WhisperInbox />} />
          <Route path="/create" element={<Create />} />
          <Route path="/you" element={<ProfilePage isOwnProfile />} />
          <Route path="/u/:username" element={<ProfilePage />} />
          <Route path="/edit/:id" element={<EditLoopPage />} />
          <Route path="/remix/:id" element={<RemixLoopPage />} />
          <Route path="/folder/trashed" element={<TrashPage />} />
          <Route path="/folder/archived" element={<ArchivedPage />} />
          <Route path="/folder/drafts" element={<DraftsPage />} />
          <Route path="/folder/:id" element={<FolderPage />} /> 
          <Route path="/loop/:id" element={<LoopViewer setShowNav={setShowNav} />} />
        </Routes>
      </div>
      <BottomNav showNav={showNav}/>
    </div>
  )
}
