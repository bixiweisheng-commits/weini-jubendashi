import React from 'react';
import { Character, Genre } from '../types';
import { Button } from './Button';
import { ArrowRight, Image as ImageIcon, Sparkles, RefreshCw, Download } from 'lucide-react';

interface StepCharactersProps {
  characters: Character[];
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  generateImage: (charId: string) => void;
  onNext: () => void;
  genre: Genre;
}

export const StepCharacters: React.FC<StepCharactersProps> = ({
  characters, updateCharacter, generateImage, onNext, genre
}) => {
  
  const handleDownload = (imageUrl: string, name: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${name}_character_design.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
           <h2 className="text-2xl font-bold text-white">人物形象设计</h2>
           <p className="text-sm text-slate-400">点击画笔图标生成三视图+近景图片 (4:3 比例)</p>
        </div>
        <Button onClick={onNext} className="px-6" icon={<ArrowRight size={20} />}>
          下一步：生成分集列表
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto grid grid-cols-1 xl:grid-cols-2 gap-8 pr-2 pb-4">
        {characters.map((char) => (
          <div key={char.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col shadow-lg">
            {/* Header */}
            <div className="p-4 bg-slate-900/50 border-b border-slate-700 flex justify-between items-start">
              <div className="flex-1 mr-4">
                <input
                  type="text"
                  value={char.name}
                  onChange={(e) => updateCharacter(char.id, { name: e.target.value })}
                  className="bg-transparent text-lg font-bold text-white outline-none border-b border-transparent focus:border-indigo-500 w-full placeholder-slate-600"
                  placeholder="姓名"
                />
                <input
                  type="text"
                  value={char.role}
                  onChange={(e) => updateCharacter(char.id, { role: e.target.value })}
                  className="bg-transparent text-sm text-indigo-400 outline-none mt-1 w-full placeholder-slate-600"
                  placeholder="角色定位"
                />
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">年龄</span>
                <input
                   type="text"
                   value={char.age}
                   onChange={(e) => updateCharacter(char.id, { age: e.target.value })}
                   className="bg-transparent text-sm text-slate-300 outline-none text-right w-16 focus:border-b focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row h-full">
                {/* Content Body - Inputs */}
                <div className="p-4 space-y-4 flex-1 order-2 md:order-1 border-t md:border-t-0 md:border-r border-slate-700">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">性格特征</label>
                    <textarea
                      value={char.personality}
                      onChange={(e) => updateCharacter(char.id, { personality: e.target.value })}
                      className="w-full bg-slate-900/30 rounded p-2 text-sm text-slate-300 mt-1 outline-none focus:ring-1 focus:ring-indigo-500 resize-none h-20 scrollbar-thin"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">外貌描写 (用于AI绘画)</label>
                    <textarea
                      value={char.appearance}
                      onChange={(e) => updateCharacter(char.id, { appearance: e.target.value })}
                      className="w-full bg-slate-900/30 rounded p-2 text-sm text-slate-300 mt-1 outline-none focus:ring-1 focus:ring-indigo-500 resize-none h-32 scrollbar-thin"
                    />
                  </div>
                </div>

                {/* Image Section - Strict 4:3 Ratio Container */}
                <div className="relative w-full md:w-[320px] shrink-0 bg-black group order-1 md:order-2">
                   {/* Aspect Ratio Enforcer wrapper */}
                   <div className="w-full aspect-[4/3] relative">
                      {char.imageUrl ? (
                        <>
                          <img 
                            src={char.imageUrl} 
                            alt={char.name} 
                            className="absolute inset-0 w-full h-full object-contain bg-slate-950" 
                          />
                          {/* Overlay Controls */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-[2px] z-10">
                            <Button 
                              onClick={() => handleDownload(char.imageUrl!, char.name)} 
                              variant="secondary"
                              size="sm"
                              icon={<Download size={16} />}
                            >
                              保存图片
                            </Button>
                            <Button 
                              onClick={() => generateImage(char.id)} 
                              isLoading={char.imageLoading}
                              variant="primary"
                              size="sm"
                              icon={<RefreshCw size={16} />}
                            >
                              重新生成
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 space-y-3 z-10 bg-slate-900/50">
                          <ImageIcon size={32} className="opacity-20" />
                          <p className="text-xs">4:3 标准比例</p>
                          <Button 
                            onClick={() => generateImage(char.id)} 
                            isLoading={char.imageLoading}
                            variant="outline"
                            className="bg-slate-800 border-slate-600 hover:bg-indigo-600 hover:border-indigo-500 hover:text-white"
                            icon={<Sparkles size={16} />}
                          >
                            生成立绘
                          </Button>
                        </div>
                      )}
                   </div>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};