
export type Genre = string;

export interface Character {
  id: string;
  name: string;
  age: string;
  role: string; // 主角, 配角, 群众演员
  personality: string;
  appearance: string;
  visualPrompt: string; // MJ/Jimeng prompt
  imageUrl?: string;
  imageLoading?: boolean;
}

export interface Scene {
  id: string;
  name: string;
  description: string;
  atmosphere: string;
  props: string;
  visualPrompt: string; // MJ/Jimeng prompt for set design
}

export interface EpisodePlan {
  number: number;
  title: string;
  summary: string;
}

export interface ScriptProject {
  idea: string;
  genre: Genre;
  outline: string; 
  characters: Character[];
  scenes: Scene[];
  episodePlan: EpisodePlan[]; 
  episodes: Record<number, string>; 
  scriptBible?: string; 
}

export enum AppStep {
  IDEA = 0,
  OUTLINE = 1,
  SCRIPT = 2,
  CHARACTERS = 3,
}

export const PRESET_GENRES = [
  '霸总虐恋', '大女主复仇', '吸血鬼传说', '狼人觉醒', '战神归来', 
  '重生逆袭', '都市言情', '科幻惊悚', '悬疑反转', '修仙奇幻'
];
