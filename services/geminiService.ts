import { RepairAnalysis, MediaItem, SkillLevel } from "../types";

export const analyzeMedia = async (
  mediaItems: MediaItem[],
  userPrompt: string,
  skillLevel: SkillLevel = 'Novice'
): Promise<RepairAnalysis> => {
  if (mediaItems.length === 0) {
    throw new Error("No media selected.");
  }

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mediaItems,
        userPrompt,
        skillLevel
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Analysis failed on server.");
    }

    const result = await response.json();
    return result as RepairAnalysis;
  } catch (error) {
    console.error("Backend Analysis Error:", error);
    throw error;
  }
};
