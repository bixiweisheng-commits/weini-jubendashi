
import React, { useState } from 'react';
import { ScriptProject, AppStep, Genre, Character, EpisodePlan } from './types';
import { StepIdea } from './components/StepIdea';
import { StepOutline } from './components/StepOutline';
import { StepCharacters } from './components/StepCharacters';
import { StepScript } from './components/StepScript';
import { generateOutlineOptions, extractCharacters, generateCharacterImage, generateEpisodeScript, planEpisodes, extendStory, generateScriptBible } from './services/geminiService';
import { Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './components/Button';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.IDEA);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number, total: number } | null>(null);
  
  const [apiKey, setApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('gemini_api_key') || '';
    } catch (e) {
      return '';
    }
  });

  const [project, setProject] = useState<ScriptProject>({
    idea: '',
    genre: '霸总虐恋',
    outline: '',
    characters: [],
    episodePlan: [],
    episodes: {},
    scriptBible: ''
  });

  const [outlineOptions, setOutlineOptions] = useState<string[]>([]);
  const [tempKey, setTempKey] = useState(apiKey);

  const ensureKey = () => {
    if (!apiKey) { setShowApiKeyModal(true); return false; }
    return true;
  };

  const handleGenerateOutlineOptions = async () => {
    if (!ensureKey()) return;
    setIsGenerating(true);
    try {
      const options = await generateOutlineOptions(apiKey, project.idea, project.genre);
      setOutlineOptions(options);
      setCurrentStep(AppStep.OUTLINE);
    } catch (e) {
      alert("生成大纲失败，请检查 API Key 或网络");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToCharacters = async () => {
    if (!ensureKey()) return;
    setIsGenerating(true);
    try {
      const chars = await extractCharacters(apiKey, project.outline);
      setProject(p => ({ ...p, characters: chars }));
      setCurrentStep(AppStep.CHARACTERS);
    } catch (e) {
      alert("解析角色失败");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateCharacterImage = async (charId: string) => {
    if (!ensureKey()) return;
    const char = project.characters.find(c => c.id === charId);
    if (!char) return;

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
      alert("生成图片失败");
      setProject(p => ({
        ...p,
        characters: p.characters.map(c => c.id === charId ? { ...c, imageLoading: false } : c)
      }));
    }
  };

  const handlePlanEpisodes = async (count: number) => {
    if (!ensureKey()) return;
    setIsGenerating(true);
    try {
        const plan = await planEpisodes(apiKey, project.outline, count);
        setProject(p => ({ ...p, episodePlan: plan }));
    } catch (e) {
        alert("规划集数失败");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleGenerateBible = async () => {
    if (!ensureKey()) return;
    setIsGenerating(true);
    try {
      const bible = await generateScriptBible(apiKey, project.outline, project.characters);
      setProject(p => ({ ...p, scriptBible: bible }));
    } catch (e) {
      alert("生成总纲失败");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBatchGenerate = async () => {
    if (!ensureKey()) return;
    if (batchProgress) return; 

    const pending = project.episodePlan.filter(p => !project.episodes[p.number]);
    if (pending.length === 0) {
        alert("所有集数已完成！");
        return;
    }

    setBatchProgress({ current: 0, total: pending.length });
    
    try {
      let currentEpisodes = { ...project.episodes };
      let processedCount = 0;

      for (const plan of pending) {
          let success = false;
          let retryCount = 0;
          const maxRetries = 2;

          while (!success && retryCount <= maxRetries) {
              try {
                  const prevContent = currentEpisodes[plan.number - 1] || "";
                  const content = await generateEpisodeScript(apiKey, project.outline, project.characters, plan, prevContent);
                  
                  currentEpisodes = { ...currentEpisodes, [plan.number]: content };
                  setProject(p => ({ ...p, episodes: { ...currentEpisodes } }));
                  success = true;
              } catch (e: any) {
                  console.warn(`第 ${plan.number} 集生成尝试 ${retryCount + 1} 失败`, e);
                  retryCount++;
                  if (retryCount <= maxRetries) {
                      await sleep(3000 * retryCount); // Increased backoff
                  }
              }
          }

          if (!success) {
              const shouldContinue = window.confirm(`第 ${plan.number} 集生成连续多次失败（可能是网络或安全过滤），是否跳过本集并继续生成剩下的集数？`);
              if (!shouldContinue) {
                  break; 
              }
          } else {
              await sleep(1000); // Respect API limits
          }

          processedCount++;
          setBatchProgress({ current: processedCount, total: pending.length });
      }
    } catch (err) {
      console.error("Batch generation fatal error:", err);
      alert("批量生成过程发生错误，您可以再次点击「继续完成未生成集数」");
    } finally {
      setBatchProgress(null);
    }
  };

  const handleExtendStory = async () => {
      if (!ensureKey()) return;
      setIsGenerating(true);
      try {
          const last = project.episodePlan[project.episodePlan.length - 1];
          const next = await extendStory(apiKey, project.outline, project.characters, last);
          setProject(p => ({ ...p, episodePlan: [...p.episodePlan, next] }));
      } catch (e) {
          alert("扩展失败");
      } finally {
          setIsGenerating(false);
      }
  };

  const handleGenerateEpisode = async (num: number) => {
      if (!ensureKey()) return;
      setIsGenerating(true);
      try {
          const plan = project.episodePlan.find(p => p.number === num);
          if (!plan) return;
          const prev = project.episodes[num-1] || "";
          // Fixed the typo: using 'prev' instead of 'prevContent'
          const content = await generateEpisodeScript(apiKey, project.outline, project.characters, plan, prev);
          setProject(p => ({ ...p, episodes: { ...project.episodes, [num]: content } }));
      } catch (e) {
          console.error(e);
          alert("编写失败，请检查网络或稍后再试");
      } finally {
          setIsGenerating(false);
      }
  };

  const handleGoBack = () => {
      if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleGoForward = () => {
      if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-200">
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-600 rounded-xl flex items-center justify-center text-white font-bold">欢</div>
            <h1 className="font-bold text-lg hidden md:block">欢玺剧本大师 Pro</h1>
          </div>
          
          <nav className="flex items-center bg-slate-800/50 rounded-lg p-1 border border-slate-700">
              <button 
                onClick={handleGoBack} 
                disabled={currentStep === AppStep.IDEA}
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
              >
                  <ChevronLeft size={20} />
              </button>
              <div className="px-4 text-xs font-bold text-orange-400 uppercase tracking-widest">
                  Step {currentStep + 1}
              </div>
              <button 
                onClick={handleGoForward}
                disabled={currentStep === AppStep.SCRIPT || (currentStep === AppStep.IDEA && !project.idea) || (currentStep === AppStep.OUTLINE && !project.outline)}
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
              >
                  <ChevronRight size={20} />
              </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
           <button onClick={() => setShowApiKeyModal(true)} className="p-2 text-slate-400 hover:text-white transition-colors bg-slate-800 rounded-lg">
                <Settings size={20} />
           </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        <div className="h-full w-full p-6 overflow-y-auto custom-scrollbar">
          {currentStep === AppStep.IDEA && (
            <StepIdea idea={project.idea} setIdea={(v) => setProject(p => ({...p, idea: v}))} genre={project.genre} setGenre={(v) => setProject(p => ({...p, genre: v}))} onNext={handleGenerateOutlineOptions} onAnalyze={() => {}} isGenerating={isGenerating} />
          )}
          {currentStep === AppStep.OUTLINE && (
            <StepOutline outline={project.outline} options={outlineOptions} setOutline={(v) => setProject(p => ({...p, outline: v}))} onNext={handleToCharacters} onRegenerate={handleGenerateOutlineOptions} isGenerating={isGenerating} hasCharacters={project.characters.length > 0} />
          )}
          {currentStep === AppStep.CHARACTERS && (
            <StepCharacters characters={project.characters} genre={project.genre} updateCharacter={(id, up) => setProject(p => ({...p, characters: p.characters.map(c => c.id === id ? {...c, ...up} : c)}))} generateImage={handleGenerateCharacterImage} onNext={() => setCurrentStep(AppStep.SCRIPT)} />
          )}
          {currentStep === AppStep.SCRIPT && (
            <StepScript 
                episodePlan={project.episodePlan} 
                episodes={project.episodes} 
                scriptBible={project.scriptBible}
                setEpisodeContent={(n, c) => setProject(p => ({...p, episodes: {...p.episodes, [n]: c}}))} 
                generateEpisode={handleGenerateEpisode} 
                generateBible={handleGenerateBible}
                isGenerating={isGenerating} 
                onAutoPlan={handlePlanEpisodes} 
                onResetPlan={() => setProject(p => ({...p, episodePlan: [], episodes: {}, scriptBible: ''}))}
                onBatchGenerate={handleBatchGenerate} 
                onExtend={handleExtendStory} 
                onUpdatePlan={(pl) => setProject(p => ({...p, episodePlan: pl}))} 
                batchProgress={batchProgress}
            />
          )}
        </div>
      </main>

      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-2">设置 API Key</h3>
            <p className="text-slate-400 text-sm mb-6">请输入您的 Google Gemini API Key 以启用 AI 功能。</p>
            <input 
                type="password" 
                placeholder="AI-..."
                value={tempKey} 
                onChange={(e) => setTempKey(e.target.value)} 
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white mb-6 focus:border-orange-500 outline-none" 
            />
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowApiKeyModal(false)}>取消</Button>
              <Button onClick={() => { localStorage.setItem('gemini_api_key', tempKey); setApiKey(tempKey); setShowApiKeyModal(false); }} className="bg-orange-600">保存并启用</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
