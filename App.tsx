
import React, { useState } from 'react';
import { ScriptProject, AppStep, Genre, Character, EpisodePlan, Scene } from './types';
import { StepIdea } from './components/StepIdea';
import { StepOutline } from './components/StepOutline';
import { StepCharacters } from './components/StepCharacters';
import { StepScript } from './components/StepScript';
import { generateOutlineOptions, extractAllCharactersFromScript, extractScenesFromScript, generateCharacterImage, generateEpisodeScript, planEpisodes, extendStory, generateScriptBible } from './services/geminiService';
// Fixed missing imports: Zap, Layers; removed unused Settings and navigation icons
import { Map, Sparkles, Layout, Zap, Layers } from 'lucide-react';
import { Button } from './components/Button';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.IDEA);
  const [isGenerating, setIsGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number, total: number } | null>(null);
  
  // Removed apiKey and tempKey states as API key is now handled exclusively via process.env.API_KEY
  const [project, setProject] = useState<ScriptProject>({
    idea: '',
    genre: '霸总虐恋',
    outline: '',
    characters: [],
    scenes: [],
    episodePlan: [],
    episodes: {},
    scriptBible: ''
  });

  const [outlineOptions, setOutlineOptions] = useState<string[]>([]);

  // Removed ensureKey checks as API key availability is a hard requirement handled externally
  const handleGenerateOutlineOptions = async () => {
    setIsGenerating(true);
    try {
      const options = await generateOutlineOptions(project.idea, project.genre);
      setOutlineOptions(options);
      setCurrentStep(AppStep.OUTLINE);
    } catch (e) {
      alert("生成大纲失败");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleProductionExtract = async () => {
    const allText = Object.values(project.episodes).join('\n');
    if (!allText) return alert("请先生成一部分剧本，以便 AI 提取角色和场景");
    
    setIsGenerating(true);
    try {
      const [chars, scenes] = await Promise.all([
          extractAllCharactersFromScript(allText),
          extractScenesFromScript(allText)
      ]);
      setProject(p => ({ ...p, characters: chars, scenes: scenes }));
      setCurrentStep(AppStep.CHARACTERS);
    } catch (e) {
      console.error(e);
      alert("提取资产失败，请检查网络");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateCharacterImage = async (charId: string) => {
    const char = project.characters.find(c => c.id === charId);
    if (!char) return;

    setProject(p => ({
      ...p,
      characters: p.characters.map(c => c.id === charId ? { ...c, imageLoading: true } : c)
    }));

    try {
      const imageUrl = await generateCharacterImage(char, project.genre);
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
    setIsGenerating(true);
    try {
        const plan = await planEpisodes(project.outline, count);
        setProject(p => ({ ...p, episodePlan: plan }));
    } catch (e) {
        alert("规划失败");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleGenerateBible = async () => {
    setIsGenerating(true);
    try {
      const bible = await generateScriptBible(project.outline, project.characters, project.scenes);
      setProject(p => ({ ...p, scriptBible: bible }));
    } catch (e) {
      alert("生成失败");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBatchGenerate = async () => {
    if (batchProgress) return; 

    const pending = project.episodePlan.filter(p => !project.episodes[p.number]);
    if (pending.length === 0) return alert("全部已完成");

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
                  const content = await generateEpisodeScript(project.outline, project.characters, plan, prevContent);
                  currentEpisodes = { ...currentEpisodes, [plan.number]: content };
                  setProject(p => ({ ...p, episodes: { ...currentEpisodes } }));
                  success = true;
              } catch (e: any) {
                  retryCount++;
                  if (retryCount <= maxRetries) await sleep(4000 * retryCount);
              }
          }

          if (!success) {
              if (!window.confirm(`第 ${plan.number} 集生成失败。是否跳过本集并继续生成剩余 ${pending.length - processedCount - 1} 集？`)) {
                  break; 
              }
          } else {
              await sleep(1200);
          }
          processedCount++;
          setBatchProgress({ current: processedCount, total: pending.length });
      }
    } catch (err) {
      alert("批量生成中断，您可以点击继续按钮恢复");
    } finally {
      setBatchProgress(null);
    }
  };

  const handleExtendStory = async (count: number) => {
      setIsGenerating(true);
      try {
          const last = project.episodePlan[project.episodePlan.length - 1];
          const newEps = await extendStory(project.outline, last, count);
          setProject(p => ({ ...p, episodePlan: [...p.episodePlan, ...newEps] }));
      } catch (e) {
          alert("扩展失败");
      } finally {
          setIsGenerating(false);
      }
  };

  const handleGenerateEpisode = async (num: number) => {
      setIsGenerating(true);
      try {
          const plan = project.episodePlan.find(p => p.number === num);
          if (!plan) return;
          const prev = project.episodes[num-1] || "";
          const content = await generateEpisodeScript(project.outline, project.characters, plan, prev);
          setProject(p => ({ ...p, episodes: { ...project.episodes, [num]: content } }));
      } catch (e) {
          alert("生成失败，请重试");
      } finally {
          setIsGenerating(false);
      }
  };

  const stages = [
      { id: AppStep.IDEA, label: '构思', icon: <Sparkles size={14}/> },
      { id: AppStep.OUTLINE, label: '大纲', icon: <Layout size={14}/> },
      { id: AppStep.SCRIPT, label: '创作', icon: <Zap size={14}/> },
      { id: AppStep.CHARACTERS, label: '资产', icon: <Layers size={14}/> },
  ];

  return (
    <div className="h-full flex flex-col font-sans">
      <header className="h-16 border-b border-white/5 bg-slate-950/40 backdrop-blur-xl flex items-center justify-between px-8 shrink-0 z-50">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-amber-900/40 border border-amber-400/20">欢</div>
            <div className="hidden md:block">
                <h1 className="font-black text-lg text-white leading-none tracking-tighter uppercase italic">欢玺 <span className="text-amber-500">PRO</span></h1>
                <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-0.5">Production Suite</p>
            </div>
          </div>
          
          <nav className="hidden lg:flex items-center gap-1.5 p-1 bg-white/5 border border-white/5 rounded-2xl">
              {stages.map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => {
                        const canNavigate = (stage.id <= currentStep) || (stage.id === AppStep.OUTLINE && project.idea) || (stage.id === AppStep.SCRIPT && project.outline);
                        if (canNavigate) setCurrentStep(stage.id);
                    }}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentStep === stage.id ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/30' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                      {stage.icon}
                      {stage.label}
                  </button>
              ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
            {currentStep === AppStep.SCRIPT && (
                <Button variant="amber" size="sm" onClick={handleProductionExtract} isLoading={isGenerating} icon={<Layers size={16} />} className="shadow-none">
                    生成制作资产
                </Button>
            )}
            <div className="h-8 w-px bg-white/5 mx-2" />
            {/* Removed Settings button to comply with no-UI-for-API-key guideline */}
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        <div className="h-full w-full p-8 overflow-y-auto custom-scrollbar">
          {currentStep === AppStep.IDEA && (
            <StepIdea idea={project.idea} setIdea={(v) => setProject(p => ({...p, idea: v}))} genre={project.genre} setGenre={(v) => setProject(p => ({...p, genre: v}))} onNext={handleGenerateOutlineOptions} onAnalyze={() => {}} isGenerating={isGenerating} />
          )}
          {currentStep === AppStep.OUTLINE && (
            <StepOutline outline={project.outline} options={outlineOptions} setOutline={(v) => setProject(p => ({...p, outline: v}))} onNext={() => setCurrentStep(AppStep.SCRIPT)} onRegenerate={handleGenerateOutlineOptions} isGenerating={isGenerating} />
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
                onResetPlan={() => { if(window.confirm("确定要重设所有分集吗？已生成的剧本将丢失。")) setProject(p => ({...p, episodePlan: [], episodes: {}, scriptBible: ''})); }}
                onBatchGenerate={handleBatchGenerate} 
                onExtend={handleExtendStory} 
                onUpdatePlan={(pl) => setProject(p => ({...p, episodePlan: pl}))} 
                batchProgress={batchProgress}
            />
          )}
          {currentStep === AppStep.CHARACTERS && (
            <StepCharacters 
                characters={project.characters} 
                scenes={project.scenes}
                genre={project.genre} 
                updateCharacter={(id, up) => setProject(p => ({...p, characters: p.characters.map(c => c.id === id ? {...c, ...up} : c)}))} 
                generateImage={handleGenerateCharacterImage} 
                onNext={() => setCurrentStep(AppStep.SCRIPT)} 
            />
          )}
        </div>
      </main>

      {/* Removed showApiKeyModal logic to comply with no-UI-for-API-key guideline */}
    </div>
  );
}
