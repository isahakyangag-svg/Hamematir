
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Settings, Layout, Palette, Box, Type, Save, Image as ImageIcon } from 'lucide-react';
import { SectionConfig } from '../../types/editor';
import { cn } from '../../lib/utils';

interface SectionSettingsSidebarProps {
  section: SectionConfig | null;
  onClose: () => void;
  onUpdate: (updatedProps: any) => void;
}

const SectionSettingsSidebar: React.FC<SectionSettingsSidebarProps> = ({ section, onClose, onUpdate }) => {
  if (!section) return null;

  const [activeLang, setActiveLang] = React.useState<'Ru' | 'En' | 'Am'>('Ru');

  const getProp = (baseName: string) => {
    const langKey = activeLang;
    const localizedField = `${baseName}${langKey}`;
    return section.props[localizedField] || section.props[baseName] || '';
  };

  const setProp = (baseName: string, value: string) => {
    const langKey = activeLang;
    const localizedField = `${baseName}${langKey}`;
    onUpdate({ ...section.props, [localizedField]: value, [baseName]: value }); // update both for now
  };

  const renderSectionSpecificSettings = () => {
    if (section.id === 'global-settings') {
      return (
        <div className="space-y-6">
           <div className="flex items-center gap-1 self-center rounded-xl bg-gray-100 p-1 mb-4">
            {['Ru', 'En', 'Am'].map((l) => (
              <button
                key={l}
                onClick={() => setActiveLang(l as any)}
                className={cn(
                  "flex-1 px-3 py-1.5 text-[10px] font-black uppercase transition-all rounded-lg",
                  activeLang === l ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"
                )}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="space-y-4 rounded-[2rem] bg-gray-50/50 p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Type size={14} className="text-blue-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Logo Identity</span>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Main Logo Text</label>
              <input 
                type="text" 
                value={section.props.logoText || ''}
                onChange={e => onUpdate({ ...section.props, logoText: e.target.value })}
                className="w-full rounded-xl bg-white px-4 py-3 text-sm font-black shadow-sm border border-gray-100 uppercase"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Logo Suffix (e.g. .AM)</label>
              <input 
                type="text" 
                value={section.props.logoSuffix || ''}
                onChange={e => onUpdate({ ...section.props, logoSuffix: e.target.value })}
                className="w-full rounded-xl bg-white px-4 py-3 text-sm font-black shadow-sm border border-gray-100 uppercase"
              />
            </div>
            <div className="space-y-4 pt-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Logo Icon Type</label>
              <div className="flex gap-2">
                {['emoji', 'image'].map((t) => (
                  <button
                    key={t}
                    onClick={() => onUpdate({ ...section.props, logoType: t })}
                    className={cn(
                      "flex-1 px-3 py-2 text-[10px] font-black uppercase transition-all rounded-xl border",
                      section.props.logoType === t ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {section.props.logoType === 'image' ? (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Logo Image URL</label>
                <input 
                  type="text" 
                  value={section.props.logoImageUrl || ''}
                  placeholder="https://..."
                  onChange={e => onUpdate({ ...section.props, logoImageUrl: e.target.value })}
                  className="w-full rounded-xl bg-white px-4 py-3 text-sm font-bold shadow-sm border border-gray-100"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Logo Emoji</label>
                <input 
                  type="text" 
                  value={section.props.logoEmoji || '🛍️'}
                  placeholder="👜, 🛒, 🛍️..."
                  onChange={e => onUpdate({ ...section.props, logoEmoji: e.target.value })}
                  className="w-full rounded-xl bg-white px-4 py-3 text-sm font-bold shadow-sm border border-gray-100"
                />
              </div>
            )}
          </div>

          <div className="space-y-4 rounded-[2rem] bg-gray-50/50 p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Layout size={14} className="text-blue-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Header Controls</span>
            </div>
            <div className="flex items-center justify-between p-2">
              <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Show Search Bar</span>
              <button 
                onClick={() => onUpdate({ ...section.props, showTopSearch: !section.props.showTopSearch })}
                className={cn(
                  "w-12 h-6 rounded-full transition-colors relative",
                  section.props.showTopSearch !== false ? "bg-blue-600" : "bg-gray-300"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                  section.props.showTopSearch !== false ? "left-7" : "left-1"
                )} />
              </button>
            </div>
            <div className="flex items-center justify-between p-2 border-t border-gray-100 pt-3">
              <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Show Lang & Currency</span>
              <button 
                onClick={() => onUpdate({ ...section.props, showHeaderControls: !section.props.showHeaderControls })}
                className={cn(
                  "w-12 h-6 rounded-full transition-colors relative",
                  section.props.showHeaderControls !== false ? "bg-blue-600" : "bg-gray-300"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                  section.props.showHeaderControls !== false ? "left-7" : "left-1"
                )} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Controls BG</label>
                  <input 
                    type="color" 
                    value={section.props.headerBgColor || '#f1f5f9'}
                    onChange={e => onUpdate({ ...section.props, headerBgColor: e.target.value })}
                    className="h-10 w-full cursor-pointer rounded-xl border-none p-1 bg-white shadow-sm"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Controls TEXT</label>
                  <input 
                    type="color" 
                    value={section.props.headerTextColor || '#334155'}
                    onChange={e => onUpdate({ ...section.props, headerTextColor: e.target.value })}
                    className="h-10 w-full cursor-pointer rounded-xl border-none p-1 bg-white shadow-sm"
                  />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Text Size (PX)</label>
                  <input 
                    type="number" 
                    value={section.props.headerTextSize || 11}
                    onChange={e => onUpdate({ ...section.props, headerTextSize: parseInt(e.target.value) })}
                    className="w-full rounded-xl bg-white px-4 py-2 text-xs font-black shadow-sm border border-gray-100"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Header Icon</label>
                  <input 
                    type="text" 
                    value={section.props.headerIcon || ''}
                    placeholder="🌐, 🌍..."
                    onChange={e => onUpdate({ ...section.props, headerIcon: e.target.value })}
                    className="w-full rounded-xl bg-white px-4 py-2 text-xs font-black shadow-sm border border-gray-100"
                  />
               </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100">
               <div className="flex items-center gap-2 mb-2">
                  <Palette size={14} className="text-blue-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Dropdown Menu Styles</span>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Menu BG</label>
                     <input 
                       type="color" 
                       value={section.props.dropdownBgColor || '#ffffff'}
                       onChange={e => onUpdate({ ...section.props, dropdownBgColor: e.target.value })}
                       className="h-10 w-full cursor-pointer rounded-xl border-none p-1 bg-white shadow-sm"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Item Text</label>
                     <input 
                       type="color" 
                       value={section.props.dropdownTextColor || '#475569'}
                       onChange={e => onUpdate({ ...section.props, dropdownTextColor: e.target.value })}
                       className="h-10 w-full cursor-pointer rounded-xl border-none p-1 bg-white shadow-sm"
                     />
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Item Hover BG</label>
                  <input 
                    type="color" 
                    value={section.props.dropdownHoverColor || '#f8fafc'}
                    onChange={e => onUpdate({ ...section.props, dropdownHoverColor: e.target.value })}
                    className="h-10 w-full cursor-pointer rounded-xl border-none p-1 bg-white shadow-sm"
                  />
               </div>
            </div>
          </div>

          <div className="space-y-4 rounded-[2rem] bg-gray-50/50 p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Palette size={14} className="text-blue-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Color Palette</span>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Primary Color (Accent)</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={section.props.primaryColor || '#4f46e5'}
                  onChange={e => onUpdate({ ...section.props, primaryColor: e.target.value })}
                  className="h-10 w-20 cursor-pointer rounded-xl border-none p-1 bg-white shadow-sm"
                />
                <input 
                  type="text"
                  value={section.props.primaryColor || '#4f46e5'}
                  onChange={e => onUpdate({ ...section.props, primaryColor: e.target.value })}
                  className="flex-1 rounded-xl bg-white px-4 py-2 text-xs font-mono shadow-sm border border-gray-100"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Secondary Color (Logo Background)</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={section.props.secondaryColor || '#0f172a'}
                  onChange={e => onUpdate({ ...section.props, secondaryColor: e.target.value })}
                  className="h-10 w-20 cursor-pointer rounded-xl border-none p-1 bg-white shadow-sm"
                />
                <input 
                  type="text"
                  value={section.props.secondaryColor || '#0f172a'}
                  onChange={e => onUpdate({ ...section.props, secondaryColor: e.target.value })}
                  className="flex-1 rounded-xl bg-white px-4 py-2 text-xs font-mono shadow-sm border border-gray-100"
                />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (section.id === 'footer-bottom') {
      return (
        <div className="space-y-6">
           <div className="flex items-center gap-1 self-center rounded-xl bg-gray-100 p-1 mb-4">
            {['Ru', 'En', 'Am'].map((l) => (
              <button
                key={l}
                onClick={() => setActiveLang(l as any)}
                className={cn(
                  "flex-1 px-3 py-1.5 text-[10px] font-black uppercase transition-all rounded-lg",
                  activeLang === l ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"
                )}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Footer Logo URL</label>
            <input 
              type="text" 
              value={section.props.logoUrl || ''}
              onChange={e => onUpdate({ ...section.props, logoUrl: e.target.value })}
              className="w-full rounded-xl bg-white px-4 py-3 text-sm font-bold shadow-sm border border-gray-100"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Footer Description</label>
            <textarea 
              value={getProp('description')}
              onChange={e => setProp('description', e.target.value)}
              className="w-full rounded-xl bg-white px-4 py-3 text-sm font-bold shadow-sm border border-gray-100 min-h-[80px]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Copyright Text</label>
            <input 
              type="text" 
              value={getProp('copyrightText')}
              onChange={e => setProp('copyrightText', e.target.value)}
              className="w-full rounded-xl bg-white px-4 py-3 text-sm font-bold shadow-sm border border-gray-100"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Privacy Label</label>
            <input 
              type="text" 
              value={getProp('privacyLabel')}
              onChange={e => setProp('privacyLabel', e.target.value)}
              className="w-full rounded-xl bg-white px-4 py-3 text-sm font-bold shadow-sm border border-gray-100"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Terms Label</label>
            <input 
              type="text" 
              value={getProp('termsLabel')}
              onChange={e => setProp('termsLabel', e.target.value)}
              className="w-full rounded-xl bg-white px-4 py-3 text-sm font-bold shadow-sm border border-gray-100"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Accent Color</label>
            <input 
              type="color" 
              value={section.props.accentColor || '#155dfc'}
              onChange={e => onUpdate({ ...section.props, accentColor: e.target.value })}
              className="h-10 w-full cursor-pointer rounded-xl border-none p-1 bg-white shadow-sm"
            />
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-1 self-center rounded-xl bg-gray-100 p-1">
          {['Ru', 'En', 'Am'].map((l) => (
            <button
              key={l}
              onClick={() => setActiveLang(l as any)}
              className={cn(
                "flex-1 px-3 py-1.5 text-[10px] font-black uppercase transition-all rounded-lg",
                activeLang === l ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"
              )}
            >
              {l}
            </button>
          ))}
        </div>

        {section.type === 'hero' && (
          <div className="space-y-4 rounded-[2rem] bg-gray-50/50 p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Layout size={14} className="text-blue-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Banner Style</span>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Layout Variant</label>
              <select 
                value={section.props.variant || 'full'}
                onChange={e => onUpdate({ ...section.props, variant: e.target.value })}
                className="w-full rounded-xl bg-white px-4 py-3 text-sm font-black shadow-sm border border-gray-100"
              >
                <option value="full">Full Height (90vh)</option>
                <option value="medium">Medium Height (60vh)</option>
                <option value="compact">Compact (30vh)</option>
                <option value="wide_long">Wide Long (970x250)</option>
                <option value="wide_short">Wide Short (728x90)</option>
                <option value="skyscraper">Skyscraper (300x600)</option>
                <option value="rectangle">Rectangle (300x250)</option>
              </select>
            </div>

            <div className="space-y-2 pt-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Custom Height (px)</label>
                <div className="flex gap-4 items-center">
                    <input 
                        type="range" 
                        min="50" 
                        max="1000"
                        step="10"
                        value={section.props.height || 500}
                        onChange={e => onUpdate({ ...section.props, height: parseInt(e.target.value) })}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <span className="text-xs font-black text-blue-600 w-12 text-right">{section.props.height || 'Auto'}</span>
                </div>
            </div>

            <button 
              onClick={() => onUpdate({ ...section.props, height: undefined })}
              className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
            >
              Reset to Default Height
            </button>

            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between p-4 rounded-3xl bg-white border border-gray-100 shadow-sm">
                  <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Hide All Overlay Content</span>
                  <input 
                      type="checkbox" 
                      className="h-6 w-6 rounded-lg text-blue-600 focus:ring-blue-500 cursor-pointer"
                      checked={section.props.hideAllContent === true}
                      onChange={e => onUpdate({ ...section.props, hideAllContent: e.target.checked })}
                  />
              </div>

              <div className="flex items-center justify-between p-4 rounded-3xl bg-white border border-gray-100 shadow-sm">
                  <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Hide Gradient Overlays</span>
                  <input 
                      type="checkbox" 
                      className="h-6 w-6 rounded-lg text-blue-600 focus:ring-blue-500 cursor-pointer"
                      checked={section.props.hideOverlays === true}
                      onChange={e => onUpdate({ ...section.props, hideOverlays: e.target.checked })}
                  />
              </div>

              <div className="flex items-center justify-between p-4 rounded-3xl bg-white border border-gray-100 shadow-sm">
                  <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Hide Slider Dots</span>
                  <input 
                      type="checkbox" 
                      className="h-6 w-6 rounded-lg text-blue-600 focus:ring-blue-500 cursor-pointer"
                      checked={section.props.hideControls === true}
                      onChange={e => onUpdate({ ...section.props, hideControls: e.target.checked })}
                  />
              </div>

              <div className="flex items-center justify-between p-4 rounded-3xl bg-white border border-gray-100 shadow-sm">
                  <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Hide Buttons</span>
                  <input 
                      type="checkbox" 
                      className="h-6 w-6 rounded-lg text-blue-600 focus:ring-blue-500 cursor-pointer"
                      checked={section.props.hideButtons === true}
                      onChange={e => onUpdate({ ...section.props, hideButtons: e.target.checked })}
                  />
              </div>

              <div className="flex items-center justify-between p-4 rounded-3xl bg-white border border-gray-100 shadow-sm">
                  <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Hide Title/Text</span>
                  <input 
                      type="checkbox" 
                      className="h-6 w-6 rounded-lg text-blue-600 focus:ring-blue-500 cursor-pointer"
                      checked={section.props.hideContent === true}
                      onChange={e => onUpdate({ ...section.props, hideContent: e.target.checked })}
                  />
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-gray-100 mt-6">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <ImageIcon size={14} className="text-blue-600" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Slider Images</span>
                  </div>
                  <button 
                     onClick={() => {
                        const current = section.props.bgImages || [section.props.bgImage || ''];
                        onUpdate({ ...section.props, bgImages: [...current, ''] });
                     }}
                     className="text-[10px] font-black text-blue-600 uppercase tracking-widest"
                  >
                     + Add Image
                  </button>
               </div>
               
               <div className="space-y-3">
                  {(section.props.bgImages || [section.props.bgImage || '']).map((img: string, idx: number) => (
                     <div key={idx} className="flex gap-2">
                        <input 
                           type="text" 
                           value={img}
                           placeholder="Image URL"
                           onChange={e => {
                              const newImages = [...(section.props.bgImages || [section.props.bgImage || ''])];
                              newImages[idx] = e.target.value;
                              onUpdate({ ...section.props, bgImages: newImages, bgImage: newImages[0] });
                           }}
                           className="flex-1 rounded-xl bg-white px-4 py-3 text-[10px] font-bold border border-gray-100"
                        />
                        <button 
                           onClick={() => {
                              const newImages = (section.props.bgImages || [section.props.bgImage || '']).filter((_: any, i: number) => i !== idx);
                              onUpdate({ ...section.props, bgImages: newImages, bgImage: newImages[0] });
                           }}
                           className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                        >
                           <X size={14} />
                        </button>
                     </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {section.type !== 'divider' && (
          <div className="space-y-4 rounded-[2rem] bg-gray-50/50 p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Type size={14} className="text-blue-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Content Settings</span>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Title Text</label>
              <input 
                type="text" 
                value={getProp('title')}
                onChange={e => setProp('title', e.target.value)}
                className="w-full rounded-xl bg-white px-4 py-3 text-sm font-bold shadow-sm border border-gray-100"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Title Emoji Icon (Optional)</label>
              <input 
                type="text" 
                value={getProp('titleEmoji')}
                onChange={e => setProp('titleEmoji', e.target.value)}
                placeholder="🚀, ⚡, 💎..."
                className="w-full rounded-xl bg-white px-4 py-3 text-sm font-bold shadow-sm border border-gray-100"
              />
            </div>

            {(section.type === 'contacts' || section.type === 'text') && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Subtitle/Text</label>
                <textarea 
                  value={getProp('subtitle')}
                  onChange={e => setProp('subtitle', e.target.value)}
                  className="w-full rounded-xl bg-white px-4 py-3 text-sm font-bold shadow-sm border border-gray-100 min-h-[80px]"
                />
              </div>
            )}

            {section.type === 'video' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Video Embed URL</label>
                <input 
                  type="text" 
                  value={section.props.videoUrl || ''}
                  onChange={e => onUpdate({ ...section.props, videoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/embed/..."
                  className="w-full rounded-xl bg-white px-4 py-3 text-sm font-bold shadow-sm border border-gray-100"
                />
              </div>
            )}

            {section.type === 'contacts' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Address</label>
                  <input 
                    type="text" 
                    value={section.props.address || ''}
                    onChange={e => onUpdate({ ...section.props, address: e.target.value })}
                    className="w-full rounded-xl bg-white px-4 py-3 text-sm font-bold shadow-sm border border-gray-100"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email</label>
                  <input 
                    type="text" 
                    value={section.props.email || ''}
                    onChange={e => onUpdate({ ...section.props, email: e.target.value })}
                    className="w-full rounded-xl bg-white px-4 py-3 text-sm font-bold shadow-sm border border-gray-100"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4 rounded-[2rem] bg-gray-50/50 p-6 border border-gray-100">
           <div className="flex items-center gap-2 mb-2">
              <Layout size={14} className="text-blue-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Visual Appearance</span>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Title Color</label>
                 <div className="flex items-center gap-2">
                   <input 
                     type="color" 
                     value={getProp('titleColor') || '#000000'}
                     onChange={e => setProp('titleColor', e.target.value)}
                     className="h-10 w-full cursor-pointer rounded-xl border-none p-1 bg-white shadow-sm transition-all hover:scale-105"
                   />
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Text Size</label>
                 <div className="flex h-10 items-center justify-center rounded-xl bg-white border border-gray-100 shadow-sm px-4">
                    <input 
                     type="number" 
                     value={section.props.titleSize || 36}
                     onChange={e => onUpdate({ ...section.props, titleSize: parseInt(e.target.value) })}
                     className="w-full bg-transparent text-xs font-black outline-none text-center"
                   />
                   <span className="text-[10px] font-bold text-gray-400 ml-1">PX</span>
                 </div>
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Background Color</label>
              <div className="flex gap-2">
                 <input 
                   type="color" 
                   value={section.props.bgColor || '#ffffff00'}
                   onChange={e => onUpdate({ ...section.props, bgColor: e.target.value })}
                   className="h-10 w-20 cursor-pointer rounded-xl border-none p-1 bg-white shadow-sm"
                 />
                 <input 
                   type="text"
                   value={section.props.bgColor || ''}
                   placeholder="#FFFFFF"
                   onChange={e => onUpdate({ ...section.props, bgColor: e.target.value })}
                   className="flex-1 rounded-xl bg-white px-4 py-2 text-xs font-mono shadow-sm border border-gray-100 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                 />
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Image Asset URL</label>
              <div className="relative group">
                 <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                     <ImageIcon size={14} />
                 </div>
                 <input 
                   type="text" 
                   value={section.props.bgImage || ''}
                   onChange={e => onUpdate({ ...section.props, bgImage: e.target.value })}
                   placeholder="https://images.unsplash.com/..."
                   className="w-full rounded-xl bg-white pl-10 pr-4 py-3 text-xs font-bold shadow-sm border border-gray-100 outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                 />
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4 pt-2">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Padding Top</label>
                  <div className="flex h-10 items-center justify-between rounded-xl bg-white border border-gray-100 shadow-sm px-4">
                     <button onClick={() => onUpdate({ ...section.props, pt: Math.max(0, (section.props.pt || 48) - 8) })} className="text-gray-400 hover:text-blue-600 transition-colors">-</button>
                     <span className="text-[10px] font-black">{section.props.pt || 48}</span>
                     <button onClick={() => onUpdate({ ...section.props, pt: (section.props.pt || 48) + 8 })} className="text-gray-400 hover:text-blue-600 transition-colors">+</button>
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Padding Bottom</label>
                  <div className="flex h-10 items-center justify-between rounded-xl bg-white border border-gray-100 shadow-sm px-4">
                     <button onClick={() => onUpdate({ ...section.props, pb: Math.max(0, (section.props.pb || 48) - 8) })} className="text-gray-400 hover:text-blue-600 transition-colors">-</button>
                     <span className="text-[10px] font-black">{section.props.pb || 48}</span>
                     <button onClick={() => onUpdate({ ...section.props, pb: (section.props.pb || 48) + 8 })} className="text-gray-400 hover:text-blue-600 transition-colors">+</button>
                  </div>
               </div>
           </div>
        </div>

        {section.type === 'products' && (
          <div className="space-y-4 rounded-[2rem] bg-gray-50/50 p-6 border border-gray-100">
             <div className="flex items-center gap-2 mb-2">
              <Box size={14} className="text-blue-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Products Config</span>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Items to Show</label>
              <select 
                value={section.props.limit || 4}
                onChange={e => onUpdate({ ...section.props, limit: parseInt(e.target.value) })}
                className="w-full rounded-xl bg-white px-4 py-3 text-sm font-black shadow-sm border border-gray-100"
              >
                {[4, 8, 12, 16, 20].map(n => <option key={n} value={n}>{n} Products</option>)}
              </select>
            </div>
          </div>
        )}

        {section.type === 'divider' && (
           <div className="space-y-4 rounded-[2rem] bg-gray-50/50 p-6 border border-gray-100">
              <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Height (px)</label>
                  <input 
                      type="range" 
                      min="0" 
                      max="400"
                      step="10"
                      value={section.props.height || 60}
                      onChange={e => onUpdate({ ...section.props, height: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="text-right text-xs font-black text-blue-600">{section.props.height || 60}px</div>
              </div>
           </div>
        )}
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed bottom-0 right-0 top-0 z-[1050] w-full max-w-md bg-white shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.1)] backdrop-blur-xl border-l border-gray-100"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-gray-100 p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/20">
                <Settings size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Section Settings</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{section.type} • {section.id}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="group flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-900 shadow-sm active:scale-95"
            >
              <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
             <div className="space-y-8">
                <div className="flex items-center gap-3">
                    <Palette size={18} className="text-blue-600" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">Customization</h3>
                </div>
                {renderSectionSpecificSettings()}
             </div>

             <div className="space-y-8 border-t border-gray-100 pt-10">
                <div className="flex items-center gap-3">
                    <Layout size={18} className="text-blue-600" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">Visibility & Layout</h3>
                </div>
                <div className="flex items-center justify-between p-4 rounded-3xl bg-gray-50/50 border border-gray-100">
                    <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Section Visible</span>
                    <input 
                        type="checkbox" 
                        className="h-6 w-6 rounded-lg text-blue-600 focus:ring-blue-500 cursor-pointer"
                        checked={section.isVisible !== false}
                        onChange={e => onUpdate({ ...section.props, isVisible: e.target.checked })}
                    />
                </div>
             </div>
          </div>

          <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-4">
             <button 
                onClick={onClose}
                className="flex-1 h-16 rounded-3xl bg-white text-sm font-black text-gray-400 shadow-sm hover:text-gray-900 transition-all border border-gray-200"
             >
                 CLOSED
             </button>
             <button 
                onClick={onClose}
                className="flex-1 h-16 rounded-3xl bg-blue-600 text-sm font-black text-white shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2"
             >
                 <Save size={20} />
                 APPLY
             </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SectionSettingsSidebar;
