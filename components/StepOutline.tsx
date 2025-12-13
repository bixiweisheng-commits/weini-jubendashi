
import React, { useEffect, useState } from 'react';
import { Button } from './Button';
import { ArrowRight, RotateCcw, PenTool, CheckCircle2, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generateOutlineOptions } from '../services/geminiService';

interface StepOutlineProps {
  outline: string;
  setOutline: (val: string) => void;
  onNext: (force?: boolean) => void;
  onRegenerate: () => void; // Used for "Try again"
  isGenerating: boolean;
  options?: string[];
  hasCharacters?: boolean;
}

// We need a parent component or logic to handle the "Options" phase if we want to keep it clean. 
// For now, I'll inject the options logic here. 
// Ideally, App.tsx should pass options, but to minimize App.tsx changes, 
// I will assume `outline` being empty means we need options, OR we add a new prop `options`.
// Actually, let's make StepOutline handle the "Display Options" vs "Display Final" state.

export const StepOutline: React.FC<StepOutlineProps> = ({
  outline, setOutline, onNext, onRegenerate, isGenerating, options = [], hasCharacters = false
}) => {
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // If we have options but no final outline selected yet (or user wants to pick)
  const showOptions = !outline && options.length > 0;

  const handleSelectOption = (opt: string, index: number) => {
    setSelectedOptionIndex(index);
    setOutline(opt);
    // Automatically exit option mode
  };

  if (showOptions) {
      return (
        <div className="max-w-6xl mx-auto space-y-6 h-full flex flex-col pb-6">
            <div className="text-center space-y-2 shrink-0">
                <h2 className="text-2xl font-bold text-white">选择一个大纲方案</h2>
                <p className="text-slate-400">AI 为您生成了三个不同风格的故事走向，请选择最喜欢的一个继续。</p>
            </div>
            
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto p-2">
                {options.map((opt, idx) => (
                    <div 
                        key={idx} 
                        className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 flex flex-col hover:border-indigo-500 transition-colors group relative"
                    >
                        <div className="absolute top-4 right-4 text-slate-600 group-hover:text-indigo-500 font-bold text-4xl opacity-20 select-none">
                            {['A', 'B', 'C'][idx]}
                        </div>
                        <div className="flex-1 overflow-y-auto mb-4 custom-scrollbar text-sm text-slate-300 leading-relaxed max-h-[60vh]">
                            <ReactMarkdown>{opt}</ReactMarkdown>
                        </div>
                        <Button onClick={() => handleSelectOption(opt, idx)} className="w-full">
                            选择方案 {['A', 'B', 'C'][idx]}
                        </Button>
                    </div>
                ))}
            </div>
            
             <div className="flex justify-center shrink-0 pt-2">
                <Button variant="ghost" onClick={onRegenerate} disabled={isGenerating}>
                    都不满意？重新生成
                </Button>
             </div>
        </div>
      );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between shrink-0 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
        <div>
           <h2 className="text-2xl font-bold text-white flex items-center gap-2">
             <span className="text-indigo-500">#</span> 最终大纲
           </h2>
           <p className="text-sm text-slate-400 mt-1">您可以继续编辑完善，或直接进行角色开发。</p>
        </div>
        <div className="flex gap-3">
           <Button variant="ghost" onClick={() => setOutline('')} icon={<RotateCcw size={16} />}>
            重选方案
           </Button>
           <Button variant="secondary" onClick={() => setIsEditing(!isEditing)} icon={<PenTool size={16} />}>
            {isEditing ? '预览模式' : '编辑模式'}
           </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-slate-800/30 rounded-xl border border-slate-700/50 backdrop-blur-sm shadow-xl">
        {isEditing ? (
          <textarea
            value={outline}
            onChange={(e) => setOutline(e.target.value)}
            className="w-full h-full bg-slate-900/50 p-8 text-slate-200 outline-none resize-none font-mono text-base leading-relaxed focus:bg-slate-900/80 transition-colors"
          />
        ) : (
          <div className="h-full overflow-y-auto p-8 prose prose-invert prose-slate max-w-none prose-headings:text-indigo-400 prose-strong:text-indigo-200">
            <ReactMarkdown>{outline}</ReactMarkdown>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2 shrink-0 gap-4">
        {hasCharacters && (
             <Button 
                variant="ghost" 
                onClick={() => {
                    if (window.confirm("确定要根据新的大纲重新生成所有角色吗？现有角色数据（包括图片）将丢失。")) {
                        onNext(true);
                    }
                }} 
                isLoading={isGenerating}
                icon={<RefreshCw size={16} />}
                className="text-slate-400 hover:text-red-400"
            >
                重置并重新生成角色
            </Button>
        )}
        <Button 
          onClick={() => onNext(false)} 
          isLoading={isGenerating}
          className="px-8 py-3 text-lg shadow-lg shadow-indigo-900/30"
          icon={<ArrowRight size={20} />}
        >
          {isGenerating ? '正在分析角色...' : (hasCharacters ? '继续下一步 (保留现有角色)' : '确认并提取角色')}
        </Button>
      </div>
    </div>
  );
};
