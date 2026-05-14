import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';

const ErrorPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-10 text-center space-y-8"
      >
        <div className="h-24 w-24 mx-auto rounded-[32px] bg-rose-50 text-rose-500 flex items-center justify-center">
          <AlertCircle size={48} strokeWidth={2.5} />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">System Anomaly</h1>
          <p className="text-slate-400 font-medium leading-relaxed">
            We encountered an unexpected error while processing your request. Our engineers have been notified.
          </p>
        </div>

        <div className="pt-4">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 h-14 px-8 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <ChevronLeft size={18} />
            Return Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ErrorPage;
