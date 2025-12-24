
export type Genre = string;

export interface Character {
  id: string;
  name: string;
  age: string;
  role: string;
  personality: string;
  appearance: string;
  imageUrl?: string;
  imageLoading?: boolean;
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
  episodePlan: EpisodePlan[]; 
  episodes: Record<number, string>; 
  scriptBible?: string; // Total outline, characters, scenes, etc.
}

export enum AppStep {
  IDEA = 0,
  OUTLINE = 1,
  CHARACTERS = 2,
  SCRIPT = 3,
}

export const PRESET_GENRES = [
  '霸总虐恋', '大女主复仇', '吸血鬼传说', '狼人觉醒', '战神归来', 
  '重生逆袭', '都市言情', '科幻惊悚', '悬疑反转', '修仙奇幻'
];
