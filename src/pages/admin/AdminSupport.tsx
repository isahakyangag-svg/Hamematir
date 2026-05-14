import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MessageSquare, 
  Search, 
  Send, 
  RefreshCw,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  Mic,
  Trash2,
  Play,
  Square,
  FileText,
  Shield,
  Zap,
  CheckCheck
} from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

interface Chat {
  id: string; // roomId OR userId
  userName: string;
  lastMessage: string;
  lastTimestamp: any;
  unreadCount?: number;
  type?: 'support' | 'partner';
}

interface Message {
  id: string;
  text?: string;
  senderId: string;
  senderName: string;
  createdAt: any;
  isAdmin: boolean;
  fileUrl?: string;
  voiceUrl?: string;
  fileType?: string;
  fileName?: string;
}

const AudioPlayer: React.FC<{ url: string }> = ({ url }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.onended = () => setIsPlaying(false);
    }
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="mt-4 flex items-center gap-4 p-4 bg-black/40 rounded-xl border border-white/5 min-w-[240px]">
       <button 
        onClick={togglePlay}
        className="h-12 w-12 flex items-center justify-center rounded-full bg-amber-500 text-black shadow-lg"
       >
         {isPlaying ? <Square size={18} fill="black" /> : <Play size={18} fill="black" />}
       </button>
       <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
         <div className={cn("h-full bg-amber-500 shadow-[0_0_10px_#f59e0b] transition-all duration-300", isPlaying ? "w-full animate-pulse" : "w-0")} />
       </div>
    </div>
  );
};

const AdminSupport: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'support' | 'partner'>('partner');
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch Chat Lists based on Active Tab
  useEffect(() => {
    setLoading(true);
    setChats([]);
    setSelectedChatId(null);

    const unsub = activeTab === 'support' 
      ? onSnapshot(query(collection(db, 'support_messages'), orderBy('createdAt', 'desc')), (snap) => {
          const chatMap: Record<string, Chat> = {};
          snap.docs.forEach(doc => {
            const data = doc.data();
            if (!chatMap[data.userId]) {
              chatMap[data.userId] = {
                id: data.userId,
                userName: data.senderName,
                lastMessage: data.text,
                lastTimestamp: data.createdAt,
                type: 'support'
              };
            }
          });
          setChats(Object.values(chatMap));
          setLoading(false);
        })
      : onSnapshot(query(collection(db, 'chat_rooms'), orderBy('updatedAt', 'desc')), (snap) => {
          setChats(snap.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              userName: data.partnerName || 'Partner',
              lastMessage: data.lastMessage || 'No messages',
              lastTimestamp: data.updatedAt,
              type: 'partner'
            };
          }));
          setLoading(false);
        });

    return () => unsub();
  }, [activeTab]);

  // 2. Fetch Active Chat Messages
  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      return;
    }

    const unsub = activeTab === 'support'
      ? onSnapshot(query(collection(db, 'support_messages'), where('userId', '==', selectedChatId), orderBy('createdAt', 'asc')), (snap) => {
          setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
        })
      : onSnapshot(query(collection(db, `chat_rooms/${selectedChatId}/messages`), orderBy('createdAt', 'asc')), (snap) => {
          setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
        });

    return () => unsub();
  }, [selectedChatId, activeTab]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (payload: any) => {
    if (!selectedChatId || !user) return;

    try {
      if (activeTab === 'support') {
        const supportPath = 'support_messages';
        await addDoc(collection(db, supportPath), {
          ...payload,
          userId: selectedChatId,
          senderId: user.uid,
          senderName: 'Admin',
          isAdmin: true,
          createdAt: serverTimestamp()
        });
      } else {
        const messagesPath = `chat_rooms/${selectedChatId}/messages`;
        await addDoc(collection(db, messagesPath), {
          ...payload,
          senderId: user.uid,
          senderName: 'Admin',
          isAdmin: true,
          createdAt: serverTimestamp(),
          read: false
        });
        
        try {
          await updateDoc(doc(db, 'chat_rooms', selectedChatId), {
            lastMessage: payload.text || 'Attachment',
            updatedAt: serverTimestamp()
          });
        } catch (updateErr) {
          console.warn("Failed to update partner room preview:", updateErr);
        }
      }
      setNewMessage('');
    } catch (err) {
      console.error("Chat error:", err);
      handleFirestoreError(err, OperationType.WRITE, activeTab === 'support' ? 'support_messages' : `chat_rooms/${selectedChatId}/messages`);
    }
  };

  const handleSendText = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim()) return;
    sendMessage({ text: newMessage.trim() });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      await sendMessage({ 
        fileUrl: base64, 
        fileName: file.name,
        fileType: file.type.startsWith('image/') ? 'image' : 'file',
        text: `Sent a ${file.type.startsWith('image/') ? 'photo' : 'file'}: ${file.name}`
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64 = event.target?.result as string;
          await sendMessage({ 
            voiceUrl: base64,
            text: 'Voice message'
          });
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const deleteMessage = async (msgId: string) => {
    if (!selectedChatId || !window.confirm('Delete message?')) return;
    try {
      if (activeTab === 'support') {
        await deleteDoc(doc(db, 'support_messages', msgId));
      } else {
        await deleteDoc(doc(db, `chat_rooms/${selectedChatId}/messages`, msgId));
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex gap-8 text-white">
      {/* Sidebar: Chat List */}
      <div className="w-96 flex flex-col bg-[#081120] rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden group">
         <div className="p-10 border-b border-white/5 bg-[#050816]/30 relative z-10">
            <h2 className="text-2xl font-display font-black text-white tracking-tight uppercase italic">{t('admin:support_title', 'Terminal')}</h2>
            
            {/* Tab Switcher */}
            <div className="flex bg-black/40 rounded-2xl p-1 mt-6 border border-white/5">
               <button 
                onClick={() => setActiveTab('partner')}
                className={cn(
                  "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                  activeTab === 'partner' ? "bg-amber-500 text-black shadow-lg" : "text-white/40 hover:text-white"
                )}
               >
                 {t('admin:support_partners', 'Partners')}
               </button>
               <button 
                onClick={() => setActiveTab('support')}
                className={cn(
                  "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                  activeTab === 'support' ? "bg-amber-500 text-black shadow-lg" : "text-white/40 hover:text-white"
                )}
               >
                 {t('admin:support_users', 'Users')}
               </button>
            </div>
         </div>
         
         <div className="flex-1 overflow-y-auto p-6 space-y-4 relative z-10 scrollbar-hide">
            {loading ? (
              <div className="flex justify-center py-12">
                 <RefreshCw className="animate-spin text-amber-500" size={32} />
              </div>
            ) : chats.length === 0 ? (
               <div className="text-center py-20">
                  <MessageSquare size={32} className="mx-auto text-slate-700 mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">{t('admin:no_active_signals', 'No active signals')}</p>
               </div>
            ) : (
               chats.map((chat) => (
                 <button
                   key={chat.id}
                   onClick={() => setSelectedChatId(chat.id)}
                   className={cn(
                      "w-full p-6 h-32 rounded-[28px] text-left transition-all border group/item relative overflow-hidden flex items-center gap-6",
                      selectedChatId === chat.id 
                        ? "bg-amber-500 border-amber-500 text-black shadow-[0_15px_40px_rgba(245,158,11,0.3)] scale-[1.02]" 
                        : "bg-[#050816]/50 border-white/5 hover:bg-white/5 hover:border-white/10"
                   )}
                 >
                    <div className={cn(
                       "h-16 w-16 shrink-0 rounded-2xl flex items-center justify-center transition-all shadow-inner",
                       selectedChatId === chat.id 
                        ? "bg-black text-amber-500" 
                        : "bg-white/5 text-slate-400 group-hover/item:text-white"
                    )}>
                       {activeTab === 'partner' ? <Zap size={28} /> : <User size={28} />}
                    </div>
                    <div className="flex-1 min-w-0">
                       <h4 className={cn("text-lg font-display font-black uppercase tracking-tight truncate", selectedChatId === chat.id ? "text-black" : "text-white")}>
                          {chat.userName}
                       </h4>
                       <p className={cn("text-[10px] font-bold uppercase tracking-widest truncate mt-1 opacity-60", selectedChatId === chat.id ? "text-black" : "text-slate-400")}>
                          {chat.lastMessage}
                       </p>
                    </div>
                    <div className={cn("h-2 w-2 rounded-full", selectedChatId === chat.id ? "bg-black" : "bg-amber-500 animate-pulse")} />
                 </button>
               ))
            )}
         </div>
      </div>

      {/* Main Chat Window */}
      <div className="flex-1 flex flex-col bg-[#081120] rounded-[48px] border border-white/5 shadow-2xl overflow-hidden relative">
         {!selectedChatId ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-20 bg-[#050816]/30">
               <MessageSquare size={48} className="text-amber-500 mb-8 opacity-20" />
               <h3 className="text-3xl font-display font-black text-white tracking-tight uppercase italic text-white/50">{t('admin:interface_standby', 'Interface Standby')}</h3>
            </div>
         ) : (
            <>
               <div className="p-10 border-b border-white/5 flex items-center justify-between bg-[#050816]/20">
                  <div className="flex items-center gap-6">
                     <div className="h-16 w-16 bg-white/5 rounded-[22px] flex items-center justify-center text-amber-500">
                        {activeTab === 'partner' ? <Zap size={28} /> : <User size={28} />}
                     </div>
                     <div>
                        <h3 className="text-2xl font-display font-black text-white uppercase tracking-tight">
                           {chats.find(c => c.id === selectedChatId)?.userName}
                        </h3>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-green-500">{t('admin:active_session', 'Active Session')}</span>
                     </div>
                  </div>
               </div>

               <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-12 space-y-8 custom-scrollbar">
                  {messages.map((msg) => (
                    <div key={msg.id} className={cn(
                       "flex flex-col max-w-[75%]",
                       msg.isAdmin ? "ml-auto items-end" : "mr-auto"
                    )}>
                       <div className={cn(
                          "group relative p-8 rounded-[32px] text-sm font-medium leading-relaxed shadow-2xl",
                          msg.isAdmin 
                            ? "bg-gradient-to-br from-[#0B1220] to-[#050816] text-[#F1D28C] rounded-tr-none border border-amber-500/20" 
                            : "bg-white/5 text-white rounded-tl-none border border-white/5"
                       )}>
                          {msg.text && <div>{msg.text}</div>}
                          
                          {msg.fileUrl && (
                            <div className="mt-4">
                               {msg.fileType === 'image' ? (
                                 <img src={msg.fileUrl} alt="attach" className="max-w-full rounded-2xl border border-white/10" />
                               ) : (
                                 <div className="flex items-center gap-3 p-4 bg-black/40 rounded-xl border border-white/5">
                                    <FileText size={20} />
                                    <span className="text-xs truncate">{msg.fileName}</span>
                                 </div>
                               )}
                            </div>
                          )}

                          {msg.voiceUrl && (
                            <AudioPlayer url={msg.voiceUrl} />
                          )}

                          <button 
                            onClick={() => deleteMessage(msg.id)}
                            className="absolute -top-2 -right-2 p-3 rounded-xl bg-rose-500/10 text-rose-500 opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:text-white transition-all shadow-xl"
                          >
                            <Trash2 size={16} />
                          </button>
                       </div>
                       <div className="mt-3 px-2 flex items-center gap-3">
                          <span className="text-[10px] font-black uppercase text-white/20">
                             {msg.senderName} • {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                       </div>
                    </div>
                  ))}
               </div>

               <div className="p-10 bg-[#050816]/50 border-t border-white/5">
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                  
                  <div className="bg-[#0b1220] p-3 rounded-[32px] flex items-center gap-4 border border-white/5 shadow-inner">
                     <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="h-14 w-14 flex items-center justify-center rounded-2xl text-white/20 hover:text-amber-500 hover:bg-white/5 transition-all"
                     >
                        <Paperclip size={24} />
                     </button>
                     
                     <input 
                        type="text"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder={t('admin:type_reply', 'Type reply...')}
                        className="flex-1 bg-transparent border-none text-sm font-bold text-white px-4 h-14"
                        onKeyPress={e => e.key === 'Enter' && handleSendText()}
                     />

                     <div className="flex items-center gap-3">
                        <button 
                          onMouseDown={startRecording}
                          onMouseUp={stopRecording}
                          onMouseLeave={stopRecording}
                          className={cn(
                            "h-14 w-14 flex items-center justify-center rounded-2xl transition-all",
                            isRecording ? "bg-rose-500 text-white animate-pulse" : "text-white/20 hover:text-amber-500 hover:bg-white/5"
                          )}
                        >
                           {isRecording ? <Square size={20} /> : <Mic size={24} />}
                        </button>
                        
                        <button 
                           onClick={() => handleSendText()}
                           className="h-16 px-10 bg-amber-500 text-black rounded-[24px] flex items-center justify-center gap-3 shadow-xl hover:scale-105 active:scale-95 transition-all text-xs font-black uppercase"
                        >
                           <Send size={18} />
                           {t('admin:send_msg', 'Send')}
                        </button>
                     </div>
                  </div>
               </div>
            </>
         )}
      </div>
    </div>
  );
};

export default AdminSupport;
