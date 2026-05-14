
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wand2, X, Loader2, Sparkles, Check, RefreshCw } from 'lucide-react';
import { generateLogo } from '../services/aiService';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

interface AILogoGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

const AILogoGenerator: React.FC<AILogoGeneratorProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState('Modern shopping cart icon with abstract geometric lines');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setSuccess(false);
    setError(null);
    try {
      const imageData = await generateLogo(prompt);
      setGeneratedImage(imageData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate logo');
    } finally {
      setIsGenerating(false);
    }
  };

  const compressImage = (base64: string, maxWidth = 512, maxHeight = 512, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Failed to get canvas context'));
        ctx.drawImage(img, 0, 0, width, height);
        // Use JPEG for better compression than PNG for photos/logos
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = (e) => reject(new Error('Failed to load image for compression'));
    });
  };

  const handleApply = async () => {
    if (!generatedImage) return;
    setIsApplying(true);
    try {
      console.log('📦 Compressing image before upload...');
      const compressedImage = await compressImage(generatedImage);
      console.log(`✅ Compressed from ${Math.round(generatedImage.length / 1024)}KB to ${Math.round(compressedImage.length / 1024)}KB`);
      
      await setDoc(doc(db, 'settings', 'appearance'), {
        logoUrl: compressedImage,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        window.location.reload(); 
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError('Failed to apply logo: ' + err.message);
    } finally {
      setIsApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-xl overflow-hidden rounded-[2.5rem] bg-white shadow-2xl"
      >
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                <Sparkles className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight">AI Logo Designer</h2>
                <p className="text-sm font-bold text-blue-100 opacity-80">Powered by Gemini 2.5 Flash</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="rounded-full p-2 hover:bg-white/10 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-8">
          <div className="space-y-6">
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-gray-400">Describe your logo style</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Minimalist shopping bag with vibrant gradient..."
                className="mt-3 w-full min-h-[100px] rounded-2xl border-none bg-gray-50 p-6 font-bold text-gray-700 shadow-inner focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 p-4 text-xs font-bold text-red-600 border border-red-100">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl bg-emerald-50 p-4 text-xs font-bold text-emerald-600 border border-emerald-100 flex items-center gap-2">
                <Check size={14} />
                Success! Site logo updated. Refreshing...
              </div>
            )}

            <div className="flex flex-col gap-6 items-center justify-center min-h-[200px] rounded-3xl border-2 border-dashed border-gray-100 bg-gray-50/50 p-4 relative overflow-hidden">
              {generatedImage ? (
                <div className="relative group">
                  <img 
                    src={generatedImage} 
                    alt="Generated Logo" 
                    className="h-48 w-48 rounded-2xl shadow-xl ring-4 ring-white border border-gray-100"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-2xl backdrop-blur-[2px]">
                    <button 
                      onClick={handleGenerate}
                      className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-blue-600 shadow-lg hover:scale-105 active:scale-95 transition-all"
                    >
                      <RefreshCw size={14} />
                      Regenerate
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className={cn(
                    "mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-xl shadow-blue-100 mb-4 transition-all",
                    isGenerating && "animate-pulse"
                  )}>
                    {isGenerating ? <Loader2 className="animate-spin text-blue-600" size={32} /> : <Wand2 className="text-blue-600" size={32} />}
                  </div>
                  <p className="text-sm font-bold text-gray-400 font-mono tracking-tighter">
                    {isGenerating ? 'Synthesizing...' : 'No logo generated yet'}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-4 p-2">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt}
                className="flex-1 flex h-14 items-center justify-center gap-2 rounded-2xl bg-blue-600 font-black text-white shadow-xl shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
                {generatedImage ? 'Try Different' : 'Generate Logo'}
              </button>
              
              {generatedImage && (
                <button
                  onClick={handleApply}
                  disabled={isApplying}
                  className="flex-1 flex h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-600 font-black text-white shadow-xl shadow-emerald-200 transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                >
                  {isApplying ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                  Apply as Site Logo
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AILogoGenerator;
