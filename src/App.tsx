import { FirebaseProvider } from './components/FirebaseProvider';
import { Header } from './components/Header';
import { GenerationSection } from './components/GenerationSection';
import { GallerySection } from './components/GallerySection';

function App() {
  return (
    <FirebaseProvider>
      <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-600 selection:text-white">
        <Header />
        
        <main className="flex flex-col items-center">
          <div className="w-full bg-zinc-950/30 border-b border-zinc-900/50">
            <GenerationSection />
          </div>
          
          <div className="w-full bg-black">
            <GallerySection />
          </div>
        </main>
        
        <footer className="w-full py-12 text-center border-t border-zinc-900 bg-black">
          <p className="text-zinc-600 text-xs font-bold uppercase tracking-[0.3em] mb-4">
            Engineered by Nano Banana Image Model & Gemini Flash
          </p>
          <div className="flex justify-center gap-4 text-zinc-800">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
          </div>
        </footer>
      </div>
    </FirebaseProvider>
  );
}

export default App;
