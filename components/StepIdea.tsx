
import React, { useState } from 'react';
import { Genre, PRESET_GENRES } from '../types';
import { Button } from './Button';
import { Sparkles, FileText, Lightbulb, Upload, Edit3 } from 'lucide-react';

interface StepIdeaProps {
  idea: string;
  setIdea: (val: string) => void;
  genre: Genre;
  setGenre: (val: Genre) => void;
  onNext: () => void;
  onAnalyze: (text: string) => void;
  isGenerating: boolean;
}

const CREATIVE_HINTS = [
  "落魄千金重生在订婚宴现场，当众退婚霸总并扇了渣男一巴掌...",
  "穷小子觉醒神秘系统，发现自己竟然是全球首富的唯一继承人...",
  "女法医穿越成不受宠的王妃，用现代解剖学破解皇宫惊天命案...",
  "深夜，一个自称是未来自己的人打来电话，警告我不要出门..."
];

export const StepIdea: React.FC<StepIdeaProps> = ({ 
  idea, setIdea, genre, setGenre, onNext, onAnalyze, isGenerating 
}) => {
  const [mode, setMode] = useState<'create' | 'import'>('create');
  const [importText, setImportText] = useState('');
  const [customGenre, setCustomGenre] = useState('');

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-red-500">
          欢玺剧本大师 Pro
        </h2>
        <p className="text-slate-400 text-lg">定制化 100 集爆款剧本生成 · 无限故事扩展</p>
      </div>

      <div className="flex justify-center">
        <div className="bg-slate-900 p-1 rounded-lg border border-slate-800 flex gap-1">
          <button onClick={() => setMode('create')} className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${mode === 'create' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
            <Sparkles size={16} className="inline mr-2" /> 从零创作
          </button>
          <button onClick={() => setMode('import')} className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${mode === 'import' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
            <Upload size={16} className="inline mr-2" /> 导入分析
          </button>
        </div>
      </div>

      {mode === 'create' ? (
        <div className="space-y-8 bg-slate-900/50 p-8 rounded-2xl border border-slate-800 backdrop-blur-sm">
          <div className="space-y-4">
            <label className="text-sm font-medium text-orange-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span> 剧本类型 (可多选或自定义)
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_GENRES.map((g) => (
                <button
                  key={g}
                  onClick={() => setGenre(g)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${genre === g ? 'bg-orange-600 border-orange-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-orange-500/50'}`}
                >
                  {g}
                </button>
              ))}
              <div className="flex items-center gap-2 ml-2">
                <Edit3 size={14} className="text-slate-500" />
                <input 
                  type="text" 
                  placeholder="自定义类型..."
                  value={customGenre}
                  onChange={(e) => {
                    setCustomGenre(e.target.value);
                    setGenre(e.target.value);
                  }}
                  className="bg-transparent border-b border-slate-700 text-sm outline-none focus:border-orange-500 text-orange-200 transition-all w-32"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-medium text-orange-300 uppercase tracking-wider flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span> 创意火花 / 故事核心
            </label>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="例如：重生之我是百亿总裁的隐婚妻..."
              className="w-full h-40 bg-slate-800/80 border border-slate-700 rounded-xl p-5 text-slate-200 focus:ring-2 focus:ring-orange-500 outline-none resize-none placeholder-slate-600 text-lg shadow-inner"
            />
            <div className="flex flex-wrap gap-2">
              {CREATIVE_HINTS.map((hint, idx) => (
                <button key={idx} onClick={() => setIdea(hint)} className="text-[10px] px-2 py-1 bg-slate-800/60 hover:text-orange-300 text-slate-500 rounded border border-slate-700/50">
                  {hint}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={onNext} disabled={!idea.trim()} isLoading={isGenerating} className="px-10 py-3 bg-orange-600 hover:bg-orange-500" icon={<Sparkles size={20} />}>
              {isGenerating ? '正在规划爆款路线...' : '生成 100 集剧本架构'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800">
           <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="在此粘贴文本..."
              className="w-full h-64 bg-slate-800/80 border border-slate-700 rounded-xl p-5 text-slate-200 focus:ring-2 focus:ring-orange-500 outline-none"
            />
           <div className="flex justify-end mt-4">
            <Button onClick={() => onAnalyze(importText)} disabled={!importText.trim()} isLoading={isGenerating} icon={<FileText size={20} />}>
              解析并重构
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
