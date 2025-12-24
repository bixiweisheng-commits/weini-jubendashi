
import { GoogleGenAI, Type } from "@google/genai";
import { Character, Genre, EpisodePlan } from "../types";

const TEXT_MODEL = "gemini-3-flash-preview"; 
const IMAGE_MODEL = "gemini-2.5-flash-image";

const getClient = (apiKey: string) => {
  if (!apiKey) throw new Error("请先在右上角设置 API Key");
  return new GoogleGenAI({ apiKey });
};

export const generateOutlineOptions = async (apiKey: string, idea: string, genre: Genre): Promise<string[]> => {
  const ai = getClient(apiKey);
  const prompt = `
    作为一名爆款短剧金牌编剧，请根据以下创意构思三个极其吸睛且内容极其丰富的故事大纲。
    类型：${genre}
    创意核心：${idea}
    要求大纲必须包含：
    1. 【核心钩子】：如何第一秒抓住观众。
    2. 【极致爽点】：全剧的爽感爆发点。
    3. 【反转逻辑】：意想不到的剧情走向。
    4. 【核心冲突】：主角与反派的死结。
    5. 【情感曲线】：观众的情绪波动设计。
    请返回一个 JSON 数组（包含3个字符串，每个字符串内容不少于500字）。
  `;
  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
    }
  });
  return JSON.parse(response.text || "[]");
};

export const generateScriptBible = async (apiKey: string, outline: string, characters: Character[]): Promise<string> => {
  const ai = getClient(apiKey);
  const prompt = `
    基于以下剧本大纲和角色设定，生成一份详尽的【剧本总纲（Script Bible）】。
    大纲：${outline}
    角色：${JSON.stringify(characters)}
    
    总纲需涵盖：
    1. 【人物全档案】：涵盖姓名、角色定位、年龄、性格深度解析、服装风格指南、核心提示词。
    2. 【场景视觉志】：剧本中主要出现的场景清单，每个场景需包含：场景描述、灯光氛围、关键道具、视觉基调。
    3. 【世界观设定】：故事发生的背景、特殊规则。
    4. 【全剧主旨】：剧本想传达的价值观或情感内核。
    
    格式：请使用清晰的 Markdown 格式。
  `;
  const response = await ai.models.generateContent({ model: TEXT_MODEL, contents: prompt });
  return response.text || "生成总纲失败";
};

export const extractCharacters = async (apiKey: string, outline: string): Promise<Character[]> => {
  const ai = getClient(apiKey);
  const prompt = `根据剧本大纲提取3-5个爆款潜质角色。大纲：${outline}`;
  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            age: { type: Type.STRING },
            role: { type: Type.STRING },
            personality: { type: Type.STRING },
            appearance: { type: Type.STRING },
          },
          required: ["name", "age", "role", "personality", "appearance"],
        },
      },
    },
  });
  const parsedData = JSON.parse(response.text || "[]");
  return parsedData.map((char: any) => ({ ...char, id: crypto.randomUUID() }));
};

export const generateCharacterImage = async (apiKey: string, character: Character, genre: Genre): Promise<string> => {
  const ai = getClient(apiKey);
  const prompt = `Cinematic character design: ${character.name}, ${character.role} in a ${genre} story. 4k, detail. Description: ${character.appearance}`;
  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: { parts: [{ text: prompt }] }
  });
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
  }
  throw new Error("No image data");
};

export const planEpisodes = async (apiKey: string, outline: string, count: number): Promise<EpisodePlan[]> => {
    const ai = getClient(apiKey);
    const prompt = `基于大纲规划 ${count} 集分集摘要。大纲：${outline}。要求每集都有极强的悬念和钩子。`;
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
                number: { type: Type.INTEGER },
                title: { type: Type.STRING },
                summary: { type: Type.STRING }
            },
            required: ["number", "title", "summary"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
};

export const generateEpisodeScript = async (apiKey: string, outline: string, characters: Character[], episodePlan: EpisodePlan, prevContent: string): Promise<string> => {
  const ai = getClient(apiKey);
  const prompt = `撰写第 ${episodePlan.number} 集：${episodePlan.title}。摘要：${episodePlan.summary}。前情提要：${prevContent.slice(-400)}。
  
  格式要求：
  1. 使用标准的影视专业剧本格式（场景名、角色名、台词、动作描写）。
  2. 严禁出现 markdown 的粗体符号（即禁止使用 ** ）。
  3. 增加冲突对白，提升短剧爽感。`;
  
  const response = await ai.models.generateContent({ model: TEXT_MODEL, contents: prompt });
  let text = response.text || "生成失败";
  
  // 强制去除所有 ** 符号
  return text.replace(/\*\*/g, '');
};

export const extendStory = async (apiKey: string, outline: string, characters: Character[], lastPlan: EpisodePlan): Promise<EpisodePlan> => {
  const ai = getClient(apiKey);
  const prompt = `续写第 ${lastPlan.number + 1} 集规划。上集：${lastPlan.summary}。严禁出现 ** 符号。`;
  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
            number: { type: Type.INTEGER },
            title: { type: Type.STRING },
            summary: { type: Type.STRING }
        },
        required: ["number", "title", "summary"]
      }
    }
  });
  const res = JSON.parse(response.text || "{}");
  if (res.title) res.title = res.title.replace(/\*\*/g, '');
  if (res.summary) res.summary = res.summary.replace(/\*\*/g, '');
  return res;
};
