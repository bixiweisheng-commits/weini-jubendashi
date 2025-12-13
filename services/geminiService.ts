
import { GoogleGenAI, Type } from "@google/genai";
import { Character, Genre, EpisodePlan } from "../types";

const TEXT_MODEL = "gemini-2.5-flash";
const IMAGE_MODEL = "gemini-2.5-flash-image";

// Helper to create client with dynamic key
const getClient = (apiKey: string) => {
  if (!apiKey) throw new Error("请先在右上角设置 API Key");
  return new GoogleGenAI({ apiKey });
};

// New: Generate 3 distinct outline options
export const generateOutlineOptions = async (apiKey: string, idea: string, genre: Genre): Promise<string[]> => {
  const ai = getClient(apiKey);
  const prompt = `
    作为一名资深的金牌编剧，请根据以下创意为我构思 **三个截然不同** 的故事大纲方案。
    
    类型：${genre}
    创意核心：${idea}

    请提供三个版本，每个版本要有不同的侧重点（例如：版本A侧重悬疑反转，版本B侧重情感纠葛，版本C侧重宏大叙事）。
    不要使用Markdown格式，请直接返回一个JSON数组，包含三个字符串，每个字符串是一个完整的大纲。

    JSON Schema:
    {
      "type": "array",
      "items": { "type": "string" }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    const jsonStr = response.text || "[]";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error generating outline options:", error);
    // Fallback if JSON fails
    return [`生成失败，请重试。\n错误详情: ${error}`];
  }
};

// Legacy support for single outline (kept but unused in new flow mostly)
export const generateOutline = async (apiKey: string, idea: string, genre: Genre): Promise<string> => {
   const options = await generateOutlineOptions(apiKey, idea, genre);
   return options[0] || "";
};

export const analyzeAndRewrite = async (apiKey: string, text: string): Promise<{ idea: string, genre: Genre, outline: string }> => {
  const ai = getClient(apiKey);
  const prompt = `
    请分析以下提供的文本/剧本内容，提取其核心创意、推测最合适的类型，并根据内容整理出一份标准的故事大纲。
    
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
              appearance: { type: Type.STRING, description: "Detailed visual description for image generation, including hair, eyes, clothing style." },
            },
            required: ["name", "age", "role", "personality", "appearance"],
          },
        },
      },
    });

    const jsonStr = response.text || "[]";
    const parsedData = JSON.parse(jsonStr);
    
    return parsedData.map((char: any) => ({
      ...char,
      id: crypto.randomUUID(),
    }));

  } catch (error) {
    console.error("Error extracting characters:", error);
    throw error;
  }
};

export const generateCharacterImage = async (apiKey: string, character: Character, genre: Genre): Promise<string> => {
  const ai = getClient(apiKey);
  // Using explicit instructions for a character sheet/4-grid view
  const prompt = `
    Character Design Sheet for ${character.name}, a ${character.age} year old ${character.role} in a ${genre} story.
    
    Please generate a **2x2 Grid Image (4 panels)** containing:
    1. Top Left: Detailed Close-up Face Portrait.
    2. Top Right: Full Body Front View.
    3. Bottom Left: Full Body Side View.
    4. Bottom Right: Back View or Dynamic Action Pose.
    
    Appearance: ${character.appearance}.
    Personality: ${character.personality}.
    
    Style: High quality concept art, cinematic lighting, 8k resolution, detailed texture, clean background.
  `;

  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: {
        parts: [{ text: prompt }]
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

// New: Plan episodes structure before writing
export const planEpisodes = async (apiKey: string, outline: string): Promise<EpisodePlan[]> => {
    const ai = getClient(apiKey);
    const prompt = `
      基于以下故事大纲，规划一个短剧/动画的分集大纲（通常为 8-12 集，如果故事较短则相应减少）。
      
      大纲：
      ${outline}
  
      请返回 JSON 数组，包含每集的集数、标题和简要剧情摘要（Summary）。
      确保剧情连贯，有起承转合。
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
                  summary: { type: Type.STRING }
              },
              required: ["number", "title", "summary"]
            }
          }
        }
      });
      return JSON.parse(response.text || "[]");
    } catch (error) {
      console.error("Error planning episodes:", error);
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
    你是一位专业的影视编剧。请撰写 **第 ${episodePlan.number} 集：${episodePlan.title}** 的完整剧本。
    
    【总故事大纲】：
    ${outline.slice(0, 1000)}...
    
    【本集摘要】：
    ${episodePlan.summary}
    
    【人物设定】：
    ${charContext}
    
    【前情提要】：
    ${prevContent ? prevContent.slice(-800) : '本集为第一集。'}

    【格式严格要求】：
    请严格遵循以下标准中文影视剧本格式：
    
    1. **场景标题**：使用 "场号、地点 时间 内/外" 格式，例如 "**1、李家客厅 日 内**"。请加粗。
    2. **动作/画面描述**：顶格写，直接描述画面动作或环境，不要加“画面：”前缀。
    3. **对话**：
       - **角色名**：“对话内容”
    4. **特殊标注**：
       - 内心独白/画外音：使用 **角色名(OS)**：“内容”
       - 旁白：使用 **旁白**：“内容”
       - 情绪/动作提示：在对话前的括号内，例如：**小艾**：(不耐烦地)“你到底去不去？”

    请直接输出剧本正文：
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
