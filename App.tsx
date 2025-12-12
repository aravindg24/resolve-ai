import React, { useState, useEffect, useRef } from 'react';
import { Camera, Zap, AlertCircle, X, Terminal, Plus, Play, Trash2, Film, Image as ImageIcon, Upload, Aperture, History, BrainCircuit } from 'lucide-react';
import { ResultsDisplay } from './components/ResultsDisplay';
import { CameraCapture } from './components/CameraCapture';
import { ScanHistory } from './components/ScanHistory';
import { analyzeMedia } from './services/geminiService';
import { saveScan } from './services/storageService';
import { AppState, RepairAnalysis, MediaItem, StoredScan, SkillLevel } from './types';

function App() {
  const [appState, setAppState] = useState<AppState>('IDLE');
  
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [userQuery, setUserQuery] = useState('How do I fix this?');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('Novice');
  
  const [analysisResult, setAnalysisResult] = useState<RepairAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedSkill = localStorage.getItem('RESOLVE_SKILL_LEVEL');
    if (storedSkill) setSkillLevel(storedSkill as SkillLevel);
  }, []);

  const handleSkillChange = (level: SkillLevel) => {
    setSkillLevel(level);
    localStorage.setItem('RESOLVE_SKILL_LEVEL', level);
  }

  const processFile = (file: File): Promise<MediaItem> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        resolve({
          id: Math.random().toString(36).substring(7),
          data: base64Data,
          mimeType: file.type,
          previewUrl: result,
          type: file.type.startsWith('video/') ? 'video' : 'image',
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      try {
        const newMediaItems = await Promise.all(newFiles.map(processFile));
        setMediaItems(prev => [...prev, ...newMediaItems]);
        setAppState('SCANNING');
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        console.error("Error processing files", err);
        setErrorMsg("Failed to process some files.");
      }
    }
  };

  const handleScanClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraCapture = (item: MediaItem) => {
    setMediaItems(prev => [...prev, item]);
    setAppState('SCANNING');
    setIsCameraOpen(false); 
  };

  const removeMediaItem = (id: string) => {
    setMediaItems(prev => {
      const updated = prev.filter(item => item.id !== id);
      if (updated.length === 0) {
        setAppState('IDLE');
      }
      return updated;
    });
  };

  const handleAnalyze = async () => {
    if (mediaItems.length === 0) return;
    
    setAppState('PROCESSING');
    setErrorMsg(null);
    
    try {
      const result = await analyzeMedia(mediaItems, userQuery, skillLevel);
      
      const newScan: StoredScan = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        analysis: result,
        media: mediaItems,
        completedSteps: [],
        skillLevel: skillLevel
      };
      
      await saveScan(newScan).catch(console.error);

      setAnalysisResult(result);
      setAppState('RESULTS');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Unknown error occurred");
      setAppState('ERROR');
    }
  };

  const resetApp = () => {
    setAppState('IDLE');
    setMediaItems([]);
    setAnalysisResult(null);
    setUserQuery('How do I fix this?');
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLoadScan = (scan: StoredScan) => {
    setAnalysisResult(scan.analysis);
    const restoredMedia = scan.media.map(m => ({
      ...m,
      previewUrl: `data:${m.mimeType};base64,${m.data}`
    }));
    setMediaItems(restoredMedia);
    setAppState('RESULTS');
  };

  return (
    <div className="min-h-screen bg-cyber-black text-cyber-text font-tech selection:bg-cyber-primary selection:text-cyber-black overflow-x-hidden">
      
      {/* Camera Overlay */}
      {isCameraOpen && (
        <CameraCapture 
          onCapture={handleCameraCapture} 
          onClose={() => setIsCameraOpen(false)} 
        />
      )}

      {/* Header */}
      <header className="fixed top-0 w-full z-30 bg-cyber-black/90 border-b border-cyber-dark backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyber-primary cursor-pointer" onClick={resetApp}>
            <Zap className="animate-pulse" size={24} />
            <h1 className="text-xl font-bold tracking-widest uppercase">Resolve_AI</h1>
          </div>
          <div className="flex items-center gap-4">
             <button 
               onClick={() => setAppState('HISTORY')}
               className="p-2 text-cyber-muted hover:text-cyber-primary transition-colors flex items-center gap-2"
             >
               <History size={18} />
               <span className="hidden md:inline text-xs font-bold uppercase tracking-wider">Logs</span>
             </button>
             <div className="text-[10px] md:text-xs text-cyber-muted font-mono flex items-center gap-2 border-l border-cyber-dark pl-4">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                ONLINE
             </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-24 px-4 pb-8 max-w-4xl mx-auto min-h-screen flex flex-col items-center justify-center">
        
        {/* Hidden Input for multiple files */}
        <input 
          type="file" 
          accept="image/*,video/*"
          multiple
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileSelect}
        />

        {/* IDLE STATE */}
        {appState === 'IDLE' && (
          <div className="flex flex-col items-center w-full animate-fade-in text-center">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Option 1: Live Camera */}
              <button 
                onClick={() => setIsCameraOpen(true)}
                className="group relative w-64 h-64 border-2 border-cyber-primary bg-cyber-panel/50 backdrop-blur-sm flex flex-col items-center justify-center gap-4 text-cyber-primary hover:text-white hover:bg-cyber-primary/10 transition-all duration-300 rounded-2xl shadow-card hover:shadow-neon-cyan"
              >
                <div className="absolute inset-0 bg-cyber-primary/5 group-hover:bg-cyber-primary/20 transition-colors rounded-2xl"></div>
                <Aperture size={64} strokeWidth={1} />
                <span className="text-xl font-bold tracking-widest uppercase">Live Capture</span>
                <span className="text-xs text-cyber-muted font-mono">(Photo / Video)</span>
              </button>

              {/* Option 2: Upload */}
              <button 
                onClick={handleScanClick}
                className="group relative w-64 h-64 border-2 border-cyber-secondary bg-cyber-panel/50 backdrop-blur-sm flex flex-col items-center justify-center gap-4 text-cyber-secondary hover:text-white hover:bg-cyber-secondary/10 transition-all duration-300 rounded-2xl shadow-card hover:shadow-neon-purple"
              >
                 <div className="absolute inset-0 bg-cyber-secondary/5 group-hover:bg-cyber-secondary/20 transition-colors rounded-2xl"></div>
                 <Upload size={64} strokeWidth={1} />
                 <span className="text-xl font-bold tracking-widest uppercase">Upload Files</span>
                 <span className="text-xs text-cyber-muted font-mono">(Gallery / Disk)</span>
              </button>
            </div>
            
            <p className="text-cyber-muted max-w-sm mb-8">
              Initialize diagnostic sequence. Capture live footage or upload evidence for multimodal analysis.
            </p>
          </div>
        )}

        {/* SCANNING PREVIEW STATE */}
        {appState === 'SCANNING' && mediaItems.length > 0 && (
          <div className="w-full max-w-2xl animate-fade-in">
             <div className="flex items-center justify-between mb-4">
                <h2 className="text-cyber-primary font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                  <Film size={16} /> Asset Manifest ({mediaItems.length})
                </h2>
                <button 
                  onClick={resetApp}
                  className="text-cyber-danger hover:text-white text-xs uppercase font-bold tracking-wider"
                >
                  Clear All
                </button>
             </div>

             {/* Media Grid */}
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {mediaItems.map((item) => (
                  <div key={item.id} className="relative aspect-square border border-cyber-dark bg-cyber-panel rounded-lg group overflow-hidden">
                    {item.type === 'video' ? (
                       <video 
                         src={item.previewUrl} 
                         className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                         muted
                         playsInline
                         onMouseOver={(e) => e.currentTarget.play()}
                         onMouseOut={(e) => e.currentTarget.pause()}
                       />
                    ) : (
                       <img 
                         src={item.previewUrl} 
                         alt="Asset" 
                         className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                       />
                    )}
                    
                    <button 
                      onClick={() => removeMediaItem(item.id)}
                      className="absolute top-1 right-1 p-1.5 bg-red-500/80 text-white hover:bg-red-600 transition-colors z-10 rounded-full"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                
                <div className="flex flex-col gap-2 h-full">
                  <button onClick={() => setIsCameraOpen(true)} className="flex-1 border border-cyber-primary/30 bg-cyber-panel rounded-lg hover:bg-cyber-primary/10 flex items-center justify-center gap-2 text-cyber-primary transition-colors">
                     <Aperture size={20} /> <span className="text-xs uppercase font-bold">Cam</span>
                  </button>
                  <button onClick={handleScanClick} className="flex-1 border border-cyber-secondary/30 bg-cyber-panel rounded-lg hover:bg-cyber-secondary/10 flex items-center justify-center gap-2 text-cyber-secondary transition-colors">
                     <Upload size={20} /> <span className="text-xs uppercase font-bold">Disk</span>
                  </button>
                </div>
             </div>
             
             {/* CONFIGURATION PANEL */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-cyber-secondary text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                    <BrainCircuit size={14} /> Operator Skill Level
                  </label>
                  <div className="flex bg-cyber-panel border border-cyber-muted rounded-lg overflow-hidden p-1">
                     {(['Novice', 'Intermediate', 'Expert'] as SkillLevel[]).map(level => (
                       <button
                         key={level}
                         onClick={() => handleSkillChange(level)}
                         className={`flex-1 py-2 text-xs font-bold uppercase transition-all rounded-md ${skillLevel === level ? 'bg-cyber-secondary text-white shadow-lg' : 'text-cyber-muted hover:text-white'}`}
                       >
                         {level}
                       </button>
                     ))}
                  </div>
                </div>

                <div>
                   <label className="block text-cyber-secondary text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                     <Terminal size={14} /> Query Parameters
                   </label>
                   <input 
                      type="text" 
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      className="w-full bg-cyber-panel border border-cyber-muted focus:border-cyber-primary text-cyber-text px-3 py-2.5 rounded-lg font-mono outline-none transition-colors"
                   />
                </div>
             </div>

             <button 
                onClick={handleAnalyze}
                className="w-full py-4 bg-gradient-to-r from-cyber-primary to-blue-600 text-white font-bold text-lg uppercase tracking-widest hover:scale-[1.02] hover:shadow-neon-cyan transition-all rounded-xl"
             >
                Initialize Analysis
             </button>
          </div>
        )}

        {/* PROCESSING STATE */}
        {appState === 'PROCESSING' && (
          <div className="flex flex-col items-center justify-center text-center animate-fade-in">
             <div className="relative w-32 h-32 mb-8">
                <div className="absolute inset-0 border-4 border-cyber-dark rounded-full"></div>
                <div className="absolute inset-0 border-t-4 border-cyber-primary rounded-full animate-spin"></div>
                <div className="absolute inset-4 border-4 border-cyber-secondary/30 rounded-full animate-pulse"></div>
             </div>
             <h2 className="text-2xl font-bold text-white mb-2 tracking-widest animate-pulse">PROCESSING</h2>
             <p className="text-cyber-primary font-mono text-sm">
               Analysing {mediaItems.length} asset{mediaItems.length > 1 ? 's' : ''}...<br/>
               Processing multimodal data...<br/>
               Safety protocols active...
             </p>
          </div>
        )}

        {/* RESULTS STATE */}
        {appState === 'RESULTS' && analysisResult && (
          <ResultsDisplay result={analysisResult} onReset={resetApp} />
        )}
        
        {/* HISTORY STATE */}
        {appState === 'HISTORY' && (
           <ScanHistory 
             onSelect={handleLoadScan} 
             onBack={() => setAppState('IDLE')} 
           />
        )}

        {/* ERROR STATE */}
        {appState === 'ERROR' && (
           <div className="text-center max-w-md border-2 border-cyber-danger/50 p-8 bg-cyber-danger/5 rounded-2xl animate-fade-in relative shadow-neon-red">
              <AlertCircle className="mx-auto text-cyber-danger mb-4" size={48} />
              <h2 className="text-xl font-bold text-cyber-danger mb-2">SYSTEM ERROR</h2>
              <p className="text-gray-400 mb-6 font-mono text-sm">{errorMsg}</p>
              <button 
                onClick={resetApp}
                className="px-6 py-2 border border-cyber-danger text-cyber-danger hover:bg-cyber-danger hover:text-black transition-colors uppercase font-bold tracking-wider rounded-lg"
              >
                Reboot System
              </button>
           </div>
        )}

      </main>
    </div>
  );
}

export default App;
