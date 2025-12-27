
import React, { useState } from 'react';
import { Button } from './Button';
import { Plus, Play, List, Sparkles, ChevronDown, ChevronUp, Layers, BookOpen, Download, RotateCcw, FileText, CheckSquare, Square } from 'lucide-react';
import { EpisodePlan } from '../types';
import ReactMarkdown from 'react-markdown';

interface StepScriptProps {
  episodePlan: EpisodePlan[];
  episodes: Record<number, string>;
  scriptBible?: string;
  setEpisodeContent: (num: number, content: string) => void;
  generateEpisode: (num: number) => void;
  generateBible: () => void;
  isGenerating: boolean;
  onAutoPlan: (count: number) => void;
  onResetPlan: () => void;
  onBatchGenerate: () => void;
  onExtend: (count: number) => void;
  onUpdatePlan: (plan: EpisodePlan[]) => void;
  batchProgress?: { current: number, total: number } | null;
}

export const StepScript: React.FC<StepScriptProps> = ({
  episodePlan, episodes, scriptBible, setEpisodeContent, generateEpisode, generateBible, isGenerating, 
  onAutoPlan, onResetPlan, onBatchGenerate, onExtend, onUpdatePlan, batchProgress
}) => {
  const [activeEpNum, setActiveEpNum] = useState<number>(0); 
  const [showPlanEditor, setShowPlanEditor] = useState(false);
  const [customCount, setCustomCount] = useState<number>(100);
  const [extendCount, setExtendCount] = useState<number>(10);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [selectedEps, setSelectedEps] = useState<Set<number>>(new Set());

  const pendingCount = episodePlan.filter(p => !episodes[p.number]).length;

  const toggleSelect = (num: number) => {
    const next = new Set(selectedEps);
    if (next.has(num)) next.delete(num);
    else next.add(num);
    setSelectedEps(next);
  };

  const selectAll = () => {
    if (selectedEps.size === episodePlan.length) setSelectedEps(new Set());
    else setSelectedEps(new Set(episodePlan.map(p => p.number)));
  };

  const handleExportSelected = (type: 'txt' | 'doc') => {
    const list = episodePlan.filter(p => selectedEps.has(p.number) || selectedEps.size === 0);
    if (list.length === 0) return alert("请先选择集数");

    let content = "";
    if (type === 'txt') {
        content = `【剧本集】\n\n`;
        list.forEach(p => {
          content += `\n第 ${p.number} 集: ${p.title}\n--------------------\n${episodes[p.number] || "(未生成)"}\n\n`;
        });
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `剧本导出_${new Date().getTime()}.txt`;
        a.click();
    } else {
        content = `<html><head><meta charset='utf-8'></head><body>`;
        list.forEach(p => {
            content += `<h2>第 ${p.number} 集: ${p.title}</h2><div style="white-space:pre-wrap;">${(episodes[p.number] || "未生成").replace(/\n/g, '<br/>')}</div><hr/>`;
        });
        content += `</body></html>`;
        const blob = new Blob([content], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `剧本导出_${new Date().getTime()}.doc`;
        a.click();
    }
  };

  if (episodePlan.length === 0) {
      return (
          <div className="h-full flex flex-col items-center justify-center space-y-6 max-w-2xl mx-auto text-center animate-in fade-in duration-500">
              <div className="p-6 bg-orange-900/20 rounded-full text-orange-500 shadow-xl">
                  <List size={48} />
              </div>
              <h2 className="text-3xl font-bold text-white">分集架构规划</h2>
              <p className="text-slate-400">设定目标集数（上不封顶），AI 将为您智能分布剧情节奏。</p>
              
              <div className="flex flex-col items-center gap-4 w-full bg-slate-900/50 p-8 rounded-2xl border border-slate-800 shadow-2xl">
                <div className="flex items-center gap-4">
                    <label className="text-slate-300 font-medium text-lg">规划集数:</label>
                    <input 
                        type="number" 
                        value={customCount}
                        onChange={(e) => setCustomCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-32 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-center focus:border-orange-500 outline-none text-2xl font-bold"
                    />
                </div>
                <div className="flex gap-2">
                    {[50, 80, 100, 150].map(n => (
                        <button key={n} onClick={() => setCustomCount(n)} className="px-3 py-1 bg-slate-800 hover:bg-orange-600 rounded text-xs">
                            {n}集
                        </button>
                    ))}
                </div>
                <Button onClick={() => onAutoPlan(customCount)} isLoading={isGenerating} size="lg" className="w-full max-w-sm bg-orange-600 mt-4" icon={<Play size={20} />}>
                    确 定 并 开 始 规 划
                </Button>
              </div>
          </div>
      );
  }

  const activePlan = episodePlan.find(p => p.number === activeEpNum);
  const currentContent = activeEpNum === 0 ? scriptBible : (episodes[activeEpNum] || '');

  return (
    <div className="max-w-[1600px] mx-auto h-full flex gap-6 animate-in fade-in duration-500">
      {/* Sidebar */}
      <div className="w-80 flex flex-col gap-3 shrink-0 bg-slate-900/50 rounded-xl border border-slate-800 p-4 shadow-xl relative overflow-hidden">
        <div className="pb-2 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="text-orange-500" size={18}/> 剧本管理器
            </h2>
            <button onClick={onResetPlan} className="text-slate-500 hover:text-orange-400 p-1 transition-colors" title="重新设定集数">
                <RotateCcw size={16} />
            </button>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
          <button
              onClick={() => setActiveEpNum(0)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all border text-xs mb-4 flex items-center gap-2 ${
                activeEpNum === 0 ? 'bg-orange-600 border-orange-500 text-white' : 'bg-slate-800/50 border-transparent text-slate-500 hover:bg-slate-800'
              }`}
          >
              <BookOpen size={14} />
              <span className="font-bold">剧本总纲 (Script Bible)</span>
          </button>

          <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">分集列表</span>
              <button onClick={selectAll} className="text-[10px] text-orange-500 hover:underline">
                  {selectedEps.size === episodePlan.length ? '取消全选' : '全选导出'}
              </button>
          </div>

          {episodePlan.map((plan) => (
            <div key={plan.number} className="flex items-center gap-1 group">
               <button onClick={() => toggleSelect(plan.number)} className="p-1 text-slate-700 hover:text-orange-500">
                   {selectedEps.has(plan.number) ? <CheckSquare size={14} /> : <Square size={14} />}
               </button>
               <button
                  onClick={() => setActiveEpNum(plan.number)}
                  className={`flex-1 text-left px-3 py-2 rounded-lg transition-all border text-xs flex justify-between items-center ${
                    activeEpNum === plan.number
                      ? 'bg-orange-600/20 border-orange-500/50 text-orange-200'
                      : 'bg-slate-800/50 border-transparent text-slate-500 hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate mr-2">第 {plan.number} 集: {plan.title}</span>
                  {episodes[plan.number] && <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />}
                </button>
            </div>
          ))}
          
          <div className="mt-4 p-2 bg-slate-800/30 rounded-lg border border-dashed border-slate-700">
              {showExtendDialog ? (
                  <div className="space-y-2 animate-in slide-in-from-bottom-2">
                      <div className="flex items-center gap-2">
                          <input type="number" value={extendCount} onChange={e => setExtendCount(parseInt(e.target.value) || 1)} className="flex-1 bg-slate-900 rounded p-1 text-xs border border-slate-700" />
                          <Button size="sm" onClick={() => { onExtend(extendCount); setShowExtendDialog(false); }}>确定</Button>
                      </div>
                      <button onClick={() => setShowExtendDialog(false)} className="text-[10px] text-slate-500 w-full text-center">取消</button>
                  </div>
              ) : (
                  <button onClick={() => setShowExtendDialog(true)} className="w-full text-xs text-orange-400 py-1 flex items-center justify-center gap-2 hover:bg-orange-500/10 rounded transition-colors">
                      <Plus size={14} /> 批量扩展后续剧集
                  </button>
              )}
          </div>
        </div>
        
        <div className="pt-4 border-t border-slate-800 space-y-2">
            {batchProgress ? (
                <div className="bg-slate-800 rounded-lg p-3 space-y-2 border border-orange-500/30">
                    <div className="flex justify-between text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                        <span>正在逐集生成...</span>
                        <span>{Math.round((batchProgress.current / batchProgress.total) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-orange-500 h-full transition-all duration-300" style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }} />
                    </div>
                    <p className="text-[10px] text-orange-300 text-center animate-pulse">编写中：第 {episodePlan.filter(p => !episodes[p.number])[batchProgress.current - 1]?.number || '?'} 集</p>
                </div>
            ) : (
                <>
                  {pendingCount > 0 && (
                    <Button onClick={onBatchGenerate} variant="primary" size="sm" className="w-full bg-orange-600 shadow-lg shadow-orange-900/30" isLoading={isGenerating}>
                      <Layers size={14} className="mr-2" /> 
                      {pendingCount === episodePlan.length ? '生成所有剧本' : `继续生成剩余 ${pendingCount} 集`}
                    </Button>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                     <Button onClick={() => handleExportSelected('txt')} variant="secondary" size="sm" icon={<Download size={14}/>}>导出 TXT</Button>
                     <Button onClick={() => handleExportSelected('doc')} variant="secondary" size="sm" icon={<Download size={14}/>}>导出 Word</Button>
                  </div>
                </>
            )}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden shadow-2xl relative">
        <div className="p-4 bg-slate-950/50 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
              <span className="bg-orange-600 text-[10px] px-2 py-1 rounded text-white font-bold tracking-widest">
                  {activeEpNum === 0 ? 'BIBLE' : `EPISODE ${activeEpNum}`}
              </span>
              <h3 className="font-semibold text-slate-200 truncate max-w-md">
                  {activeEpNum === 0 ? '全剧档案：人物、服装与场景' : activePlan?.title}
              </h3>
          </div>
          <div className="flex gap-2">
             {activeEpNum !== 0 && (
                <Button variant="ghost" size="sm" onClick={() => setShowPlanEditor(!showPlanEditor)} className="text-slate-500">
                    {showPlanEditor ? <ChevronUp size={16} /> : <ChevronDown size={16} />} 剧情摘要
                </Button>
             )}
             <Button 
                onClick={() => activeEpNum === 0 ? generateBible() : generateEpisode(activeEpNum)} 
                isLoading={isGenerating} 
                icon={<Sparkles size={16} />} 
                className="bg-orange-600"
             >
               {currentContent ? (activeEpNum === 0 ? '重新生成总纲' : '重新撰写本集') : (activeEpNum === 0 ? '生成总纲档案' : '撰写本集剧本')}
             </Button>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden">
            {showPlanEditor && activeEpNum !== 0 && activePlan && (
                <div className="p-4 bg-slate-800/30 border-b border-slate-700 animate-in slide-in-from-top duration-300">
                    <textarea 
                        value={activePlan.summary}
                        onChange={(e) => {
                          const newPlan = episodePlan.map(p => p.number === activeEpNum ? {...p, summary: e.target.value} : p);
                          onUpdatePlan(newPlan);
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-sm text-slate-400 focus:border-orange-500 outline-none h-24 resize-none"
                    />
                </div>
            )}
            {activeEpNum === 0 ? (
                <div className="w-full h-full overflow-y-auto p-12 prose prose-invert prose-orange max-w-none">
                    {scriptBible ? <ReactMarkdown>{scriptBible}</ReactMarkdown> : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-600 space-y-6">
                            <BookOpen size={80} className="opacity-10" />
                            <div className="text-center">
                                <p className="text-lg font-medium">剧本总纲尚未生成</p>
                                <p className="text-sm opacity-50">点击右上方按钮提取剧本中的所有人物、场景、服装和道具信息</p>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="relative flex-1">
                    <textarea
                        value={currentContent}
                        onChange={(e) => setEpisodeContent(activeEpNum, e.target.value)}
                        placeholder="正在等待指令..."
                        className="w-full h-full bg-transparent p-12 text-slate-200 outline-none resize-none font-mono text-xl leading-relaxed selection:bg-orange-500/30 whitespace-pre-wrap"
                        spellCheck={false}
                    />
                    {!currentContent && !isGenerating && (
                         <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                             <FileText size={120} />
                         </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
