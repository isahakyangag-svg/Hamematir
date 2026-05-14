import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Trash2, 
  Edit,
  Search,
  RefreshCw,
  Tag,
  X,
  Save,
  Package,
  Layers
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

interface Category {
  id: string;
  name: string; // compatibility
  nameRu?: string;
  nameEn?: string;
  nameAm?: string;
  slug?: string;
  icon?: string;
  parentId?: string | null;
  description?: string;
  descRu?: string;
  descEn?: string;
  descAm?: string;
  productCount?: number;
  createdAt: any;
}

const AdminCategories: React.FC = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [activeLangTab, setActiveLangTab] = useState<'ru' | 'en' | 'am'>('ru');
  const [iconType, setIconType] = useState<'emoji' | 'url'>('emoji');

  const [formData, setFormData] = useState({
    nameRu: '',
    nameEn: '',
    nameAm: '',
    descRu: '',
    descEn: '',
    descAm: '',
    slug: '',
    icon: '📦',
    parentId: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const catSnap = await getDocs(collection(db, 'categories'));
      const catList = catSnap.docs.map(doc => {
        const d = doc.data();
        return { 
          id: doc.id, 
          ...d,
          name: d.nameRu || d.name || '' // fallback
        } as Category;
      }).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      // Fetch product counts for each category
      const productsSnap = await getDocs(collection(db, 'products'));
      const counts: Record<string, number> = {};
      productsSnap.docs.forEach(d => {
        const catId = d.data().categoryId;
        if (catId) counts[catId] = (counts[catId] || 0) + 1;
      });

      setCategories(catList.map(cat => ({
        ...cat,
        productCount: counts[cat.id] || 0
      })));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'categories');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const createSlug = (name: string) => {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u0531-\u058F\u0561-\u0587]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'cat-' + Math.random().toString(36).substring(2, 7);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      const slug = formData.slug.trim() || createSlug(formData.nameRu);
      
      const categoryData = {
        nameRu: formData.nameRu.trim(),
        nameEn: formData.nameEn.trim(),
        nameAm: formData.nameAm.trim(),
        descRu: formData.descRu.trim(),
        descEn: formData.descEn.trim(),
        descAm: formData.descAm.trim(),
        name: formData.nameRu.trim(), // keep for compatibility
        description: formData.descRu.trim(), // keep for compatibility
        slug: slug,
        icon: formData.icon,
        parentId: formData.parentId || null,
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, 'categories', editingId), categoryData);
      } else {
        await addDoc(collection(db, 'categories'), {
          ...categoryData,
          createdAt: serverTimestamp()
        });
      }

      resetForm();
      fetchData();
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, 'categories');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEdit = (category: any) => {
    setFormData({
      nameRu: category.nameRu || category.name || '',
      nameEn: category.nameEn || '',
      nameAm: category.nameAm || '',
      descRu: category.descRu || category.description || '',
      descEn: category.descEn || '',
      descAm: category.descAm || '',
      slug: category.slug || '',
      icon: category.icon || '📦',
      parentId: category.parentId || ''
    });
    setIconType(category.icon?.startsWith('http') ? 'url' : 'emoji');
    setEditingId(category.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    const cat = categories.find(c => c.id === id);
    
    // Check for subcategories
    const hasSubcategories = categories.some(c => c.parentId === id);
    if (hasSubcategories) {
      alert(`Невозможно удалить категорию "${cat?.nameRu || cat?.name}", так как она содержит подкатегории. Сначала удалите или переместите подкатегории.`);
      setConfirmDeleteId(null);
      return;
    }

    if (cat && cat.productCount && cat.productCount > 0) {
      alert(`Невозможно удалить категорию "${cat.nameRu || cat.name}", так как она содержит ${cat.productCount} товаров. Пожалуйста, сначала переназначьте или удалите товары.`);
      setConfirmDeleteId(null);
      return;
    }

    setIsActionLoading(true);
    try {
      await deleteDoc(doc(db, 'categories', id));
      setCategories(prev => prev.filter(c => c.id !== id));
      setConfirmDeleteId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `categories/${id}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ 
      nameRu: '', 
      nameEn: '', 
      nameAm: '', 
      descRu: '', 
      descEn: '', 
      descAm: '', 
      slug: '',
      icon: '📦',
      parentId: ''
    });
    setIconType('emoji');
    setEditingId(null);
    setIsAdding(false);
  };

  const mainCategories = categories.filter(c => !c.parentId);
  
  const filteredCategories = categories.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      (c.nameRu || '').toLowerCase().includes(term) ||
      (c.nameEn || '').toLowerCase().includes(term) ||
      (c.nameAm || '').toLowerCase().includes(term) ||
      (c.slug || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between px-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-4xl font-display font-black tracking-tight text-white uppercase leading-none">{t('admin:taxonomy', 'Taxonomy')}</h1>
          <p className="mt-3 text-sm font-medium text-slate-500 uppercase tracking-widest opacity-60">{t('admin:taxonomy_subtitle', 'Manage catalog hierarchy and product classification nodes.')}</p>
        </motion.div>
        
        <button 
          onClick={() => setIsAdding(true)}
          className="flex h-14 items-center gap-3 rounded-[24px] bg-gradient-to-r from-[#C5A059] to-[#F1D28C] px-8 text-[11px] font-black uppercase tracking-widest text-[#050816] shadow-[0_15px_40px_rgba(197,160,89,0.3)] transition-all hover:scale-105 active:scale-95 group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
          {t('admin:create_node', 'Create node')}
        </button>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center px-2">
        <div className="relative flex-1 max-w-md group">
          <div className="absolute inset-0 bg-white/5 rounded-[24px] blur-sm group-focus-within:bg-[#C5A059]/10 transition-all duration-500" />
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#F1D28C] transition-colors" size={20} />
          <input 
            type="text"
            placeholder={t('admin:filter_taxonomy', 'Filter taxonomy...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="relative w-full rounded-[24px] border border-white/5 bg-white/5 pl-14 pr-6 h-14 font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-[#C5A059]/30 focus:bg-white/10 transition-all"
          />
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-500">
            <Layers size={18} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            {t('admin:nodes_synchronized', 'Nodes synchronized')}: <span className="text-white ml-2">{filteredCategories.length}</span>
          </span>
        </div>
      </div>

      {/* Table/List */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-[48px] border border-white/5 bg-[#081120] shadow-[0_30px_100px_rgba(0,0,0,0.5)] relative"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.03)_0,transparent_50%)] pointer-events-none" />

        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left font-display">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{t('admin:classification', 'Classification')}</th>
                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{t('admin:route_map', 'Route Map')}</th>
                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{t('admin:inventory', 'Inventory')}</th>
                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 text-right">{t('admin:execution', 'Execution')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-10 py-24 text-center">
                    <RefreshCw className="mx-auto mb-4 animate-spin text-[#F1D28C]" size={36} />
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-600">{t('admin:accessing_taxonomic_nodes', 'Accessing taxonomic nodes...')}</span>
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-10 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-20 w-20 rounded-[32px] bg-white/5 flex items-center justify-center text-slate-700">
                        <Tag size={40} />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-600">{t('admin:no_nodes_identified', 'No nodes identified in the current sector.')}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat, i) => (
                  <motion.tr 
                    key={cat.id} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group hover:bg-white/5 transition-all duration-300"
                  >
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-6">
                        <div className="relative group/icon">
                          <div className="absolute inset-0 bg-[#C5A059]/0 group-hover/icon:bg-[#C5A059]/20 blur-xl rounded-full transition-all duration-500" />
                          <div className="relative flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#050816] border border-white/5 shadow-2xl overflow-hidden group-hover:scale-110 transition-transform duration-500">
                            {cat.icon?.startsWith('http') ? (
                              <img 
                                referrerPolicy="no-referrer"
                                src={cat.icon} 
                                alt="" 
                                className="h-full w-full object-cover brightness-110" 
                                onError={(e) => {
                                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-2xl opacity-60">📦</span>';
                                }}
                              />
                            ) : (
                              <span className="text-3xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{cat.icon || '📦'}</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                             <p className="text-lg font-display font-black text-white uppercase tracking-tight group-hover:text-amber-500 transition-colors">{cat.name}</p>
                             {cat.parentId && (
                               <div className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[8px] font-black uppercase tracking-widest text-slate-500">
                                 {t('admin:sub_node', 'SUB-NODE')}
                               </div>
                             )}
                          </div>
                          <p className="text-[10px] font-bold text-slate-500 mt-1 line-clamp-1 opacity-60 uppercase tracking-widest">
                            {cat.parentId ? `${t('admin:parent_prefix', 'PARENT')}: ${categories.find(c => c.id === cat.parentId)?.nameRu || 'NULL'} · ` : ''}
                            {cat.description || t('admin:profile_not_initialized', 'PROFILE NOT INITIALIZED')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-2 bg-amber-500/40 rounded-full group-hover:w-4 transition-all" />
                        <span className="rounded-xl border border-white/5 bg-white/5 px-4 py-2 font-mono text-[10px] font-black uppercase tracking-wider text-[#F1D28C]/70 group-hover:bg-[#F1D28C]/10 group-hover:text-[#F1D28C] transition-all">
                          /{cat.slug || createSlug(cat.name)}
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <div className="flex h-12 w-28 items-center justify-between rounded-[20px] bg-white/5 px-4 group-hover:bg-white/10 transition-colors">
                        <Package size={16} className="text-slate-600 group-hover:text-[#C5A059] transition-colors" />
                        <span className="text-lg font-display font-black text-white">{cat.productCount}</span>
                      </div>
                    </td>
                    <td className="px-10 py-7 text-right">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 transition-transform">
                        {confirmDeleteId === cat.id ? (
                          <div className="flex items-center gap-2 rounded-2xl bg-rose-500/10 border border-rose-500/40 p-1">
                            <button 
                              onClick={() => handleDelete(cat.id)}
                              disabled={isActionLoading}
                              className="h-10 px-6 rounded-xl bg-rose-500 text-[10px] font-black text-white hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
                            >
                              {t('admin:purge', 'PURGE')}
                            </button>
                            <button 
                              onClick={() => setConfirmDeleteId(null)}
                              disabled={isActionLoading}
                              className="h-10 w-10 flex items-center justify-center rounded-xl text-white hover:bg-white/10 transition-all"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleEdit(cat)}
                              className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white/5 text-slate-500 hover:bg-[#C5A059]/10 hover:text-[#F1D28C] border border-white/5 transition-all"
                            >
                              <Edit size={18} />
                            </button>
                            <button 
                              onClick={() => setConfirmDeleteId(cat.id)}
                              className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white/5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 border border-white/5 transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetForm}
              className="absolute inset-0 bg-[#050816]/80 backdrop-blur-3xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-[48px] bg-[#0B1220] p-10 shadow-[0_30px_100px_rgba(0,0,0,0.8)] border border-white/5"
            >
              <div className="absolute right-8 top-8">
                <button onClick={resetForm} className="rounded-2xl bg-white/5 p-3 text-slate-500 hover:bg-white/10 hover:text-white transition-all border border-white/10">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex h-20 w-20 items-center justify-center rounded-[32px] bg-gradient-to-br from-[#C5A059] to-[#F1D28C] text-[#050816] mb-8 font-black shadow-[0_0_40px_rgba(197,160,89,0.4)]">
                 <Tag size={36} />
              </div>

              <h2 className="text-3xl font-display font-black tracking-tight text-white uppercase leading-tight">
                {editingId ? t('admin:modify_classification', 'Modify Classification') : t('admin:initialize_classification', 'Initialize Classification')}
              </h2>
              <p className="mt-3 text-sm font-medium text-slate-500">{t('admin:classification_subtitle', 'Configure hierarchical nodes for catalog synchronization.')}</p>

              <form onSubmit={handleSubmit} className="mt-10 space-y-8 text-left">
                {/* Language Tabs */}
                <div className="flex gap-2 rounded-[24px] bg-white/5 p-1.5 border border-white/5 max-w-xs">
                  {(['ru', 'am', 'en'] as const).map(lang => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setActiveLangTab(lang)}
                      className={cn(
                        "flex-1 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                        activeLangTab === lang ? "bg-[#C5A059] text-black shadow-lg" : "text-slate-500 hover:text-slate-300"
                      )}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="col-span-full">
                    <div className="space-y-6">
                      {activeLangTab === 'ru' && (
                        <>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">{t('admin:node_name', 'Node Name')} (RU)</label>
                            <input 
                              required 
                              type="text"
                              value={formData.nameRu} 
                              onChange={e => setFormData({...formData, nameRu: e.target.value})} 
                              placeholder={t('admin:node_name_placeholder_ru', 'Напр. Смартфоны')}
                              className="w-full h-16 rounded-3xl border border-white/5 bg-white/5 px-6 text-sm font-bold text-white transition-all focus:border-[#C5A059]/30 focus:bg-white/10 outline-none shadow-inner"
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">{t('admin:node_intelligence', 'Node Intelligence')} (RU)</label>
                            <textarea 
                              rows={3}
                              value={formData.descRu} 
                              onChange={e => setFormData({...formData, descRu: e.target.value})} 
                              placeholder={t('admin:node_desc_placeholder_ru', 'Краткое описание категории...')}
                              className="w-full rounded-[32px] border border-white/5 bg-white/5 px-6 py-6 text-sm font-bold text-white transition-all focus:border-[#C5A059]/30 focus:bg-white/10 outline-none shadow-inner resize-none appearance-none"
                            />
                          </div>
                        </>
                      )}

                      {activeLangTab === 'en' && (
                        <>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Node Name (EN)</label>
                            <input 
                              type="text"
                              value={formData.nameEn} 
                              onChange={e => setFormData({...formData, nameEn: e.target.value})} 
                              placeholder="e.g. Smartphones"
                              className="w-full h-16 rounded-3xl border border-white/5 bg-white/5 px-6 text-sm font-bold text-white transition-all focus:border-[#C5A059]/30 focus:bg-white/10 outline-none shadow-inner"
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Node Intelligence (EN)</label>
                            <textarea 
                              rows={3}
                              value={formData.descEn} 
                              onChange={e => setFormData({...formData, descEn: e.target.value})} 
                              placeholder="Short category description..."
                              className="w-full rounded-[32px] border border-white/5 bg-white/5 px-6 py-6 text-sm font-bold text-white transition-all focus:border-[#C5A059]/30 focus:bg-white/10 outline-none shadow-inner resize-none appearance-none"
                            />
                          </div>
                        </>
                      )}

                      {activeLangTab === 'am' && (
                        <>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Node Name (AM)</label>
                            <input 
                              type="text"
                              value={formData.nameAm} 
                              onChange={e => setFormData({...formData, nameAm: e.target.value})} 
                              placeholder="Օր. Սմարթֆոններ"
                              className="w-full h-16 rounded-3xl border border-white/5 bg-white/5 px-6 text-sm font-bold text-white transition-all focus:border-[#C5A059]/30 focus:bg-white/10 outline-none shadow-inner"
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Node Intelligence (AM)</label>
                            <textarea 
                              rows={3}
                              value={formData.descAm} 
                              onChange={e => setFormData({...formData, descAm: e.target.value})} 
                              placeholder="Կատեգորիայի համառոտ նկարագրությունը..."
                              className="w-full rounded-[32px] border border-white/5 bg-white/5 px-6 py-6 text-sm font-bold text-white transition-all focus:border-[#C5A059]/30 focus:bg-white/10 outline-none shadow-inner resize-none appearance-none"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="col-span-full space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Parent Node Hierarchy</label>
                    <select 
                      value={formData.parentId}
                      onChange={e => setFormData({...formData, parentId: e.target.value})}
                      className="w-full h-16 rounded-3xl border border-white/5 bg-white/5 px-6 text-sm font-bold text-white outline-none appearance-none cursor-pointer"
                    >
                      <option value="">Master Protocol (Root Category)</option>
                      {mainCategories
                        .filter(c => c.id !== editingId)
                        .map(c => (
                        <option key={c.id} value={c.id} className="bg-[#0B1220]">{c.nameRu || c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-full space-y-6">
                    <div className="flex items-center justify-between px-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">Visual Node Identity</label>
                      <div className="flex gap-2 bg-white/5 p-1 rounded-2xl border border-white/5">
                        <button 
                          type="button"
                          onClick={() => setIconType('emoji')}
                          className={cn("px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all", iconType === 'emoji' ? "bg-[#C5A059] text-black shadow-lg" : "text-slate-500")}
                        >
                          Emoji
                        </button>
                        <button 
                          type="button"
                          onClick={() => setIconType('url')}
                          className={cn("px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all", iconType === 'url' ? "bg-[#C5A059] text-black shadow-lg" : "text-slate-500")}
                        >
                          Asset URL
                        </button>
                      </div>
                    </div>
                    
                    {iconType === 'emoji' ? (
                      <div className="flex gap-6 items-center">
                        <input 
                          type="text"
                          value={formData.icon} 
                          onChange={e => setFormData({...formData, icon: e.target.value})} 
                          className="w-24 h-24 text-center rounded-[32px] border border-white/5 bg-white/5 text-4xl transition-all focus:border-[#C5A059]/30 focus:bg-white/10 outline-none shadow-inner"
                        />
                        <div className="flex flex-wrap gap-3 items-center flex-1">
                          {['📱', '💻', '🎧', '🎮', '⌚', '📷', '📺', '🏠', '⚡', '🛸'].map(emoji => (
                            <button 
                              key={emoji}
                              type="button"
                              onClick={() => setFormData({...formData, icon: emoji})}
                              className={cn(
                                "h-12 w-12 flex items-center justify-center rounded-2xl text-xl transition-all hover:scale-110 active:scale-95 border border-white/5 shadow-2xl",
                                formData.icon === emoji ? "bg-[#C5A059] text-black border-[#F1D28C] glow-gold" : "bg-white/5 hover:bg-white/10 text-white"
                              )}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <input 
                        type="url"
                        value={formData.icon} 
                        onChange={e => setFormData({...formData, icon: e.target.value})} 
                        placeholder="https://example.com/icon.png"
                        className="w-full h-16 rounded-3xl border border-white/5 bg-white/5 px-6 text-sm font-bold text-white transition-all focus:border-[#C5A059]/30 focus:bg-white/10 outline-none shadow-inner"
                      />
                    )}
                  </div>

                  <div className="col-span-full space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Node Vector (Slug)</label>
                    <input 
                      type="text"
                      value={formData.slug} 
                      onChange={e => setFormData({...formData, slug: e.target.value})} 
                      placeholder="smartphones"
                      className="w-full h-16 rounded-3xl border border-white/5 bg-white/5 px-6 text-sm font-bold text-white transition-all focus:border-[#C5A059]/30 focus:bg-white/10 outline-none shadow-inner"
                    />
                    <p className="px-2 text-[9px] font-black text-slate-700 uppercase tracking-widest leading-relaxed">
                      Auto-generation will attempt translation if left uninitialized.
                    </p>
                  </div>
                </div>

                <div className="flex gap-5 pt-4">
                  <button 
                    type="button"
                    onClick={resetForm}
                    className="flex-1 h-16 rounded-[28px] bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/10 transition-all active:scale-95"
                  >
                    Abort
                  </button>
                  <button 
                    type="submit"
                    disabled={isActionLoading}
                    className="flex-[2] h-16 rounded-[28px] bg-white text-[11px] font-black uppercase tracking-widest text-black shadow-2xl hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isActionLoading ? <RefreshCw className="mx-auto animate-spin" size={20} /> : editingId ? 'Update Matrix' : 'Initialize Matrix'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCategories;
