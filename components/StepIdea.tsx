import React, { useState } from 'react';
import { Genre, GENRES } from '../types';
import { Button } from './Button';
import { Sparkles, FileText, Lightbulb, Upload } from 'lucide-react';

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
  "赛博朋克世界的赏金猎人接到一个保护仿生人的任务...",
  "落魄的厨神穿越回古代御膳房，用现代料理征服皇帝...",
  "一觉醒来，全世界的人都听不到声音，除了主角...",
  "被困在同一天的大学生，必须找出阻止世界毁灭的方法...",
  "退隐江湖的剑客在现代都市开了一家侦探事务所..."
];

export const StepIdea: React.FC<StepIdeaProps> = ({ 
  idea, setIdea, genre, setGenre, onNext, onAnalyze, isGenerating 
}) => {
  const [mode, setMode] = useState<'create' | 'import'>('create');
  const [importText, setImportText] = useState('');

  const handleHintClick = (hint: string) => {
    setIdea(hint);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400">
          欢玺剧本大师
        </h2>
        <p className="text-slate-400 text-lg">从灵感到剧本，AI 助你一臂之力</p>
      </div>

      {/* Mode Switcher */}
      <div className="flex justify-center">
        <div className="bg-slate-900 p-1 rounded-lg border border-slate-800 flex gap-1">
          <button
            onClick={() => setMode('create')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              mode === 'create' 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-2"><Sparkles size={16} /> 从零创作</span>
          </button>
          <button
            onClick={() => setMode('import')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              mode === 'import' 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-2"><Upload size={16} /> 导入/仿写</span>
          </button>
        </div>
      </div>

      {mode === 'create' ? (
        <div className="space-y-8 bg-slate-900/50 p-8 rounded-2xl border border-slate-800 backdrop-blur-sm">
          {/* Genre Selection */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-indigo-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
              选择剧本类型
            </label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {GENRES.map((g) => (
                <button
                  key={g}
                  onClick={() => setGenre(g)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                    genre === g
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/40'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:border-slate-600 hover:text-slate-200'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Idea Input */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-indigo-300 uppercase tracking-wider flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
               一句话创意 / 故事梗概
            </label>
            <div className="relative">
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="在此输入你的创意..."
                className="w-full h-40 bg-slate-800/80 border border-slate-700 rounded-xl p-5 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none placeholder-slate-600 text-lg leading-relaxed shadow-inner"
              />
              <div className="absolute top-2 right-2">
                 <Lightbulb className="text-amber-400 opacity-20" size={24} />
              </div>
            </div>

            {/* Hints */}
            <div className="space-y-2">
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Sparkles size={12} /> 灵感提示 (点击填入)
              </p>
              <div className="flex flex-wrap gap-2">
                {CREATIVE_HINTS.map((hint, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleHintClick(hint)}
                    className="text-xs px-3 py-1.5 bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-indigo-300 rounded-full border border-slate-700/50 transition-colors text-left max-w-full truncate"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              onClick={onNext} 
              disabled={!idea.trim()} 
              isLoading={isGenerating}
              className="w-full md:w-auto text-lg px-10 py-3 shadow-xl shadow-indigo-900/20"
              icon={<Sparkles size={20} />}
            >
              {isGenerating ? '正在构建故事骨架...' : '生成剧本大纲'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-8 bg-slate-900/50 p-8 rounded-2xl border border-slate-800 backdrop-blur-sm">
           <div className="space-y-4">
             <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-900/30 rounded-lg text-indigo-400">
                  <Upload size={24} />
                </div>
                <div>
                   <h3 className="text-lg font-medium text-white">导入文本进行仿写/改编</h3>
                   <p className="text-slate-400 text-sm mt-1">粘贴现有的小说章节、剧本片段或粗略笔记。AI 将分析其风格、提取核心并帮你重构大纲。</p>
                </div>
             </div>
             
             <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="在此粘贴文本..."
                className="w-full h-64 bg-slate-800/80 border border-slate-700 rounded-xl p-5 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none placeholder-slate-600 text-sm leading-relaxed shadow-inner font-mono"
              />
           </div>
           
           <div className="flex justify-end pt-4">
            <Button 
              onClick={() => onAnalyze(importText)} 
              disabled={!importText.trim()} 
              isLoading={isGenerating}
              className="w-full md:w-auto text-lg px-10 py-3"
              icon={<FileText size={20} />}
            >
              {isGenerating ? '正在分析文本...' : '分析并生成大纲'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};