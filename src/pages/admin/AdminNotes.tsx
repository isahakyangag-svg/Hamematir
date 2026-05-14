import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  StickyNote, 
  FileText,
  Calendar,
  MoreVertical,
  CheckCircle2,
  Clock,
  Layout,
  ExternalLink
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

interface Note {
  id: string;
  title: string;
  content: string;
  url?: string;
  imageUrl?: string;
  status: 'pending' | 'completed' | 'urgent';
  createdAt: Timestamp;
  blocks: any[]; // Support for structured blocks if needed
}

const AdminNotes: React.FC = () => {
  const { t } = useTranslation();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    url: '',
    imageUrl: '',
    status: 'pending' as Note['status']
  });

  useEffect(() => {
    const q = query(collection(db, 'admin_notes'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setNotes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'admin_notes');
    });
    return unsub;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingNote) {
        await updateDoc(doc(db, 'admin_notes', editingNote.id), {
          ...formData,
          createdAt: serverTimestamp() // Optional: update time?
        });
      } else {
        await addDoc(collection(db, 'admin_notes'), {
          ...formData,
          createdAt: serverTimestamp(),
          blocks: []
        });
      }
      closeModal();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'admin_notes');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await deleteDoc(doc(db, 'admin_notes', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'admin_notes');
    }
  };

  const openModal = (note?: Note) => {
    if (note) {
      setEditingNote(note);
      setFormData({
        title: note.title,
        content: note.content,
        url: note.url || '',
        imageUrl: note.imageUrl || '',
        status: note.status
      });
    } else {
      setEditingNote(null);
      setFormData({ title: '', content: '', url: '', imageUrl: '', status: 'pending' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedNote(null);
    setEditingNote(null);
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-12 pb-20 text-white">
      <header className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between px-2">
        <div className="flex items-center gap-8">
          <div className="h-20 w-20 rounded-[28px] bg-[#C5A059]/10 flex items-center justify-center shadow-[0_0_50px_rgba(197,160,89,0.1)] border border-[#C5A059]/20 relative group">
            <div className="absolute inset-0 bg-[#C5A059] opacity-20 blur-xl group-hover:opacity-40 transition-opacity" />
            <StickyNote className="text-[#F1D28C] relative z-10" size={36} />
          </div>
          <div>
            <h1 className="text-4xl font-display font-black tracking-tight text-white uppercase italic leading-none">Neural Archive</h1>
            <p className="mt-3 text-sm font-medium text-slate-500 uppercase tracking-widest opacity-60">Strategic organizational node for administrative operations.</p>
          </div>
        </div>

        <button 
          onClick={() => openModal()}
          className="flex h-16 items-center gap-4 rounded-[28px] bg-gradient-to-r from-[#C5A059] to-[#F1D28C] px-10 text-[11px] font-black uppercase tracking-[0.3em] text-[#050816] shadow-[0_15px_40px_rgba(197,160,89,0.3)] hover:scale-105 active:scale-95 transition-all group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform" />
          Initialize Sequence
        </button>
      </header>

      {/* Stats / Filters */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 px-2">
         {[
           { label: 'Total Archives', count: notes.length, icon: FileText, color: 'indigo' },
           { label: 'Pending Protocols', count: notes.filter(n => n.status === 'pending').length, icon: Clock, color: 'amber' },
           { label: 'Critical Alert', count: notes.filter(n => n.status === 'urgent').length, icon: AlertCircle, color: 'rose' }
         ].map(stat => (
           <div key={stat.label} className="bg-[#081120] p-10 rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 opacity-0 blur-[50px] group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className={cn(
                "mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border transition-all shadow-inner",
                stat.color === 'indigo' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 
                stat.color === 'amber' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                'bg-rose-500/10 text-rose-400 border-rose-500/20'
              )}>
                <stat.icon size={28} />
              </div>
              <div className="relative z-10">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 italic">{stat.label}</p>
                 <p className="text-4xl font-display font-black text-white mt-1 uppercase italic tracking-tighter">{stat.count}</p>
              </div>
           </div>
         ))}
      </div>

      {/* Search and List */}
      <div className="space-y-10 px-2">
        <div className="relative group max-w-xl">
           <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-[#C5A059]/40 to-transparent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-700" />
           <Search size={20} className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#C5A059] transition-colors" />
           <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search terminal archives..." 
            className="w-full h-20 pl-20 pr-8 rounded-[30px] bg-[#081120] border border-white/5 outline-none focus:bg-[#0B1220] transition-all font-display font-black text-white uppercase tracking-widest placeholder:text-slate-800 italic text-sm" 
           />
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
           <AnimatePresence mode="popLayout">
             {filteredNotes.map((note, idx) => (
                 <motion.div
                   key={note.id}
                   layout
                   initial={{ opacity: 0, scale: 0.9, y: 20 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.9 }}
                   onClick={() => setSelectedNote(note)}
                   className="group relative flex flex-col rounded-[44px] border border-white/5 bg-[#081120] p-10 shadow-2xl transition-all hover:bg-[#0B1220] hover:border-[#C5A059]/20 cursor-pointer overflow-hidden"
                 >
                    <div className="absolute inset-0 bg-[#C5A059] opacity-0 blur-[100px] group-hover:opacity-[0.03] transition-opacity pointer-events-none" />
                    
                    <div className="mb-8 flex justify-between items-center relative z-10">
                       <div className={cn(
                         "inline-flex items-center gap-3 rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] border shadow-inner",
                         note.status === 'urgent' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                         note.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                         'bg-[#C5A059]/10 text-[#F1D28C] border-[#C5A059]/20'
                       )}>
                          <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", 
                             note.status === 'urgent' ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' : 
                             note.status === 'completed' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 
                             'bg-[#C5A059] shadow-[0_0_10px_#C5A059]'
                          )} />
                          {note.status}
                       </div>
                       <div className="flex items-center gap-3">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal(note);
                            }} 
                            className="p-3 bg-white/5 text-slate-500 hover:text-[#C5A059] rounded-xl transition-all border border-transparent hover:border-white/5 active:scale-90"
                          >
                             <Edit3 size={18} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(note.id);
                            }} 
                            className="p-3 bg-white/5 text-slate-500 hover:text-rose-500 rounded-xl transition-all border border-transparent hover:border-white/5 active:scale-90"
                          >
                             <Trash2 size={18} />
                          </button>
                       </div>
                    </div>

                  {note.imageUrl && (
                    <div className="mb-8 aspect-video w-full rounded-[30px] bg-[#050816] overflow-hidden border border-white/5 shadow-inner relative z-10">
                       <img src={note.imageUrl} alt={note.title} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-60" />
                       <div className="absolute inset-0 bg-gradient-to-t from-[#081120] via-transparent to-transparent opacity-60" />
                    </div>
                  )}

                  <div className="flex-1 space-y-4 relative z-10">
                     <h3 className="text-2xl font-display font-black tracking-tight text-white leading-none uppercase italic group-hover:text-[#F1D28C] transition-colors">
                       {note.title}
                     </h3>
                     <p className="text-sm font-medium text-slate-500 leading-relaxed line-clamp-3 opacity-80 italic">
                       {note.content}
                     </p>
                  </div>

                  <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between relative z-10">
                     <div className="flex items-center gap-3 text-slate-600">
                        <Calendar size={16} className="opacity-40" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] font-mono">
                          {note.createdAt?.toDate().toLocaleDateString('ru-RU') || 'ARCHIVAL_NOW'}
                        </span>
                     </div>
                     {note.url && (
                        <a 
                          href={note.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          onClick={(e) => e.stopPropagation()}
                          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-[#C5A059] transition-all hover:bg-[#C5A059] hover:text-[#050816] shadow-xl border border-white/5"
                        >
                           <ExternalLink size={20} />
                        </a>
                     )}
                  </div>
               </motion.div>
             ))}
           </AnimatePresence>

      {/* View Modal */}
      <AnimatePresence>
        {selectedNote && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 md:p-12 pointer-events-none">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedNote(null)}
              className="absolute inset-0 bg-[#050816]/95 backdrop-blur-3xl pointer-events-auto" 
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="relative w-full max-w-5xl bg-[#081120] rounded-[60px] shadow-[0_50px_200px_rgba(0,0,0,0.8)] overflow-hidden pointer-events-auto flex flex-col border border-white/10"
            >
               <div className="absolute inset-0 bg-[#C5A059] opacity-[0.01] blur-[150px] pointer-events-none" />
               
              <div className="bg-[#050816]/60 backdrop-blur-md px-14 py-12 border-b border-white/5 flex justify-between items-center shrink-0 relative z-10">
                <div className="space-y-4">
                  <div className={cn(
                    "inline-flex items-center gap-3 rounded-full px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl border",
                    selectedNote.status === 'urgent' ? 'bg-rose-500 text-white border-rose-400/20' : 
                    selectedNote.status === 'completed' ? 'bg-emerald-600 text-white border-emerald-400/20' : 
                    'bg-[#C5A059] text-[#050816] border-white/20'
                  )}>
                    <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                    {selectedNote.status} Protocol
                  </div>
                  <h3 className="text-5xl font-display font-black tracking-tighter uppercase italic leading-none text-white">
                    {selectedNote.title}
                  </h3>
                </div>
                <button onClick={() => setSelectedNote(null)} className="h-20 w-20 rounded-[32px] bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-rose-500 hover:text-white transition-all active:scale-90 shadow-2xl">
                  <X size={32} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-14 space-y-12 scrollbar-hide relative z-10">
                {selectedNote.imageUrl && (
                  <div className="w-full aspect-video rounded-[40px] overflow-hidden bg-[#050816] border border-white/5 shadow-2xl group">
                    <img 
                      src={selectedNote.imageUrl} 
                      alt={selectedNote.title} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-80" 
                    />
                  </div>
                )}

                <div className="space-y-8 max-w-4xl">
                   <div className="flex items-center gap-4">
                      <div className="h-1 w-12 bg-gradient-to-r from-[#C5A059] to-transparent rounded-full" />
                      <span className="text-[12px] font-black text-[#C5A059] uppercase tracking-[0.4em] italic opacity-60 italic">Core Content Node</span>
                   </div>
                   <p className="text-2xl font-medium text-slate-300 leading-relaxed whitespace-pre-wrap italic opacity-90">
                     {selectedNote.content}
                   </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-14 border-t border-white/5">
                    <div className="space-y-6">
                       <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] italic">Archive Initiation Date</span>
                       <div className="flex items-center gap-6 bg-[#050816]/50 p-8 rounded-[32px] border border-white/5 shadow-inner">
                          <Calendar size={28} className="text-[#C5A059]" />
                          <span className="text-xl font-display font-black text-white uppercase italic tracking-wider">
                            {selectedNote.createdAt?.toDate().toLocaleDateString('ru-RU', { 
                              day: 'numeric', 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </span>
                       </div>
                    </div>
                    {selectedNote.url && (
                      <div className="space-y-6">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] italic">Secure External Link</span>
                        <a 
                          href={selectedNote.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-between bg-gradient-to-r from-[#C5A059] to-[#F1D28C] p-8 rounded-[32px] text-[#050816] shadow-[0_20px_60px_rgba(197,160,89,0.3)] transition-all hover:scale-[1.02] active:scale-95 group"
                        >
                          <div className="flex items-center gap-6">
                             <LinkIcon size={28} />
                             <span className="text-lg font-black uppercase tracking-widest italic">Execute Bridge</span>
                          </div>
                          <ExternalLink size={28} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                        </a>
                      </div>
                    )}
                </div>
              </div>

              <div className="p-14 bg-[#050816]/40 backdrop-blur-md flex gap-8 shrink-0 border-t border-white/5 relative z-10">
                <button 
                  onClick={() => {
                    const note = selectedNote;
                    setSelectedNote(null);
                    openModal(note);
                  }}
                  className="flex-1 h-20 rounded-[28px] bg-white/5 border border-white/10 font-black uppercase tracking-[0.3em] text-slate-400 hover:bg-white/10 hover:text-[#F1D28C] transition-all active:scale-95 flex items-center justify-center gap-4 text-xs"
                >
                  <Edit3 size={24} />
                  Reconfigure Protocol
                </button>
                <button 
                   onClick={() => setSelectedNote(null)}
                   className="flex-1 h-20 rounded-[28px] bg-white text-[#050816] font-black uppercase tracking-[0.3em] shadow-2xl transition-all hover:bg-[#F1D28C] active:scale-95 text-xs italic"
                >
                  Close Terminal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
        </div>
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 md:p-12 pointer-events-none">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={closeModal}
              className="absolute inset-0 bg-[#050816]/90 backdrop-blur-2xl pointer-events-auto" 
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-3xl bg-[#081120] rounded-[60px] shadow-[0_50px_150px_rgba(0,0,0,1)] overflow-hidden pointer-events-auto border border-white/10"
            >
               <div className="absolute inset-0 bg-[#C5A059] opacity-[0.01] blur-[150px] pointer-events-none" />
               
              <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[90vh] relative z-10">
                <div className="bg-[#050816]/70 backdrop-blur-md p-12 text-white flex justify-between items-center border-b border-white/5">
                  <div>
                    <h3 className="text-3xl font-display font-black uppercase tracking-tighter italic leading-none">
                       {editingNote ? 'Protocol Reconfiguration' : 'Initialize New Node'}
                    </h3>
                    <p className="text-[10px] font-black opacity-40 mt-3 uppercase tracking-[0.4em] italic">Cognitive Asset Integration V4</p>
                  </div>
                  <button type="button" onClick={closeModal} className="h-16 w-16 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-rose-500 transition-all active:scale-90 shadow-xl">
                    <X size={24} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-12 space-y-10 scrollbar-hide">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 ml-6 italic">Protocol Subject</label>
                    <input 
                      required
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Archive Name Entry..."
                      className="w-full h-20 rounded-[30px] bg-[#050816] px-10 text-xl font-display font-black text-white border border-white/5 transition-all focus:border-[#C5A059]/40 outline-none shadow-inner uppercase tracking-widest placeholder:text-slate-800 italic" 
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 ml-6 italic">Neural Content Descriptor</label>
                    <textarea 
                      required
                      rows={6}
                      value={formData.content}
                      onChange={e => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Detailed archival transmission..."
                      className="w-full rounded-[40px] bg-[#050816] p-10 text-lg font-medium text-slate-400 border border-white/5 transition-all focus:border-[#C5A059]/40 outline-none resize-none shadow-inner leading-relaxed italic" 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 ml-6 italic">Bridge URI</label>
                      <div className="relative group/link">
                        <LinkIcon size={20} className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within/link:text-[#C5A059] transition-colors" />
                        <input 
                          type="url"
                          value={formData.url}
                          onChange={e => setFormData({ ...formData, url: e.target.value })}
                          placeholder="https://secure.link"
                          className="w-full h-20 rounded-[30px] bg-[#050816] pl-20 pr-8 font-black text-white border border-white/5 outline-none focus:border-[#C5A059]/40 transition-all shadow-inner text-sm italic" 
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 ml-6 italic">Visual Asset URI</label>
                      <div className="relative group/img">
                        <ImageIcon size={20} className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within/img:text-[#C5A059] transition-colors" />
                        <input 
                          type="url"
                          value={formData.imageUrl}
                          onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                          placeholder="https://cloud.matrix/img.png"
                          className="w-full h-20 rounded-[30px] bg-[#050816] pl-20 pr-8 font-black text-white border border-white/5 outline-none focus:border-[#C5A059]/40 transition-all shadow-inner text-sm italic" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 ml-6 italic">Priority Level Synchronization</label>
                    <div className="grid grid-cols-3 gap-6 p-2 rounded-[40px] bg-[#050816] border border-white/5">
                      {['pending', 'completed', 'urgent'].map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setFormData({ ...formData, status: s as Note['status'] })}
                          className={cn(
                            "py-5 rounded-[30px] font-black uppercase tracking-[0.2em] text-[10px] transition-all border shadow-2xl active:scale-95 italic font-display",
                            formData.status === s 
                              ? s === 'urgent' ? "bg-rose-500 border-rose-400 text-white shadow-rose-500/20" : 
                                s === 'completed' ? "bg-emerald-600 border-emerald-400 text-white shadow-emerald-500/20" : 
                                "bg-[#C5A059] border-[#F1D28C] text-[#050816] shadow-[0_10px_30px_rgba(197,160,89,0.3)]"
                              : "bg-transparent border-transparent text-slate-600 hover:text-slate-400"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-12 bg-[#050816]/70 backdrop-blur-md flex gap-8 border-t border-white/5">
                  <button type="button" onClick={closeModal} className="flex-1 h-20 rounded-[28px] bg-white/5 border border-white/10 font-black uppercase tracking-[0.3em] text-slate-500 hover:bg-white/10 hover:text-white transition-all active:scale-95 text-xs">
                    Abort
                  </button>
                  <button type="submit" className="flex-[2] h-20 rounded-[28px] bg-gradient-to-r from-[#C5A059] to-[#F1D28C] text-[#050816] font-black uppercase tracking-[0.4em] shadow-[0_20px_60px_rgba(197,160,89,0.3)] transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4 text-xs italic">
                    <Save size={20} />
                    {editingNote ? 'Sync Protocol' : 'Deploy Node'}
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

// Mock icon missed in imports
const AlertCircle = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

export default AdminNotes;
