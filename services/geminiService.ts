
import { GoogleGenAI, Type } from "@google/genai";
import { Character, Genre, EpisodePlan, Scene } from "../types";

// Using gemini-3-pro-preview for complex creative writing tasks as per guidelines
const TEXT_MODEL = "gemini-3-pro-preview"; 
const IMAGE_MODEL = "gemini-2.5-flash-image";

// Initializing the GenAI client with the environment variable API key exclusively
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Removed apiKey parameter from all service functions to comply with hard requirement of using process.env.API_KEY
export const generateOutlineOptions = async (idea: string, genre: Genre): Promise<string[]> => {
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

export const generateScriptBible = async (outline: string, characters: Character[], scenes: Scene[]): Promise<string> => {
  const prompt = `
    基于以下剧本大纲、角色和场景，生成一份极其详尽的【剧本拍摄总纲（Production Bible）】。
    
    角色：${JSON.stringify(characters)}
    场景：${JSON.stringify(scenes)}
    
    总纲需包含：
    1. 【全角色深度档案】：姓名、地位、性格、成长弧光、核心台词风格、视觉提示词。
    2. 【拍摄场景志】：所有核心场景的细致描写、光影要求、必备道具、美术制景建议。
    3. 【美术与服装风格】：整体色调方案、不同阶层的服化道标准。
    4. 【导演建议】：镜头语言、节奏控制。
    
    格式：请使用清晰、专业的 Markdown 格式，严禁使用 **。
  `;
  const response = await ai.models.generateContent({ model: TEXT_MODEL, contents: prompt });
  return (response.text || "生成总纲失败").replace(/\*\*/g, '');
};

export const extractAllCharactersFromScript = async (scriptText: string): Promise<Character[]> => {
  const prompt = `从以下剧本内容中提取所有出现的角色，并按主角、配角、群众演员分类。
  
  要求：
  1. 深度分析性格、年龄、外貌细节。
  2. 为每个角色编写一段极其详细的 Midjourney/即梦 视觉提示词 (Visual Prompt)，用于生成角色标准像（要求包含：构图、光影、服装材质、面部特征、风格描述）。
  
  剧本内容：${scriptText.slice(0, 15000)}
  
  请返回 JSON 数组。`;
  
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
            role: { type: Type.STRING, description: "主角, 配角, 或 群众演员" },
            personality: { type: Type.STRING },
            appearance: { type: Type.STRING },
            visualPrompt: { type: Type.STRING, description: "MJ/即梦 英文视觉提示词" },
          },
          required: ["name", "age", "role", "personality", "appearance", "visualPrompt"],
        },
      },
    },
  });
  const parsedData = JSON.parse(response.text || "[]");
  return parsedData.map((char: any) => ({ ...char, id: crypto.randomUUID() }));
};

export const extractScenesFromScript = async (scriptText: string): Promise<Scene[]> => {
    const prompt = `从以下剧本内容中提取所有出现的拍摄场景。
    
    要求：
    1. 提取场景名。
    2. 详细描述场景布局、装修风格。
    3. 给出灯光氛围建议、核心道具清单。
    4. 编写一段 Midjourney/即梦 视觉提示词，用于生成场景参考图（包含：风格、光影、视角、细节描述）。
    
    剧本内容：${scriptText.slice(0, 15000)}
    
    请返回 JSON 数组。`;

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
                        description: { type: Type.STRING },
                        atmosphere: { type: Type.STRING },
                        props: { type: Type.STRING },
                        visualPrompt: { type: Type.STRING, description: "MJ/即梦 视觉参考提示词" }
                    },
                    required: ["name", "description", "atmosphere", "props", "visualPrompt"]
                }
            }
        }
    });
    const parsedData = JSON.parse(response.text || "[]");
    return parsedData.map((scene: any) => ({ ...scene, id: crypto.randomUUID() }));
};

export const generateCharacterImage = async (character: Character, genre: Genre): Promise<string> => {
  // Prioritize the generated visualPrompt if available
  const prompt = character.visualPrompt || `Professional Cinematic character concept art: ${character.name}, a ${character.role} in a ${genre} story. Personality: ${character.personality}. Physical attributes: ${character.appearance}. 4k, high detail, studio lighting.`;
  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: { parts: [{ text: prompt }] }
  });
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    // Correctly iterating through parts to find image data as per guidelines
    if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
  }
  throw new Error("No image data");
};

export const planEpisodes = async (outline: string, count: number): Promise<EpisodePlan[]> => {
    const prompt = `基于大纲规划 ${count} 集分集摘要。大纲：${outline}。要求每集都有极强的悬念。请确保生成 ${count} 个分集。`;
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

export const generateEpisodeScript = async (outline: string, characters: Character[], episodePlan: EpisodePlan, prevContent: string): Promise<string> => {
  const prompt = `撰写第 ${episodePlan.number} 集：${episodePlan.title}。摘要：${episodePlan.summary}。前情提要：${prevContent.slice(-600)}。
  
  格式要求：
  1. 专业剧本格式。
  2. 严格禁止粗体 ** 符号。
  3. 增加极具张力的台词。`;
  
  const response = await ai.models.generateContent({ model: TEXT_MODEL, contents: prompt });
  let text = response.text || "生成失败";
  return text.replace(/\*\*/g, '');
};

export const extendStory = async (outline: string, lastPlan: EpisodePlan, count: number): Promise<EpisodePlan[]> => {
  const prompt = `接着第 ${lastPlan.number} 集，继续规划后面 ${count} 集的内容。要求保持一致性并增加新钩子。`;
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
  return JSON.parse(response.text || "[]").map((p: any) => ({
    ...p,
    title: p.title.replace(/\*\*/g, ''),
    summary: p.summary.replace(/\*\*/g, '')
  }));
};
