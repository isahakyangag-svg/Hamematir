
import React, { useState } from 'react';
import { Pencil, Plus, Trash2, ChevronUp, ChevronDown, Settings, X, Check } from 'lucide-react';
import { useEditor } from './EditorContext';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface EditableSectionProps {
  id: string;
  onEdit: () => void;
  onAddAbove: () => void;
  onAddBelow: () => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  children: React.ReactNode;
}

const EditableSection: React.FC<EditableSectionProps> = ({ 
  id, 
  onEdit, 
  onAddAbove, 
  onAddBelow, 
  onDelete,
  onMoveUp,
  onMoveDown,
  children 
}) => {
  const { isEditing, hoveredSectionId, setHoveredSectionId, activeSectionId } = useEditor();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const isHovered = hoveredSectionId === id;
  const isActive = activeSectionId === id;

  if (!isEditing) return <>{children}</>;

  return (
    <div 
      className={cn(
        "group relative transition-all duration-300",
        isHovered ? "ring-2 ring-blue-500 ring-offset-4 rounded-[40px]" : "",
        isActive ? "ring-2 ring-blue-600 ring-offset-8 rounded-[40px]" : ""
      )}
      onMouseEnter={() => setHoveredSectionId(id)}
      onMouseLeave={() => {
        setHoveredSectionId(null);
        setShowConfirmDelete(false);
      }}
    >
      {/* Plus Button Above */}
      <div className="absolute -top-4 left-1/2 z-30 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
        <button 
          onClick={onAddAbove}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:scale-110 active:scale-95"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Main Content */}
      <div className="relative">
        {children}
        
        {/* Editor Overlay */}
        <div className={cn(
          "absolute right-4 top-4 z-50 flex items-center gap-2 rounded-2xl bg-white/95 p-2 shadow-2xl backdrop-blur-md transition-all duration-300",
          isHovered ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0 pointer-events-none"
        )}>
          {!showConfirmDelete ? (
            <>
              <button 
                onClick={onMoveUp}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                title="Move Up"
              >
                <ChevronUp size={20} />
              </button>
              <button 
                onClick={onMoveDown}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                title="Move Down"
              >
                <ChevronDown size={20} />
              </button>
              <div className="h-6 w-px bg-gray-200" />
              <button 
                onClick={onEdit}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                title="Settings"
              >
                <Settings size={20} />
              </button>
              <button 
                onClick={() => setShowConfirmDelete(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                title="Delete"
              >
                <Trash2 size={20} />
              </button>
            </>
          ) : (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1 bg-red-600 p-1 rounded-xl"
            >
              <span className="px-3 text-[10px] font-black uppercase tracking-widest text-white">Удалить?</span>
              <button 
                onClick={() => {
                  onDelete();
                  setShowConfirmDelete(false);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-red-600 hover:bg-red-50 transition-colors"
              >
                <Check size={16} />
              </button>
              <button 
                onClick={() => setShowConfirmDelete(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Plus Button Below */}
      <div className="absolute -bottom-4 left-1/2 z-30 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
        <button 
          onClick={onAddBelow}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:scale-110 active:scale-95"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};

export default EditableSection;
