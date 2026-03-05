import React from 'react';
import { motion } from 'motion/react';
import { ExternalLink, Package, Cpu } from 'lucide-react';

interface Product {
  id: number;
  title: string;
  description: string;
  url: string;
  image_url: string;
}

export default function OtherProductCard({ product }: { product: Product }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, borderColor: 'rgba(99, 102, 241, 0.4)' }}
      className="group relative flex items-center gap-5 overflow-hidden rounded-lg glass-card p-4 transition-all hover:bg-white/10"
    >
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-white/10 bg-vault-bg">
        <img
          src={product.image_url || `https://picsum.photos/seed/${product.title}/200/200`}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[0.3] group-hover:grayscale-0"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="mb-1 flex items-center gap-2">
          <Cpu size={10} className="text-indigo-500" />
          <h3 className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors font-display uppercase tracking-tight truncate">
            {product.title}
          </h3>
        </div>
        <p className="mb-3 line-clamp-2 text-[10px] text-slate-500 leading-relaxed font-mono uppercase tracking-wider">
          {product.description}
        </p>
        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-[0.2em] text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          View Product <ExternalLink size={10} />
        </a>
      </div>
      
      {/* Decorative Corner */}
      <div className="absolute top-0 right-0 p-1">
        <div className="h-1 w-1 bg-white/10 rounded-full" />
      </div>
    </motion.div>
  );
}
