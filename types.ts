export type Genre = '武侠' | '都市言情' | '穿越' | '科幻' | '悬疑' | '奇幻';

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
  episodePlan: EpisodePlan[]; // Auto-generated plan
  episodes: Record<number, string>; // Map episode number to content
}

export enum AppStep {
  IDEA = 0,
  OUTLINE = 1,
  CHARACTERS = 2,
  SCRIPT = 3,
}

export const GENRES: Genre[] = ['武侠', '都市言情', '穿越', '科幻', '悬疑', '奇幻'];