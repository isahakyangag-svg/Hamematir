import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Trash2, 
  Edit,
  Search,
  RefreshCw,
  Award,
  X,
  Package,
  Star,
  Globe
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
  orderBy
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

interface Brand {
  id: string;
  name: string;
  slug?: string;
  logo?: string;
  description?: string;
  descRu?: string;
  descEn?: string;
  descAm?: string;
  featured?: boolean;
  isActive?: boolean;
  productCount?: number;
  createdAt: any;
}

const AdminBrands: React.FC = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [activeLangTab, setActiveLangTab] = useState<'ru' | 'en' | 'am'>('ru');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    logo: '',
    descRu: '',
    descEn: '',
    descAm: '',
    featured: false,
    isActive: true
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const brandSnap = await getDocs(collection(db, 'brands'));
      const brandList = brandSnap.docs.map(doc => {
        const d = doc.data();
        return { 
          id: doc.id, 
          ...d 
        } as Brand;
      }).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      // Fetch product counts for each brand
      const productsSnap = await getDocs(collection(db, 'products'));
      const counts: Record<string, number> = {};
      productsSnap.docs.forEach(d => {
        const bId = d.data().brandId;
        if (bId) counts[bId] = (counts[bId] || 0) + 1;
      });

      setBrands(brandList.map(b => ({
        ...b,
        productCount: counts[b.id] || 0
      })));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'brands');
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
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'brand-' + Math.random().toString(36).substring(2, 7);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      const slug = formData.slug.trim() || createSlug(formData.name);
      
      const brandData = {
        name: formData.name.trim(),
        slug: slug,
        logo: formData.logo.trim(),
        descRu: formData.descRu.trim(),
        descEn: formData.descEn.trim(),
        descAm: formData.descAm.trim(),
        description: formData.descRu.trim(),
        featured: formData.featured,
        isActive: formData.isActive,
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, 'brands', editingId), brandData);
      } else {
        await addDoc(collection(db, 'brands'), {
          ...brandData,
          createdAt: serverTimestamp()
        });
      }

      resetForm();
      fetchData();
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, 'brands');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEdit = (brand: Brand) => {
    setFormData({
      name: brand.name,
      slug: brand.slug || '',
      logo: brand.logo || '',
      descRu: brand.descRu || brand.description || '',
      descEn: brand.descEn || '',
      descAm: brand.descAm || '',
      featured: brand.featured || false,
      isActive: brand.isActive !== false
    });
    setEditingId(brand.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    const brand = brands.find(b => b.id === id);
    if (brand && brand.productCount && brand.productCount > 0) {
      alert(`Невозможно удалить бренд "${brand.name}", так как он привязан к ${brand.productCount} товарам.`);
      setConfirmDeleteId(null);
      return;
    }

    setIsActionLoading(true);
    try {
      await deleteDoc(doc(db, 'brands', id));
      setBrands(prev => prev.filter(b => b.id !== id));
      setConfirmDeleteId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `brands/${id}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: '', 
      slug: '', 
      logo: '', 
      descRu: '', 
      descEn: '', 
      descAm: '',
      featured: false,
      isActive: true
    });
    setEditingId(null);
    setIsAdding(false);
  };

  const filteredBrands = brands.filter(b => {
    const term = searchTerm.toLowerCase();
    return (
      (b.name || '').toLowerCase().includes(term) ||
      (b.slug || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between px-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-4xl font-display font-black tracking-tight text-white uppercase leading-none">{t('admin:manufacturers', 'Manufacturers')}</h1>
          <p className="mt-3 text-sm font-medium text-slate-500 uppercase tracking-widest opacity-60">{t('admin:manufacturers_subtitle', 'Curate brand identities and product association matrix.')}</p>
        </motion.div>
        
        <button 
          onClick={() => setIsAdding(true)}
          className="flex h-14 items-center gap-3 rounded-[24px] bg-gradient-to-r from-[#C5A059] to-[#F1D28C] px-8 text-[11px] font-black uppercase tracking-widest text-[#050816] shadow-[0_15px_40px_rgba(197,160,89,0.3)] transition-all hover:scale-105 active:scale-95 group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
          {t('admin:add_manufacturer', 'Add Manufacturer')}
        </button>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center px-2">
        <div className="relative flex-1 max-w-md group">
          <div className="absolute inset-0 bg-white/5 rounded-[24px] blur-sm group-focus-within:bg-[#C5A059]/10 transition-all duration-500" />
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#F1D28C] transition-colors" size={20} />
          <input 
            type="text"
            placeholder={t('admin:search_brands_placeholder', 'Search brands...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="relative w-full rounded-[24px] border border-white/5 bg-white/5 pl-14 pr-6 h-14 font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-[#C5A059]/30 focus:bg-white/10 transition-all"
          />
        </div>
        <div className="ml-auto">
          <div className="px-6 h-14 flex items-center rounded-[24px] border border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500">
            {t('admin:node_count', 'Node Count')}: <span className="text-white ml-2">{filteredBrands.length}</span>
          </div>
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
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{t('admin:identity', 'Identity')}</th>
                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{t('admin:status', 'Status')}</th>
                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{t('admin:inventory', 'Inventory')}</th>
                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 text-right">{t('admin:execution', 'Execution')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-10 py-24 text-center">
                    <RefreshCw className="mx-auto mb-4 animate-spin text-[#F1D28C]" size={36} />
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-600">{t('admin:accessing_manufacturer_nodes', 'Accessing manufacturer nodes...')}</span>
                  </td>
                </tr>
              ) : filteredBrands.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-10 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-20 w-20 rounded-[32px] bg-white/5 flex items-center justify-center text-slate-700">
                        <Package size={40} />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-600">{t('admin:no_identities_located', 'No identities located in synchronized data.')}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBrands.map((brand, i) => (
                  <motion.tr 
                    key={brand.id} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group hover:bg-white/5 transition-all duration-300"
                  >
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-6">
                        <div className="relative group/logo">
                          <div className="absolute inset-0 bg-[#C5A059]/0 group-hover/logo:bg-[#C5A059]/20 blur-xl rounded-full transition-all duration-500" />
                          <div className="relative flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#050816] border border-white/5 shadow-2xl overflow-hidden p-3 group-hover:scale-110 transition-transform duration-500">
                            {brand.logo ? (
                              <img src={brand.logo} alt={brand.name} className="h-full w-full object-contain brightness-110" />
                            ) : (
                              <Award className="text-slate-700 group-hover:text-[#F1D28C] transition-colors" size={28} />
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <p className="text-lg font-display font-black text-white uppercase tracking-tight">{brand.name}</p>
                            {brand.featured && (
                              <div className="h-6 px-2 rounded-lg bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center">
                                <Star size={10} className="fill-[#F1D28C] text-[#F1D28C]" />
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mt-1 opacity-60">UID: {brand.slug || brand.id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <div className={cn(
                        "inline-flex h-8 items-center gap-2 rounded-full px-4 text-[9px] font-black uppercase tracking-widest border transition-all duration-500",
                        brand.isActive !== false 
                          ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]" 
                          : "bg-white/5 border-white/10 text-slate-500"
                      )}>
                        <div className={cn("h-1.5 w-1.5 rounded-full", brand.isActive !== false ? "bg-emerald-500 group-hover:bg-white" : "bg-slate-500")} />
                        {brand.isActive !== false ? t('admin:synchronized', 'Synchronized') : t('admin:standby', 'Standby')}
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <div className="flex h-12 w-28 items-center justify-between rounded-[20px] bg-white/5 px-4 group-hover:bg-white/10 transition-colors">
                        <Package size={16} className="text-slate-600 group-hover:text-[#F1D28C] transition-colors" />
                        <span className="text-lg font-display font-black text-white">{brand.productCount}</span>
                      </div>
                    </td>
                    <td className="px-10 py-7 text-right">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 transition-transform">
                        {confirmDeleteId === brand.id ? (
                          <div className="flex items-center gap-2 rounded-2xl bg-rose-500/10 border border-rose-500/40 p-1">
                            <button 
                              onClick={() => handleDelete(brand.id)}
                              disabled={isActionLoading}
                              className="h-10 px-6 rounded-xl bg-rose-500 text-[10px] font-black text-white hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
                            >
                              {t('admin:confirm', 'CONFIRM')}
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
                              onClick={() => handleEdit(brand)}
                              className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white/5 text-slate-500 hover:bg-[#C5A059]/10 hover:text-[#F1D28C] border border-white/5 transition-all"
                            >
                              <Edit size={18} />
                            </button>
                            <button 
                              onClick={() => setConfirmDeleteId(brand.id)}
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
                 <Award size={36} />
              </div>

              <h2 className="text-3xl font-display font-black tracking-tight text-white uppercase leading-tight">
                {editingId ? 'Modify Identity' : 'Initialize Identity'}
              </h2>
              <p className="mt-3 text-sm font-medium text-slate-500">Configure corporate parameters for synchronized product nodes.</p>

              <form onSubmit={handleSubmit} className="mt-10 space-y-8 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Brand Designation</label>
                      <input 
                        required 
                        type="text"
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})} 
                        placeholder="e.g. Samsung"
                        className="w-full h-16 rounded-3xl border border-white/5 bg-white/5 px-6 text-sm font-bold text-white transition-all focus:border-[#C5A059]/30 focus:bg-white/10 outline-none shadow-inner"
                      />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Corporate Asset (Logo)</label>
                      <input 
                        type="url"
                        value={formData.logo} 
                        onChange={e => setFormData({...formData, logo: e.target.value})} 
                        placeholder="https://..."
                        className="w-full h-16 rounded-3xl border border-white/5 bg-white/5 px-6 text-sm font-bold text-white transition-all focus:border-[#C5A059]/30 focus:bg-white/10 outline-none shadow-inner"
                      />
                   </div>
                </div>

                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Route Identifier (Slug)</label>
                   <input 
                     type="text"
                     value={formData.slug} 
                     onChange={e => setFormData({...formData, slug: e.target.value})} 
                     placeholder="samsung"
                     className="w-full h-16 rounded-3xl border border-white/5 bg-white/5 px-6 text-sm font-bold text-white transition-all focus:border-[#C5A059]/30 focus:bg-white/10 outline-none shadow-inner"
                   />
                </div>

                <div className="space-y-6">
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

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Manufacturer Profile ({activeLangTab.toUpperCase()})</label>
                    <textarea 
                      rows={3}
                      value={activeLangTab === 'ru' ? formData.descRu : activeLangTab === 'en' ? formData.descEn : formData.descAm} 
                      onChange={e => {
                        const val = e.target.value;
                        if (activeLangTab === 'ru') setFormData({...formData, descRu: val});
                        if (activeLangTab === 'en') setFormData({...formData, descEn: val});
                        if (activeLangTab === 'am') setFormData({...formData, descAm: val});
                      }} 
                      placeholder="Enter manufacturer intelligence profile..."
                      className="w-full rounded-[32px] border border-white/5 bg-white/5 px-6 py-6 text-sm font-bold text-white transition-all focus:border-[#C5A059]/30 focus:bg-white/10 outline-none shadow-inner resize-none appearance-none"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-8">
                  <label className="flex items-center gap-4 cursor-pointer group">
                    <div className={cn(
                      "h-8 w-14 rounded-full transition-all relative border border-white/10",
                      formData.featured ? "bg-[#C5A059] shadow-[0_0_20px_rgba(197,160,89,0.3)]" : "bg-white/5"
                    )}>
                      <div className={cn(
                        "h-5 w-5 bg-white rounded-full absolute top-1 transition-all duration-300",
                        formData.featured ? "left-7 shadow-lg" : "left-1.5"
                      )} />
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={formData.featured} 
                      onChange={e => setFormData({...formData, featured: e.target.checked})} 
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-white transition-colors">Tier 1 Exclusive</span>
                  </label>

                  <label className="flex items-center gap-4 cursor-pointer group">
                    <div className={cn(
                      "h-8 w-14 rounded-full transition-all relative border border-white/10",
                      formData.isActive ? "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "bg-white/5"
                    )}>
                      <div className={cn(
                        "h-5 w-5 bg-white rounded-full absolute top-1 transition-all duration-300",
                        formData.isActive ? "left-7 shadow-lg" : "left-1.5"
                      )} />
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={formData.isActive} 
                      onChange={e => setFormData({...formData, isActive: e.target.checked})} 
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-white transition-colors">Broadcast Active</span>
                  </label>
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
                    {isActionLoading ? <RefreshCw className="mx-auto animate-spin" size={20} /> : editingId ? 'Update Identity' : 'Authorize Identity'}
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

export default AdminBrands;
