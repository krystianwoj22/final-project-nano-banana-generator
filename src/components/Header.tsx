import React, { useState } from 'react';
import { useAuth } from './FirebaseProvider';
import { signInWithGoogle, logout } from '../lib/firebase';
import { useApiKey } from '../hooks/useApiKey';
import { KeyRound, CheckCircle2, UserCircle, LogOut } from 'lucide-react';

export function Header() {
  const { user } = useAuth();
  const { apiKey, saveApiKey, hasApiKey } = useApiKey();
  const [inputKey, setInputKey] = useState(apiKey);
  
  // Keep input in sync when context loads
  React.useEffect(() => {
    setInputKey(apiKey);
  }, [apiKey]);

  const handleSave = () => {
    saveApiKey(inputKey);
  };

  return (
    <header className="bg-black/50 backdrop-blur-xl border-b border-zinc-900 p-5 sticky top-0 z-50 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-purple-600 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-purple-900/20 group-hover:scale-110 transition-transform">
            🍌
          </div>
          <span className="text-xl font-black text-white tracking-widest uppercase">
            Nano <span className="text-purple-500">Banana</span>
          </span>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6 flex-1 justify-end">
          {/* API Key Setup */}
          <div className="flex items-center gap-2 bg-zinc-900/50 p-1 rounded-2xl border border-zinc-800 w-full sm:w-auto overflow-hidden">
            <div className="pl-4 pr-2 text-zinc-500">
              <KeyRound className="w-4 h-4" />
            </div>
            <input 
              type="password"
              className="bg-transparent border-none px-3 py-2 text-xs font-bold text-zinc-200 outline-none w-full sm:w-48 placeholder-zinc-700"
              placeholder="API CREDENTIALS"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
            />
            <button 
              onClick={handleSave}
              className="px-5 py-2 bg-white hover:bg-zinc-200 text-black text-[10px] font-black rounded-[14px] transition-all uppercase tracking-widest"
            >
              SAVE
            </button>
            <div className="px-4 border-l border-zinc-800">
              {hasApiKey ? (
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" title="Connected" />
              ) : (
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" title="Disconnected" />
              )}
            </div>
          </div>

          {/* Auth Setup */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-full pl-1">
                <img src={user.photoURL || ''} alt="avatar" className="w-8 h-8 rounded-full border border-white/10" />
                <button
                  onClick={logout}
                  className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-white transition"
                  title="Disconnect Identity"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest shadow-xl transition-all active:scale-95"
              >
                <UserCircle className="w-4 h-4 text-purple-500" />
                Secure Login
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
