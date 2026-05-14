import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Github, 
  ExternalLink, 
  RefreshCw, 
  Code, 
  Search, 
  User as UserIcon,
  AlertCircle,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { cn } from '../../lib/utils';

interface GithubRepo {
  id: number;
  name: string;
  description: string;
  html_url: string;
  updated_at: string;
  stargazers_count: number;
  language: string;
}

interface GithubUser {
  login: string;
  avatar_url: string;
}

const AdminMyCodes: React.FC = () => {
  const { t } = useTranslation();
  const [token, setToken] = useState<string | null>(localStorage.getItem('github_token'));
  const [user, setUser] = useState<GithubUser | null>(() => {
    const saved = localStorage.getItem('github_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleConnect = async () => {
    try {
      const response = await fetch('/api/auth/github/url');
      const { url } = await response.json();
      
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        url,
        'github_oauth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        setError('Popup blocked. Please check your browser settings.');
      }
    } catch (err) {
      setError('Failed to initiate GitHub connection');
    }
  };

  const fetchRepos = async (accessToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('https://api.github.com/user/repos', {
        headers: { Authorization: `token ${accessToken}` },
        params: { sort: 'updated', per_page: 100 }
      });
      setRepos(response.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        // Token expired
        setToken(null);
        setUser(null);
        localStorage.removeItem('github_token');
        localStorage.removeItem('github_user');
        setError('Your GitHub session has expired. Please reconnect.');
      } else {
        setError('Could not load GitHub repositories. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GITHUB_AUTH_SUCCESS') {
        const { accessToken, user } = event.data;
        setToken(accessToken);
        setUser(user);
        localStorage.setItem('github_token', accessToken);
        localStorage.setItem('github_user', JSON.stringify(user));
        fetchRepos(accessToken);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (token) {
      fetchRepos(token);
    }
  }, []);

  const filteredRepos = repos.filter(repo => 
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-6xl space-y-12 pb-20 text-white">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between px-2">
        <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-4xl font-display font-black tracking-tight text-white uppercase italic leading-none">
            {token ? 'Мои Коды' : 'GitHub Connection'}
          </h1>
          <p className="mt-3 text-sm font-medium text-white/60 uppercase tracking-widest">
            {token ? 'Manage and monitor your GitHub repositories repository matrix' : 'Connect your workspace to the repository grid'}
          </p>
        </motion.div>

        {token && (
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-3 px-6 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/5 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Connected: {user?.login}
             </div>
             <button 
               onClick={() => fetchRepos(token)}
               disabled={loading}
               className="flex h-12 items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-6 text-slate-300 transition-all hover:bg-white/10 hover:text-white active:scale-95 shadow-xl"
             >
                <RefreshCw size={18} className={cn(loading && "animate-spin")} />
                <span className="text-[11px] font-black uppercase tracking-widest">Обновить</span>
             </button>
          </div>
        )}
      </header>

      {!token ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-32 rounded-[48px] bg-[#081120] border border-white/5 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A059] blur-[120px] opacity-[0.03]" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 blur-[120px]" />
          
          <div className="relative flex flex-col items-center max-w-md text-center px-10">
             <div className="h-24 w-24 rounded-[32px] bg-white/5 border border-white/10 flex items-center justify-center text-[#C5A059] mb-8 shadow-inner ring-4 ring-[#C5A059]/10">
                <Github size={48} />
             </div>
             <h2 className="text-3xl font-display font-black text-white uppercase tracking-tight italic mb-4">Repository Grid Offline</h2>
             <p className="text-sm font-medium text-slate-500 leading-relaxed uppercase tracking-widest opacity-60 mb-10">
               Connect your GitHub account to authorize repository synchronization and display your source protocols.
             </p>
             <button 
               onClick={handleConnect}
               className="flex h-16 items-center gap-4 rounded-[28px] bg-gradient-to-r from-[#C5A059] to-[#F1D28C] px-10 text-[11px] font-black uppercase tracking-[0.3em] text-[#050816] shadow-[0_15px_40px_rgba(197,160,89,0.3)] hover:scale-105 active:scale-95 transition-all group"
             >
                <Github size={20} className="group-hover:rotate-12 transition-transform" />
                Подключить GitHub
             </button>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-10">
          {/* Search Filter */}
          <div className="relative group max-w-2xl px-2">
             <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-[#C5A059]" size={20} />
             <input 
                type="text" 
                placeholder="Search repository grid..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-16 w-full rounded-[28px] bg-[#050816] pl-16 pr-8 text-sm font-black text-white border border-white/5 transition-all focus:border-[#C5A059]/40 outline-none shadow-inner tracking-widest uppercase italic"
             />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-6 flex items-center gap-4 text-rose-500"
            >
               <AlertCircle size={24} />
               <p className="text-xs font-black uppercase tracking-widest">{error}</p>
            </motion.div>
          )}

          {/* Repos Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 px-2">
             <AnimatePresence mode="popLayout">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-64 rounded-[40px] bg-[#081120] border border-white/5 animate-pulse" />
                  ))
                ) : filteredRepos.length > 0 ? (
                  filteredRepos.map((repo, index) => (
                    <motion.div
                      key={repo.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="group relative overflow-hidden rounded-[40px] bg-[#081120] p-10 border border-white/5 shadow-2xl hover:border-[#C5A059]/30 transition-all flex flex-col justify-between h-full"
                    >
                       <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A059] blur-[60px] opacity-[0.02] group-hover:opacity-[0.08] transition-opacity" />
                       
                       <div className="relative space-y-4">
                          <div className="flex items-start justify-between">
                             <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C5A059] shadow-inner">
                                <Code size={22} />
                             </div>
                             {repo.language && (
                               <span className="text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-white/5 text-white/70 border border-white/5">
                                 {repo.language}
                               </span>
                             )}
                          </div>
                          
                          <div>
                             <h3 className="text-xl font-display font-black text-white uppercase tracking-tight group-hover:text-[#C5A059] transition-colors leading-snug">
                               {repo.name}
                             </h3>
                             <p className="mt-4 text-xs font-medium text-slate-500 line-clamp-2 leading-relaxed h-10">
                               {repo.description || 'No binary descriptor provided for this logic node.'}
                             </p>
                          </div>
                       </div>

                       <div className="relative pt-8 mt-4 border-t border-white/5 flex items-center justify-between">
                          <div className="flex flex-col">
                             <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Last Sync</span>
                             <span className="text-[10px] font-bold text-white/70">
                               {new Date(repo.updated_at).toLocaleDateString()}
                             </span>
                          </div>
                          
                          <a 
                            href={repo.html_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white/70 hover:bg-[#C5A059] hover:text-[#050816] hover:border-[#C5A059] transition-all active:scale-95 shadow-xl group/btn"
                          >
                             <ExternalLink size={18} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                          </a>
                       </div>
                    </motion.div>
                  ))
                ) : !loading && (
                   <div className="col-span-full py-20 text-center">
                      <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-700 italic">No nodes identified in current matrix query.</p>
                   </div>
                )}
             </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMyCodes;
