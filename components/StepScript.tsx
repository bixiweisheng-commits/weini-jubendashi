
import React, { useState } from 'react';
import { Button } from './Button';
import { Plus, Play, Save, Copy, FileText, ChevronRight, Download, Trash2, List } from 'lucide-react';
import { EpisodePlan } from '../types';

interface StepScriptProps {
  episodePlan: EpisodePlan[];
  episodes: Record<number, string>;
  setEpisodeContent: (num: number, content: string) => void;
  generateEpisode: (num: number) => void;
  isGenerating: boolean;
  onAutoPlan: () => void;
  onBatchGenerate: () => void;
  onExport: () => void; // Full export
  onExportWord: () => void; // Full export
  onExportEpisode: (num: number) => void; // Single episode
  onExportEpisodeWord: (num: number) => void; // Single episode
  onUpdatePlan: (plan: EpisodePlan[]) => void;
}

export const StepScript: React.FC<StepScriptProps> = ({
  episodePlan, episodes, setEpisodeContent, generateEpisode, isGenerating, 
  onAutoPlan, onBatchGenerate, onExport, onExportWord, onExportEpisode, onExportEpisodeWord, onUpdatePlan
}) => {
  const [activeEpNum, setActiveEpNum] = useState<number>(1);
  const [showPlanEditor, setShowPlanEditor] = useState(false);

  // If no plan exists, prompt to generate it
  if (episodePlan.length === 0) {
      return (
          <div className="h-full flex flex-col items-center justify-center space-y-6 max-w-2xl mx-auto text-center">
              <div className="p-6 bg-indigo-900/20 rounded-full">
                  <List size={48} className="text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">规划分集大纲</h2>
              <p className="text-slate-400">在开始撰写正文之前，让我们先规划好每一集的故事走向，确保剧情连贯。</p>
              <Button onClick={onAutoPlan} isLoading={isGenerating} size="lg" icon={<Play size={20} />}>
                  AI 自动规划分集
              </Button>
          </div>
      );
  }

  const activePlan = episodePlan.find(p => p.number === activeEpNum) || episodePlan[0];
  const currentContent = episodes[activeEpNum] || '';

  const handleDeleteEpisode = (num: number) => {
      if(confirm('确定要清空这一集的内容吗？')) {
          setEpisodeContent(num, '');
      }
  };

  const updatePlanSummary = (num: number, val: string) => {
      const newPlan = episodePlan.map(p => p.number === num ? { ...p, summary: val } : p);
      onUpdatePlan(newPlan);
  };

  return (
    <div className="max-w-[1600px] mx-auto h-full flex gap-6">
      {/* Sidebar - Episode List */}
      <div className="w-80 flex flex-col gap-3 shrink-0 bg-slate-900/50 rounded-xl border border-slate-800 p-4">
        <div className="pb-2 border-b border-slate-800 flex justify-between items-center">
            <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="text-indigo-500" size={18}/> 剧本列表
                </h2>
                <p className="text-xs text-slate-500 mt-1">共 {episodePlan.length} 集</p>
            </div>
            <div className="flex gap-1">
                 <Button onClick={onBatchGenerate} variant="primary" size="sm" disabled={isGenerating} title="一键生成所有">
                    ⚡ 全生成
                 </Button>
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {episodePlan.map((plan) => {
            const hasContent = !!episodes[plan.number];
            return (
              <button
                key={plan.number}
                onClick={() => setActiveEpNum(plan.number)}
                className={`w-full text-left px-3 py-3 rounded-lg transition-all border flex flex-col gap-1 group ${
                  activeEpNum === plan.number
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200'
                    : 'bg-slate-800/50 border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                    <span className="font-medium text-sm">第 {plan.number} 集</span>
                    {hasContent ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                    ) : (
                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                </div>
                <div className="text-xs text-slate-500 truncate w-full opacity-70">
                    {plan.title}
                </div>
              </button>
            );
          })}
        </div>
        
        <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
             <div className="text-xs text-slate-500 text-center mb-1">导出全剧本</div>
             <div className="flex gap-2">
                <Button onClick={onExportWord} variant="secondary" className="flex-1" size="sm" icon={<Download size={14} />}>
                    Word
                </Button>
                <Button onClick={onExport} variant="secondary" className="flex-1" size="sm" icon={<FileText size={14} />}>
                    TXT
                </Button>
             </div>
        </div>
      </div>

      {/* Main Content - Editor */}
      <div className="flex-1 flex flex-col bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-4 bg-slate-950/50 border-b border-slate-800 flex justify-between items-center backdrop-blur-md">
          <div className="flex items-center gap-3">
              <span className="bg-indigo-600 text-xs px-2 py-1 rounded text-white font-bold">EP{activeEpNum}</span>
              <div>
                  <h3 className="font-semibold text-lg text-slate-200">{activePlan.title}</h3>
              </div>
          </div>
          <div className="flex gap-2 items-center">
             <div className="flex gap-1 mr-2">
                <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onExportEpisodeWord(activeEpNum)}
                    disabled={!currentContent}
                    title="导出本集 Word"
                >
                    <Download size={16} className="mr-1"/> Word
                </Button>
                 <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onExportEpisode(activeEpNum)}
                    disabled={!currentContent}
                    title="导出本集 TXT"
                >
                    <FileText size={16} className="mr-1"/> TXT
                </Button>
             </div>
             
             <div className="h-6 w-px bg-slate-700 mx-1"></div>
             
             <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowPlanEditor(!showPlanEditor)}
             >
                 {showPlanEditor ? '隐藏本集摘要' : '查看/修改摘要'}
             </Button>
             <div className="h-6 w-px bg-slate-700 mx-1"></div>
             <Button 
              onClick={() => handleDeleteEpisode(activeEpNum)}
              variant="ghost"
              disabled={!currentContent}
              icon={<Trash2 size={16} />}
              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
             >
               清空
             </Button>
            <Button 
              onClick={() => generateEpisode(activeEpNum)}
              isLoading={isGenerating}
              disabled={isGenerating}
              icon={<Play size={16} />}
              variant="primary"
            >
              {currentContent ? '重新生成本集' : 'AI 撰写本集'}
            </Button>
          </div>
        </div>
        
        <div className="flex-1 relative bg-slate-900 flex flex-col">
            {/* Summary / Plan Editor Context */}
            {showPlanEditor && (
                <div className="p-4 bg-slate-800/50 border-b border-slate-700 animate-in slide-in-from-top-2">
                    <label className="text-xs text-indigo-300 font-bold mb-1 block">本集剧情规划 (AI 将根据此摘要生成剧本)</label>
                    <textarea 
                        value={activePlan.summary}
                        onChange={(e) => updatePlanSummary(activePlan.number, e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-300 focus:border-indigo-500 outline-none h-20 resize-none"
                    />
                </div>
            )}

            <div className="flex-1 relative">
                {!currentContent && !isGenerating ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 space-y-6">
                        <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center">
                        <FileText size={40} className="text-slate-600" />
                        </div>
                        <div className="text-center">
                        <p className="text-lg font-medium text-slate-300">本集暂无内容</p>
                        <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">点击右上角“AI 撰写本集”或“全生成”开始创作。</p>
                        </div>
                    </div>
                ) : (
                    <textarea
                        value={currentContent}
                        onChange={(e) => setEpisodeContent(activeEpNum, e.target.value)}
                        placeholder={isGenerating ? "正在撰写剧本中..." : "在此输入或编辑剧本..."}
                        className="w-full h-full bg-transparent p-8 text-slate-200 outline-none resize-none font-mono text-base leading-loose selection:bg-indigo-500/30"
                        spellCheck={false}
                    />
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
