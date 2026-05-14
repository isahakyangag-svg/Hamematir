import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { PenTool } from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useEditor } from './EditorContext';
import EditableSection from './EditableSection';
import EditorToolbar from './EditorToolbar';
import WidgetLibraryModal from './WidgetLibraryModal';
import SectionSettingsSidebar from './SectionSettingsSidebar';
import DynamicRenderer from './DynamicRenderer';
import { PageStructure, SectionConfig, SectionType } from '../../types/editor';

interface VisualPageEditorProps {
  pageId: string;
  initialStructure?: PageStructure;
  children?: React.ReactNode;
}

const VisualPageEditor: React.FC<VisualPageEditorProps> = ({ pageId, initialStructure, children }) => {
  const { isAdmin } = useAuth();
  
  const homeInitialStructure: PageStructure = {
    sections: [
      { id: 'hero-1', type: 'hero', props: { isVisible: true } },
      { id: 'search-1', type: 'search', props: { isVisible: true } },
      { id: 'stores-1', type: 'stores', props: { title: 'МАГАЗИНЫ-ПАРТНЕРЫ', isVisible: true } },
      { id: 'products-1', type: 'products', props: { title: 'ПОПУЛЯРНЫЕ ТОВАРЫ', limit: 8, filter: 'popular', isVisible: true } },
      { id: 'discount-1', type: 'products', props: { title: 'ЛУЧШИЕ ПРЕДЛОЖЕНИЯ', limit: 8, filter: 'sale', isVisible: true } },
    ]
  };

  const defaultStructure: PageStructure = initialStructure || (pageId === 'home' ? homeInitialStructure : {
    sections: [{ id: 'native-content', type: 'native', props: { isVisible: true, pt: 0, pb: 0 } }]
  });

  const { 
    isEditing, 
    setIsEditing, 
    setActiveSectionId, 
    activeSectionId,
    footerSettings,
    setFooterSettings,
    globalSettings,
    setGlobalSettings
  } = useEditor();
  
  const [structure, setStructure] = useState<PageStructure>(defaultStructure);
  const [originalStructure, setOriginalStructure] = useState<PageStructure>(defaultStructure);
  const [originalFooterSettings, setOriginalFooterSettings] = useState<any>(null);
  const [originalGlobalSettings, setOriginalGlobalSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isWidgetLibraryOpen, setIsWidgetLibraryOpen] = useState(false);
  const [addingAt, setAddingAt] = useState<{ index: number } | null>(null);

  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [pageSnap, footerSnap, globalSnap] = await Promise.all([
          getDoc(doc(db, 'settings', `page_${pageId}`)),
          getDoc(doc(db, 'footer_settings', 'main')),
          getDoc(doc(db, 'global_settings', 'main'))
        ]);

        if (pageSnap.exists()) {
          const data = pageSnap.data() as PageStructure;
          setStructure(data);
          setOriginalStructure(data);
        }

        if (footerSnap.exists()) {
          const fData = footerSnap.data();
          setFooterSettings(fData);
          setOriginalFooterSettings(fData);
        }

        if (globalSnap.exists()) {
          const gData = globalSnap.data();
          setGlobalSettings(gData);
          setOriginalGlobalSettings(gData);
        } else {
          // Default global settings
          const defaultGlobal = {
            logoText: 'ZIGZAG',
            logoSuffix: '.AM',
            logoSubtitle: 'Premium Comparison',
            primaryColor: '#4f46e5',
            secondaryColor: '#0f172a',
            showTopSearch: true
          };
          setGlobalSettings(defaultGlobal);
          setOriginalGlobalSettings(defaultGlobal);
        }
      } catch (error: any) {
        console.error("Failed to fetch data:", error);
        setErrorStatus(error.message);
        // We don't use handleFirestoreError here because it stops the app flow
        // but we might want to for diagnostic if the user asks.
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [pageId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const promises = [
         setDoc(doc(db, 'settings', `page_${pageId}`), {
           ...structure,
           updatedAt: serverTimestamp()
         })
      ];

      if (footerSettings !== originalFooterSettings) {
          promises.push(setDoc(doc(db, 'footer_settings', 'main'), {
              ...footerSettings,
              updatedAt: serverTimestamp()
          }));
      }

      if (globalSettings !== originalGlobalSettings) {
          promises.push(setDoc(doc(db, 'global_settings', 'main'), {
              ...globalSettings,
              updatedAt: serverTimestamp()
          }));
      }

      await Promise.all(promises);
      setOriginalStructure(structure);
      setOriginalFooterSettings(footerSettings);
      setOriginalGlobalSettings(globalSettings);
      setIsEditing(false);
      alert('All changes saved successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'batch_update');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSection = (type: SectionType, initialProps: any = {}) => {
    const newSection: SectionConfig = {
      id: `${type}-${Date.now()}`,
      type,
      props: { isVisible: true, ...initialProps },
      isVisible: true
    };

    const newSections = [...structure.sections];
    const index = addingAt ? addingAt.index : newSections.length;
    newSections.splice(index, 0, newSection);

    setStructure({ ...structure, sections: newSections });
    setIsWidgetLibraryOpen(false);
    setAddingAt(null);
  };

  const handleUpdateSection = (id: string, props: any) => {
    if (id === 'footer-bottom') {
      setFooterSettings(props);
    } else if (id === 'global-settings') {
      setGlobalSettings(props);
    } else {
      setStructure({
        ...structure,
        sections: structure.sections.map(s => s.id === id ? { ...s, props } : s)
      });
    }
  };

  const handleDeleteSection = (id: string) => {
    if (id === 'footer-bottom' || id === 'global-settings') return;
    setStructure({
      ...structure,
      sections: structure.sections.filter(s => s.id !== id)
    });
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newSections = [...structure.sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    const [moved] = newSections.splice(index, 1);
    newSections.splice(targetIndex, 0, moved);
    setStructure({ ...structure, sections: newSections });
  };

  const hasChanges = JSON.stringify(structure) !== JSON.stringify(originalStructure) || 
                     JSON.stringify(footerSettings) !== JSON.stringify(originalFooterSettings) ||
                     JSON.stringify(globalSettings) !== JSON.stringify(originalGlobalSettings);

  const getActiveSection = () => {
    if (activeSectionId === 'footer-bottom') {
      return { id: 'footer-bottom', type: 'footer' as any, props: footerSettings || {} };
    }
    if (activeSectionId === 'global-settings') {
      return { id: 'global-settings', type: 'global' as any, props: globalSettings || {} };
    }
    return structure.sections.find(s => s.id === activeSectionId) || null;
  };

  if (loading) {
      return (
          <div className="flex justify-center items-center py-20">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
      );
  }

  if (errorStatus) {
    return (
      <div className="mx-auto max-w-2xl p-8 my-10 bg-red-50 border border-red-200 rounded-[2rem] text-center">
        <h2 className="text-xl font-black text-red-900 mb-4">Error Loading Data</h2>
        <p className="text-sm font-bold text-red-700/70 mb-6 font-mono break-all">{errorStatus}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-red-600 text-white px-8 py-3 rounded-xl font-black text-xs uppercase"
        >
          Try Refreshing
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {isAdmin && !isEditing && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => setIsEditing(true)}
          className="fixed bottom-10 right-10 z-[1000] flex h-16 items-center gap-3 rounded-[2rem] bg-blue-600 px-8 text-sm font-black text-white shadow-2xl transition-all hover:bg-blue-700 hover:scale-110 active:scale-95"
        >
          <PenTool size={20} />
          EDIT PAGE
        </motion.button>
      )}

      {isEditing && (
        <EditorToolbar 
          onSave={handleSave}
          onCancel={() => {
            setStructure(originalStructure);
            setIsEditing(false);
          }}
          hasChanges={hasChanges}
          saving={saving}
        />
      )}

      <DynamicRenderer 
        sections={structure.sections}
        children={children}
        renderEditable={(id, children) => {
          const index = structure.sections.findIndex(s => s.id === id);
          return (
            <EditableSection
              key={id}
              id={id}
              onEdit={() => setActiveSectionId(id)}
              onDelete={() => handleDeleteSection(id)}
              onMoveUp={() => handleMove(index, 'up')}
              onMoveDown={() => handleMove(index, 'down')}
              onAddAbove={() => { setAddingAt({ index }); setIsWidgetLibraryOpen(true); }}
              onAddBelow={() => { setAddingAt({ index: index + 1 }); setIsWidgetLibraryOpen(true); }}
            >
              {children}
            </EditableSection>
          );
        }}
      />

      <WidgetLibraryModal 
        isOpen={isWidgetLibraryOpen}
        onClose={() => setIsWidgetLibraryOpen(false)}
        onSelect={handleAddSection}
      />

      <SectionSettingsSidebar 
        section={getActiveSection()}
        onClose={() => setActiveSectionId(null)}
        onUpdate={(props) => handleUpdateSection(activeSectionId!, props)}
      />
    </div>
  );
};

export default VisualPageEditor;
