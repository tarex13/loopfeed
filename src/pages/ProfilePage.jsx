import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Archive, Trash2, Edit3 } from 'lucide-react';
import { useUser } from '../store/useUser';
import { useCreateLoopStore } from '../features/create-loop/useCreateLoopStore';
import { PlusCircle, Mail, Folder, Layers} from 'lucide-react';
import LoopCard from '../components/LoopCard';
import FolderCard from '../components/FolderCard';
import CreateFolderModal from '../components/CreateFolderModal';
import EditProfileModal from '../components/EditProfileModal';
import WhisperCard from '../components/WhsiperCard';
import FolderContextMenu from '../components/FolderContextMenu';
import Loading from '../components/Loading';
import { motion } from 'framer-motion';

export default function ProfilePage({ isOwnProfile = false }) {
  const { username } = useParams();
  const location = useLocation();
  const { user, loading: loadingUser } = useUser();
  const fetched = useRef(false);
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loops, setLoops] = useState([]);
  const [folders, setFolders] = useState([]);
  const [whispers, setWhispers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [activeDropFolder, setActiveDropFolder] = useState(null);
  const [editingBio, setEditingBio] = useState(false);
  const [editingName, setEditingName] = useState(false);

  const { loopDragged, setLoopDragged } = useCreateLoopStore();
  const realOwnProfile = isOwnProfile && !username;


  const systemFolders = [
    {
      id: 'archived',
      label: 'Archived',
      description: 'Loops you’ve archived will appear here.',
      icon: Archive,
    },
    {
      id: 'trashed',
      label: 'Trash',
      description: 'Deleted loops stay here for 30 days.',
      icon: Trash2,
    },
    {
      id: 'drafts',
      label: 'Drafts',
      description: 'Loops you’re still working on.',
      icon: Edit3,
    },
  ];


  useEffect(() => {
    if (loadingUser) return;
    if (realOwnProfile && !user) navigate('/auth');
  }, [loadingUser, user]);

  useEffect(() => {
    if (!fetched.current && (!loadingUser && (realOwnProfile ? user : username))) {
      fetched.current = true;
      fetchContent();
    }
  }, [loadingUser, user, username]);

  // ... continues in next chunk
  const fetchContent = async () => {
    setLoading(true);

    try {
      let loadedProfile = null;

      if (realOwnProfile && user?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (error) throw error;
        loadedProfile = data;
      } else if (username) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();
        if (error) throw error;
        loadedProfile = data;
      }

      if (!loadedProfile) {
        setProfile(null);
        setLoops([]);
        setFolders([]);
        setWhispers([]);
        return;
      }

      const visibilityFilter = realOwnProfile ? {} : { visibility: 'public' };
      const folderFilter = realOwnProfile ? {} : { is_public: true };

      // Get page system folder context if any
      const pathParts = location.pathname.split('/');
      const currentSystemFolder = systemFolders.find(f => pathParts.includes(f.id))?.id;

      const [{ data: loops = [] }, { data: allFolders = [] }, { data: whispers = [] }] = await Promise.all([
        supabase
          .from('loops')
          .select('*, loop_cards(type, content, metadata, is_upload)')
           .eq('status', 'normal')
          .eq('user_id', loadedProfile.id)
          .match(visibilityFilter),
        
        supabase
          .from('folders')
          .select('*')
          .eq('user_id', loadedProfile.id)
          .match(folderFilter),

        realOwnProfile
          ? supabase
              .from('whispers')
              .select('*')
              .eq('recipient_id', loadedProfile.id)
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [] }),
      ]);

      const folders = realOwnProfile
        ? [...allFolders].filter(f => !f.system)
        : allFolders.filter(f => !f.system);

      const filteredLoops = currentSystemFolder
        ? loops.filter(l => l.status === currentSystemFolder)
        : loops.filter(l => l.status === 'normal' || realOwnProfile);

      setProfile(loadedProfile);
      setLoops(filteredLoops);
      setFolders(folders);
      setWhispers(whispers);
    } catch (error) {
      console.error('Failed to fetch profile content:', error);
      setProfile(null);
      setLoops([]);
      setFolders([]);
      setWhispers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = async (loopId, folderId) => {
    setActiveDropFolder(null);

    if (!loopId || !folderId) return;

    // Check if it's a system folder
    const sys = systemFolders.find(f => f.id === folderId);

    if (sys) {
      if (sys.id === 'drafts') return; // Cannot drag to drafts
      try {
        const { error } = await supabase
          .from('loops')
          .update({ status: sys.id })
          .eq('id', loopId)
          .eq('user_id', user?.id);
        if (error) throw error;
        fetchContent();
      } catch (err) {
        console.error('Error moving loop to system folder:', err.message);
      }
      return;
    }

    // Otherwise, it's a normal folder
    try {
      await supabase.from('folder_loops').insert({ loop_id: loopId, folder_id: folderId });
      fetchContent();
    } catch (err) {
      console.error("Failed to drop loop into folder:", err.message);
    }
  };

  const handleSave = async (key, value) => {
    if (profile[key] !== value) {
      await supabase.from('profiles').update({ [key]: value }).eq('id', profile.id);
      fetchContent();
    }
  };

  const renderEditableField = (value, key, editing, setEditing, className = '') => (
    realOwnProfile ? (
      editing ? (
        <input
          defaultValue={value}
          autoFocus
          onBlur={(e) => {
            setEditing(false);
            handleSave(key, e.target.value);
          }}
          className={`inline-input ${className}`}
        />
      ) : (
        <span className={`cursor-pointer ${className}`} onClick={() => setEditing(true)}>
          {value || <span className="italic text-white/30">Add {key}…</span>}
        </span>
      )
    ) : (
      <span className={className}>{value}</span>
    )
  );
  const renderSystemFolders = () => {
    if (!realOwnProfile) return null;

    return (
      <div className="space-y-3 mb-8">
        <h3 className="text-sm text-white/60 font-semibold pl-1">System Folders</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {systemFolders.map(folder => {
            const Icon = folder.icon;

            return (
              <div
                key={folder.id}
                onClick={() => navigate(`/folder/${folder.id}`)}
                onDragOver={(e) => {
                  if (folder.id !== 'drafts') {
                    e.preventDefault();
                    setActiveDropFolder(folder.id);
                  }
                }}
                onDrop={() => {
                  if (realOwnProfile && loopDragged && folder.id !== 'drafts') {
                    handleDrop(loopDragged, folder.id);
                  }
                }}
                onMouseLeave={() => setActiveDropFolder(null)}
                onDragLeave={() => setActiveDropFolder(null)}
                className={`relative glass-card p-4 transition cursor-pointer ${
                  activeDropFolder === folder.id ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {Icon && <Icon size={18} className="text-white/80" />}
                  <span className="font-semibold text-white">{folder.label}</span>
                </div>
                <p className="text-sm text-white/60">{folder.description}</p>
              </div>
              
            );
          })}
        </div>
      </div>
    );
  };


  const renderUserFolders = () => {
    if (folders.length === 0) {
      return (
        <div className="glass-card p-6 text-center text-white/70">
          {realOwnProfile ? 'No folders yet. Create one above.' : 'No public folders.'}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {folders.map(folder => (
          <div
            key={folder.id}
            onClick={() => navigate(`/folder/${folder.id}`)}
            onDragOver={(e) => {
              e.preventDefault();
              setActiveDropFolder(folder.id);
            }}
            onDrop={() => {
              if (realOwnProfile && !folder.system) {
                handleDrop(loopDragged, folder.id);
              }
            }}
            className={`relative glass-card p-4 transition cursor-pointer ${
              activeDropFolder === folder.id ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            {realOwnProfile && !folder.system && (
              <div className="absolute top-2 right-2 z-10">
                <FolderContextMenu folder={folder} onRefresh={fetchContent} />
              </div>
            )}
            <FolderCard folder={folder} />
          </div>
        ))}
      </div>
    );
  };
  const renderAvatar = () => {
    const avatarURL = profile?.avatar_url
    const fallback = (profile?.username || 'U')[0].toUpperCase()
    return (
      <div className="relative group w-16 h-16 shrink-0 rounded-full overflow-hidden border border-white/10 bg-black/40 backdrop-blur-lg">
        {avatarURL ? (
          <img src={avatarURL} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/80 text-2xl font-bold bg-black/30">
            {fallback}
          </div>
        )}
      </div>
    )
  }
  if (loadingUser || loading) return <Loading />;
  if (!profile) {
    return <div className="text-center py-32 text-white/60">This user does not exist.</div>;
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 md:px-10 pt-14 pb-32 space-y-16 text-white">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex gap-4 items-start">
          {renderAvatar()}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">
              {renderEditableField(profile?.username, 'username', editingName, setEditingName)}
            </h1>
            <p className="text-gray-400 max-w-xl text-sm">
              {renderEditableField(profile?.bio, 'bio', editingBio, setEditingBio)}
            </p>
          </div>
        </div>

        {realOwnProfile && (
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => setShowEditProfile(true)} className="glass-button px-4 py-2 flex items-center gap-2 text-sm">
              <Edit3 size={16} /> Edit Profile
            </button>
            <button onClick={() => setShowCreateFolder(true)} className="glass-button bg-pink-500 text-white px-4 py-2 flex items-center gap-2 text-sm hover:bg-pink-600">
              <PlusCircle size={16} /> New Folder
            </button>
          </div>
        )}
      </div>

      {/* Loops */}
      <section>
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <Layers size={18} /> {realOwnProfile ? 'Your Loops' : 'Public Loops'}
        </h2>
        {loops.length === 0 ? (
          <div className="glass-card p-6 text-center text-white/70">
            {realOwnProfile ? 'You haven’t created any loops yet.' : 'No public loops available.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {loops.map(loop => (
              <motion.div
                key={loop.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                draggable={realOwnProfile}
                onDragStart={() => setLoopDragged(loop.id)}
              >
                <LoopCard loop={loop} aspect="aspect-[3/4]" />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* System Folders */}
      {renderSystemFolders()}

      {/* User Folders */}
      <section>
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <Folder size={18} /> {realOwnProfile ? 'Your Folders' : 'Public Folders'}
        </h2>
        {renderUserFolders()}
      </section>

      {/* Whispers */}
      {realOwnProfile && (
        <section>
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <Mail size={18} /> Your Whispers
          </h2>
          {whispers.length === 0 ? (
            <div className="glass-card p-6 text-center text-white/70">
              You currently have no whispers.
            </div>
          ) : (
            <div className="space-y-3">
              {whispers.map(w => <WhisperCard key={w.id} whisper={w} />)}
            </div>
          )}
        </section>
      )}

      {/* Modals */}
      {showCreateFolder && (
        <CreateFolderModal
          onClose={() => setShowCreateFolder(false)}
          onCreated={async () => {
            await fetchContent();
            setShowCreateFolder(false);
          }}
        />
      )}
      {showEditProfile && (
        <EditProfileModal
          current={profile}
          onClose={(cancelled) => {
            setShowEditProfile(false);
            !cancelled && fetchContent();
          }}
        />
      )}
    </div>
  );
}
