import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in the environment.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function getCareerAdvice(skills: string, goals: string): Promise<string> {
  try {
    const ai = getAI();
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `I have the following skills: ${skills}. My career goals are: ${goals}. Can you provide some career advice, potential job roles, and skills I should learn?`,
      config: {
        systemInstruction: "You are a professional career advisor with 20 years of experience. Provide concise, actionable, and encouraging advice.",
      },
    });
    return response.text || "No advice available at the moment.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error while getting advice. Please try again later.";
  }
}

export async function analyzeSkillGap(currentSkills: string[], careerGoal: string) {
  try {
    const ai = getAI();
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the skill gap for someone wanting to become a ${careerGoal}. Current skills: ${currentSkills.join(', ')}`,
      config: {
        systemInstruction: "You are a career expert. Analyze the gap between current skills and the target career goal.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            skillScore: { type: Type.NUMBER, description: "A score from 0-100" },
            missingSkills: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  priority: { type: Type.STRING, enum: ["high", "medium", "low"] }
                },
                required: ["name", "priority"]
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
                },
                required: ["name"]
              }
            },
            recommendedProjects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  skillsToLearn: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["name", "description"]
              }
            }
          },
          required: ["skillScore", "missingSkills", "recommendedCourses", "recommendedProjects"]
        }
      },
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { skillScore: 50, missingSkills: [], recommendedCourses: [], recommendedProjects: [] };
  }
}

export async function analyzeResume(resumeText: string) {
  try {
    const ai = getAI();
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this resume for ATS compatibility and provide feedback. Resume text: ${resumeText.substring(0, 3000)}`,
      config: {
        systemInstruction: "You are an expert HR manager and ATS specialist.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            strengthScore: { type: Type.NUMBER },
            missingSections: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            keywordsFound: { type: Type.ARRAY, items: { type: Type.STRING } },
            keywordsMissing: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["strengthScore", "missingSections", "suggestions"]
        }
      },
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { strengthScore: 0, missingSections: [], suggestions: [], keywordsFound: [], keywordsMissing: [] };
  }
}

export async function generateApplicationEmail(job: any, resumeContext: string): Promise<string> {
  try {
    const ai = getAI();
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Write a professional application email for: Job: ${job.title} at ${job.company}. Context: ${resumeContext}`,
      config: {
        systemInstruction: "You are a professional job applicant. Write a compelling and professional application email.",
      },
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Dear Hiring Manager, I am interested in this position...";
  }
}

export async function searchJobsWithAI(query: string) {
  try {
    const ai = getAI();
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a list of 5 realistic job postings based on this search query: "${query}". Include the company name, job title, a brief description, location, and a realistic contact email address for the company.`,
      config: {
        systemInstruction: "You are a realistic job board API. Generate realistic job postings.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              company: { type: Type.STRING },
              description: { type: Type.STRING },
              location: { type: Type.STRING },
              companyEmail: { type: Type.STRING },
              careerCategory: { type: Type.STRING }
            },
            required: ["title", "company", "description", "location", "companyEmail", "careerCategory"]
          }
        }
      },
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
}

export async function generateResumes(data: any): Promise<any[]> {
  try {
    const ai = getAI();
    const prompt = `You are a professional resume writer and career coach.
    
Create 3 different resume versions for a student based on the provided information, following these specific visual templates:

Template 1: "Modern Sidebar" (Inspired by Image 1)
- Layout: A distinct sidebar on the left (represented by a separate section in markdown).
- Sidebar contains: Contact Info, Skills (as a list), Languages, and Education.
- Main area contains: Name (Large), Professional Summary, Work History (with dates on the left), and Projects.
- Color theme: Navy blue and white.

Template 2: "Minimalist Professional" (Inspired by Image 2)
- Layout: Clean, centered, single-column layout.
- Header: Name (Large, centered), Title, Contact Info (horizontal line).
- Sections: Profile, Professional Experience, Education, Skills (with dot-based ratings like ●●●●○), Languages, Awards, and a Favorite Quote at the bottom.
- Style: Uses horizontal lines to separate sections.

Template 3: "Bold Executive" (Inspired by Image 3)
- Layout: A dark gray sidebar on the left, white main content area.
- Sidebar contains: Name (Large, white text on dark), Title, Contact Info, Objective/Summary, Education, Skills, and Certifications.
- Main area contains: Work Experience (with company names bolded and dates/location clearly marked), and Projects.
- Style: High contrast, bold headings, clean sans-serif feel.

Input Data:
- Name: ${data.name}
- Phone: ${data.phone}
- Email: ${data.email}
- GitHub: ${data.github_link || 'N/A'}
- LinkedIn: ${data.linkedin_link || 'N/A'}
- Education: ${data.education}
- Skills: ${data.skills}
- Experience: ${data.experience || 'N/A'}
- Achievements: ${data.achievements || 'N/A'}
- Projects: ${data.projects || 'N/A'}
- Certifications: ${data.certifications || 'N/A'}

Instructions:
1. Generate 3 complete resumes using the same data but different structures as described above.
2. Improve wording, clarity, and impact of bullet points.
3. Return the output as a JSON array of 3 objects, each with 'title' (e.g., "Modern Sidebar"), 'style' (a description of the layout), and 'content' (the markdown content of the resume).

Response Format:
[
  { "title": "Modern Sidebar", "style": "blue-sidebar", "content": "..." },
  { "title": "Minimalist Professional", "style": "minimalist", "content": "..." },
  { "title": "Bold Executive", "style": "gray-sidebar", "content": "..." }
]`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are a professional resume writer. Return ONLY a JSON array of 3 resume objects.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              style: { type: Type.STRING },
              content: { type: Type.STRING }
            },
            required: ["title", "style", "content"]
          }
        }
      },
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
}

