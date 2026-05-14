import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { 
  User, 
  LogOut, 
  Heart, 
  Clock, 
  Settings, 
  Shield, 
  ShoppingBag,
  Search,
  MessageSquare,
  HelpCircle,
  Phone,
  Mail,
  Edit,
  Send,
  Zap,
  Layout,
  Briefcase,
  FileText,
  ChevronRight,
  RefreshCw,
  Info,
  Calendar,
  CreditCard,
  History,
  Newspaper,
  X,
  CheckCircle2,
  Trash
} from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { cn } from '../lib/utils';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';

const Profile: React.FC = () => {
  const { user, loading, logout, isAdmin, isPartner, isOwner } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [userData, setUserData] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    gender: 'Мужской',
    birthday: '',
    phone: '',
    photoURL: '',
    documentInfo: '',
    newPassword: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Chat Logic
  useEffect(() => {
    if (!user) return;

    // Fetch extra user data
    const fetchUserData = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData(data);
          setEditFormData({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            middleName: data.middleName || '',
            gender: data.gender || 'Мужской',
            birthday: data.birthday || '',
            phone: data.phone || data.mobilePhone || '+374 ',
            photoURL: data.photoURL || user.photoURL || '',
            documentInfo: data.documentInfo || '',
            newPassword: ''
          });
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };

    fetchUserData();

    const q = query(
      collection(db, 'support_messages'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (!window.confirm('Вы уверены, что хотите полностью удалить свои данные? Это действие необратимо.')) return;

    setIsDeleting(true);
    try {
      // 1. Delete user document from Firestore
      const userRef = doc(db, 'users', user.uid);
      await deleteDoc(userRef);

      // 2. Delete support messages related to this user
      const q = query(collection(db, 'support_messages'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();

      // 3. Logout
      await logout();
      navigate('/');
    } catch (err) {
      console.error("Account deletion error:", err);
      alert("Ошибка при удалении аккаунта. Возможно, требуется повторный вход в систему.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      
      const displayName = `${editFormData.firstName} ${editFormData.lastName}`.trim() || user.displayName;

      const updates: any = {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        middleName: editFormData.middleName,
        gender: editFormData.gender,
        birthday: editFormData.birthday,
        phone: editFormData.phone,
        documentInfo: editFormData.documentInfo,
        displayName: displayName,
        photoURL: editFormData.photoURL,
        updatedAt: serverTimestamp()
      };

      try {
        await updateDoc(userRef, updates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
      
      // Update Auth Profile too
      if (editFormData.photoURL !== user.photoURL || displayName !== user.displayName) {
        await updateProfile(user, {
          displayName: displayName,
          photoURL: editFormData.photoURL
        });
      }

      setUserData({ ...userData, ...updates });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditModalOpen(false);
      }, 1500);
    } catch (err) {
      console.error("Profile update error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      await addDoc(collection(db, 'support_messages'), {
        text: newMessage.trim(),
        userId: user.uid,
        senderId: user.uid,
        senderName: user.displayName || 'User',
        isAdmin: false,
        createdAt: serverTimestamp()
      });
      setNewMessage('');
    } catch (err) {
      console.error("Chat error:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <RefreshCw className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-10 pb-24">
      {/* Top Navigation Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2.5rem] bg-white p-4 shadow-sm border border-gray-100">
         <div className="flex items-center gap-2">
            <Link to="/help" className="flex items-center gap-2 rounded-2xl bg-gray-50 px-4 py-2 text-xs font-black uppercase text-gray-500 hover:bg-gray-100 transition-all">
               <HelpCircle size={14} />
               Помощь
            </Link>
            <Link to="/contacts" className="flex items-center gap-2 rounded-2xl bg-gray-50 px-4 py-2 text-xs font-black uppercase text-gray-500 hover:bg-gray-100 transition-all">
               <Phone size={14} />
               Контакты
            </Link>
            <Link to="/about" className="flex items-center gap-2 rounded-2xl bg-gray-50 px-4 py-2 text-xs font-black uppercase text-gray-500 hover:bg-gray-100 transition-all">
               <Info size={14} />
               О компании
            </Link>
         </div>

         <div className="flex items-center gap-2">
            {(isPartner || isOwner) && (
              <Link to="/partner" className="flex items-center gap-2 rounded-2xl bg-indigo-50 px-6 py-2.5 text-xs font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-100 transition-all active:scale-95 shadow-sm border border-indigo-100">
                 <Briefcase size={14} />
                 Панель партнера
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin" className="flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">
                 <Shield size={14} />
                 Admin Panel
              </Link>
            )}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-2xl bg-red-50 px-6 py-2.5 text-xs font-black uppercase tracking-widest text-red-600 hover:bg-red-100 transition-all active:scale-95"
            >
               <LogOut size={14} />
               Выйти
            </button>
         </div>
      </div>

      {/* Hero Profile Info Section */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
         <div className="relative overflow-hidden rounded-[3rem] bg-white p-8 shadow-xl border border-gray-100 flex flex-col items-center text-center">
            <div className="absolute top-0 h-24 w-full bg-gradient-to-br from-gray-900 to-gray-800" />
            <div className="relative mt-8">
               <div className="h-32 w-32 rounded-[2.5rem] border-4 border-white shadow-2xl bg-gray-100 flex items-center justify-center overflow-hidden">
                  <img 
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                    alt={user.displayName || 'User'} 
                    className="h-full w-full object-cover"
                  />
               </div>
               <div className="absolute bottom-1 right-1 h-6 w-6 rounded-full border-4 border-white bg-green-500 shadow-lg" />
            </div>
            
            <h2 className="mt-6 text-3xl font-black text-gray-900 tracking-tight">{user.displayName}</h2>
            
            <div className="mt-8 w-full space-y-4 text-left border-t border-gray-50 pt-8 px-4">
               <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                     <Phone size={18} />
                  </div>
                  <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Mobile Phone</p>
                     <p className="text-sm font-bold text-gray-700">{userData?.phone || userData?.mobilePhone || '+374 457-34-22'}</p>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                     <Mail size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                     <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email Address</p>
                     <p className="text-sm font-bold text-gray-700 truncate">{user.email}</p>
                  </div>
               </div>
            </div>
         </div>

         <div className="lg:col-span-2 rounded-[3rem] bg-white border border-gray-100 shadow-xl p-10 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8">
               <button 
                onClick={() => setIsEditModalOpen(true)}
                className="flex h-12 items-center gap-2 rounded-2xl bg-gray-50 px-6 text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition-all shadow-sm"
               >
                  <Settings size={16} />
                  Настройки
               </button>
            </div>
            
            <h3 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
               <User size={24} className="text-indigo-600" />
               Личная информация
            </h3>

            <div className="mt-12 grid grid-cols-2 gap-y-8 gap-x-12">
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Пол</p>
                  <p className="text-lg font-bold text-gray-900">{userData?.gender || 'Мужской'}</p>
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Дата рождения</p>
                  <p className="text-lg font-bold text-gray-900">{userData?.birthday || '08 апреля 1968'}</p>
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Фамилия</p>
                  <p className="text-lg font-bold text-gray-900">{userData?.lastName || '-'}</p>
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Имя</p>
                  <p className="text-lg font-bold text-gray-900">{userData?.firstName || user.displayName?.split(' ')[0]}</p>
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Отчество</p>
                  <p className="text-lg font-bold text-gray-900">{userData?.middleName || '-'}</p>
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Документ</p>
                  <p className="text-lg font-bold text-gray-900">{userData?.documentInfo || '-'}</p>
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Статус аккаунта</p>
                  <p className="text-lg font-bold text-green-600 uppercase tracking-tighter">Верифицирован</p>
               </div>
            </div>

            <div className="mt-auto pt-10 border-t border-gray-50 flex items-center gap-2">
               <div className="h-2 w-2 rounded-full bg-green-500" />
               <span className="text-[10px] font-black uppercase tracking-widest text-green-600">Система активна</span>
            </div>
         </div>
      </section>

      {/* Action Blocks */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
         <div className="group relative overflow-hidden rounded-[3rem] bg-white p-10 shadow-xl border border-gray-100 hover:shadow-blue-600/5 transition-all">
            <div className="relative z-10">
               <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110">
                  <Zap size={32} />
               </div>
               <h3 className="text-2xl font-black text-gray-900 mb-2">Стать партнером</h3>
               <p className="text-gray-500 font-bold leading-relaxed mb-8">
                  Откройте новые возможности для своего бизнеса прямо сейчас. Узнайте больше о партнерской программе.
               </p>
               <Link to="/partnership" className="flex items-center gap-2 font-black text-blue-600 hover:translate-x-2 transition-transform uppercase text-xs tracking-widest bg-blue-50 px-6 py-3 rounded-xl mt-4 self-start">
                  Подробнее <ChevronRight size={18} />
               </Link>
            </div>
         </div>

         <div className="group relative overflow-hidden rounded-[3rem] bg-white p-10 shadow-xl border border-gray-100 hover:shadow-indigo-600/5 transition-all">
            <div className="relative z-10">
               <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 transition-transform group-hover:scale-110">
                  <Layout size={32} />
               </div>
               <h3 className="text-2xl font-black text-gray-900 mb-2">Заказать баннер</h3>
               <p className="text-gray-500 font-bold leading-relaxed mb-8">
                  Привлекайте в 3 раза больше клиентов с помощью нашей системы рекламных баннеров на главной странице.
               </p>
               <Link to="/advertising" className="flex items-center gap-2 font-black text-indigo-600 hover:translate-x-2 transition-transform uppercase text-xs tracking-widest bg-indigo-50 px-6 py-3 rounded-xl mt-4 self-start">
                  Заказать <ChevronRight size={18} />
               </Link>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
         {/* Support Chat */}
         <div className="lg:col-span-1 flex flex-col h-[600px] rounded-[3rem] bg-white border border-gray-100 shadow-xl overflow-hidden self-start sticky top-24">
            <div className="p-8 border-b border-gray-50 bg-indigo-600 text-white">
               <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                     <MessageSquare size={20} />
                  </div>
                  <div>
                    <h3 className="font-black leading-tight">Поддержка</h3>
                    <p className="text-[10px] font-black uppercase opacity-60">Tech Support Online</p>
                  </div>
               </div>
            </div>
            
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
               {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4">
                     <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm mb-4">
                        <MessageSquare size={24} />
                     </div>
                     <p className="text-xs font-bold text-gray-400">У вас есть вопрос? Напишите нам прямо здесь.</p>
                  </div>
               ) : messages.map((msg: any) => (
                  <div key={msg.id} className={cn(
                     "flex flex-col max-w-[85%]",
                     !msg.isAdmin ? "ml-auto items-end" : "mr-auto"
                  )}>
                     <div className={cn(
                        "p-4 rounded-[20px] text-xs font-bold shadow-sm",
                        !msg.isAdmin ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white text-gray-900 rounded-tl-none border border-gray-100"
                     )}>
                        {msg.text}
                     </div>
                  </div>
               ))}
            </div>

            <form onSubmit={handleSendMessage} className="p-6 border-t border-gray-50">
               <div className="flex items-center gap-2">
                  <input 
                     type="text"
                     value={newMessage}
                     onChange={e => setNewMessage(e.target.value)}
                     placeholder="Введите текст..."
                     className="flex-1 rounded-2xl border-none bg-gray-50 px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-600/10 transition-all"
                  />
                  <button className="h-10 w-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-100">
                     <Send size={16} />
                  </button>
               </div>
            </form>
         </div>

         {/* Center Column - Clean Layout */}
         <div className="lg:col-span-2 space-y-8">
            <div className="rounded-[3rem] bg-slate-900 p-12 text-white shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Shield size={120} />
               </div>
               <div className="relative z-10">
                  <h3 className="text-3xl font-black mb-4 tracking-tighter">Безопасность вашего аккаунта</h3>
                  <p className="text-slate-400 font-bold leading-relaxed mb-8 max-w-md">
                     Мы обеспечиваем максимальную защиту ваших данных. Все изменения подтверждаются системой безопасности.
                  </p>
                  <div className="flex gap-4">
                     <div className="px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 text-xs font-black uppercase tracking-widest">
                        SSL Защита
                     </div>
                     <div className="px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 text-xs font-black uppercase tracking-widest">
                        2FA Ready
                     </div>
                  </div>
               </div>
            </div>

            <div className="rounded-[3rem] bg-indigo-600 p-12 text-white shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Zap size={120} />
               </div>
               <div className="relative z-10">
                  <h3 className="text-3xl font-black mb-4 tracking-tighter">Ваш персональный ассистент</h3>
                  <p className="text-indigo-100 font-bold leading-relaxed mb-8 max-w-md">
                     Свяжитесь с нами в чате слева, если у вас возникли сложности с настройкой профиля.
                  </p>
               </div>
            </div>
         </div>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[3.5rem] bg-white shadow-2xl flex flex-col"
            >
              <div className="bg-slate-900 p-10 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/50">
                    <Settings className="animate-spin-slow" size={24} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black tracking-tighter uppercase">Настройки профиля</h2>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Персональное управление данными</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-95"
                >
                  <X size={28} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-12 scrollbar-hide">
                <form id="profile-form" onSubmit={handleUpdateProfile} className="space-y-12">
                   
                   {/* Photo Section */}
                   <div className="flex flex-col md:flex-row items-center gap-10 bg-slate-50 p-8 rounded-[2.5rem]">
                      <div className="relative group">
                         <div className="h-32 w-32 rounded-[2.5rem] bg-white shadow-xl overflow-hidden border-4 border-white transition-transform group-hover:scale-105">
                            <img src={editFormData.photoURL || user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} className="h-full w-full object-cover" />
                         </div>
                      </div>
                      <div className="flex-1 w-full space-y-4">
                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2">Ссылка на фото профиля</label>
                         <input 
                           type="text" 
                           value={editFormData.photoURL}
                           onChange={e => setEditFormData({...editFormData, photoURL: e.target.value})}
                           placeholder="https://example.com/photo.jpg"
                           className="w-full bg-white rounded-2xl px-6 py-4 text-sm font-bold border border-slate-100 focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all"
                         />
                      </div>
                   </div>

                   {/* Personal Info Grid */}
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2">Фамилия</label>
                         <input 
                           type="text" 
                           value={editFormData.lastName}
                           onChange={e => setEditFormData({...editFormData, lastName: e.target.value})}
                           className="w-full bg-slate-50 rounded-2xl px-6 py-4 text-sm font-bold border border-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                         />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2">Имя</label>
                         <input 
                           type="text" 
                           value={editFormData.firstName}
                           onChange={e => setEditFormData({...editFormData, firstName: e.target.value})}
                           className="w-full bg-slate-50 rounded-2xl px-6 py-4 text-sm font-bold border border-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                         />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2">Отчество</label>
                         <input 
                           type="text" 
                           value={editFormData.middleName}
                           onChange={e => setEditFormData({...editFormData, middleName: e.target.value})}
                           className="w-full bg-slate-50 rounded-2xl px-6 py-4 text-sm font-bold border border-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                         />
                      </div>

                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2">Пол</label>
                         <select 
                           value={editFormData.gender}
                           onChange={e => setEditFormData({...editFormData, gender: e.target.value})}
                           className="w-full bg-slate-50 rounded-2xl px-6 py-4 text-sm font-bold border border-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all appearance-none"
                         >
                            <option value="Мужской">Мужской</option>
                            <option value="Женский">Женский</option>
                         </select>
                      </div>

                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2">Дата рождения</label>
                         <input 
                           type="text" 
                           value={editFormData.birthday}
                           placeholder="ДД.ММ.ГГГГ"
                           onChange={e => setEditFormData({...editFormData, birthday: e.target.value})}
                           className="w-full bg-slate-50 rounded-2xl px-6 py-4 text-sm font-bold border border-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                         />
                      </div>

                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2">Номер телефона</label>
                         <input 
                           type="tel" 
                           value={editFormData.phone}
                           onChange={e => setEditFormData({...editFormData, phone: e.target.value})}
                           className="w-full bg-slate-50 rounded-2xl px-6 py-4 text-sm font-bold border border-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                         />
                      </div>

                      <div className="space-y-3 md:col-span-3">
                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2">Документ (Паспорт / ID)</label>
                         <input 
                           type="text" 
                           value={editFormData.documentInfo}
                           placeholder="Например: Паспорт РФ 1816-344535"
                           onChange={e => setEditFormData({...editFormData, documentInfo: e.target.value})}
                           className="w-full bg-slate-50 rounded-2xl px-6 py-4 text-sm font-bold border border-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                         />
                      </div>
                   </div>

                   <div className="pt-8 border-t border-slate-100">
                      <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex gap-4">
                         <Shield className="text-amber-500 shrink-0" size={24} />
                         <div>
                            <p className="text-sm font-black text-amber-900 mb-1 tracking-tight">Внимание!</p>
                            <p className="text-xs font-bold text-amber-700 leading-relaxed">
                               Для смены пароля или email адреса, пожалуйста, воспользуйтесь формой восстановления на странице входа или свяжитесь с поддержкой.
                            </p>
                         </div>
                      </div>
                   </div>
                </form>
              </div>

              <div className="p-10 bg-slate-50 flex flex-wrap gap-4 shrink-0">
                <button 
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="px-6 py-5 rounded-[2rem] bg-red-50 text-red-600 font-black uppercase tracking-widest text-xs hover:bg-red-100 transition-all active:scale-95 flex items-center gap-2"
                >
                  <Trash size={16} />
                  Удалить аккаунт
                </button>
                <div className="flex-1" />
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-10 py-5 rounded-[2rem] bg-white border border-slate-200 text-slate-500 font-black uppercase tracking-widest text-xs hover:bg-slate-100 transition-all active:scale-95"
                >
                  Отмена
                </button>
                <button 
                   form="profile-form"
                   disabled={isSaving}
                   className="px-12 py-5 rounded-[2rem] bg-blue-600 text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  {isSaving ? 'Сохранение...' : (
                    <>
                      <CheckCircle2 size={18} />
                      Сохранить данные
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
         {saveSuccess && (
           <motion.div 
             initial={{ opacity: 0, y: 50, scale: 0.8 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, y: 50, scale: 0.8 }}
             className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] bg-emerald-600 text-white px-10 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-4 font-black uppercase tracking-widest text-xs"
           >
              <CheckCircle2 size={24} />
              Данные профиля обновлены
           </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
