import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useUser } from '../store/useUser';
import LoopCard from '../components/LoopCard';
import Loading from '../components/Loading';
import { Edit3, Trash2 } from 'lucide-react';

export default function DraftsPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [loops, setLoops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDrafts = async () => {
      if (!user) return;
      setLoading(true);
      const { data } = await supabase
        .from('loops')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .select('*, loop_cards(type, content, metadata)');
      setLoops(data || []);
      setLoading(false);
    };

    loadDrafts();
  }, [user]);

  const handlePublish = async (loopId) => {
    await supabase.from('loops').update({ status: 'normal' }).eq('id', loopId);
    setLoops(prev => prev.filter(loop => loop.id !== loopId));
  };

  const handleDelete = async (loopId) => {
    const confirm = window.confirm('Are you sure you want to delete this draft?');
    if (!confirm) return;
    await supabase.from('loops').update({ status: 'deleted' }).eq('id', loopId);
    setLoops(prev => prev.filter(loop => loop.id !== loopId));
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-screen-xl mx-auto px-4 md:px-10 pt-14 pb-32 space-y-12 text-white">
      <h1 className="text-2xl font-bold mb-4">Your Drafts</h1>
      {loops.length === 0 ? (
        <div className="glass-card p-6 text-center text-white/60">No drafts found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loops.map(loop => (
            <div key={loop.id} className="relative group">
              <LoopCard loop={loop} aspect="aspect-[3/4]" />
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => navigate(`/edit/${loop.id}`)} className="p-2 bg-black text-white border-2 border-white  rounded-lg hover:bg-gray-900">
                  Edit
                </button>
                <button onClick={() => handlePublish(loop.id)} className="p-2 bg-white text-black border-2 border-black rounded-lg font-semibold hover:bg-zinc-300">
                  Publish
                </button>
                <button onClick={() => handleDelete(loop.id)} className="p-2 bg-red-500 rounded-lg hover:bg-red-600">
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