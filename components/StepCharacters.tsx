
import React, { useState } from 'react';
import { Character, Scene, Genre } from '../types';
import { Button } from './Button';
import { 
  ArrowLeft, ImageIcon, Sparkles, RefreshCw, Download, 
  Users, User, LayoutGrid, Copy, FileOutput, Map, 
  Layers, Info, Zap, Camera, Box
} from 'lucide-react';

interface StepCharactersProps {
  characters: Character[];
  scenes: Scene[];
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  generateImage: (charId: string) => void;
  onNext: () => void;
  genre: Genre;
}

export const StepCharacters: React.FC<StepCharactersProps> = ({
  characters, scenes = [], updateCharacter, generateImage, onNext, genre
}) => {
  const [activeTab, setActiveTab] = useState<'characters' | 'scenes'>('characters');
  const [charFilter, setCharFilter] = useState<string>('all');

  const categories = ['all', '主角', '配角', '群众演员'];
  const filteredChars = characters.filter(c => charFilter === 'all' || c.role === charFilter);

  const downloadImage = (imageUrl: string, name: string) => {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `${name}_design.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleCopyPrompt = (prompt: string) => {
      navigator.clipboard.writeText(prompt);
      alert("提示词已复制到剪贴板");
  };

  const handleExportToDoc = () => {
      let html = `<html><head><meta charset='utf-8'><title>Production Assets</title></head><body style="font-family: sans-serif;">`;
      html += `<h1 style="color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">${activeTab === 'characters' ? '全剧角色档案' : '剧本场景志'}</h1>`;
      
      if (activeTab === 'characters') {
          characters.forEach(char => {
              html += `
                <div style="margin-bottom: 30px; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px;">
                    <h2 style="color: #c2410c; margin-top: 0;">${char.name} <small style="color: #64748b; font-weight: normal;">(${char.role} / ${char.age})</small></h2>
                    <p><strong>性格：</strong>${char.personality}</p>
                    <p><strong>外貌：</strong>${char.appearance}</p>
                    <div style="background: #f8fafc; padding: 10px; border-radius: 4px; font-size: 12px; color: #475569;">
                        <strong>视觉提示词:</strong> ${char.visualPrompt}
                    </div>
                </div>`;
          });
      } else {
          scenes.forEach(scene => {
              html += `
                <div style="margin-bottom: 30px; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px;">
                    <h2 style="color: #1d4ed8; margin-top: 0;">${scene.name}</h2>
                    <p><strong>场景描述：</strong>${scene.description}</p>
                    <p><strong>灯光氛围：</strong>${scene.atmosphere}</p>
                    <p><strong>核心道具：</strong>${scene.props}</p>
                </div>`;
          });
      }
      html += `</body></html>`;
      
      const blob = new Blob([html], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab === 'characters' ? '角色档案' : '场景档案'}_${new Date().getTime()}.doc`;
      a.click();
      URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[1400px] mx-auto h-full flex flex-col gap-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0 pt-4">
        <div className="flex items-center gap-6">
           <button onClick={onNext} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-slate-400 group">
               <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
           </button>
           <div className="space-y-1">
              <h2 className="text-3xl font-extrabold text-white tracking-tight text-glow">
                  制作资产库 <span className="text-amber-500">ASSET LIB</span>
              </h2>
              <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">Advanced Cinematic Script Suite v2.0</p>
           </div>
        </div>
        
        <div className="flex items-center gap-2 p-1.5 bg-slate-900/50 backdrop-blur border border-white/5 rounded-2xl shadow-inner">
            <button 
                onClick={() => setActiveTab('characters')} 
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'characters' ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <Users size={18} /> 角色档案
            </button>
            <button 
                onClick={() => setActiveTab('scenes')} 
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'scenes' ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <Map size={18} /> 场景志
            </button>
        </div>
      </div>

      {/* Filter & Export Bar */}
      <div className="flex items-center justify-between glass-card p-4 rounded-3xl border-white/5">
        <div className="flex items-center gap-3">
            {activeTab === 'characters' && (
                <div className="flex gap-1.5 bg-black/20 p-1 rounded-xl">
                    {categories.map(c => (
                        <button 
                            key={c} 
                            onClick={() => setCharFilter(c)} 
                            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${charFilter === c ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            {c === 'all' ? '全部' : c}
                        </button>
                    ))}
                </div>
            )}
            <div className="h-6 w-px bg-white/5" />
            <span className="text-xs text-slate-500 font-medium ml-2">
                当前显示: <span className="text-amber-500/80">{activeTab === 'characters' ? filteredChars.length : scenes.length}</span> 个资产
            </span>
        </div>
        <div className="flex gap-3">
             <Button variant="outline" size="sm" onClick={handleExportToDoc} icon={<FileOutput size={16} />} className="rounded-xl border-white/10 hover:bg-white/5">
                导出 {activeTab === 'characters' ? '角色' : '场景'}档案
             </Button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10">
        {activeTab === 'characters' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredChars.length === 0 ? (
                    <div className="col-span-full h-80 flex flex-col items-center justify-center glass-card rounded-[40px] border-dashed border-white/10 opacity-30">
                        <Users size={80} className="mb-4" />
                        <p className="text-xl font-medium tracking-tight">暂无角色数据</p>
                    </div>
                ) : filteredChars.map((char) => (
                    <div key={char.id} className="glass-card rounded-[32px] overflow-hidden flex flex-col group hover:border-amber-500/30 transition-all duration-500 premium-shadow">
                        {/* Character Card Header */}
                        <div className="p-8 pb-4 relative overflow-hidden">
                             <div className="flex items-start justify-between relative z-10">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-2xl font-black text-white leading-none tracking-tight">{char.name}</h3>
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                        <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">{char.role}</span>
                                        <span className="text-[10px] bg-white/5 text-slate-400 border border-white/5 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">{char.age}</span>
                                    </div>
                                </div>
                             </div>
                        </div>

                        {/* Character Details */}
                        <div className="px-8 space-y-6 flex-1">
                            <div className="grid grid-cols-1 gap-5">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Zap size={14} className="text-amber-500/60" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">性格档案</span>
                                    </div>
                                    <p className="text-sm text-slate-300 leading-relaxed font-medium bg-white/5 p-4 rounded-2xl border border-white/5">{char.personality}</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Camera size={14} className="text-amber-500/60" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">视觉细节</span>
                                    </div>
                                    <p className="text-sm text-slate-300 leading-relaxed font-medium bg-white/5 p-4 rounded-2xl border border-white/5 italic">"{char.appearance}"</p>
                                </div>
                            </div>

                            {/* Prompt Box */}
                            <div className="bg-black/40 rounded-3xl p-5 border border-white/5 group-hover:border-amber-500/20 transition-colors">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-[9px] font-black text-amber-500/80 uppercase tracking-widest flex items-center gap-1.5">
                                        <Sparkles size={12} /> MJ / 即梦 AI Prompt
                                    </span>
                                    <button onClick={() => handleCopyPrompt(char.visualPrompt)} className="text-slate-600 hover:text-white transition-colors p-1">
                                        <Copy size={14} />
                                    </button>
                                </div>
                                <p className="text-[11px] text-slate-400 font-mono leading-relaxed line-clamp-3">{char.visualPrompt}</p>
                            </div>
                        </div>

                        {/* Visual Image Section */}
                        <div className="mt-6 p-4 pt-0">
                            <div className="relative h-64 w-full rounded-[24px] overflow-hidden bg-black/40 border border-white/5 group/img">
                                {char.imageUrl ? (
                                    <>
                                        <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover/img:scale-110" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-all flex flex-col justify-end p-6">
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="amber" onClick={() => generateImage(char.id)} isLoading={char.imageLoading} icon={<RefreshCw size={14}/>} className="flex-1 shadow-none">重绘</Button>
                                                <Button size="sm" variant="secondary" onClick={() => downloadImage(char.imageUrl!, char.name)} icon={<Download size={14}/>} className="px-3" />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center gap-4 text-center p-6">
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/5 animate-pulse">
                                            <ImageIcon size={24} className="text-slate-600" />
                                        </div>
                                        <Button size="sm" variant="outline" onClick={() => generateImage(char.id)} isLoading={char.imageLoading} icon={<Sparkles size={14}/>} className="hover:bg-amber-600 hover:text-white transition-all rounded-xl">生成概念图</Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            /* SCENES GRID */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {scenes.length === 0 ? (
                    <div className="col-span-full h-80 flex flex-col items-center justify-center glass-card rounded-[40px] border-dashed border-white/10 opacity-30">
                        <Map size={80} className="mb-4" />
                        <p className="text-xl font-medium tracking-tight">暂无场景数据</p>
                    </div>
                 ) : scenes.map((scene) => (
                    <div key={scene.id} className="glass-card rounded-[40px] p-8 flex flex-col gap-8 group hover:border-amber-500/30 transition-all premium-shadow border border-white/5">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <h3 className="text-3xl font-black text-white tracking-tighter">{scene.name}</h3>
                                <div className="flex gap-2">
                                    <span className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em]">Scene Profile</span>
                                </div>
                            </div>
                            <div className="p-3 bg-white/5 rounded-2xl text-slate-500 group-hover:text-amber-500 transition-colors">
                                <Camera size={24} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                    <LayoutGrid size={14} /> 空间描写
                                </h4>
                                <p className="text-sm text-slate-300 leading-relaxed bg-white/5 p-5 rounded-3xl border border-white/5 min-h-[120px]">{scene.description}</p>
                            </div>
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                    <Zap size={14} /> 灯光与氛围
                                </h4>
                                <p className="text-sm text-slate-300 leading-relaxed bg-white/5 p-5 rounded-3xl border border-white/5 min-h-[120px]">{scene.atmosphere}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <Box size={14} /> 核心道具清单
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {scene.props.split(/[、,，\n]/).filter(p => p.trim()).map((prop, i) => (
                                    <span key={i} className="px-4 py-2 bg-black/40 border border-white/5 rounded-2xl text-xs text-slate-400 font-medium hover:border-amber-500/20 transition-all">{prop.trim()}</span>
                                ))}
                            </div>
                        </div>

                        <div className="bg-amber-600/5 border border-amber-600/10 p-6 rounded-[32px] space-y-3">
                             <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                                    <Sparkles size={14} /> 场景提示词 (Production Visuals)
                                </span>
                                <button onClick={() => handleCopyPrompt(scene.visualPrompt)} className="text-amber-700 hover:text-amber-500 p-1">
                                    <Copy size={14} />
                                </button>
                             </div>
                             <p className="text-xs text-amber-900/60 dark:text-amber-400/60 font-mono italic leading-relaxed">{scene.visualPrompt}</p>
                        </div>
                    </div>
                 ))}
            </div>
        )}
      </div>
    </div>
  );
};
