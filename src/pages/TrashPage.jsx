import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '../store/useUser';
import LoopCard from '../components/LoopCard';
import Loading from '../components/Loading';
import { RotateCcw, Trash } from 'lucide-react';

export default function TrashPage() {
  const { user } = useUser();
  const [loops, setLoops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDeleted = async () => {
      if (!user) return;
      setLoading(true);
      const { data } = await supabase
        .from('loops')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'trashed')
        .select('*, loop_cards(type, content, metadata, media_uploads:media_uploads!loop_cards_media_upload_id_fkey(thumbnail_url))');
      setLoops(data || []);
      setLoading(false);
    };

    loadDeleted();
  }, [user]);

  const handleRestore = async (loopId) => {
    await supabase.from('loops').update({ status: 'normal' }).eq('id', loopId);
    setLoops(prev => prev.filter(loop => loop.id !== loopId));
  };

  const handleDeletePermanently = async (loopId) => {
    const confirm = window.confirm('Permanently delete this loop?');
    if (!confirm) return;
    
    await supabase.from('loops').delete().eq('id', loopId);
    setLoops(prev => prev.filter(loop => loop.id !== loopId));
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-screen-xl mx-auto px-4 md:px-10 pt-14 pb-32 space-y-12 text-white">
      <h1 className="text-2xl font-bold mb-4">Trash</h1>
      {loops.length === 0 ? (
        <div className="glass-card p-6 text-center text-white/60">Trash is empty.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loops.map(loop => (
            <div key={loop.id} className="relative group">
              <LoopCard context={false} key={loop.id} loop={loop} aspect="aspect-[3/4]" />
              <div className="absolute top-2 right-2 flex gap-2  bg-black-700 group-hover:opacity-100 transition">
                <button onClick={() => handleRestore(loop.id)} className="p-2 text-xs bg-gray-700 rounded-full hover:bg-yellow-600">
                  Restore
                </button>
                <button onClick={() => handleDeletePermanently(loop.id)} className="p-2 text-xs bg-red-600 rounded-full hover:bg-red-700">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}