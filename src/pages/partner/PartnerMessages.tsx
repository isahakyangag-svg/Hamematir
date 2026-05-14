import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Paperclip, 
  Mic, 
  Smile, 
  MoreVertical, 
  Search, 
  CheckCheck,
  User,
  Shield,
  Zap,
  Phone,
  Video,
  X,
  Plus,
  DollarSign,
  MessageSquare,
  Trash2,
  Image as ImageIcon,
  FileText,
  Play,
  Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  where,
  deleteDoc,
  doc,
  setDoc,
  updateDoc,
  getDocs
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';

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
    <div className="mt-2 relative z-10 flex items-center gap-4 p-3 bg-black/20 rounded-xl border border-white/10 min-w-[200px]">
       <button 
        onClick={togglePlay}
        className="h-10 w-10 flex items-center justify-center rounded-full bg-amber-500 text-black shadow-lg"
       >
         {isPlaying ? <Square size={16} fill="black" /> : <Play size={16} fill="black" />}
       </button>
       <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
         <div className={cn("h-full bg-amber-500 shadow-[0_0_10px_#f59e0b] transition-all duration-300", isPlaying ? "w-full animate-pulse" : "w-0")} />
       </div>
       <span className="text-[10px] opacity-50 uppercase font-black">Voice</span>
    </div>
  );
};

const PartnerMessages: React.FC = () => {
  const { user } = useAuth();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Initialize or get the Admin Chat Room for this partner
  useEffect(() => {
    if (!user) return;

    const initializeRoom = async () => {
      try {
        const roomsRef = collection(db, 'chat_rooms');
        const q = query(roomsRef, where('partnerId', '==', user.uid), where('type', '==', 'admin_support'));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const roomDocs = querySnapshot.docs;
          setRoomId(roomDocs[0].id);
          
          // Cleanup: if there are multiple rooms, delete the extra ones
          if (roomDocs.length > 1) {
            console.warn(`Found ${roomDocs.length} support rooms. Cleaning up extras...`);
            for (let i = 1; i < roomDocs.length; i++) {
              await deleteDoc(doc(db, 'chat_rooms', roomDocs[i].id));
            }
          }
        } else {
          // Create new room if none exists
          const newRoomRef = doc(collection(db, 'chat_rooms'));
          await setDoc(newRoomRef, {
            partnerId: user.uid,
            partnerName: user.displayName || 'Partner',
            lastMessage: 'Chat established',
            updatedAt: serverTimestamp(),
            type: 'admin_support'
          });
          setRoomId(newRoomRef.id);
        }
      } catch (err) {
        console.error("Chat initialization failed:", err);
        // Important: don't set roomId if creation failed
        handleFirestoreError(err, OperationType.WRITE, 'chat_rooms');
      }
    };

    initializeRoom();
  }, [user]);

  // 2. Listen to messages
  useEffect(() => {
    if (!roomId) return;

    const q = query(
      collection(db, `chat_rooms/${roomId}/messages`),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `chat_rooms/${roomId}/messages`));

    return () => unsub();
  }, [roomId]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (payload: any) => {
    if (!roomId || !user) return;
    try {
      const messagesPath = `chat_rooms/${roomId}/messages`;
      await addDoc(collection(db, messagesPath), {
        ...payload,
        senderId: user.uid,
        senderName: user.displayName || 'Partner',
        isAdmin: false,
        createdAt: serverTimestamp(),
        read: false
      });
      
      try {
        await updateDoc(doc(db, 'chat_rooms', roomId), {
          lastMessage: payload.text || 'Attachment',
          updatedAt: serverTimestamp()
        });
      } catch (updateErr) {
        console.warn("Failed to update room preview:", updateErr);
        // We don't necessarily want to fail the whole message send if just the preview update fails
      }
      
      setMessageText('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `chat_rooms/${roomId}/messages`);
    }
  };

  const handleSendText = () => {
    if (!messageText.trim()) return;
    sendMessage({ text: messageText.trim() });
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
    if (!window.confirm('Delete message?')) return;
    try {
      await deleteDoc(doc(db, `chat_rooms/${roomId}/messages`, msgId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `chat_rooms/${roomId}/messages/${msgId}`);
    }
  };

  const activeRoom = {
    name: 'Администрация (Главная)',
    online: true,
    type: 'admin'
  };

  return (
    <div className="h-[calc(100vh-220px)] flex bg-[#0B1220]/50 backdrop-blur-3xl border border-white/5 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] overflow-hidden relative">
      {/* Sidebar - Rooms List (Simplified to 1 Room) */}
      <div className="w-96 border-r border-white/5 flex flex-col bg-[#0B1220]/30 hidden lg:flex">
        <div className="p-8 border-b border-white/5 bg-[#0B1220]/50">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Ваши чаты</h3>
           </div>
        </div>

        <div className="p-4">
           <button
              className="w-full flex gap-5 p-5 rounded-[2rem] transition-all duration-500 relative group overflow-hidden text-black shadow-[0_10px_30px_rgba(197,160,89,0.2)]"
           >
             <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-[#F1D28C] to-[#8B6E32] z-0" />
             <div className="relative shrink-0 z-10">
                <div className="h-14 w-14 rounded-2xl flex items-center justify-center border bg-black/10 border-black/10">
                   <Shield size={24} className="text-black" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-4 shadow-xl bg-black border-[#F1D28C]" />
             </div>

             <div className="flex-1 min-w-0 text-left relative z-10">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-sm font-black truncate uppercase tracking-tight text-black">Чат с администрацией</span>
                </div>
                <p className="text-[11px] font-black truncate uppercase tracking-widest text-black/80">
                  {messages.length > 0 ? messages[messages.length - 1].text : 'Активен'}
                </p>
             </div>
           </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col relative bg-[#050816]/30 backdrop-blur-3xl">
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />

        {roomId ? (
          <>
            {/* Header */}
            <div className="h-24 flex items-center justify-between px-10 border-b border-white/5 relative z-10 bg-black/10 backdrop-blur-md">
               <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500 to-[#8B6E32] p-0.5 shadow-xl">
                       <div className="w-full h-full bg-[#0B1220] rounded-xl flex items-center justify-center text-amber-500">
                        <Shield size={20} />
                       </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-[#0B1220] shadow-xl" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Администрация</h3>
                    <div className="flex items-center gap-2 mt-1">
                       <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,1)]" />
                       <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">В сети</span>
                    </div>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  <button className="h-11 w-11 flex items-center justify-center rounded-xl bg-white/5 text-white/20 hover:text-white hover:bg-white/10 transition-all border border-white/5 shadow-xl"><Phone size={18} /></button>
                  <button className="h-11 w-11 flex items-center justify-center rounded-xl bg-white/5 text-white/20 hover:text-white hover:bg-white/10 transition-all border border-white/5 shadow-xl"><Video size={18} /></button>
                  <button className="h-11 w-11 flex items-center justify-center rounded-xl bg-white/5 text-white/20 hover:text-white hover:bg-white/10 transition-all border border-white/5 shadow-xl"><MoreVertical size={18} /></button>
               </div>
            </div>

            {/* Messages Scroll Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-8 relative z-10"
            >
               {messages.map((msg, idx) => (
                 <motion.div 
                   initial={{ opacity: 0, y: 20, scale: 0.95 }}
                   animate={{ opacity: 1, y: 0, scale: 1 }}
                   key={msg.id}
                   className={cn(
                     "flex flex-col max-w-[75%]",
                     msg.senderId === user.uid ? "ml-auto items-end" : "mr-auto items-start"
                   )}
                 >
                    <div className={cn(
                      "group relative p-6 rounded-[2rem] text-[13px] font-black leading-relaxed shadow-2xl overflow-hidden",
                      msg.senderId === user.uid 
                        ? "bg-gradient-to-br from-amber-500 via-[#F1D28C] to-[#8B6E32] text-black rounded-tr-none shadow-amber-500/20" 
                        : "bg-[#0B1220] text-white/80 border border-white/5 rounded-tl-none shadow-black/40"
                    )}>
                      {msg.senderId === user.uid && <div className="absolute inset-0 bg-white/10 opacity-20 pointer-events-none" />}
                      
                      {/* Message Content */}
                      {msg.text && <p className="relative z-10">{msg.text}</p>}
                      
                      {msg.fileUrl && (
                        <div className="mt-2 relative z-10">
                          {msg.fileType === 'image' ? (
                            <img src={msg.fileUrl} alt="uploaded" className="max-w-full rounded-2xl border border-white/10" />
                          ) : (
                            <div className="flex items-center gap-3 p-3 bg-black/20 rounded-xl border border-white/10">
                               <FileText size={20} />
                               <span className="text-[10px] truncate max-w-[150px]">{msg.fileName}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {msg.voiceUrl && (
                        <AudioPlayer url={msg.voiceUrl} />
                      )}

                      {/* Delete Action */}
                      <button 
                        onClick={() => deleteMessage(msg.id)}
                        className="absolute top-2 right-2 p-2 rounded-lg bg-black/20 text-black/40 opacity-0 group-hover:opacity-100 hover:text-rose-500 hover:bg-rose-500/20 transition-all z-20"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center gap-3 px-2">
                       <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                          {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </span>
                       {msg.senderId === user.uid && (
                         <div className={cn("flex items-center", msg.read ? "text-amber-500" : "text-white/10")}>
                           <CheckCheck size={14} strokeWidth={3} />
                         </div>
                       )}
                    </div>
                 </motion.div>
               ))}
            </div>

            {/* Input Area */}
            <div className="p-10 border-t border-white/10 relative z-10 bg-black/20 backdrop-blur-xl">
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 className="hidden" 
                 onChange={handleFileUpload}
               />
               
               <div className="relative flex items-center gap-4 p-3 bg-white/5 border border-white/5 rounded-[2.5rem] focus-within:bg-white/[0.08] focus-within:ring-2 focus-within:ring-amber-500/40 transition-all duration-300 shadow-inner group">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="h-12 w-12 flex items-center justify-center rounded-2xl text-white/20 hover:text-amber-500 hover:bg-amber-500/10 transition-all"
                  >
                    <Paperclip size={22} />
                  </button>
                  
                  <input 
                    type="text" 
                    placeholder={isRecording ? "Recording voice message..." : "Ваше сообщение..."}
                    className="flex-1 bg-transparent border-none outline-none text-xs font-black uppercase tracking-widest text-white placeholder:text-white/20 disabled:opacity-50"
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    disabled={isRecording}
                    onKeyPress={e => e.key === 'Enter' && handleSendText()}
                  />

                  <div className="flex items-center gap-2">
                    {messageText.length === 0 ? (
                      <button 
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        onMouseLeave={stopRecording}
                        className={cn(
                          "h-12 w-12 flex items-center justify-center rounded-2xl transition-all",
                          isRecording ? "bg-rose-500 text-white animate-pulse" : "text-white/20 hover:text-amber-500"
                        )}
                      >
                        {isRecording ? <Square size={20} /> : <Mic size={22} />}
                      </button>
                    ) : (
                      <button 
                        onClick={handleSendText}
                        className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 via-[#F1D28C] to-[#8B6E32] text-black stroke-black flex items-center justify-center shadow-2xl shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all"
                      >
                        <Send size={24} strokeWidth={3} />
                      </button>
                    )}
                  </div>
               </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-20 relative">
             <div className="absolute inset-0 bg-[#C5A059]/5 blur-[120px] rounded-full pointer-events-none" />
             <MessageSquare size={54} className="text-amber-500/20 mb-8" />
             <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Initializing Chat</h3>
             <p className="text-[10px] font-black text-white/20 mt-2 uppercase tracking-[0.3em]">Connecting to Admin Terminal...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerMessages;
