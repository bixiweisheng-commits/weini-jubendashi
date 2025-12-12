import { GoogleGenAI, Type } from "@google/genai";
import { Character, Genre, EpisodePlan } from "../types";

const TEXT_MODEL = "gemini-2.5-flash";
const IMAGE_MODEL = "gemini-2.5-flash-image";

// Helper to create client with dynamic key
const getClient = (apiKey: string) => {
  if (!apiKey) throw new Error("请先在右上角设置 API Key");
  return new GoogleGenAI({ apiKey });
};

export const generateOutline = async (apiKey: string, idea: string, genre: Genre): Promise<string> => {
  const ai = getClient(apiKey);
  const prompt = `
    作为一名资深的金牌编剧，请根据以下创意为我创作一份精彩的剧本大纲。
    
    类型：${genre}
    创意核心：${idea}

    请严格按照以下结构进行创作（必须包含这四个部分）：
    1. **钩子 (The Hook)**: 开篇即抓住观众眼球的冲突或悬念。
    2. **反转 (The Twist)**: 剧情发展中的意想不到的转折，打破常规。
    3. **高潮 (The Climax/Second Twist)**: 全剧最高潮，进行再次反转，将情绪推向顶峰。
    4. **升华 (The Elevation)**: 结尾的主题升华，留下深刻的思考或情感共鸣。

    请用Markdown格式输出，条理清晰，引人入胜。
  `;

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
    });
    return response.text || "无法生成大纲，请重试。";
  } catch (error) {
    console.error("Error generating outline:", error);
    throw error;
  }
};

export const analyzeAndRewrite = async (apiKey: string, text: string): Promise<{ idea: string, genre: Genre, outline: string }> => {
  const ai = getClient(apiKey);
  const prompt = `
    请分析以下提供的文本/剧本内容，提取其核心创意、推测最合适的类型，并根据内容整理出一份标准的故事大纲（包含钩子、反转、高潮、升华）。
    
    输入文本：
    ${text.slice(0, 5000)}

    请返回 JSON 格式：
    {
      "idea": "一句话概括核心创意",
      "genre": "从['武侠', '都市言情', '穿越', '科幻', '悬疑', '奇幻']中选一个最接近的",
      "outline": "整理后的Markdown格式大纲"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            idea: { type: Type.STRING },
            genre: { type: Type.STRING },
            outline: { type: Type.STRING }
          },
          required: ["idea", "genre", "outline"]
        }
      }
    });

    const jsonStr = response.text || "{}";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error analyzing script:", error);
    throw error;
  }
};

export const extractCharacters = async (apiKey: string, outline: string): Promise<Character[]> => {
  const ai = getClient(apiKey);
  const prompt = `
    根据以下剧本大纲，提取主要角色（3-5人）。
    为每个人物提供：姓名、年龄、角色定位（主角/反派等）、性格特征、以及详细的外貌描写（用于AI绘画）。

    大纲内容：
    ${outline}
  `;

  try {
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
              appearance: { type: Type.STRING, description: "Detailed visual description for image generation" },
            },
            required: ["name", "age", "role", "personality", "appearance"],
          },
        },
      },
    });

    const jsonStr = response.text || "[]";
    const parsedData = JSON.parse(jsonStr);
    
    // Add unique IDs
    return parsedData.map((char: any) => ({
      ...char,
      id: crypto.randomUUID(),
    }));

  } catch (error) {
    console.error("Error extracting characters:", error);
    throw error;
  }
};

export const planEpisodes = async (apiKey: string, outline: string): Promise<EpisodePlan[]> => {
  const ai = getClient(apiKey);
  const prompt = `
    作为总编剧，请根据以下剧本大纲，规划分集剧情。
    请根据故事的体量，合理划分集数（通常为 3-12 集）。
    
    大纲内容：
    ${outline}
    
    请返回 JSON 格式数组：
    [
      { "number": 1, "title": "第一集标题", "summary": "本集主要情节摘要" },
      ...
    ]
  `;

  try {
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
              summary: { type: Type.STRING },
            },
            required: ["number", "title", "summary"],
          },
        },
      },
    });

    const jsonStr = response.text || "[]";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error planning episodes:", error);
    // Fallback: return at least one episode if parsing fails
    return [{ number: 1, title: "第一集", summary: "故事开始。" }];
  }
};

export const generateCharacterImage = async (apiKey: string, character: Character, genre: Genre): Promise<string> => {
  const ai = getClient(apiKey);
  const prompt = `
    Character Design Sheet for ${character.name}, a character in a ${genre} story.
    Role: ${character.role}.
    Age: ${character.age}.
    Description: ${character.appearance}.
    
    Layout: Split screen. Left side: Three-view diagram (Front, Side, Back) full body reference. Right side: Detailed cinematic close-up portrait.
    Style: High quality, consistent character design, detailed, professional concept art, anime or semi-realistic style suitable for animation.
  `;

  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "4:3",
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data received");
  } catch (error) {
    console.error("Error generating character image:", error);
    throw error;
  }
};

export const generateEpisodeScript = async (
  apiKey: string,
  outline: string, 
  characters: Character[], 
  episodePlan: EpisodePlan,
  prevContent: string
): Promise<string> => {
  const ai = getClient(apiKey);
  const charContext = characters.map(c => `${c.name} (${c.role}): ${c.personality}`).join('\n');
  
  const prompt = `
    你是一位专业的影视/动画编剧。请撰写 **第 ${episodePlan.number} 集：${episodePlan.title}** 的完整剧本。
    
    本集剧情摘要：
    ${episodePlan.summary}
    
    总体大纲背景：
    ${outline.slice(0, 500)}...

    人物设定：
    ${charContext}
    
    ${prevContent ? `前情提要：\n${prevContent.slice(-300)}...` : ''}

    【格式严格要求】请参考标准中文剧本格式：

    1. **场景标题**：格式为 "序号. [内/外]景 [地点] [时间]"。
       例如：
       1. 内景 房间 夜晚
       2. 外景 街道 日

    2. **动作/画面描述**：直接描写看到的画面和动作，不要加括号，不要缩进，作为独立段落。
       例如：
       黑暗。冰箱微弱的轰鸣是背景音。一盏灯打开，很快，又关掉。

    3. **对话**：格式为 "人物名：对话内容" 或 "人物名（状态/动作）：对话内容"。
       例如：
       杰克（接）：早啊弱壳壳。今天是我的生日。
       玛（点头）：意志控制身体。

    请直接开始创作剧本内容：
  `;

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
    });
    return response.text || "生成失败，请重试。";
  } catch (error) {
    console.error("Error generating script:", error);
    throw error;
  }
};