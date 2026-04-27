import React, { useState } from 'react';
import { useApiKey } from '../hooks/useApiKey';
import { enhancePromptWithGemini, generateImageWithGemini } from '../lib/gemini';
import { Sparkles, Image as ImageIcon, Loader2, Triangle, Ban, Layers } from 'lucide-react';
import { useAuth } from './FirebaseProvider';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { compressImage } from '../lib/imageUtils';
import { motion, AnimatePresence } from 'motion/react';

const STYLES = ["None", "Realistic", "3D Render", "Watercolor", "Pixel Art", "Cyberpunk", "Vintage"];
const RATIOS = ["1:1", "16:9", "9:16", "4:3"] as const;
const COUNTS = [1, 2, 4];

export function GenerationSection() {
  const { apiKey, hasApiKey } = useApiKey();
  const { user } = useAuth();
  
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("None");
  const [aspectRatio, setAspectRatio] = useState<typeof RATIOS[number]>("1:1");
  const [numImages, setNumImages] = useState(1);
  
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const getFullPrompt = () => {
    let finalPrompt = prompt;
    if (selectedStyle !== "None") {
      finalPrompt = `${prompt}. Style: ${selectedStyle}`;
    }
    return finalPrompt;
  };

  const handleEnhance = async () => {
    if (!hasApiKey) {
      setError("Please save your API key in the settings bar first.");
      return;
    }
    if (!prompt.trim()) {
      setError("Please enter a basic prompt to enhance.");
      return;
    }

    setIsEnhancing(true);
    setError(null);
    try {
      const enhanced = await enhancePromptWithGemini(apiKey, prompt);
      setPrompt(enhanced);
    } catch (err: any) {
      setError(err.message || "Failed to enhance prompt.");
    } finally {
      setIsEnhancing(false);
    }
  };

  const saveToFirebase = async (imageUrl: string, finalPrompt: string) => {
    if (!user) return;
    try {
      const compressedImage = await compressImage(imageUrl, 512, 0.5);
      const imageId = crypto.randomUUID();
      const docRef = doc(db, 'generated_images', imageId);
      await setDoc(docRef, {
        id: imageId,
        prompt: prompt.slice(0, 100),
        fullPrompt: finalPrompt,
        imageData: compressedImage,
        createdAt: serverTimestamp(),
        userId: user.uid,
        aspectRatio,
        negativePrompt,
        style: selectedStyle,
        likesCount: 0
      });
    } catch (err: any) {
      console.error("Save failure:", err);
      try {
        handleFirestoreError(err, OperationType.CREATE, 'generated_images');
      } catch(e) {}
    }
  };

  const handleGenerate = async () => {
    if (!hasApiKey) {
      setError("Please save your API key in the settings bar first.");
      return;
    }
    if (!prompt.trim()) {
      setError("Please enter a prompt to generate an image.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);

    const finalPrompt = getFullPrompt();
    const newImages: string[] = [];

    try {
      // Loop for multiple images as Gemini current SDK processes 1 at a time for Nano
      for (let i = 0; i < numImages; i++) {
        const url = await generateImageWithGemini(apiKey, finalPrompt, aspectRatio, negativePrompt);
        newImages.push(url);
        
        // Auto-save each to gallery if user is signed in
        if (user) {
          await saveToFirebase(url, finalPrompt);
        }
      }
      setGeneratedImages(newImages);
    } catch (err: any) {
      setError(err.message || "Failed to generate image.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className="max-w-6xl mx-auto py-12 px-6 w-full flex flex-col gap-10">
      <div className="w-full text-center space-y-4">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-black text-white tracking-tighter"
        >
          GENERATE <span className="text-purple-500">REALITY.</span>
        </motion.h1>
        <p className="text-zinc-500 text-lg max-w-xl mx-auto font-medium">
          Professional-grade AI image generation using the Nano Banana engine.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Controls Panel */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-8 shadow-2xl space-y-8">
            
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm font-medium"
              >
                {error}
              </motion.div>
            )}

            {/* Prompt Area */}
            <div className="space-y-3">
              <label className="text-xs uppercase tracking-widest font-bold text-zinc-500 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Main Prompt
              </label>
              <div className="relative group">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full h-40 bg-zinc-950/50 border border-zinc-800 rounded-2xl p-5 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 resize-none transition-all text-lg leading-relaxed"
                  placeholder="Cinematic shot of a neon lotus in a glass jar..."
                />
                <button
                  onClick={handleEnhance}
                  disabled={isEnhancing || !prompt.trim()}
                  className="absolute bottom-4 right-4 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {isEnhancing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Magic Enhance
                </button>
              </div>
            </div>

            {/* Negative Prompt */}
            <div className="space-y-3">
              <label className="text-xs uppercase tracking-widest font-bold text-zinc-500 flex items-center gap-2">
                <Ban className="w-4 h-4" /> What to avoid
              </label>
              <input
                type="text"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                className="w-full bg-zinc-950/40 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-300 placeholder-zinc-800 focus:outline-none focus:border-purple-500/50 transition-all text-sm"
                placeholder="Blurry, low resolution, distorted hands..."
              />
            </div>

            {/* Grid Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
              <div className="space-y-4">
                <label className="text-xs uppercase tracking-widest font-bold text-zinc-500 flex items-center gap-2">
                  <Triangle className="w-4 h-4" /> Aspect Ratio
                </label>
                <div className="flex gap-2">
                  {RATIOS.map(r => (
                    <button
                      key={r}
                      onClick={() => setAspectRatio(r)}
                      className={`flex-1 py-3 rounded-xl text-xs font-black transition-all border ${
                        aspectRatio === r 
                          ? 'bg-white border-white text-black shadow-lg shadow-white/10' 
                          : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs uppercase tracking-widest font-bold text-zinc-500 flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Batch Count
                </label>
                <div className="flex gap-2">
                  {COUNTS.map(c => (
                    <button
                      key={c}
                      onClick={() => setNumImages(c)}
                      className={`flex-1 py-3 rounded-xl text-xs font-black transition-all border ${
                        numImages === c 
                          ? 'bg-white border-white text-black shadow-lg shadow-white/10' 
                          : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                      }`}
                    >
                      {c === 1 ? 'SINGLE' : `${c} IMAGES`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Style Selector */}
            <div className="space-y-4">
              <label className="text-xs uppercase tracking-widest font-bold text-zinc-500">Visual Style</label>
              <div className="flex flex-wrap gap-2">
                {STYLES.map(style => (
                  <button
                    key={style}
                    onClick={() => setSelectedStyle(style)}
                    className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all border ${
                      selectedStyle === style 
                        ? 'bg-purple-600 border-purple-500 text-white' 
                        : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-white hover:bg-zinc-100 text-black font-black text-xl py-6 rounded-2xl flex items-center justify-center gap-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl active:scale-[0.98]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-7 h-7 animate-spin" /> 
                  <span className="tracking-tighter">GENERATING ARTIFACTS...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-7 h-7" /> 
                  <span className="tracking-tighter uppercase">Generate Masterpiece</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Sidebar / Display */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 h-fit">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden group">
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-4 text-center"
                >
                  <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                  <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Processing Reality...</p>
                </motion.div>
              ) : generatedImages.length > 0 ? (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full space-y-4"
                >
                  <div className={`grid gap-4 ${numImages === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {generatedImages.map((img, idx) => (
                      <div key={idx} className="relative group/img overflow-hidden rounded-xl border border-zinc-700 shadow-2xl aspect-square bg-zinc-950">
                        <img src={img} alt={`Result ${idx}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  {user && (
                    <p className="text-emerald-400 text-[10px] font-black uppercase tracking-tighter text-center">
                      ✓ Synchronized with Gallery
                    </p>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center space-y-4"
                >
                  <div className="w-20 h-20 bg-zinc-950 border border-zinc-800 rounded-3xl flex items-center justify-center mx-auto opacity-50 group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-8 h-8 text-zinc-700" />
                  </div>
                  <p className="text-zinc-700 font-bold uppercase tracking-widest text-[10px]">Output Matrix Empty</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
