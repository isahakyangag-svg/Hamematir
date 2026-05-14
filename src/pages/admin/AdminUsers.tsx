import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  Shield, 
  Lock, 
  Unlock, 
  Mail, 
  Clock, 
  Search, 
  Filter, 
  MoreHorizontal, 
  UserPlus, 
  Smartphone, 
  Globe, 
  Eye, 
  Ban,
  CheckCircle,
  XCircle,
  MoreVertical,
  ChevronRight,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { collection, doc, updateDoc, query, orderBy, onSnapshot, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

interface UserData {
  id: string;
  displayName: string;
  email: string;
  role: 'admin' | 'partner' | 'user';
  status: 'active' | 'blocked' | 'pending';
  lastLogin?: any;
  createdAt?: any;
  phone?: string;
  age?: number;
  ipAddress?: string;
  photoURL?: string;
}

const AdminUsers: React.FC = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });
    return () => unsubscribe();
  }, []);

  const updateUserStatus = async (id: string, status: 'active' | 'blocked') => {
    try {
      await updateDoc(doc(db, 'users', id), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${id}`);
    }
  };

  const updateUserRole = async (id: string, role: string) => {
    try {
      await updateDoc(doc(db, 'users', id), { role });
      
      const adminRef = doc(db, 'admins', id);
      const user = users.find(u => u.id === id);
      
      if (role === 'admin') {
        const adminDoc = await getDoc(adminRef);
        if (!adminDoc.exists()) {
          await setDoc(adminRef, {
            email: user?.email || '',
            role: 'admin',
            createdAt: serverTimestamp()
          });
        }
      } else {
        await deleteDoc(adminRef);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${id}`);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone?.includes(searchTerm);
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-display font-black tracking-tight text-white uppercase leading-none">{t('admin:identity_manager', 'Identity Manager')}</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">{t('admin:users_desc', 'Manage global identity nodes and access protocols.') || t('users_desc')}</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex h-14 items-center gap-3 rounded-[24px] bg-white/5 border border-white/10 px-6 shadow-2xl text-[11px] font-black uppercase tracking-widest text-[#F1D28C] group hover:border-[#C5A059]/30 transition-all">
              <Users size={20} className="text-[#C5A059] group-hover:scale-110 transition-transform" />
              <span>{users.length} {t('admin:total_users', 'Total Users')}</span>
           </div>
        </div>
      </header>

      {/* Filters Bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-amber-500" size={20} />
          <input
            type="text"
            placeholder={t('admin:search_users_placeholder', 'Scan directory by name, email, or phone identifier...')}
            className="w-full h-16 rounded-[28px] border border-white/5 bg-white/5 pl-14 pr-6 text-sm font-medium text-white placeholder:text-slate-600 outline-none transition-all focus:bg-white/10 focus:border-amber-500/30 shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="relative flex h-16 items-center">
             <Filter className="absolute left-5 text-slate-500 pointer-events-none" size={16} />
              <select 
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-16 w-48 appearance-none rounded-[28px] border border-white/5 bg-white/5 pl-14 pr-6 text-[10px] font-black uppercase tracking-widest text-slate-400 outline-none transition-all focus:bg-white/10 focus:border-amber-500/30"
              >
                <option value="all" className="bg-[#081120]">{t('admin:all_roles', 'All Roles')}</option>
                <option value="admin" className="bg-[#081120]">{t('admin:admins', 'Admins')}</option>
                <option value="partner" className="bg-[#081120]">{t('admin:partners', 'Partners')}</option>
                <option value="user" className="bg-[#081120]">{t('admin:users', 'Users')}</option>
              </select>
          </div>
          <div className="relative flex h-16 items-center">
             <Globe className="absolute left-5 text-slate-500 pointer-events-none" size={16} />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-16 w-48 appearance-none rounded-[28px] border border-white/5 bg-white/5 pl-14 pr-6 text-[10px] font-black uppercase tracking-widest text-slate-400 outline-none transition-all focus:bg-white/10 focus:border-amber-500/30"
              >
                <option value="all" className="bg-[#081120]">{t('admin:all_status', 'All Status')}</option>
                <option value="active" className="bg-[#081120]">{t('admin:active', 'Active')}</option>
                <option value="blocked" className="bg-[#081120]">{t('admin:blocked', 'Blocked')}</option>
                <option value="pending" className="bg-[#081120]">{t('admin:pending', 'Pending')}</option>
              </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* Table View */}
        <div className="lg:col-span-8 overflow-hidden rounded-[40px] border border-white/5 bg-[#081120] p-1 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-8 py-8 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">{t('admin:identity', 'Identity')}</th>
                  <th className="px-8 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center">{t('admin:protocol_role', 'Protocol / Role')}</th>
                  <th className="px-8 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{t('admin:security_logs', 'Security Logs')}</th>
                  <th className="px-8 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">{t('admin:status', 'Status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <AnimatePresence mode="popLayout">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-24 text-center">
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                          <RefreshCw size={40} className="mx-auto text-amber-500 opacity-20" />
                        </motion.div>
                      </td>
                    </tr>
                  ) : filteredUsers.map((user, i) => (
                    <motion.tr 
                      key={user.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={cn(
                        "group hover:bg-white/5 transition-all cursor-pointer relative",
                        selectedUser?.id === user.id && "bg-white/5 after:absolute after:left-0 after:top-4 after:bottom-4 after:w-1 after:bg-amber-500 after:rounded-full after:shadow-[0_0_15px_rgba(197,160,89,0.8)]"
                      )}
                      onClick={() => setSelectedUser(user)}
                    >
                      <td className="px-8 py-7">
                        <div className="flex items-center gap-5">
                          <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl bg-white/5 border border-white/10 shadow-2xl transition-transform group-hover:scale-105">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center font-black text-slate-600 text-xl uppercase bg-gradient-to-br from-white/5 to-transparent">
                                {user.displayName?.[0] || user.email[0]}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-black text-white text-base tracking-tight leading-none group-hover:text-amber-500 transition-colors uppercase">{user.displayName || t('admin:unnamed_user', 'Unnamed User')}</p>
                            <p className="mt-1.5 text-xs font-medium text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-7 text-center">
                        <select 
                          className={cn(
                            "appearance-none rounded-2xl px-5 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none border border-transparent shadow-xl transition-all cursor-pointer",
                            user.role === 'admin' ? "bg-amber-500 text-black shadow-amber-500/20" : 
                            user.role === 'partner' ? "bg-white/5 text-[#F1D28C] border-white/10" : 
                            "bg-white/5 text-slate-500 border-white/5"
                          )}
                          value={user.role}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateUserRole(user.id, e.target.value)}
                        >
                          <option value="user" className="bg-[#081120]">{t('admin:user', 'User')}</option>
                          <option value="partner" className="bg-[#081120]">{t('admin:partner', 'Partner')}</option>
                          <option value="admin" className="bg-[#081120]">{t('admin:admin', 'Admin')}</option>
                        </select>
                      </td>
                      <td className="px-8 py-7">
                         <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-tighter">
                               <Smartphone size={14} className="text-amber-500/40" />
                               <span>{user.ipAddress || '0.0.0.0'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                               <Clock size={12} />
                               <span>{t('admin:established', 'Estd.')} {new Date(user.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                            </div>
                         </div>
                      </td>
                      <td className="px-8 py-7 text-right">
                         <div className={cn(
                             "inline-flex items-center gap-2 rounded-full px-4 py-2 text-[9px] font-black uppercase tracking-widest border shadow-2xl backdrop-blur-xl",
                             user.status === 'active' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                         )}>
                             <div className={cn("h-1.5 w-1.5 rounded-full shadow-[0_0_10px_currentColor]", user.status === 'active' ? "bg-emerald-400" : "bg-rose-400")} />
                             {user.status}
                         </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Profile Sidebar */}
        <div className="lg:col-span-4">
          <AnimatePresence mode="wait">
             {selectedUser ? (
                <motion.div
                  key={selectedUser.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="sticky top-10 overflow-hidden rounded-[48px] border border-white/5 bg-[#0B1220] shadow-2xl shadow-black/80"
                >
                   <div className="relative h-48 bg-gradient-to-br from-[#0B1220] to-[#111827] p-10 flex flex-col justify-end">
                      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none overflow-hidden">
                         <div className="absolute -top-1/2 -left-1/4 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(197,160,89,0.15)_0,transparent_70%)]" />
                      </div>

                      <button 
                        onClick={() => setSelectedUser(null)}
                        className="absolute right-8 top-8 rounded-2xl bg-white/5 p-3 text-slate-500 hover:bg-white/10 hover:text-white transition-all border border-white/10"
                      >
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                         </svg>
                      </button>

                      <div className="relative z-10 flex items-center gap-6">
                        <div className="h-24 w-24 overflow-hidden rounded-[32px] border-4 border-[#0B1220] bg-white/5 shadow-2xl">
                           {selectedUser.photoURL ? (
                             <img src={selectedUser.photoURL} alt="" className="h-full w-full object-cover" />
                           ) : (
                             <div className="flex h-full w-full items-center justify-center bg-white/5 text-4xl font-black text-slate-700 uppercase">
                                {selectedUser.displayName?.[0] || selectedUser.email[0]}
                             </div>
                           )}
                        </div>
                        <div>
                                                       <h2 className="text-3xl font-display font-black text-white uppercase tracking-tight leading-none">{selectedUser.displayName || t('admin:no_identity', 'No Identity')}</h2>
                           <p className="mt-2 text-xs font-bold text-slate-500 tracking-tight">{selectedUser.email}</p>
                        </div>
                      </div>
                   </div>
                   
                   <div className="px-10 pb-10 pt-10">
                      <div className="grid grid-cols-2 gap-5 mb-10">
                         <div className="rounded-[32px] bg-white/5 p-6 border border-white/5 shadow-inner">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-2">Protocol</p>
                            <div className="flex items-center gap-3">
                               <div className="h-3 w-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(197,160,89,0.8)]" />
                               <p className="font-black text-white uppercase text-xs">{selectedUser.status}</p>
                            </div>
                         </div>
                         <div className="rounded-[32px] bg-white/5 p-6 border border-white/5 shadow-inner">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-2">Access Grid</p>
                            <p className="font-black text-[#F1D28C] uppercase text-xs">{selectedUser.role}</p>
                         </div>
                      </div>

                      <div className="space-y-8">
                         <header className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">Encrypted Metadata</h3>
                         </header>

                         <div className="space-y-6">
                            <div className="flex items-center justify-between group">
                               <div className="flex items-center gap-4">
                                  <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 border border-white/5 group-hover:text-amber-500 group-hover:border-amber-500/30 transition-all shadow-xl">
                                    <Smartphone size={18}/>
                                  </div>
                                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Phone Identifier</span>
                               </div>
                               <span className="text-sm font-black text-white tracking-widest">{selectedUser.phone || 'UNKNOWN'}</span>
                            </div>
                            <div className="flex items-center justify-between group">
                               <div className="flex items-center gap-4">
                                  <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 border border-white/5 group-hover:text-amber-500 group-hover:border-amber-500/30 transition-all shadow-xl">
                                    <Globe size={18}/>
                                  </div>
                                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Last Known IP</span>
                               </div>
                               <span className="text-sm font-black text-white font-mono">{selectedUser.ipAddress || 'TERMINATED'}</span>
                            </div>
                            <div className="flex items-center justify-between group">
                               <div className="flex items-center gap-4">
                                  <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 border border-white/5 group-hover:text-amber-500 group-hover:border-amber-500/30 transition-all shadow-xl">
                                    <CheckCircle size={18}/>
                                  </div>
                                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Session Age</span>
                               </div>
                               <span className="text-sm font-black text-white">{selectedUser.age || '--'} Standard Years</span>
                            </div>
                         </div>

                         <div className="pt-10 space-y-4">
                            <button 
                              onClick={() => updateUserStatus(selectedUser.id, selectedUser.status === 'active' ? 'blocked' : 'active')}
                              className={cn(
                                "flex w-full items-center justify-center gap-3 rounded-[24px] py-6 text-[11px] font-black uppercase tracking-[0.3em] transition-all shadow-2xl relative overflow-hidden group",
                                selectedUser.status === 'active' ? "bg-rose-500 text-white shadow-rose-500/20" : "bg-emerald-500 text-white shadow-emerald-500/20"
                              )}
                            >
                               <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12" />
                               {selectedUser.status === 'active' ? <Ban size={20}/> : <CheckCircle size={20}/>}
                               {selectedUser.status === 'active' ? t('admin:revoke_access', 'Revoke Access') : t('admin:authorize_grid', 'Authorize Grid')}
                            </button>
                            <button 
                              className="flex w-full items-center justify-center gap-3 rounded-[24px] border border-white/5 bg-white/5 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 transition-all hover:bg-white/10 hover:text-[#F1D28C] hover:border-amber-500/30"
                            >
                               <Shield size={20} />
                               {t('admin:execute_rights_audit', 'Execute Rights Audit')}
                            </button>
                         </div>
                      </div>
                   </div>
                </motion.div>
             ) : (
                <div className="flex h-[700px] flex-col items-center justify-center rounded-[48px] border-2 border-dashed border-white/5 bg-[#081120] p-12 text-center opacity-40 shadow-inner">
                   <div className="rounded-full bg-white/5 p-10 shadow-2xl mb-10 border border-white/5">
                      <Users size={80} className="text-slate-800" strokeWidth={1} />
                   </div>
                   <h3 className="text-xl font-display font-black text-slate-400 uppercase tracking-[0.3em]">{t('admin:select_profile', 'Select Profile')}</h3>
                   <p className="mt-4 text-xs font-medium text-slate-600 max-w-[200px] mx-auto leading-relaxed">{t('admin:select_profile_tip', 'Detailed intelligence will manifest here once an identity is selected from the grid.')}</p>
                </div>
             )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
