import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      // Fallback or warning if key is missing
      console.warn('GEMINI_API_KEY is not set or is using a placeholder. AI features may fail.');
    }
    aiInstance = new GoogleGenAI({ apiKey: apiKey || '' });
  }
  return aiInstance;
}

class AIService {
  static async analyzeSkillGap(currentSkills: string[], careerGoal: string) {
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze the skill gap for someone wanting to become a ${careerGoal}. Current skills: ${currentSkills.join(', ')}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              skillScore: { type: Type.NUMBER },
              missingSkills: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    priority: { type: Type.STRING, enum: ['high', 'medium', 'low'] }
                  }
                }
              },
              recommendedCourses: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    url: { type: Type.STRING },
                    platform: { type: Type.STRING }
                  }
                }
              },
              recommendedProjects: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });

      return JSON.parse(response.text || '{}');
    } catch (error) {
      console.error('AI Service Error:', error);
      return {
        skillScore: 50,
        missingSkills: [],
        recommendedCourses: [],
        recommendedProjects: []
      };
    }
  }

  static async analyzeResume(resumeText: string) {
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this resume for ATS compatibility and provide feedback. Resume text: ${resumeText.substring(0, 3000)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              strengthScore: { type: Type.NUMBER },
              missingSections: { type: Type.ARRAY, items: { type: Type.STRING } },
              suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              keywordsFound: { type: Type.ARRAY, items: { type: Type.STRING } },
              keywordsMissing: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });

      return JSON.parse(response.text || '{}');
    } catch (error) {
      console.error('AI Service Error:', error);
      return { strengthScore: 0, missingSections: [], suggestions: [], keywordsFound: [], keywordsMissing: [] };
    }
  }

  static async generateApplicationEmail(job: any, resumeContext: string) {
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Write a professional application email for: Job: ${job.title} at ${job.company}. Context: ${resumeContext}`,
      });

      return response.text || "";
    } catch (error) {
      console.error('AI Service Error:', error);
      return "Dear Hiring Manager, I am interested in this position...";
    }
  }
}

export default AIService;
