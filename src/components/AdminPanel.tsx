import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Trash2, Edit2, Save, Lock, Upload, Image as ImageIcon, Package, ChevronUp, ChevronDown, Settings, Terminal, ShieldCheck, Database } from 'lucide-react';

interface Game {
  id: number;
  title: string;
  description: string;
  url: string;
  image_url: string;
  status: string;
  sort_order: number;
}

interface Product {
  id: number;
  title: string;
  description: string;
  url: string;
  image_url: string;
  sort_order: number;
}

export default function AdminPanel({ onUpdate }: { onUpdate: () => void }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [settings, setSettings] = useState<any>({});
  const [games, setGames] = useState<Game[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; type: 'game' | 'product' } | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    image_url: '',
    status: 'active'
  });

  const [productFormData, setProductFormData] = useState({
    title: '',
    description: '',
    url: '',
    image_url: ''
  });

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
    }
  };

  useEffect(() => {
    if (isLoggedIn) fetchAll();
  }, [isLoggedIn]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (res.ok) {
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('AUTH_FAILURE: INVALID_CREDENTIALS');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'game' | 'product' | 'logo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('ERROR: FILE_SIZE_EXCEEDED (MAX 10MB)');
      return;
    }

    const formDataUpload = new FormData();
    formDataUpload.append('image', file);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formDataUpload
    });
    const data = await res.json();

    if (target === 'game') setFormData({ ...formData, image_url: data.url });
    if (target === 'product') setProductFormData({ ...productFormData, image_url: data.url });
    if (target === 'logo') {
      setSettings({ ...settings, logo_url: data.url });
      // Automatically update setting after upload
      handleUpdateSetting('logo_url', data.url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/games/${editingId}` : '/api/games';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('SAVE_FAILED');

      setIsAdding(false);
      setEditingId(null);
      setFormData({ title: '', description: '', url: '', image_url: '', status: 'active' });
      await fetchAll();
      onUpdate();
    } catch (err) {
      alert('CRITICAL_ERROR: ' + (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productFormData)
      });
      if (!res.ok) throw new Error('SAVE_FAILED');
      
      setIsAddingProduct(false);
      setProductFormData({ title: '', description: '', url: '', image_url: '' });
      await fetchAll();
      onUpdate();
    } catch (err) {
      alert('CRITICAL_ERROR: ' + (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number, type: 'game' | 'product') => {
    try {
      const res = await fetch(`/api/${type === 'game' ? 'games' : 'products'}/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || 'DELETE_FAILED');
      }
      setDeleteConfirm(null);
      await fetchAll();
      onUpdate();
    } catch (err) {
      alert('CRITICAL_ERROR: ' + (err as Error).message);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await fetch('/api/admin/reset', { method: 'POST' });
      await fetchAll();
      onUpdate();
    } catch (err) {
      alert('RESET_FAILURE');
    } finally {
      setIsResetting(false);
    }
  };

  const handleUpdateSetting = async (key: string, value: string) => {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    });
    fetchAll();
    onUpdate();
  };

  const handleMove = async (index: number, direction: 'up' | 'down', type: 'game' | 'product') => {
    const list = type === 'game' ? [...games] : [...products];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= list.length) return;

    const [movedItem] = list.splice(index, 1);
    list.splice(newIndex, 0, movedItem);

    await Promise.all(list.map((item, i) => 
      fetch(`/api/${type === 'game' ? 'games' : 'products'}/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: i })
      })
    ));

    fetchAll();
    onUpdate();
  };

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-md glass-card rounded-lg p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-6 rounded-full bg-indigo-500/10 p-5 text-indigo-500 border border-indigo-500/20 shadow-2xl shadow-indigo-500/20">
            <Lock size={40} />
          </div>
          <h2 className="text-3xl font-black text-white font-display uppercase tracking-tighter">Admin Login</h2>
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] mt-2">Secure Access Required</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-slate-500 ml-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-md bg-white/5 border border-white/10 px-4 py-4 text-white placeholder:text-slate-700 focus:border-indigo-500 focus:outline-none font-mono"
            />
          </div>
          {loginError && (
            <div className="flex items-center gap-2 text-[10px] font-mono text-rose-500 uppercase tracking-widest bg-rose-500/5 p-3 rounded border border-rose-500/20">
              <Terminal size={12} />
              {loginError}
            </div>
          )}
          <button
            type="submit"
            className="w-full rounded-md bg-indigo-600 py-4 font-mono text-xs uppercase tracking-[0.3em] text-white hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 glass-card rounded flex items-center justify-center text-indigo-500">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white font-display uppercase tracking-tighter">Admin Panel</h2>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Session Active: Root</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 rounded-md bg-white/5 border border-white/10 px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-white hover:bg-white/10 transition-all"
          >
            Back to Site
          </button>
          <button 
            onClick={handleReset}
            disabled={isResetting}
            className="flex items-center gap-2 rounded-md bg-rose-500/10 border border-rose-500/20 px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-rose-500 hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50"
          >
            <Database size={14} />
            {isResetting ? 'Resetting...' : 'Reset Database'}
          </button>
        </div>
      </div>

      {/* Settings Management */}
      <div className="glass-card rounded-lg p-8">
        <div className="mb-6 flex items-center gap-3">
          <Settings className="text-indigo-400" size={20} />
          <h3 className="text-sm font-mono font-bold text-white uppercase tracking-[0.2em]">Settings</h3>
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Logo URL</label>
            <div className="flex gap-3">
              <input
                type="url"
                placeholder="https://cdn.vault.io/logo.png"
                value={settings.logo_url || ''}
                onChange={e => setSettings({ ...settings, logo_url: e.target.value })}
                className="flex-1 rounded-md bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-700 focus:border-indigo-500 focus:outline-none font-mono text-xs"
              />
              <label className="flex cursor-pointer items-center gap-2 rounded-md bg-white/5 border border-white/10 px-4 py-3 text-slate-500 hover:bg-white/10 transition-colors">
                <Upload size={16} />
                <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'logo')} />
              </label>
              <button
                onClick={() => handleUpdateSetting('logo_url', settings.logo_url)}
                className="rounded-md bg-indigo-600 px-6 py-3 text-[10px] font-mono uppercase tracking-widest text-white hover:bg-indigo-500 transition-colors"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Games Management */}
      <div className="glass-card rounded-lg p-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ImageIcon className="text-indigo-400" size={20} />
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-[0.2em]">Manage Games</h3>
          </div>
          <button
            onClick={() => {
              setIsAdding(!isAdding);
              setEditingId(null);
              setFormData({ title: '', description: '', url: '', image_url: '', status: 'active' });
            }}
            className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-white hover:bg-indigo-500 transition-colors"
          >
            {isAdding ? <X size={14} /> : <Plus size={14} />}
            {isAdding ? 'Cancel' : 'Add Game'}
          </button>
        </div>

        <AnimatePresence>
          {isAdding && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleSubmit}
              className="mb-10 space-y-6 overflow-hidden border-b border-white/5 pb-10"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Game Title</label>
                  <input
                    type="text"
                    placeholder="Game Name"
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-md bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-700 focus:border-indigo-500 focus:outline-none font-mono text-xs"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Status</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'active', label: 'Online', color: 'bg-emerald-500' },
                      { id: 'coming_soon', label: 'Pending', color: 'bg-indigo-500' },
                      { id: 'maintenance', label: 'Locked', color: 'bg-amber-500' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, status: opt.id })}
                        className={`flex items-center gap-2 rounded border px-3 py-2 text-[10px] font-mono uppercase tracking-widest transition-all ${
                          formData.status === opt.id 
                            ? `bg-indigo-500/20 border-indigo-500 text-white` 
                            : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
                        }`}
                      >
                        <div className={`h-1.5 w-1.5 rounded-full ${opt.color}`} />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Description</label>
                <textarea
                  placeholder="Game description..."
                  required
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-md bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-700 focus:border-indigo-500 focus:outline-none h-24 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-slate-500">URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/game"
                    required
                    value={formData.url}
                    onChange={e => setFormData({ ...formData, url: e.target.value })}
                    className="w-full rounded-md bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-700 focus:border-indigo-500 focus:outline-none font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Image URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://example.com/image.jpg"
                      value={formData.image_url}
                      onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                      className="flex-1 rounded-md bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-700 focus:border-indigo-500 focus:outline-none font-mono text-xs"
                    />
                    <label className="flex cursor-pointer items-center gap-2 rounded-md bg-white/5 border border-white/10 px-4 py-3 text-slate-500 hover:bg-white/10 transition-colors">
                      <Upload size={16} />
                      <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'game')} />
                    </label>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600/20 border border-emerald-500/30 px-4 py-4 text-[10px] font-mono uppercase tracking-[0.3em] text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50"
              >
                <Save size={16} />
                {isSaving ? 'Saving...' : (editingId ? 'Update Game' : 'Save Game')}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="space-y-2">
          {games.map((game, index) => (
            <div
              key={game.id}
              className="flex items-center justify-between rounded-md bg-white/5 border border-white/5 p-4 hover:bg-white/10 transition-all group"
            >
              <div className="flex items-center gap-6">
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => handleMove(index, 'up', 'game')}
                    disabled={index === 0}
                    className="text-slate-700 hover:text-indigo-400 disabled:opacity-0 transition-colors"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button 
                    onClick={() => handleMove(index, 'down', 'game')}
                    disabled={index === games.length - 1}
                    className="text-slate-700 hover:text-indigo-400 disabled:opacity-0 transition-colors"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
                <div className="h-12 w-20 rounded border border-white/10 bg-vault-bg overflow-hidden">
                  <img src={game.image_url || `https://picsum.photos/seed/${game.title}/100/60`} className="h-full w-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-white text-sm uppercase tracking-tighter">{game.title}</h4>
                    <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">ID:{game.id.toString().padStart(3, '0')}</span>
                  </div>
                  <p className="text-[9px] font-mono text-slate-500 truncate max-w-[200px] uppercase tracking-widest mt-1">{game.url}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingId(game.id);
                    setFormData({
                      title: game.title,
                      description: game.description,
                      url: game.url,
                      image_url: game.image_url,
                      status: game.status
                    });
                    setIsAdding(true);
                  }}
                  className="p-2 text-slate-600 hover:text-indigo-400 transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                
                {deleteConfirm?.id === game.id && deleteConfirm?.type === 'game' ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(game.id, 'game')}
                      className="rounded bg-rose-500 px-2 py-1 text-[8px] font-mono uppercase text-white"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="text-slate-500 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm({ id: game.id, type: 'game' })}
                    className="p-2 text-slate-600 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Other Products Management */}
      <div className="glass-card rounded-lg p-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="text-indigo-400" size={20} />
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-[0.2em]">Manage Products</h3>
          </div>
          <button
            onClick={() => setIsAddingProduct(!isAddingProduct)}
            className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-white hover:bg-indigo-500 transition-colors"
          >
            {isAddingProduct ? <X size={14} /> : <Plus size={14} />}
            {isAddingProduct ? 'Cancel' : 'Add Product'}
          </button>
        </div>

        <AnimatePresence>
          {isAddingProduct && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleProductSubmit}
              className="mb-10 space-y-6 overflow-hidden border-b border-white/5 pb-10"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Product Title</label>
                <input
                  type="text"
                  placeholder="Product Name"
                  required
                  value={productFormData.title}
                  onChange={e => setProductFormData({ ...productFormData, title: e.target.value })}
                  className="w-full rounded-md bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-700 focus:border-indigo-500 focus:outline-none font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Description</label>
                <textarea
                  placeholder="Product description..."
                  required
                  value={productFormData.description}
                  onChange={e => setProductFormData({ ...productFormData, description: e.target.value })}
                  className="w-full rounded-md bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-700 focus:border-indigo-500 focus:outline-none h-20 font-mono text-xs"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-slate-500">URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/product"
                    required
                    value={productFormData.url}
                    onChange={e => setProductFormData({ ...productFormData, url: e.target.value })}
                    className="w-full rounded-md bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-700 focus:border-indigo-500 focus:outline-none font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Image URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://example.com/image.png"
                      value={productFormData.image_url}
                      onChange={e => setProductFormData({ ...productFormData, image_url: e.target.value })}
                      className="flex-1 rounded-md bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-700 focus:border-indigo-500 focus:outline-none font-mono text-xs"
                    />
                    <label className="flex cursor-pointer items-center gap-2 rounded-md bg-white/5 border border-white/10 px-4 py-3 text-slate-500 hover:bg-white/10 transition-colors">
                      <Upload size={16} />
                      <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'product')} />
                    </label>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600/20 border border-emerald-500/30 px-4 py-4 text-[10px] font-mono uppercase tracking-[0.3em] text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all"
              >
                <Save size={16} /> Save Product
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="space-y-2">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="flex items-center justify-between rounded-md bg-white/5 border border-white/5 p-4 hover:bg-white/10 transition-all group"
            >
              <div className="flex items-center gap-6">
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => handleMove(index, 'up', 'product')}
                    disabled={index === 0}
                    className="text-slate-700 hover:text-indigo-400 disabled:opacity-0 transition-colors"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button 
                    onClick={() => handleMove(index, 'down', 'product')}
                    disabled={index === products.length - 1}
                    className="text-slate-700 hover:text-indigo-400 disabled:opacity-0 transition-colors"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
                <div className="h-12 w-12 rounded border border-white/10 bg-vault-bg overflow-hidden">
                  <img src={product.image_url || `https://picsum.photos/seed/${product.title}/100/100`} className="h-full w-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <h4 className="font-black text-white text-sm uppercase tracking-tighter">{product.title}</h4>
                  <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-1">ID:{product.id.toString().padStart(3, '0')}</p>
                </div>
              </div>
              
              {deleteConfirm?.id === product.id && deleteConfirm?.type === 'product' ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(product.id, 'product')}
                    className="rounded bg-rose-500 px-2 py-1 text-[8px] font-mono uppercase text-white"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="text-slate-500 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteConfirm({ id: product.id, type: 'product' })}
                  className="p-2 text-slate-600 hover:text-rose-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
