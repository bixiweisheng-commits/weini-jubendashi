
import React, { useState } from 'react';
import { Button } from './Button';
import { Plus, Play, List, Sparkles, ChevronDown, ChevronUp, Layers, BookOpen, Download, RotateCcw } from 'lucide-react';
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
  onExtend: () => void;
  onUpdatePlan: (plan: EpisodePlan[]) => void;
  batchProgress?: { current: number, total: number } | null;
}

export const StepScript: React.FC<StepScriptProps> = ({
  episodePlan, episodes, scriptBible, setEpisodeContent, generateEpisode, generateBible, isGenerating, 
  onAutoPlan, onResetPlan, onBatchGenerate, onExtend, onUpdatePlan, batchProgress
}) => {
  const [activeEpNum, setActiveEpNum] = useState<number>(0); // 0 means Bible
  const [showPlanEditor, setShowPlanEditor] = useState(false);
  const [customCount, setCustomCount] = useState<number>(100);

  const pendingCount = episodePlan.filter(p => !episodes[p.number]).length;

  const handleExportTxt = () => {
    let fullText = `【剧本总纲】\n\n${scriptBible || ""}\n\n`;
    episodePlan.forEach(p => {
      fullText += `\n\n====================\n第 ${p.number} 集: ${p.title}\n====================\n\n`;
      fullText += episodes[p.number] || "(本集尚未生成)";
    });
    
    const blob = new Blob([fullText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `剧本合集_${new Date().toLocaleDateString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportDoc = () => {
    // Generate simple HTML that Word can open correctly
    let htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>剧本导出</title></head>
      <body>
        <h1>剧本总纲</h1>
        <div style="white-space: pre-wrap;">${scriptBible?.replace(/\n/g, '<br/>') || ""}</div>
        <hr/>
    `;

    episodePlan.forEach(p => {
      htmlContent += `
        <h2 style="page-break-before: always;">第 ${p.number} 集: ${p.title}</h2>
        <div style="white-space: pre-wrap;">${(episodes[p.number] || "本集尚未生成").replace(/\n/g, '<br/>')}</div>
      `;
    });

    htmlContent += `</body></html>`;
    
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `剧本全集_${new Date().toLocaleDateString()}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (episodePlan.length === 0) {
      return (
          <div className="h-full flex flex-col items-center justify-center space-y-6 max-w-2xl mx-auto text-center animate-in fade-in duration-500">
              <div className="p-6 bg-orange-900/20 rounded-full text-orange-500 shadow-xl">
                  <List size={48} />
              </div>
              <h2 className="text-3xl font-bold text-white">分集架构规划</h2>
              <p className="text-slate-400">设定您想要的剧本总集数，AI 将为您构建完整的爆款故事架构。</p>
              
              <div className="flex flex-col items-center gap-4 w-full bg-slate-900/50 p-8 rounded-2xl border border-slate-800 shadow-2xl">
                <div className="flex items-center gap-4">
                    <label className="text-slate-300 font-medium">目标集数:</label>
                    <input 
                        type="number" 
                        value={customCount}
                        onChange={(e) => setCustomCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-center focus:border-orange-500 outline-none text-xl font-bold"
                    />
                </div>
                <div className="flex gap-3 w-full max-w-sm mt-2">
                    <Button onClick={() => onAutoPlan(customCount)} isLoading={isGenerating} size="lg" className="flex-1 bg-orange-600 hover:bg-orange-500" icon={<Play size={20} />}>
                        生成分集大纲
                    </Button>
                </div>
              </div>
          </div>
      );
  }

  const activePlan = episodePlan.find(p => p.number === activeEpNum);
  const currentContent = activeEpNum === 0 ? scriptBible : (episodes[activeEpNum] || '');

  return (
    <div className="max-w-[1600px] mx-auto h-full flex gap-6 animate-in fade-in duration-500">
      {/* Sidebar */}
      <div className="w-80 flex flex-col gap-3 shrink-0 bg-slate-900/50 rounded-xl border border-slate-800 p-4 shadow-xl">
        <div className="pb-2 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="text-orange-500" size={18}/> 剧本控制台
            </h2>
            <button onClick={onResetPlan} className="text-slate-500 hover:text-orange-400 p-1" title="重设集数">
                <RotateCcw size={16} />
            </button>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
          <button
              onClick={() => setActiveEpNum(0)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all border text-xs mb-4 flex items-center gap-2 ${
                activeEpNum === 0
                  ? 'bg-orange-600/20 border-orange-500/50 text-orange-200'
                  : 'bg-slate-800/50 border-transparent text-slate-500 hover:bg-slate-800'
              }`}
          >
              <BookOpen size={14} />
              <span className="font-bold">剧本总纲 (Bible)</span>
              {scriptBible && <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 ml-auto" />}
          </button>

          {episodePlan.map((plan) => (
            <button
              key={plan.number}
              onClick={() => setActiveEpNum(plan.number)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all border text-xs flex justify-between items-center ${
                activeEpNum === plan.number
                  ? 'bg-orange-600/20 border-orange-500/50 text-orange-200'
                  : 'bg-slate-800/50 border-transparent text-slate-500 hover:bg-slate-800'
              }`}
            >
              <span className="truncate mr-2">第 {plan.number} 集: {plan.title}</span>
              {episodes[plan.number] && <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />}
            </button>
          ))}
          <Button onClick={onExtend} variant="ghost" size="sm" className="w-full mt-4 border border-dashed border-slate-700 text-orange-400 hover:bg-orange-900/10">
            <Plus size={14} className="mr-2" /> 扩展下一集
          </Button>
        </div>
        
        <div className="pt-4 border-t border-slate-800 space-y-2">
            {batchProgress ? (
                <div className="bg-slate-800 rounded-lg p-3 space-y-2 border border-orange-500/30">
                    <div className="flex justify-between text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                        <span>批量生成中...</span>
                        <span>{Math.round((batchProgress.current / batchProgress.total) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
                        <div className="bg-orange-500 h-full transition-all duration-300" style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }} />
                    </div>
                    <p className="text-[10px] text-orange-300 text-center">正在编写第 {batchProgress.current} 集</p>
                </div>
            ) : (
                <>
                  {pendingCount > 0 && (
                    <Button onClick={onBatchGenerate} variant="primary" size="sm" className="w-full bg-orange-600 animate-pulse shadow-orange-500/20 shadow-lg" isLoading={isGenerating}>
                      <Layers size={14} className="mr-2" /> 
                      {pendingCount === episodePlan.length ? '一键生成所有剧本' : `继续生成剩余 ${pendingCount} 集`}
                    </Button>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                     <Button onClick={handleExportTxt} variant="secondary" size="sm" icon={<Download size={14}/>}>导出 TXT</Button>
                     <Button onClick={handleExportDoc} variant="secondary" size="sm" icon={<Download size={14}/>}>导出 Word</Button>
                  </div>
                </>
            )}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-4 bg-slate-950/50 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
              <span className="bg-orange-600 text-xs px-2 py-1 rounded text-white font-bold">
                  {activeEpNum === 0 ? 'BIBLE' : `EP${activeEpNum}`}
              </span>
              <h3 className="font-semibold text-slate-200 truncate max-w-md">
                  {activeEpNum === 0 ? '全剧总纲：人物与场景档案' : activePlan?.title}
              </h3>
          </div>
          <div className="flex gap-2">
             {activeEpNum !== 0 && (
                <Button variant="ghost" size="sm" onClick={() => setShowPlanEditor(!showPlanEditor)}>
                    {showPlanEditor ? <ChevronUp size={16} /> : <ChevronDown size={16} />} 剧情大纲
                </Button>
             )}
             <Button 
                onClick={() => activeEpNum === 0 ? generateBible() : generateEpisode(activeEpNum)} 
                isLoading={isGenerating} 
                icon={<Sparkles size={16} />} 
                className="bg-orange-600"
             >
               {currentContent ? (activeEpNum === 0 ? '重新生成总纲' : '重新撰写本集') : (activeEpNum === 0 ? 'AI 生成总纲' : 'AI 撰写本集')}
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
                <div className="w-full h-full overflow-y-auto p-10 prose prose-invert prose-orange max-w-none prose-headings:text-orange-400 prose-strong:text-orange-200">
                    {scriptBible ? <ReactMarkdown>{scriptBible}</ReactMarkdown> : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
                            <BookOpen size={64} className="opacity-10" />
                            <p>点击上方「AI 生成总纲」生成涵盖人物、服装、场景及道具的完整档案</p>
                        </div>
                    )}
                </div>
            ) : (
                <textarea
                    value={currentContent}
                    onChange={(e) => setEpisodeContent(activeEpNum, e.target.value)}
                    placeholder="点击右上方「AI 撰写」开始创作..."
                    className="w-full h-full bg-transparent p-10 text-slate-200 outline-none resize-none font-mono text-lg leading-relaxed selection:bg-orange-500/30 whitespace-pre-wrap"
                    spellCheck={false}
                />
            )}
        </div>
      </div>
    </div>
  );
};
