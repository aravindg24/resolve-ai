import React, { useState, useEffect } from 'react';
import { Key, Lock, Save } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onSave: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onSave }) => {
  const [inputKey, setInputKey] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.trim()) {
      onSave(inputKey.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-cyber-panel border-2 border-cyber-secondary shadow-[0_0_20px_rgba(188,19,254,0.3)] p-6 relative overflow-hidden">
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyber-primary"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyber-primary"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyber-primary"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyber-primary"></div>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-cyber-secondary/20 rounded-full text-cyber-secondary">
            <Lock size={24} />
          </div>
          <h2 className="text-2xl font-tech font-bold text-white uppercase tracking-wider">
            Access Required
          </h2>
        </div>

        <p className="text-cyber-muted mb-6 font-tech text-sm">
          Initialize secure connection. Enter your Gemini API Key to activate the Resolve AI protocol.
          The key is stored locally on your device.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Key className="absolute left-3 top-3 text-cyber-primary" size={20} />
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="Paste GEMINI_API_KEY here"
              className="w-full bg-cyber-dark border border-cyber-muted focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary text-cyber-text pl-10 pr-4 py-3 font-mono outline-none transition-all"
              autoFocus
            />
          </div>
          
          <button
            type="submit"
            disabled={!inputKey}
            className="w-full group relative overflow-hidden bg-cyber-secondary/20 hover:bg-cyber-secondary/30 text-cyber-secondary border border-cyber-secondary py-3 font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Save size={18} />
              Authenticate
            </span>
            <div className="absolute inset-0 bg-cyber-secondary/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          </button>
        </form>
        
        <div className="mt-4 text-center">
             <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-cyber-primary underline font-mono hover:text-white transition-colors"
             >
                 Get API Key via Google AI Studio
             </a>
        </div>
      </div>
    </div>
  );
};
