
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
  
  const downloadImage = (imageUrl: string, name: string) => {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `${name}_character_design.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
           <h2 className="text-2xl font-bold text-white">人物形象设计</h2>
           <p className="text-sm text-slate-400">点击画笔图标生成三视图+近景图片</p>
        </div>
        <Button onClick={onNext} className="px-6" icon={<ArrowRight size={20} />}>
          开始创作剧本
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-6 pr-2 pb-4">
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
                  className="bg-transparent text-sm text-indigo-400 outline-none mt-1 w-full placeholder-indigo-400/50"
                  placeholder="角色定位"
                />
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs text-slate-500 block">年龄</span>
                <input
                   type="text"
                   value={char.age}
                   onChange={(e) => updateCharacter(char.id, { age: e.target.value })}
                   className="bg-transparent text-sm text-slate-300 outline-none text-right w-16 focus:border-b focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Content Body */}
            <div className="p-4 space-y-4 flex-1">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">性格特征</label>
                <textarea
                  value={char.personality}
                  onChange={(e) => updateCharacter(char.id, { personality: e.target.value })}
                  className="w-full bg-slate-900/30 rounded p-2 text-sm text-slate-300 mt-1 outline-none focus:ring-1 focus:ring-indigo-500 resize-none h-16"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">外貌描写 (用于AI绘画)</label>
                <textarea
                  value={char.appearance}
                  onChange={(e) => updateCharacter(char.id, { appearance: e.target.value })}
                  className="w-full bg-slate-900/30 rounded p-2 text-sm text-slate-300 mt-1 outline-none focus:ring-1 focus:ring-indigo-500 resize-none h-24"
                />
              </div>
            </div>

            {/* Image Section */}
            <div className="relative h-80 bg-black/60 border-t border-slate-700 group flex items-center justify-center overflow-hidden">
              {char.imageUrl ? (
                <>
                  {/* Use object-contain to ensure the whole image is seen without cropping */}
                  <img src={char.imageUrl} alt={char.name} className="w-full h-full object-contain bg-slate-950" />
                  
                  {/* Overlay Controls */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button 
                      onClick={() => generateImage(char.id)} 
                      isLoading={char.imageLoading}
                      variant="primary"
                      icon={<RefreshCw size={16} />}
                      size="sm"
                    >
                      重新生成
                    </Button>
                    <Button
                      onClick={() => downloadImage(char.imageUrl!, char.name)}
                      variant="secondary"
                      icon={<Download size={16} />}
                      size="sm"
                    >
                      下载图片
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-500 space-y-3 p-4 text-center">
                  <ImageIcon size={48} className="opacity-20" />
                  <p className="text-sm">暂无形象图片</p>
                  <Button 
                    onClick={() => generateImage(char.id)} 
                    isLoading={char.imageLoading}
                    variant="outline"
                    icon={<Sparkles size={16} />}
                  >
                    生成角色设计图
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
