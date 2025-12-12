import React from 'react';
import { Button } from './Button';
import { ArrowRight, RotateCcw, PenTool, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface StepOutlineProps {
  outline: string;
  setOutline: (val: string) => void;
  onNext: () => void;
  onRegenerate: () => void;
  isGenerating: boolean;
}

export const StepOutline: React.FC<StepOutlineProps> = ({
  outline, setOutline, onNext, onRegenerate, isGenerating
}) => {
  const [isEditing, setIsEditing] = React.useState(false);

  return (
    <div className="max-w-5xl mx-auto space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between shrink-0 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
        <div>
           <h2 className="text-2xl font-bold text-white flex items-center gap-2">
             <span className="text-indigo-500">#</span> 剧本大纲
           </h2>
           <p className="text-sm text-slate-400 mt-1">请检查故事结构：钩子、反转、高潮、升华</p>
        </div>
        <div className="flex gap-3">
           {!isEditing && (
             <Button variant="ghost" onClick={onRegenerate} disabled={isGenerating} icon={<RotateCcw size={16} />}>
              重新生成
             </Button>
           )}
           <Button 
            variant={isEditing ? "primary" : "secondary"} 
            onClick={() => setIsEditing(!isEditing)} 
            icon={isEditing ? <Save size={16} /> : <PenTool size={16} />}
           >
            {isEditing ? '保存修改' : '修改大纲'}
           </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-slate-800/30 rounded-xl border border-slate-700/50 backdrop-blur-sm shadow-xl relative">
        {isEditing ? (
          <textarea
            value={outline}
            onChange={(e) => setOutline(e.target.value)}
            className="w-full h-full bg-slate-900 p-8 text-slate-200 outline-none resize-none font-mono text-base leading-relaxed focus:ring-2 focus:ring-indigo-500/50 inset-0 absolute"
            placeholder="在此输入或修改大纲..."
          />
        ) : (
          <div className="h-full overflow-y-auto p-8 prose prose-invert prose-slate max-w-none prose-headings:text-indigo-400 prose-strong:text-indigo-200">
            <ReactMarkdown>{outline}</ReactMarkdown>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2 shrink-0">
        <Button 
          onClick={onNext} 
          isLoading={isGenerating}
          className="px-8 py-3 text-lg shadow-lg shadow-indigo-900/30"
          icon={<ArrowRight size={20} />}
        >
          {isGenerating ? '正在分析角色...' : '确认并提取角色'}
        </Button>
      </div>
    </div>
  );
};