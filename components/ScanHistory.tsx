import React, { useEffect, useState } from 'react';
import { Trash2, Clock, AlertTriangle, CheckCircle, ChevronRight, HardDrive } from 'lucide-react';
import { StoredScan, DangerLevel } from '../types';
import { getHistory, deleteScan } from '../services/storageService';

interface ScanHistoryProps {
  onSelect: (scan: StoredScan) => void;
  onBack: () => void;
}

export const ScanHistory: React.FC<ScanHistoryProps> = ({ onSelect, onBack }) => {
  const [scans, setScans] = useState<StoredScan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScans();
  }, []);

  const loadScans = async () => {
    try {
      const data = await getHistory();
      setScans(data);
    } catch (error) {
      console.error("Failed to load history", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Permanently delete this record?")) {
      await deleteScan(id);
      loadScans();
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in pb-20">
      <div className="flex items-center justify-between mb-8 border-b border-cyber-dark pb-4">
        <div className="flex items-center gap-3 text-cyber-primary">
          <HardDrive size={24} />
          <h2 className="text-xl font-bold uppercase tracking-widest">System Logs</h2>
        </div>
        <button
          onClick={onBack}
          className="text-cyber-muted hover:text-white uppercase text-xs font-bold tracking-wider"
        >
          Close Database
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-t-2 border-l-2 border-cyber-primary rounded-full animate-spin"></div>
        </div>
      ) : scans.length === 0 ? (
        <div className="text-center py-12 text-cyber-muted border border-dashed border-cyber-dark p-8">
          <p className="font-mono mb-2">DATABASE EMPTY</p>
          <p className="text-sm">No analysis records found in local storage.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {scans.map((scan) => {
            const isDanger = scan.analysis.dangerLevel === DangerLevel.High;
            const thumbnail = scan.media[0]?.data
              ? `data:${scan.media[0].mimeType};base64,${scan.media[0].data}`
              : null;

            return (
              <div
                key={scan.id}
                onClick={() => onSelect(scan)}
                className={`
                  relative group cursor-pointer border border-cyber-dark bg-cyber-panel p-4 flex gap-4 items-center transition-all overflow-hidden
                  hover:border-cyber-primary/50 hover:bg-cyber-panel/80
                  ${isDanger ? 'border-l-4 border-l-cyber-danger' : 'border-l-4 border-l-cyber-primary'}
                `}
              >
                {/* Thumbnail */}
                <div className="w-20 h-20 bg-black flex-shrink-0 border border-cyber-dark relative overflow-hidden">
                  {thumbnail ? (
                    <img src={thumbnail} alt="Scan" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-cyber-dark">?</div>
                  )}
                  {scan.media.length > 1 && (
                    <div className="absolute bottom-0 right-0 bg-black/70 text-white text-[10px] px-1 font-mono">
                      +{scan.media.length - 1}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-cyber-muted text-xs font-mono flex items-center gap-1">
                      <Clock size={12} />
                      {formatDate(scan.timestamp)}
                    </span>
                    {isDanger && (
                      <span className="text-cyber-danger text-[10px] uppercase border border-cyber-danger px-1 rounded-sm">Critical</span>
                    )}
                  </div>
                  <h3 className="text-white font-bold text-lg truncate group-hover:text-cyber-primary transition-colors">
                    {scan.analysis.objectName}
                  </h3>
                  <p className="text-cyber-muted text-sm truncate">
                    {scan.analysis.safetyWarning}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={(e) => handleDelete(e, scan.id)}
                    className="p-2 text-cyber-muted hover:text-cyber-danger transition-colors z-10"
                    title="Delete Record"
                  >
                    <Trash2 size={18} />
                  </button>
                  <ChevronRight className="text-cyber-dark group-hover:text-cyber-primary transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
