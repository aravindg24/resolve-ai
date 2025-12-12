import React, { useState, useEffect } from 'react';
import { RepairAnalysis, DangerLevel } from '../types';
import { 
  AlertTriangle, CheckCircle, Volume2, RotateCcw, VolumeX, 
  Wrench, Clock, Activity, Mic, MicOff, CheckSquare, Square, 
  ShieldAlert, UserCheck, AlertOctagon 
} from 'lucide-react';

interface ResultsDisplayProps {
  result: RepairAnalysis;
  onReset: () => void;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, onReset }) => {
  const isDanger = result.dangerLevel === DangerLevel.High;
  const isLowConfidence = result.confidenceScore < 60;
  
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recog = new SpeechRecognition();
      recog.continuous = true;
      recog.interimResults = false;
      recog.lang = 'en-US';

      recog.onresult = (event: any) => {
        const command = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
        if (command.includes('next')) handleNextStep();
        else if (command.includes('back') || command.includes('previous')) handlePrevStep();
        else if (command.includes('stop')) setIsListening(false);
      };

      recog.onerror = (e: any) => { console.error(e); setIsListening(false); };
      setRecognition(recog);
    }
  }, [completedSteps]);

  useEffect(() => {
    if (isListening && recognition) recognition.start();
    else if (!isListening && recognition) recognition.stop();
  }, [isListening, recognition]);

  const toggleStep = (index: number) => {
    setCompletedSteps(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleNextStep = () => {
    const nextIndex = result.steps.findIndex((_, idx) => !completedSteps.includes(idx));
    if (nextIndex !== -1) setCompletedSteps(prev => [...prev, nextIndex]);
  };

  const handlePrevStep = () => {
    if (completedSteps.length === 0) return;
    const maxIndex = Math.max(...completedSteps);
    setCompletedSteps(prev => prev.filter(i => i !== maxIndex));
  };

  const speakInstructions = () => {
    if (!window.speechSynthesis) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const text = isDanger 
      ? `DANGER. ${result.safetyWarning}. Contact ${result.professionalReferral}.` 
      : `Starting repair for ${result.objectName}. ${result.reasoning}. Step 1: ${result.steps[0]}`;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const progress = result.steps.length > 0 ? Math.round((completedSteps.length / result.steps.length) * 100) : 0;

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in pb-32">
      
      {/* 1. SAFETY LOCKOUT (High Danger) */}
      {isDanger && (
        <div className="rounded-2xl bg-cyber-danger/10 border-2 border-cyber-danger p-6 mb-8 shadow-neon-red animate-pulse-fast">
          <div className="flex flex-col items-center text-center">
            <AlertOctagon size={80} className="text-cyber-danger mb-4" />
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">DO NOT ATTEMPT</h1>
            <div className="bg-cyber-danger text-black font-bold px-4 py-1 rounded-full mb-6 text-sm tracking-widest uppercase">
              Lethal Hazard Detected
            </div>
            
            <p className="text-xl text-white font-bold mb-4">{result.safetyWarning}</p>
            
            <div className="w-full bg-black/50 rounded-xl p-6 border border-cyber-danger/30 mb-6">
              <h3 className="text-cyber-danger text-xs font-bold uppercase tracking-widest mb-2">Reasoning</h3>
              <p className="text-gray-300 font-mono text-sm">{result.reasoning}</p>
            </div>

            <div className="flex items-center gap-3 bg-white/10 px-6 py-4 rounded-xl border border-white/20">
              <UserCheck size={24} className="text-white" />
              <div className="text-left">
                <div className="text-xs text-gray-400 uppercase font-bold">Recommended Action</div>
                <div className="text-lg font-bold text-white">Contact {result.professionalReferral || "Professional"}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. HEADER CARD (Safe Mode) */}
      {!isDanger && (
        <div className="bg-cyber-panel rounded-2xl border border-cyber-dark p-6 mb-6 shadow-lg relative overflow-hidden group">
          {/* Background gradient hint */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">{result.objectName}</h1>
              <div className="flex flex-wrap gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 border ${result.confidenceScore > 80 ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-500'}`}>
                  <Activity size={12} />
                  Confidence: {result.confidenceScore}%
                </span>
                <span className="px-3 py-1 rounded-full border border-cyber-secondary/30 bg-cyber-secondary/10 text-cyber-secondary text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <Clock size={12} />
                  {result.estimatedTime}
                </span>
              </div>
            </div>
            
            {/* Progress Radial */}
            <div className="relative w-16 h-16 flex-shrink-0">
               <svg className="w-full h-full -rotate-90">
                  <circle cx="32" cy="32" r="28" className="stroke-cyber-dark" strokeWidth="4" fill="none" />
                  <circle cx="32" cy="32" r="28" className="stroke-cyber-primary transition-all duration-500" strokeWidth="4" fill="none" strokeDasharray="175" strokeDashoffset={175 - (175 * progress) / 100} />
               </svg>
               <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                 {progress}%
               </div>
            </div>
          </div>

          {/* Reasoning / Analysis */}
          <div className="mb-6 bg-cyber-black/50 rounded-xl p-4 border-l-4 border-cyber-secondary">
             <h3 className="text-cyber-muted text-[10px] font-bold uppercase tracking-widest mb-1">AI Analysis</h3>
             <p className="text-sm text-gray-300 leading-relaxed font-mono">{result.reasoning}</p>
          </div>

          {/* Tool Checklist */}
          {result.toolsRequired.length > 0 && (
            <div className="border-t border-cyber-dark pt-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                <Wrench size={14} className="text-cyber-secondary" /> Required Tools
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.toolsRequired.map((tool, i) => (
                  <span key={i} className="px-3 py-1.5 bg-cyber-dark rounded-lg text-xs font-medium text-gray-300 border border-white/5">
                    {tool}
                  </span>
                ))}
                {result.toolSubstitutions?.map((sub, i) => (
                  <span key={`sub-${i}`} className="px-3 py-1.5 bg-cyber-secondary/10 rounded-lg text-xs font-medium text-cyber-secondary border border-cyber-secondary/20" title={`Substitute for ${sub.original}`}>
                    Use {sub.substitute} instead of {sub.original}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. SAFETY WARNING (Low Danger) */}
      {!isDanger && result.safetyWarning && (
        <div className="flex gap-4 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-200 mb-6 items-start">
          <ShieldAlert size={24} className="text-orange-500 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-orange-500 text-sm uppercase tracking-wide mb-1">Safety First</h4>
            <p className="text-sm">{result.safetyWarning}</p>
          </div>
        </div>
      )}
      
      {/* 4. CONFIDENCE WARNING */}
      {!isDanger && isLowConfidence && (
         <div className="flex gap-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 mb-6 items-start">
           <AlertTriangle size={24} className="text-yellow-500 flex-shrink-0" />
           <div>
             <h4 className="font-bold text-yellow-500 text-sm uppercase tracking-wide mb-1">Low Confidence Analysis</h4>
             <p className="text-sm">The image provided was unclear. Proceed with caution and verify the device model manually.</p>
           </div>
         </div>
      )}

      {/* 5. INTERACTIVE STEPS */}
      {!isDanger && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
             <h2 className="text-lg font-bold text-white uppercase tracking-wider">Instructions</h2>
             
             <div className="flex gap-2">
                {recognition && (
                  <button 
                    onClick={() => setIsListening(!isListening)}
                    className={`h-10 w-10 rounded-full flex items-center justify-center border transition-all ${isListening ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse' : 'bg-cyber-dark border-cyber-dark text-cyber-muted hover:text-white'}`}
                  >
                    {isListening ? <Mic size={18} /> : <MicOff size={18} />}
                  </button>
                )}
                <button 
                    onClick={speakInstructions}
                    className={`h-10 w-10 rounded-full flex items-center justify-center border transition-all ${isSpeaking ? 'bg-cyber-primary/20 border-cyber-primary text-cyber-primary' : 'bg-cyber-dark border-cyber-dark text-cyber-muted hover:text-white'}`}
                >
                    {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
             </div>
          </div>

          {result.steps.map((step, idx) => {
            const isCompleted = completedSteps.includes(idx);
            const isNext = !isCompleted && (idx === 0 || completedSteps.includes(idx - 1));

            return (
              <button 
                key={idx}
                onClick={() => toggleStep(idx)}
                className={`
                  w-full text-left p-4 rounded-xl border transition-all duration-300 relative overflow-hidden group
                  ${isCompleted 
                    ? 'bg-cyber-dark border-cyber-dark opacity-50' 
                    : isNext 
                      ? 'bg-cyber-panel border-cyber-primary shadow-lg scale-[1.02] z-10' 
                      : 'bg-cyber-panel border-cyber-dark opacity-80 hover:opacity-100'}
                `}
              >
                {isNext && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyber-primary"></div>}
                
                <div className="flex gap-4">
                  <div className={`mt-1 flex-shrink-0 ${isCompleted ? 'text-green-500' : isNext ? 'text-cyber-primary' : 'text-gray-500'}`}>
                     {isCompleted ? <CheckCircle size={24} /> : isNext ? <div className="w-6 h-6 rounded-full border-2 border-cyber-primary flex items-center justify-center"><div className="w-2 h-2 bg-cyber-primary rounded-full animate-pulse"></div></div> : <div className="w-6 h-6 rounded-full border-2 border-gray-600"></div>}
                  </div>
                  <div>
                    <span className={`text-xs font-bold uppercase tracking-wider mb-1 block ${isNext ? 'text-cyber-primary' : 'text-gray-500'}`}>
                      Step {idx + 1}
                    </span>
                    <p className={`text-base ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                      {step}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Floating Action Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-8 py-4 bg-cyber-primary text-black font-bold text-lg rounded-full shadow-neon-cyan hover:scale-105 transition-transform"
        >
          <RotateCcw size={20} />
          New Scan
        </button>
      </div>
    </div>
  );
};
