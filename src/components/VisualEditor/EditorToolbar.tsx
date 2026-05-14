
import React from 'react';
import { Save, X, Eye, EyeOff, Layout, ChevronLeft, ChevronRight, Monitor, Tablet, Smartphone, Settings } from 'lucide-react';
import { useEditor } from './EditorContext';
import { cn } from '../../lib/utils';

interface EditorToolbarProps {
  onSave: () => void;
  onCancel: () => void;
  hasChanges: boolean;
  saving: boolean;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ onSave, onCancel, hasChanges, saving }) => {
  const { isEditing, setIsEditing, setActiveSectionId, activeSectionId } = useEditor();

  return (
    <div className="fixed left-6 top-1/2 z-[1000] -translate-y-1/2 flex flex-col items-center gap-4">
      <div className="flex flex-col items-center gap-3 rounded-[32px] bg-slate-950 p-2.5 text-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] backdrop-blur-2xl ring-1 ring-white/10">
        {/* Editor Brand Indicator */}
        <div className="group relative flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.4)]">
          <Layout size={20} className="transition-transform group-hover:scale-110" />
          <div className="absolute left-14 hidden group-hover:block whitespace-nowrap rounded-xl bg-slate-900 px-4 py-2 text-[10px] font-black tracking-widest text-white uppercase ring-1 ring-white/5 shadow-2xl">
            Visual Editor
          </div>
        </div>

        <div className="h-px w-6 bg-white/10" />

        {/* Global Settings Toggle */}
        <button 
            onClick={() => setActiveSectionId(activeSectionId === 'global-settings' ? null : 'global-settings')}
            className={cn(
                "group relative flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-300",
                activeSectionId === 'global-settings' 
                  ? "bg-white text-slate-950 shadow-xl" 
                  : "text-slate-400 hover:bg-white/10 hover:text-white"
            )}
        >
            <Settings size={20} className={cn(activeSectionId === 'global-settings' && "animate-[spin_4s_linear_infinite]")} />
            <div className="absolute left-14 hidden group-hover:block whitespace-nowrap rounded-xl bg-slate-900 px-4 py-2 text-[10px] font-black tracking-widest text-white uppercase ring-1 ring-white/5 shadow-2xl">
              Site Settings
            </div>
        </button>

        <div className="h-px w-4 bg-white/5" />

        {/* Action: Save */}
        <button 
          onClick={onSave}
          disabled={!hasChanges || saving}
          className={cn(
            "group relative flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-300",
            hasChanges 
              ? "bg-emerald-500 text-white shadow-[0_8px_24px_rgba(16,185,129,0.3)] hover:bg-emerald-600 active:scale-95" 
              : "text-slate-600 cursor-not-allowed"
          )}
        >
          {saving ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <Save size={20} />
          )}
          <div className="absolute left-14 hidden group-hover:block whitespace-nowrap rounded-xl bg-slate-900 px-4 py-2 text-[10px] font-black tracking-widest text-white uppercase ring-1 ring-white/5 shadow-2xl">
            {saving ? 'Saving...' : hasChanges ? 'Apply Changes' : 'No Changes'}
          </div>
        </button>

        {/* Action: Cancel */}
        <button 
          onClick={onCancel}
          className="group relative flex h-11 w-11 items-center justify-center rounded-2xl text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 transition-all duration-300"
        >
          <X size={20} />
          <div className="absolute left-14 hidden group-hover:block whitespace-nowrap rounded-xl bg-slate-900 px-4 py-2 text-[10px] font-black tracking-widest text-white uppercase ring-1 ring-white/5 shadow-2xl">
            Exit Editor
          </div>
        </button>
      </div>

      {/* Screen Size Helper (Small Dot Cluster) */}
      <div className="flex flex-col gap-1 pr-1 opacity-40 hover:opacity-100 transition-opacity">
        <div className="h-1 w-1 rounded-full bg-white" />
        <div className="h-1 w-1 rounded-full bg-white/50" />
        <div className="h-1 w-1 rounded-full bg-white/20" />
      </div>
    </div>
  );
};

export default EditorToolbar;
