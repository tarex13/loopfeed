import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '../store/useUser';
import LoopCard from '../components/LoopCard';
import Loading from '../components/Loading';
import { UploadCloud } from 'lucide-react';

export default function ArchivedPage() {
  const { user } = useUser();
  const [loops, setLoops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArchived = async () => {
      if (!user) return;
      setLoading(true);
      const { data } = await supabase
        .from('loops')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'archived')
        .select('*, loop_cards(type, content, metadata)');
      setLoops(data || []);
      setLoading(false);
    };

    loadArchived();
  }, [user]);

  const handleUnarchive = async (loopId) => {
    await supabase.from('loops').update({ status: 'normal' }).eq('id', loopId);
    setLoops(prev => prev.filter(loop => loop.id !== loopId));
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-screen-xl mx-auto px-4 md:px-10 pt-14 pb-32 space-y-12 text-white">
      <h1 className="text-2xl font-bold mb-4">Archived Loops</h1>
      {loops.length === 0 ? (
        <div className="glass-card p-6 text-center text-white/60">No archived loops found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loops.map(loop => (
            <div key={loop.id} className="relative group">
              <LoopCard loop={loop} aspect="aspect-[3/4]" />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => handleUnarchive(loop.id)} className="p-2 bg-blue-500 rounded-full hover:bg-blue-600" title="restore">
                  <UploadCloud size={16}  />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}