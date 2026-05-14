
import React, { createContext, useContext, useState } from 'react';
import { SectionConfig } from '../../types/editor';

interface EditorContextType {
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
  activeSectionId: string | null;
  setActiveSectionId: (id: string | null) => void;
  hoveredSectionId: string | null;
  setHoveredSectionId: (id: string | null) => void;
  footerSettings: any;
  setFooterSettings: (settings: any) => void;
  globalSettings: any;
  setGlobalSettings: (settings: any) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [hoveredSectionId, setHoveredSectionId] = useState<string | null>(null);
  const [footerSettings, setFooterSettings] = useState<any>(null);
  const [globalSettings, setGlobalSettings] = useState<any>(null);

  return (
    <EditorContext.Provider value={{ 
      isEditing, 
      setIsEditing, 
      activeSectionId, 
      setActiveSectionId,
      hoveredSectionId,
      setHoveredSectionId,
      footerSettings,
      setFooterSettings,
      globalSettings,
      setGlobalSettings
    }}>
      {children}
    </EditorContext.Provider>
  );
}

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) throw new Error('useEditor must be used within EditorProvider');
  return context;
};
