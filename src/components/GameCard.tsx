import React from 'react';
import { motion } from 'motion/react';
import { ExternalLink, Clock, AlertTriangle, Terminal } from 'lucide-react';

interface Game {
  id: number;
  title: string;
  description: string;
  url: string;
  image_url: string;
  status: string;
}

export default function GameCard({ game }: { game: Game }) {
  const isComingSoon = game.status === 'coming_soon';
  const isMaintenance = game.status === 'maintenance';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      className="group relative overflow-hidden rounded-lg glass-card transition-all hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10"
    >
      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/5 font-mono text-[8px] uppercase tracking-[0.2em] text-slate-500">
        <div className="flex items-center gap-2">
          <Terminal size={10} className="text-indigo-500" />
          <span>ID: {game.id.toString().padStart(3, '0')}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`h-1 w-1 rounded-full ${isMaintenance ? 'bg-amber-500' : isComingSoon ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
          <span>{game.status.replace('_', ' ')}</span>
        </div>
      </div>

      <div className="aspect-video w-full overflow-hidden relative">
        <img
          src={game.image_url || `https://picsum.photos/seed/${game.title}/800/600`}
          alt={game.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[0.2] group-hover:grayscale-0"
          referrerPolicy="no-referrer"
        />
        
        {/* Overlay Grid */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
        
        {(isComingSoon || isMaintenance) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-[3px]">
            <div className={`flex flex-col items-center gap-3 text-center p-6`}>
              <div className={`p-3 rounded-full ${isMaintenance ? 'bg-amber-500/20 text-amber-500' : 'bg-indigo-500/20 text-indigo-500'}`}>
                {isMaintenance ? <AlertTriangle size={24} /> : <Clock size={24} />}
              </div>
              <div>
                <div className="text-xs font-mono uppercase tracking-[0.3em] text-white mb-1">
                  {isMaintenance ? 'Maintenance' : 'Coming Soon'}
                </div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                  {isMaintenance ? 'Offline' : 'Pending'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="mb-3 text-2xl font-black text-white group-hover:text-indigo-400 transition-colors font-display uppercase tracking-tighter">
          {game.title}
        </h3>
        <p className="mb-8 line-clamp-2 text-sm text-slate-400 leading-relaxed font-light">
          {game.description}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          {(!isComingSoon && !isMaintenance) ? (
            <a
              href={game.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-3 rounded-md bg-indigo-600/10 border border-indigo-500/30 px-6 py-3 text-[10px] font-mono uppercase tracking-[0.2em] text-indigo-400 transition-all hover:bg-indigo-600 hover:text-white hover:border-indigo-600 active:scale-95"
            >
              Play Now <ExternalLink size={14} />
            </a>
          ) : (
            <div className="w-full rounded-md bg-white/5 border border-white/5 py-3 text-center text-[10px] font-mono uppercase tracking-[0.2em] text-slate-600">
              {isMaintenance ? 'Locked' : 'Coming Soon'}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
