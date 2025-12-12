import React, { useState } from 'react';
import { Button } from './Button';
import { Plus, Play, Save, Copy, FileText, ChevronRight, Wand2, Download, Trash2, Zap, FileOutput } from 'lucide-react';
import { EpisodePlan } from '../types';

interface StepScriptProps {
  episodePlan: EpisodePlan[];
  episodes: Record<number, string>;
  setEpisodeContent: (num: number, content: string) => void;
  generateEpisode: (num: number) => void;
  isGenerating: boolean;
  onAutoPlan: () => void;
  onUpdatePlan: (plan: EpisodePlan[]) => void;
  onBatchGenerate: () => void;
  onExport: () => void;
  onExportWord: () => void;
}

export const StepScript: React.FC<StepScriptProps> = ({
  episodePlan, episodes, setEpisodeContent, generateEpisode, isGenerating, onAutoPlan, onUpdatePlan, onBatchGenerate, onExport, onExportWord
}) => {
  const [activeEp, setActiveEp] = React.useState<number>(1);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  // If no plan, show empty state or auto-trigger
  const hasPlan = episodePlan && episodePlan.length > 0;
  
  const currentPlan = hasPlan ? episodePlan.find(p => p.number === activeEp) : null;
  const currentContent = episodes[activeEp] || '';

  // Ensure activeEp is valid
  React.useEffect(() => {
    if (episodePlan.length > 0 && !episodePlan.find(p => p.number === activeEp)) {
      setActiveEp(episodePlan[0].number);
    }
  }, [episodePlan, activeEp]);

  const handleDeleteEpisode = (e: React.MouseEvent, num: number) => {
    e.stopPropagation();
    if (!confirm(`确定要删除第 ${num} 集吗？这会重新排列后续集数。`)) return;
    
    const newPlan = episodePlan
      .filter(p => p.number !== num)
      .map((p, index) => ({ ...p, number: index + 1 })); // Renumber
    
    onUpdatePlan(newPlan);
  };

  const handleAddEpisode = () => {
    const newNum = episodePlan.length + 1;
    const newPlan = [
      ...episodePlan,
      { number: newNum, title: "新剧集", summary: "请输入剧情摘要..." }
    ];
    onUpdatePlan(newPlan);
    setActiveEp(newNum);
  };

  const handleUpdateCurrentPlan = (updates: Partial<EpisodePlan>) => {
    if (!currentPlan) return;
    const newPlan = episodePlan.map(p => 
      p.number === activeEp ? { ...p, ...updates } : p
    );
    onUpdatePlan(newPlan);
  };

  const handleManualSave = () => {
      // Logic is handled by state, this provides visual feedback
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
  };

  if (!hasPlan && !isGenerating) {
    return (
       <div className="h-full flex flex-col items-center justify-center space-y-6">
          <div className="text-center space-y-2">
             <h2 className="text-2xl font-bold text-white">正在规划分集剧情...</h2>
             <p className="text-slate-400">AI 正在根据大纲拆解故事结构，请稍候。</p>
          </div>
          <Button onClick={onAutoPlan} isLoading={isGenerating} size="lg" icon={<Wand2 size={20}/>}>
             开始生成分集列表
          </Button>
       </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto h-full flex gap-6">
      {/* Sidebar - Episode List */}
      <div className="w-80 flex flex-col gap-3 shrink-0 bg-slate-900/50 rounded-xl border border-slate-800 p-4">
        <div className="pb-2 border-b border-slate-800">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="text-indigo-500" size={20}/> 分集剧本
            </h2>
            <p className="text-xs text-slate-500 mt-1">共 {episodePlan.length} 集</p>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {episodePlan.map((ep) => {
            const hasContent = !!episodes[ep.number];
            return (
              <div
                key={ep.number}
                onClick={() => setActiveEp(ep.number)}
                className={`w-full text-left p-3 rounded-lg transition-all border flex flex-col gap-1 cursor-pointer group relative ${
                  activeEp === ep.number
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-100'
                    : 'bg-slate-800/50 border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                   <span className="font-bold text-sm">第 {ep.number} 集</span>
                   {hasContent && <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />}
                </div>
                <span className="text-xs opacity-70 truncate w-11/12">{ep.title}</span>
                
                {/* Delete Button */}
                <button 
                  onClick={(e) => handleDeleteEpisode(e, ep.number)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded opacity-0 group-hover:opacity-100 transition-all"
                  title="删除本集"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>

        <div className="pt-2 space-y-2 border-t border-slate-800">
          <Button onClick={handleAddEpisode} variant="outline" className="w-full border-dashed text-xs" icon={<Plus size={14} />}>
            新增一集
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={onBatchGenerate} disabled={isGenerating} variant="secondary" className="w-full text-xs" icon={<Zap size={14} />}>
              一键生成
            </Button>
             {/* Dropdown-ish UI for exports */}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={onExport} disabled={isGenerating} variant="secondary" className="w-full text-xs" icon={<Download size={14} />}>
              导出 TXT
            </Button>
            <Button onClick={onExportWord} disabled={isGenerating} variant="secondary" className="w-full text-xs" icon={<FileOutput size={14} />}>
              导出 Word
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Editor */}
      <div className="flex-1 flex flex-col bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-4 bg-slate-950/50 border-b border-slate-800 flex flex-col gap-4 backdrop-blur-md">
           
           {/* Title and Summary Editing */}
           <div className="flex justify-between items-start gap-4">
              <div className="flex-1 space-y-2">
                 <div className="flex items-center gap-2">
                    <span className="bg-indigo-500 text-xs px-2 py-0.5 rounded text-white font-bold shrink-0">EP{activeEp}</span>
                    <input 
                      type="text" 
                      value={currentPlan?.title || ''} 
                      onChange={(e) => handleUpdateCurrentPlan({ title: e.target.value })}
                      className="bg-transparent text-lg font-semibold text-slate-200 outline-none placeholder-slate-600 w-full focus:underline decoration-indigo-500/50"
                      placeholder="输入本集标题"
                    />
                 </div>
                 <input
                   value={currentPlan?.summary || ''}
                   onChange={(e) => handleUpdateCurrentPlan({ summary: e.target.value })}
                   className="bg-slate-800/50 rounded px-2 py-1 text-sm text-slate-400 outline-none w-full placeholder-slate-600 focus:text-slate-200 focus:bg-slate-800"
                   placeholder="输入本集剧情摘要 (用于生成剧本的上下文)"
                 />
              </div>

              <div className="flex gap-2 shrink-0">
                  <Button 
                    onClick={handleManualSave}
                    variant="outline"
                    icon={<Save size={16} />}
                  >
                    {saveStatus === 'saved' ? '已保存' : '保存'}
                  </Button>
                  <Button 
                    onClick={() => generateEpisode(activeEp)}
                    isLoading={isGenerating}
                    disabled={isGenerating}
                    icon={<Play size={16} />}
                    variant="primary"
                  >
                    {currentContent ? '重新生成' : 'AI 撰写'}
                  </Button>
              </div>
           </div>
        </div>
        
        <div className="flex-1 relative bg-slate-950">
            {!currentContent && !isGenerating ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 space-y-6 p-8">
                    <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800">
                       <FileText size={32} className="text-indigo-500" />
                    </div>
                    <div className="text-center max-w-md space-y-2">
                      <p className="text-xl font-medium text-slate-200">准备生成第 {activeEp} 集</p>
                      <p className="text-sm text-slate-500 bg-slate-900 p-4 rounded-lg border border-slate-800 text-left">
                        <span className="font-bold text-indigo-400 block mb-1">剧情摘要：</span>
                        {currentPlan?.summary || "暂无摘要"}
                      </p>
                    </div>
                    <Button onClick={() => generateEpisode(activeEp)} variant="primary" className="px-8 py-3 text-lg shadow-lg shadow-indigo-500/20">
                      开始撰写剧本
                    </Button>
                </div>
            ) : (
                 <textarea
                    value={currentContent}
                    onChange={(e) => setEpisodeContent(activeEp, e.target.value)}
                    placeholder={isGenerating ? "正在撰写剧本中..." : "剧本内容区域... (可直接编辑)"}
                    className="w-full h-full bg-transparent p-8 text-slate-200 outline-none resize-none font-mono text-base leading-loose selection:bg-indigo-500/30 whitespace-pre-wrap"
                    spellCheck={false}
                 />
            )}
        </div>
      </div>
    </div>
  );
};