import React, { useState, useEffect } from 'react';
import { ScriptProject, AppStep, Genre, Character, EpisodePlan } from './types';
import { StepIdea } from './components/StepIdea';
import { StepOutline } from './components/StepOutline';
import { StepCharacters } from './components/StepCharacters';
import { StepScript } from './components/StepScript';
import { generateOutline, extractCharacters, generateCharacterImage, generateEpisodeScript, analyzeAndRewrite, planEpisodes } from './services/geminiService';
import { Clapperboard, BookOpen, Users, PenTool, ChevronRight, Settings, Key } from 'lucide-react';
import { Button } from './components/Button';

export default function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.IDEA);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  
  // API Key State
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('gemini_api_key') || process.env.API_KEY || '';
  });

  const [tempKey, setTempKey] = useState(apiKey);

  const saveApiKey = () => {
    localStorage.setItem('gemini_api_key', tempKey);
    setApiKey(tempKey);
    setShowApiKeyModal(false);
  };
  
  // Project State
  const [project, setProject] = useState<ScriptProject>({
    idea: '',
    genre: '武侠',
    outline: '',
    characters: [],
    episodePlan: [],
    episodes: {}
  });

  // Ensure key is available before calling services
  const ensureKey = (): boolean => {
    if (!apiKey) {
      setShowApiKeyModal(true);
      return false;
    }
    return true;
  };

  // --- Handlers ---

  const handleAnalyze = async (text: string) => {
    if (!ensureKey()) return;
    setIsGenerating(true);
    try {
      const result = await analyzeAndRewrite(apiKey, text);
      setProject(p => ({ 
        ...p, 
        idea: result.idea, 
        genre: result.genre as Genre, 
        outline: result.outline 
      }));
      setCurrentStep(AppStep.OUTLINE);
    } catch (e) {
      alert("分析失败，请检查文本内容或API Key。");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateOutline = async () => {
    if (!ensureKey()) return;
    setIsGenerating(true);
    try {
      const outline = await generateOutline(apiKey, project.idea, project.genre);
      setProject(p => ({ ...p, outline }));
      setCurrentStep(AppStep.OUTLINE);
    } catch (e) {
      alert("生成大纲失败，请检查网络或 Key 是否有效。");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateOutline = async () => {
    await handleGenerateOutline();
  };

  const handleExtractCharacters = async () => {
    if (!ensureKey()) return;
    setIsGenerating(true);
    try {
      const characters = await extractCharacters(apiKey, project.outline);
      setProject(p => ({ ...p, characters }));
      setCurrentStep(AppStep.CHARACTERS);
    } catch (e) {
      alert("提取角色失败。");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateCharacterImage = async (charId: string) => {
    if (!ensureKey()) return;
    const char = project.characters.find(c => c.id === charId);
    if (!char) return;

    // Set loading state for specific character
    setProject(p => ({
      ...p,
      characters: p.characters.map(c => c.id === charId ? { ...c, imageLoading: true } : c)
    }));

    try {
      const imageUrl = await generateCharacterImage(apiKey, char, project.genre);
      setProject(p => ({
        ...p,
        characters: p.characters.map(c => c.id === charId ? { ...c, imageUrl, imageLoading: false } : c)
      }));
    } catch (e) {
      setProject(p => ({
        ...p,
        characters: p.characters.map(c => c.id === charId ? { ...c, imageLoading: false } : c)
      }));
      alert(`无法为 ${char.name} 生成图片`);
    }
  };

  const handlePlanEpisodes = async () => {
    if (!ensureKey()) return;
    setIsGenerating(true);
    try {
        const plan = await planEpisodes(apiKey, project.outline);
        setProject(p => ({ ...p, episodePlan: plan }));
    } catch (e) {
        alert("分集规划失败，请重试");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleToScriptStep = async () => {
      setCurrentStep(AppStep.SCRIPT);
      // Automatically plan episodes if not already done
      if (project.episodePlan.length === 0) {
          await handlePlanEpisodes();
      }
  };

  const handleGenerateEpisode = async (episodeNum: number) => {
    if (!ensureKey()) return;
    const plan = project.episodePlan.find(p => p.number === episodeNum);
    if (!plan) return;

    setIsGenerating(true);
    try {
      // Get context from previous episode if available
      const prevContent = project.episodes[episodeNum - 1] || "";
      const content = await generateEpisodeScript(apiKey, project.outline, project.characters, plan, prevContent);
      setProject(p => ({
        ...p,
        episodes: { ...p.episodes, [episodeNum]: content }
      }));
    } catch (e) {
      alert("生成剧本失败");
    } finally {
      setIsGenerating(false);
    }
  };

  // Batch Generation Logic
  const handleBatchGenerate = async () => {
    if (!ensureKey()) return;
    setIsGenerating(true);
    
    try {
      let currentEpisodes = { ...project.episodes };

      for (const plan of project.episodePlan) {
        if (currentEpisodes[plan.number]) continue;

        const prevContent = currentEpisodes[plan.number - 1] || "";
        const content = await generateEpisodeScript(apiKey, project.outline, project.characters, plan, prevContent);
        
        currentEpisodes[plan.number] = content;
        
        setProject(p => ({
          ...p,
          episodes: { ...p.episodes, [plan.number]: content }
        }));
      }
    } catch (e) {
      alert("一键生成过程中断，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = () => {
    let content = `# ${project.idea}\n\n`;
    content += `## 剧本大纲\n${project.outline}\n\n`;
    content += `## 人物小传\n`;
    project.characters.forEach(c => {
      content += `### ${c.name} (${c.role}, ${c.age})\n${c.personality}\n${c.appearance}\n\n`;
    });
    content += `## 分集剧本\n\n`;
    
    project.episodePlan.forEach(ep => {
      content += `### 第 ${ep.number} 集：${ep.title}\n`;
      content += `摘要：${ep.summary}\n\n`;
      content += `${project.episodes[ep.number] || "(暂无内容)"}\n\n`;
      content += `---\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `剧本_${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportWord = () => {
    // Basic HTML template for Word
    let content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${project.idea}</title></head>
      <body>
      <h1>${project.idea}</h1>
      <h2>剧本大纲</h2>
      <p>${project.outline.replace(/\n/g, '<br/>')}</p>
      <hr/>
      <h2>人物小传</h2>
    `;
    
    project.characters.forEach(c => {
      content += `<h3>${c.name} (${c.role}, ${c.age})</h3>`;
      content += `<p><strong>性格：</strong>${c.personality}</p>`;
      content += `<p><strong>外貌：</strong>${c.appearance}</p>`;
      if (c.imageUrl) {
         content += `<img src="${c.imageUrl}" width="300" />`;
      }
      content += `<br/>`;
    });

    content += `<hr/><h2>分集剧本</h2>`;
    
    project.episodePlan.forEach(ep => {
      content += `<h3>第 ${ep.number} 集：${ep.title}</h3>`;
      content += `<p><strong>摘要：</strong>${ep.summary}</p>`;
      const scriptText = project.episodes[ep.number] || "(暂无内容)";
      content += `<div>${scriptText.replace(/\n/g, '<br/>')}</div>`;
      content += `<br/><hr/><br/>`;
    });

    content += `</body></html>`;

    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `剧本_${new Date().toISOString().slice(0,10)}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpdatePlan = (newPlan: EpisodePlan[]) => {
      setProject(p => ({ ...p, episodePlan: newPlan }));
  };

  const steps = [
    { id: AppStep.IDEA, title: '创意/导入', icon: <Clapperboard size={18} /> },
    { id: AppStep.OUTLINE, title: '故事大纲', icon: <BookOpen size={18} /> },
    { id: AppStep.CHARACTERS, title: '角色设计', icon: <Users size={18} /> },
    { id: AppStep.SCRIPT, title: '分集剧本', icon: <PenTool size={18} /> },
  ];

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header / Nav */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-900/20">
            欢
          </div>
          <h1 className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            欢玺剧本大师
          </h1>
        </div>

        {/* Stepper */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-950/50 p-1.5 rounded-full border border-slate-800/60 shadow-inner">
          {steps.map((step, idx) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => isCompleted && setCurrentStep(step.id)}
                  disabled={!isCompleted && !isActive}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : isCompleted 
                        ? 'text-slate-300 hover:text-white hover:bg-slate-800' 
                        : 'text-slate-600 cursor-not-allowed'
                  }`}
                >
                  {step.icon}
                  <span>{step.title}</span>
                </button>
                {idx < steps.length - 1 && (
                  <ChevronRight size={14} className="text-slate-700 mx-1" />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
           {!apiKey && <span className="text-xs text-amber-500 animate-pulse hidden md:block">⚠️ 请配置 API Key</span>}
           <button 
             onClick={() => setShowApiKeyModal(true)}
             className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
             title="API Key 设置"
           >
             <Settings size={20} />
           </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
         <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/10 to-transparent pointer-events-none"></div>

        <div className="h-full w-full p-6 overflow-y-auto custom-scrollbar relative z-10">
          {currentStep === AppStep.IDEA && (
            <div className="h-full flex flex-col justify-center">
                <StepIdea
                idea={project.idea}
                setIdea={(val) => setProject(p => ({ ...p, idea: val }))}
                genre={project.genre}
                setGenre={(val) => setProject(p => ({ ...p, genre: val }))}
                onNext={handleGenerateOutline}
                onAnalyze={handleAnalyze}
                isGenerating={isGenerating}
                />
            </div>
          )}

          {currentStep === AppStep.OUTLINE && (
            <StepOutline
              outline={project.outline}
              setOutline={(val) => setProject(p => ({ ...p, outline: val }))}
              onNext={handleExtractCharacters}
              onRegenerate={handleRegenerateOutline}
              isGenerating={isGenerating}
            />
          )}

          {currentStep === AppStep.CHARACTERS && (
            <StepCharacters
              characters={project.characters}
              genre={project.genre}
              updateCharacter={(id, updates) => setProject(p => ({
                ...p,
                characters: p.characters.map(c => c.id === id ? { ...c, ...updates } : c)
              }))}
              generateImage={handleGenerateCharacterImage}
              onNext={handleToScriptStep}
            />
          )}

          {currentStep === AppStep.SCRIPT && (
            <StepScript
              episodePlan={project.episodePlan}
              episodes={project.episodes}
              setEpisodeContent={(num, content) => setProject(p => ({
                ...p,
                episodes: { ...p.episodes, [num]: content }
              }))}
              generateEpisode={handleGenerateEpisode}
              isGenerating={isGenerating}
              onAutoPlan={handlePlanEpisodes}
              onBatchGenerate={handleBatchGenerate}
              onExport={handleExport}
              onExportWord={handleExportWord}
              onUpdatePlan={handleUpdatePlan}
            />
          )}
        </div>
      </main>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl scale-100">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Key size={20} className="text-indigo-400"/> 设置 API Key
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              为了使用 Google Gemini 模型，请输入您的 API Key。Key 将安全存储在您的本地浏览器中。
            </p>
            <input 
              type="password"
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-indigo-500 mb-6 font-mono"
            />
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowApiKeyModal(false)}>取消</Button>
              <Button onClick={saveApiKey}>保存配置</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}