import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';
import { Download, X, Heart, Filter, Grid3X3, Layers } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { motion, AnimatePresence } from 'motion/react';

interface GeneratedImage {
  id: string;
  prompt: string;
  fullPrompt: string;
  imageData: string;
  createdAt: any;
  userId: string;
  style?: string;
  likesCount?: number;
  aspectRatio?: string;
}

const STYLE_FILTERS = ["All", "Realistic", "3D Render", "Watercolor", "Pixel Art", "Cyberpunk", "Vintage"];

export function GallerySection() {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    const q = query(collection(db, 'generated_images'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        ...doc.data()
      })) as GeneratedImage[];
      setImages(fetched);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'generated_images');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLike = async (e: React.MouseEvent, imageId: string) => {
    e.stopPropagation();
    try {
      const docRef = doc(db, 'generated_images', imageId);
      await updateDoc(docRef, {
        likesCount: increment(1)
      });
    } catch (err) {
      console.error("Like failed:", err);
    }
  };

  const formatDisplayDate = (createdAt: any) => {
    if (!createdAt) return 'Recent';
    if (createdAt && typeof createdAt.toDate === 'function') {
      return createdAt.toDate().toLocaleString();
    }
    return new Date(createdAt).toLocaleString();
  };

  const filteredImages = activeFilter === "All" 
    ? images 
    : images.filter(img => img.style === activeFilter);

  const downloadImage = (baseurl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = baseurl;
    a.download = `${filename}.jpg`;
    a.click();
  };

  if (loading) {
    return (
      <div className="w-full py-24 flex flex-col items-center justify-center gap-4 text-zinc-500">
        <div className="w-10 h-10 border-2 border-zinc-800 border-t-zinc-400 rounded-full animate-spin" />
        <p className="text-[10px] uppercase font-bold tracking-[0.2em]">Synchronizing Archive</p>
      </div>
    );
  }

  return (
    <section className="max-w-7xl mx-auto py-24 px-6 w-full space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-zinc-800 pb-12">
        <div className="space-y-2">
          <h2 className="text-4xl font-black text-white tracking-tight italic uppercase">
            <span className="text-purple-500">Global</span> Archive
          </h2>
          <p className="text-zinc-500 font-medium">Collective intelligence rendered into visual artifacts.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {STYLE_FILTERS.map(style => (
            <button
              key={style}
              onClick={() => setActiveFilter(style)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                activeFilter === style 
                  ? 'bg-white border-white text-black' 
                  : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      {filteredImages.length === 0 ? (
        <div className="bg-zinc-900/30 border-2 border-dashed border-zinc-800 rounded-3xl p-20 text-center text-zinc-600 flex flex-col items-center gap-4">
          <Filter className="w-10 h-10 opacity-20" />
          <p className="font-bold uppercase tracking-widest text-xs">No artifacts matching this style filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {filteredImages.map(img => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={img.id}
                onClick={() => setSelectedImage(img)}
                className="group cursor-pointer bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-500 transition-all shadow-xl hover:shadow-2xl relative"
              >
                <div className="aspect-square w-full overflow-hidden bg-zinc-950 relative">
                  <img 
                    src={img.imageData} 
                    alt={img.prompt} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" 
                    loading="lazy"
                  />
                  <button 
                    onClick={(e) => handleLike(e, img.id)}
                    className="absolute top-3 right-3 p-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-white hover:text-red-500 transition-colors z-10 opacity-0 group-hover:opacity-100 transform translate-y-[-10px] group-hover:translate-y-0 duration-300"
                  >
                    <Heart className={`w-4 h-4 ${img.likesCount ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-[10px] font-black text-white uppercase tracking-tighter line-clamp-2">
                      {img.prompt}
                    </p>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      {img.style || 'None'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-3 h-3 text-zinc-500 fill-zinc-500/20" />
                    <span className="text-xs font-black text-zinc-400">{img.likesCount || 0}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl" 
            onClick={() => setSelectedImage(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-6xl bg-zinc-950 rounded-[40px] border border-zinc-800/50 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col lg:flex-row max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex-1 bg-black flex items-center justify-center overflow-hidden relative border-r border-zinc-800/50">
                <img src={selectedImage.imageData} className="w-full h-full object-contain" alt="Generated" />
                <div className="absolute top-6 left-6 flex gap-3">
                  <div className="px-3 py-1 bg-black/50 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-black text-white uppercase tracking-widest">
                    {selectedImage.aspectRatio || '1:1'}
                  </div>
                  <div className="px-3 py-1 bg-black/50 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-black text-white uppercase tracking-widest">
                    {selectedImage.style || 'No Style'}
                  </div>
                </div>
              </div>
              
              <div className="w-full lg:w-[400px] flex flex-col p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                    <Grid3X3 className="w-4 h-4 text-purple-500" /> Meta Data
                  </h3>
                  <button onClick={() => setSelectedImage(null)} className="p-2 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-500 hover:text-white transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-8 flex-1">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Prompt Instruction</h4>
                    <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-900 rounded-3xl p-6 border border-zinc-800/50 font-medium italic">
                      "{selectedImage.fullPrompt}"
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800/50">
                      <h4 className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Timestamp</h4>
                      <p className="text-xs text-white font-bold">
                        {formatDisplayDate(selectedImage.createdAt)}
                      </p>
                    </div>
                    <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800/50">
                      <h4 className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Approvals</h4>
                      <p className="text-xs text-white font-bold flex items-center gap-2">
                        <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                        {selectedImage.likesCount || 0} Likes
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Layers className="w-3 h-3 text-purple-500" /> Identification
                    </h4>
                    <p className="text-[10px] font-mono text-zinc-600 break-all">
                      UUID: {selectedImage.id}
                    </p>
                    <p className="text-[10px] font-mono text-zinc-600 break-all">
                      AUTHOR_ID: {selectedImage.userId}
                    </p>
                  </div>
                </div>

                <div className="mt-12 pt-8 border-t border-zinc-800 pb-2">
                  <button 
                    onClick={() => downloadImage(selectedImage.imageData, `artifact-${selectedImage.id.slice(0,8)}`)}
                    className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-widest py-5 rounded-2xl transition-all shadow-xl active:scale-95"
                  >
                    <Download className="w-5 h-5" />
                    Extract Artifact
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
}
