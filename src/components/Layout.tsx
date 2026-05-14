import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { EditorProvider } from './VisualEditor/EditorContext';
import VisualPageEditor from './VisualEditor/VisualPageEditor';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { useEditor } from './VisualEditor/EditorContext';
import { cn } from '../lib/utils';

const EditorResetter: React.FC = () => {
  const location = useLocation();
  const { setIsEditing, setActiveSectionId, setHoveredSectionId } = useEditor();

  React.useEffect(() => {
    setIsEditing(false);
    setActiveSectionId(null);
    setHoveredSectionId(null);
  }, [location.pathname, setIsEditing, setActiveSectionId, setHoveredSectionId]);

  return null;
};

const Layout: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  
  const pageId = isHomePage 
    ? 'home' 
    : location.pathname.split('/').filter(Boolean).join('_');

  return (
    <EditorProvider>
      <EditorResetter />
      <div className="min-h-screen bg-[#070B14] font-sans text-white selection:bg-amber-500/30 selection:text-amber-200 overflow-x-hidden">
        {/* Subtle Background Elements - Luxury Glows */}
        <div className="fixed inset-0 pointer-events-none -z-10">
          <div className="absolute top-[10%] -right-20 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px] opacity-20" />
          <div className="absolute top-[40%] -left-40 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px] opacity-10" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-600/5 rounded-full blur-[120px] opacity-15" />
        </div>

        <Header />
        
        <main className={cn(
          "relative transition-all duration-500 min-h-[calc(100vh-400px)]",
          isHomePage ? "pt-0" : "mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-10 pb-24 pt-10"
        )}>
           <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.01 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              key={location.pathname}
            >
              <VisualPageEditor pageId={pageId}>
                <Outlet />
              </VisualPageEditor>
            </motion.div>
           </AnimatePresence>
        </main>

        <Footer />
      </div>
    </EditorProvider>
  );
};

export default Layout;
