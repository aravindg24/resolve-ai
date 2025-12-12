import { GoogleGenAI, Type, Schema } from "@google/genai";
import { RepairAnalysis, MediaItem, SkillLevel } from "../types";

const ANALYSIS_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    objectName: {
      type: Type.STRING,
      description: "The specific name of the item and model if visible.",
    },
    dangerLevel: {
      type: Type.STRING,
      enum: ["Low", "High"],
      description: "CRITICAL: Mark 'High' for fire, exposed mains voltage, gas leaks, structural instability, or bloated batteries.",
    },
    confidenceScore: {
      type: Type.INTEGER,
      description: "0-100 score. Low confidence (<60) if image is blurry or damage is ambiguous.",
    },
    reasoning: {
      type: Type.STRING,
      description: "Explain your visual reasoning. E.g., 'I see charring on the PCB which suggests a short circuit.'",
    },
    safetyWarning: {
      type: Type.STRING,
      description: "Specific safety instruction. If High danger, start with 'STOP: DO NOT ATTEMPT'.",
    },
    professionalReferral: {
      type: Type.STRING,
      description: "If danger is High, specify who to call (e.g., 'Certified Electrician', 'Fire Department').",
    },
    toolsRequired: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of professional tools needed.",
    },
    toolSubstitutions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          original: { type: Type.STRING },
          substitute: { type: Type.STRING },
        },
      },
      description: "Suggest household alternatives for tools if safe (e.g., 'Credit Card' for 'Spudger').",
    },
    estimatedTime: {
      type: Type.STRING,
      description: "Estimated time to complete.",
    },
    steps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Step-by-step guide adapted to skill level. If Danger is High, return an empty array.",
    },
  },
  required: ["objectName", "dangerLevel", "confidenceScore", "reasoning", "safetyWarning", "toolsRequired", "estimatedTime", "steps"],
};

export const analyzeMedia = async (
  mediaItems: MediaItem[],
  userPrompt: string,
  skillLevel: SkillLevel = 'Novice'
): Promise<RepairAnalysis> => {
  if (mediaItems.length === 0) {
    throw new Error("No media selected.");
  }

  // Use the API key directly from the environment variable
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const promptText = `
    You are Resolve AI, an expert safety-first technician.
    
    CONTEXT:
    - User Skill Level: ${skillLevel.toUpperCase()}
    - User Query: "${userPrompt}"
    
    INSTRUCTIONS:
    1. **VISUAL REASONING**: Analyze the image/video frames. Identify specific damage patterns. Connect visual evidence to the root cause.
    2. **SAFETY FIRST**: 
       - Look for: Fire, Smoke, Exposed Mains Wiring, Gas Pipes, Bloated Li-Ion Batteries.
       - If ANY of these are present, set 'dangerLevel' to 'High'.
       - If 'High' danger: Provide a scary 'safetyWarning', a 'professionalReferral', and return EMPTY 'steps'. Do not help them fix a bomb or a house fire.
    3. **PERSONALIZATION**:
       - **Novice**: Use simple language. Suggest tool substitutions (e.g. use a butter knife carefully if safe). Explain *why* a step is needed.
       - **Expert**: Be concise. Use technical jargon. Focus on specifications.
    4. **CONFIDENCE**:
       - If the image is blurry or you cannot clearly see the model number/damage, lower 'confidenceScore' and explain why in 'reasoning'.
    
    Return strict JSON.
  `;

  const parts = mediaItems.map(item => ({
    inlineData: {
      mimeType: item.mimeType,
      data: item.data,
    }
  }));

  parts.push({ text: promptText } as any);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: parts,
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA,
        systemInstruction: "You are an intelligent repair assistant. Your priority is user safety, then repair success.",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini.");

    return JSON.parse(text) as RepairAnalysis;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Analysis failed. Please ensure images are clear and try again.");
  }
};
