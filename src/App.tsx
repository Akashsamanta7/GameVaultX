import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, Shield, Settings, ChevronRight, Info, Mail, FileText, AlertCircle, LayoutGrid, Package, Cpu, Activity, Globe, Lock } from 'lucide-react';
import ThreeScene from './components/ThreeScene';
import GameCard from './components/GameCard';
import AdminPanel from './components/AdminPanel';
import OtherProductCard from './components/OtherProductCard';

interface Game {
  id: number;
  title: string;
  description: string;
  url: string;
  image_url: string;
  status: 'active' | 'coming_soon' | 'maintenance';
}

interface Product {
  id: number;
  title: string;
  description: string;
  url: string;
  image_url: string;
}

type Page = 'home' | 'admin' | 'privacy' | 'terms' | 'disclaimer';

export default function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = async () => {
    try {
      const [gamesRes, productsRes, settingsRes] = await Promise.all([
        fetch('/api/games'),
        fetch('/api/products'),
        fetch('/api/settings')
      ]);

      const gamesData = await gamesRes.json();
      const productsData = await productsRes.json();
      const settingsData = await settingsRes.json();

      setGames(Array.isArray(gamesData) ? gamesData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setSettings(settingsData && typeof settingsData === 'object' ? settingsData : {});
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setGames([]);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  const renderLegalPage = (title: string, icon: React.ReactNode, content: string) => (
    <div className="min-h-screen pt-32 pb-20 px-6 atmosphere">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-3xl p-8 md:p-12"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400">
              {icon}
            </div>
            <h1 className="text-4xl font-bold text-white font-display uppercase tracking-tight">{title}</h1>
          </div>
          <div className="prose prose-invert max-w-none text-slate-400 space-y-6">
            <p className="text-lg leading-relaxed font-sans">{content}</p>
            <div className="h-px bg-white/10 my-8" />
            <p className="font-mono text-xs uppercase tracking-widest opacity-50">Last Updated: {new Date().toLocaleDateString()}</p>
          </div>
          <button 
            onClick={() => setCurrentPage('home')}
            className="mt-12 flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-bold transition-colors uppercase text-sm tracking-widest"
          >
            ← Back to Home
          </button>
        </motion.div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-vault-bg text-slate-300 selection:bg-indigo-500/30 font-sans">
      {/* Hero Video Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <video 
          autoPlay 
          muted 
          loop 
          playsInline 
          className="w-full h-full object-cover opacity-20 scale-105 blur-[1px]"
          poster="https://picsum.photos/seed/gaming/1920/1080?blur=10"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-vault-bg/80 via-transparent to-vault-bg" />
      </div>

      {/* Dynamic Background Overlay */}
      <div className="fixed inset-0 z-0 atmosphere pointer-events-none opacity-50" />
      
      {/* Scanline Effect */}
      <div className="fixed inset-0 z-50 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,118,0.06))] bg-[length:100%_2px,3px_100%]" />

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-vault-bg/50 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div 
              className="flex cursor-pointer items-center gap-3 group"
              onClick={() => setCurrentPage('home')}
            >
              <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-indigo-600 shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform border border-white/20">
                <img 
                  src={settings.logo_url || "https://picsum.photos/seed/logo/100/100"} 
                  alt="Logo" 
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tighter text-white font-display uppercase leading-none">GameVault <span className="text-indigo-500">X</span></span>
                <span className="text-[10px] font-mono text-indigo-400/70 uppercase tracking-[0.2em]">Secure Protocol v3.0</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-6 text-[10px] font-mono uppercase tracking-widest text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity size={12} className="text-indigo-500" />
                  <span>{games.length} Games</span>
                </div>
              </div>
              <button 
                onClick={() => setCurrentPage(currentPage === 'admin' ? 'home' : 'admin')}
                className="flex items-center gap-2 rounded-md bg-white/5 px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-white hover:bg-white/10 transition-all border border-white/10"
              >
                <Settings size={14} className={currentPage === 'admin' ? 'rotate-90 transition-transform' : ''} />
                {currentPage === 'admin' ? 'Exit Admin' : 'Admin Login'}
              </button>
            </div>
          </div>
        </nav>

        <AnimatePresence mode="wait">
          {currentPage === 'home' && (
            <motion.main
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Hero Section */}
              <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-20 text-center overflow-hidden">
                <div className="absolute inset-0 -z-10 opacity-40">
                  <ThreeScene />
                </div>
                
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="max-w-5xl"
                >
                  <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-4 py-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-indigo-400">
                    <Shield size={12} />
                    <span>Secure Gaming Environment</span>
                  </div>
                  <h1 className="mb-8 text-7xl font-black tracking-tighter text-white md:text-9xl font-display uppercase leading-[0.85]">
                    Game <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20 glow-text">Vault</span>
                  </h1>
                  <p className="mx-auto mb-12 max-w-2xl text-base text-slate-400 md:text-lg leading-relaxed font-sans font-light">
                    A high-performance collection of curated web games. <br className="hidden md:block" />
                    Optimized for instant play on any device.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-6">
                    <a 
                      href="#games"
                      className="group flex items-center gap-3 rounded-md bg-indigo-600 px-10 py-5 text-xs font-mono uppercase tracking-[0.2em] text-white shadow-2xl shadow-indigo-500/20 hover:bg-indigo-500 transition-all active:scale-95"
                    >
                      Explore Games
                      <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </a>
                    <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                      <div className="flex flex-col items-start">
                        <span className="text-white">0.00ms</span>
                        <span>Latency</span>
                      </div>
                      <div className="h-8 w-px bg-white/10" />
                      <div className="flex flex-col items-start">
                        <span className="text-white">100%</span>
                        <span>Uptime</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
                
                {/* Decorative Elements */}
                <div className="absolute bottom-10 left-10 hidden lg:block">
                  <div className="flex flex-col gap-2 font-mono text-[8px] uppercase tracking-[0.3em] text-slate-600">
                    <span>// SYSTEM_LOG_INIT</span>
                    <span>// LOADING_ASSETS...</span>
                    <span>// VAULT_READY</span>
                  </div>
                </div>
              </section>

              {/* Games Grid */}
              <section id="games" className="mx-auto max-w-7xl px-6 py-32">
                <div className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-[10px] font-mono text-indigo-400 uppercase tracking-widest">
                      <Cpu size={12} />
                      <span>Collection</span>
                    </div>
                    <h2 className="text-5xl font-black text-white font-display uppercase tracking-tighter">Featured Games</h2>
                  </div>
                  <div className="flex items-center gap-4 font-mono text-[10px] text-slate-500 uppercase tracking-widest">
                    <span>Filter: All</span>
                    <div className="h-4 w-px bg-white/10" />
                    <span>Sort: ID_ASC</span>
                  </div>
                </div>

                {isLoading ? (
                  <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-[450px] rounded-2xl bg-white/5 animate-pulse border border-white/5" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
                    {games.map((game, index) => (
                      <motion.div
                        key={game.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <GameCard game={game} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </section>

              {/* Other Products Section */}
              {products.length > 0 && (
                <section id="products" className="mx-auto max-w-7xl px-6 py-32">
                  <div className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
                    <div>
                      <div className="mb-2 flex items-center gap-2 text-[10px] font-mono text-indigo-400 uppercase tracking-widest">
                        <Package size={12} />
                        <span>Tools</span>
                      </div>
                      <h2 className="text-5xl font-black text-white font-display uppercase tracking-tighter">Other Products</h2>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {products.map((product, index) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <OtherProductCard product={product} />
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}
            </motion.main>
          )}

          {currentPage === 'admin' && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="min-h-screen pt-32 pb-20 px-6 atmosphere"
            >
              <div className="mx-auto max-w-5xl">
                <AdminPanel onUpdate={fetchAll} />
              </div>
            </motion.div>
          )}

          {currentPage === 'privacy' && renderLegalPage(
            'Privacy Protocol', 
            <Shield size={24} />, 
            'Your privacy is paramount. This protocol outlines our data handling procedures. We do not harvest personal telemetry unless explicitly authorized. Local storage is utilized strictly for session persistence and performance optimization.'
          )}
          
          {currentPage === 'terms' && renderLegalPage(
            'Usage Terms', 
            <FileText size={24} />, 
            'By accessing GameVault X, you agree to these operational terms. Modules are provided "as is" for simulation purposes. We assume no liability for data anomalies or hardware issues arising from platform interaction.'
          )}
          
          {currentPage === 'disclaimer' && renderLegalPage(
            'Legal Disclaimer', 
            <AlertCircle size={24} />, 
            'All modules and satellite products are for research and entertainment purposes. We do not guarantee 100% packet delivery or error-free execution. Proceed at your own discretion.'
          )}
        </AnimatePresence>

        {/* Footer */}
        {currentPage !== 'admin' && (
          <footer className="border-t border-white/5 bg-vault-bg/80 py-24 backdrop-blur-xl">
            <div className="mx-auto max-w-7xl px-6">
              <div className="grid grid-cols-1 gap-16 md:grid-cols-4">
                <div className="col-span-1 md:col-span-2">
                  <div className="mb-8 flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-lg bg-indigo-600 border border-white/20">
                      <img src={settings.logo_url || "https://picsum.photos/seed/logo/100/100"} alt="Logo" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xl font-black text-white font-display uppercase tracking-tighter">GameVault X</span>
                      <span className="text-[8px] font-mono text-indigo-400 uppercase tracking-[0.4em]">Secure Protocol</span>
                    </div>
                  </div>
                  <p className="mb-10 max-w-sm text-sm text-slate-500 leading-relaxed font-light">
                    The premier repository for high-fidelity web modules. <br />
                    Engineered for the next generation of digital interaction.
                  </p>
                  <div className="flex gap-4">
                    <a href="#" className="rounded-md bg-white/5 p-3 text-slate-500 hover:bg-white/10 hover:text-indigo-400 transition-all border border-white/5">
                      <Mail size={18} />
                    </a>
                    <a href="#" className="rounded-md bg-white/5 p-3 text-slate-500 hover:bg-white/10 hover:text-indigo-400 transition-all border border-white/5">
                      <Globe size={18} />
                    </a>
                  </div>
                </div>
                
                <div>
                  <h4 className="mb-8 font-mono font-bold text-white uppercase tracking-[0.3em] text-[10px]">Vault_Map</h4>
                  <ul className="space-y-4 text-xs font-mono uppercase tracking-widest text-slate-500">
                    <li><a href="#games" className="hover:text-indigo-400 transition-colors">Modules</a></li>
                    <li><a href="#products" className="hover:text-indigo-400 transition-colors">Satellites</a></li>
                    <li><button onClick={() => setCurrentPage('admin')} className="hover:text-indigo-400 transition-colors">Admin_Auth</button></li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="mb-8 font-mono font-bold text-white uppercase tracking-[0.3em] text-[10px]">Legal_Docs</h4>
                  <ul className="space-y-4 text-xs font-mono uppercase tracking-widest text-slate-500">
                    <li><button onClick={() => setCurrentPage('privacy')} className="hover:text-indigo-400 transition-colors">Privacy_Proc</button></li>
                    <li><button onClick={() => setCurrentPage('terms')} className="hover:text-indigo-400 transition-colors">Usage_Terms</button></li>
                    <li><button onClick={() => setCurrentPage('disclaimer')} className="hover:text-indigo-400 transition-colors">Disclaimer</button></li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-24 flex flex-col items-center justify-between gap-8 border-t border-white/5 pt-12 md:flex-row">
                <p className="font-mono text-[10px] text-slate-600 uppercase tracking-widest">
                  © {new Date().getFullYear()} GameVault X. All rights reserved.
                </p>
                <div className="flex items-center gap-3 font-mono text-[10px] text-slate-600 uppercase tracking-widest">
                  <span>Status: Optimal</span>
                  <div className="h-1 w-1 rounded-full bg-emerald-500" />
                  <span>Region: Global_Edge</span>
                </div>
              </div>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
