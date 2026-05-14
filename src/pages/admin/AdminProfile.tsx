import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  User, 
  Shield, 
  Mail, 
  MapPin, 
  Phone, 
  Save, 
  RefreshCw,
  Camera,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { updateProfile, updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

const AdminProfile: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    photoURL: user?.photoURL || '',
    phone: '',
    location: 'Yerevan, Armenia'
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
    show: false
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // Update Firebase Auth
      await updateProfile(user, {
        displayName: formData.displayName,
        photoURL: formData.photoURL
      });

      // Update Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
         displayName: formData.displayName,
         photoURL: formData.photoURL,
         phone: formData.phone,
         updatedAt: new Date()
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await updatePassword(user, passwordForm.newPassword);
      setSuccess(true);
      setPasswordForm({ newPassword: '', confirmPassword: '', show: false });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl space-y-12 pb-20 text-white">
      <header className="px-2">
        <h1 className="text-4xl font-display font-black tracking-tight text-white uppercase italic leading-none">Security Clearance</h1>
        <p className="mt-3 text-sm font-medium text-slate-500 uppercase tracking-widest opacity-60">Architectural identity management and administrative access protocols.</p>
      </header>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 px-2">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-8">
           <div className="relative overflow-hidden rounded-[48px] bg-[#081120] p-10 shadow-[0_30px_100px_rgba(0,0,0,0.5)] border border-white/5 flex flex-col items-center text-center group">
              <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-br from-[#0B1220] to-transparent opacity-50" />
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#C5A059] opacity-[0.02] blur-[80px] pointer-events-none group-hover:opacity-[0.05] transition-opacity" />
              
              <div className="relative mt-4 group/avatar">
                 <div className="absolute inset-0 bg-[#C5A059] opacity-20 blur-3xl group-hover/avatar:opacity-40 transition-opacity" />
                 <div className="h-40 w-40 rounded-[40px] border-4 border-[#050816] bg-gradient-to-br from-[#0B1220] to-[#050816] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-center overflow-hidden relative z-10">
                    {formData.photoURL ? (
                       <img src={formData.photoURL} alt="Avatar" className="w-full h-full object-cover transition-transform duration-1000 group-hover/avatar:scale-110" />
                    ) : (
                       <User size={64} className="text-slate-800" />
                    )}
                 </div>
                 <button className="absolute -bottom-2 -right-2 h-12 w-12 bg-[#C5A059] text-[#050816] rounded-2xl border-4 border-[#081120] flex items-center justify-center shadow-xl hover:scale-110 transition-transform z-20">
                    <Camera size={20} />
                 </button>
              </div>

              <h2 className="mt-8 text-3xl font-display font-black text-white uppercase tracking-tight italic relative z-10 leading-none">
                 {formData.displayName || 'Administrator'}
              </h2>
              <div className="mt-4 inline-flex items-center gap-3 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/20 px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#C5A059] relative z-10 shadow-2xl">
                 <Shield size={12} className="animate-pulse" />
                 Level: Master_Key
              </div>

              <div className="mt-12 w-full space-y-6 text-left relative z-10">
                 <div className="flex items-center gap-5 p-5 rounded-3xl bg-[#050816]/50 border border-white/5 shadow-inner group/node">
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-[#C5A059]/50 group-hover/node:text-[#C5A059] transition-colors">
                       <Mail size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="text-[8px] font-black uppercase tracking-widest text-slate-700">Comms Logic</p>
                       <p className="text-sm font-bold text-slate-300 truncate font-mono">{user?.email}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-5 p-5 rounded-3xl bg-[#050816]/50 border border-white/5 shadow-inner group/node">
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-[#C5A059]/50 group-hover/node:text-[#C5A059] transition-colors">
                       <MapPin size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="text-[8px] font-black uppercase tracking-widest text-slate-700">Localization Node</p>
                       <p className="text-sm font-bold text-slate-300 truncate">{formData.location}</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="rounded-[40px] bg-gradient-to-br from-[#0B1220] to-[#050816] p-10 text-white shadow-2xl border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A059] opacity-[0.03] blur-[40px] transition-opacity" />
              <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 shadow-inner mb-6 group-hover:scale-110 transition-transform">
                 <Lock size={24} />
              </div>
              <h3 className="text-xl font-display font-black mb-3 uppercase tracking-tight italic">Archival Security</h3>
              <p className="text-xs font-medium text-slate-500 leading-relaxed uppercase tracking-widest">
                 System integrity is optimal. Rotate neural access keys every 90 planetary cycles.
              </p>
           </div>
        </div>

        {/* Edit Forms */}
        <div className="lg:col-span-2 space-y-12">
           <form onSubmit={handleUpdateProfile} className="rounded-[48px] bg-[#081120] p-12 shadow-2xl border border-white/5 relative overflow-hidden group">
              <div className="absolute inset-0 bg-[#C5A059] opacity-[0.01] blur-[100px] pointer-events-none" />
              
              <div className="flex items-center gap-6 mb-12">
                 <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C5A059] shadow-inner">
                    <User size={24} />
                 </div>
                 <div>
                    <h3 className="text-2xl font-display font-black text-white uppercase tracking-tight">Identity Parameters</h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Configure public administrative descriptors</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-6 italic">Public Designation</label>
                    <input 
                       type="text"
                       value={formData.displayName}
                       onChange={e => setFormData({...formData, displayName: e.target.value})}
                       className="w-full h-18 rounded-[28px] bg-[#050816] border border-white/5 px-8 text-sm font-black text-white focus:border-[#C5A059]/40 outline-none transition-all shadow-inner uppercase tracking-widest italic"
                    />
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-6 italic">Mobile Frequency</label>
                    <input 
                       type="text"
                       placeholder="+374..."
                       value={formData.phone}
                       onChange={e => setFormData({...formData, phone: e.target.value})}
                       className="w-full h-18 rounded-[28px] bg-[#050816] border border-white/5 px-8 text-sm font-bold text-[#C5A059] focus:border-[#C5A059]/40 outline-none transition-all shadow-inner"
                    />
                 </div>
                 <div className="md:col-span-2 space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-6 italic">Visual ID Reference (URI)</label>
                    <input 
                       type="text"
                       value={formData.photoURL}
                       onChange={e => setFormData({...formData, photoURL: e.target.value})}
                       className="w-full h-18 rounded-[28px] bg-[#050816] border border-white/5 px-4 text-xs font-medium text-slate-400 focus:border-[#C5A059]/40 outline-none transition-all shadow-inner"
                    />
                 </div>
              </div>
              <div className="mt-14 flex justify-end">
                 <button 
                   disabled={loading}
                   className="flex h-18 items-center gap-4 rounded-[28px] bg-gradient-to-r from-[#C5A059] to-[#F1D28C] px-12 text-[11px] font-black uppercase tracking-[0.3em] text-[#050816] shadow-[0_15px_40px_rgba(197,160,89,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 group font-display"
                 >
                    {loading ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} className="group-hover:rotate-12 transition-transform" />}
                    Persist Metadata
                 </button>
              </div>
           </form>

           <form onSubmit={handleChangePassword} className="rounded-[48px] bg-[#081120] p-12 shadow-2xl border border-white/5 relative overflow-hidden group">
              <div className="absolute inset-0 bg-rose-500 opacity-[0.01] blur-[100px] pointer-events-none" />

              <div className="flex items-center gap-6 mb-12">
                 <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C5A059] shadow-inner">
                    <Lock size={24} />
                 </div>
                 <div>
                    <h3 className="text-2xl font-display font-black text-white uppercase tracking-tight">Access Protocol Rotation</h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Update administrative decryption keys</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                 <div className="relative group/pass">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-6 italic">Secure Vector Alpha</label>
                    <input 
                       type={passwordForm.show ? "text" : "password"}
                       value={passwordForm.newPassword}
                       onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                       className="w-full h-18 rounded-[28px] bg-[#050816] border border-white/5 px-8 text-sm font-black text-white focus:border-[#C5A059]/40 outline-none transition-all shadow-inner"
                    />
                    <button 
                      type="button" 
                      onClick={() => setPasswordForm({...passwordForm, show: !passwordForm.show})}
                      className="absolute bottom-6 right-6 text-slate-700 hover:text-[#C5A059] transition-colors"
                    >
                       {passwordForm.show ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-6 italic">Secure Vector Verify</label>
                    <input 
                       type={passwordForm.show ? "text" : "password"}
                       value={passwordForm.confirmPassword}
                       onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                       className="w-full h-18 rounded-[28px] bg-[#050816] border border-white/5 px-8 text-sm font-black text-white focus:border-[#C5A059]/40 outline-none transition-all shadow-inner"
                    />
                 </div>
              </div>
              <div className="mt-14 flex justify-end">
                 <button 
                   disabled={loading}
                   className="flex h-18 items-center gap-4 rounded-[28px] bg-[#050816] border border-white/10 px-12 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 hover:bg-white/5 hover:text-white transition-all active:scale-95 disabled:opacity-50 group font-display shadow-xl"
                 >
                    {loading ? <RefreshCw className="animate-spin" size={20} /> : <Lock size={20} />}
                    Commit Logic Gate
                 </button>
              </div>
           </form>
        </div>
      </div>

      <AnimatePresence>
         {success && (
            <motion.div 
               initial={{ opacity: 0, y: 50, scale: 0.9 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               exit={{ opacity: 0, y: 50, scale: 0.9 }}
               className="fixed bottom-12 left-1/2 -ml-40 w-80 bg-gradient-to-r from-emerald-600 to-green-500 text-[#050816] rounded-3xl py-6 px-8 font-black text-[10px] uppercase tracking-[0.3em] text-center shadow-[0_20px_80px_rgba(16,185,129,0.3)] z-[150] border border-emerald-400/20"
            >
               Protocol Synchronized Successfully
            </motion.div>
         )}
         {error && (
            <motion.div 
               initial={{ opacity: 0, y: 50, scale: 0.9 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               exit={{ opacity: 0, y: 50, scale: 0.9 }}
               className="fixed bottom-12 left-1/2 -ml-40 w-80 bg-rose-600 text-white rounded-3xl py-6 px-8 font-black text-[10px] uppercase tracking-[0.3em] text-center shadow-[0_20px_80px_rgba(244,63,94,0.3)] z-[150] border border-rose-400/20"
            >
               Execution Fault: {error}
            </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
};

export default AdminProfile;
