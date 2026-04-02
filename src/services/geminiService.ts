import { GoogleGenAI, Type } from "@google/genai";

function getAI() {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || "";
  return new GoogleGenAI({ apiKey });
}

export async function generateCategorySpecificHooks(category: string, topic: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 3 high-retention video hooks specifically for the category: "${category}" on the topic: "${topic}". 
      For each hook, provide:
      1. The hook text
      2. The psychological reason why it works
      3. An example of how to deliver it
      
      Use Google Search to find current viral trends or successful examples related to this topic if necessary.
      Format the response as JSON with an array of objects called "hooks", each having keys: text, reason, delivery.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hooks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  delivery: { type: Type.STRING },
                },
                required: ["text", "reason", "delivery"],
              },
            },
          },
          required: ["hooks"],
        },
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Category AI Generation Error:", error);
    throw error;
  }
}

export async function generateHookSuggestions(topic: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate high-retention video hooks for the topic: "${topic}". 
      Provide:
      1. An Opening Hook (0-5s)
      2. A Mid-video Storytelling Hook
      3. A Final Payoff Hook
      
      Format the response as JSON with keys: opening, middle, payoff.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            opening: { type: Type.STRING },
            middle: { type: Type.STRING },
            payoff: { type: Type.STRING },
          },
          required: ["opening", "middle", "payoff"],
        },
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
}

export async function weakToViralRewriter(sentence: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Rewrite this boring sentence into three high-retention versions:
      1. High-Retention (Viral style)
      2. Emotional (Connects deeply)
      3. Suspenseful (Creates mystery)
      
      Original: "${sentence}"
      
      Format the response as JSON with keys: highRetention, emotional, suspenseful. Each should have "text" and "explanation" (what changed and why).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            highRetention: {
              type: Type.OBJECT,
              properties: { text: { type: Type.STRING }, explanation: { type: Type.STRING } },
              required: ["text", "explanation"]
            },
            emotional: {
              type: Type.OBJECT,
              properties: { text: { type: Type.STRING }, explanation: { type: Type.STRING } },
              required: ["text", "explanation"]
            },
            suspenseful: {
              type: Type.OBJECT,
              properties: { text: { type: Type.STRING }, explanation: { type: Type.STRING } },
              required: ["text", "explanation"]
            },
          },
          required: ["highRetention", "emotional", "suspenseful"],
        },
      },
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Rewriter Error:", error);
    throw error;
  }
}

export async function watchTimeBooster(script: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this video script for watch time optimization:
      "${script}"
      
      Provide:
      1. Drop-off points (where viewers might leave)
      2. Hook suggestions to insert at those points
      3. Flow improvements
      
      Format as JSON with keys: dropOffPoints (array of { location: string, reason: string }), hookSuggestions (array of { location: string, hook: string }), flowImprovements (string).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dropOffPoints: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { location: { type: Type.STRING }, reason: { type: Type.STRING } },
                required: ["location", "reason"]
              }
            },
            hookSuggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { location: { type: Type.STRING }, hook: { type: Type.STRING } },
                required: ["location", "hook"]
              }
            },
            flowImprovements: { type: Type.STRING },
          },
          required: ["dropOffPoints", "hookSuggestions", "flowImprovements"],
        },
      },
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Booster Error:", error);
    throw error;
  }
}

export async function storyExpander(idea: string, userStyle?: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Expand this simple idea into a full engaging video story:
      Idea: "${idea}"
      ${userStyle ? `Tone/Style to match: ${userStyle}` : ""}
      
      Include:
      1. Opening Hook
      2. Story Beats with hooks placed throughout
      3. Final Payoff
      
      Format as JSON with keys: opening, storyBeats (array of { beat: string, hook: string }), payoff.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            opening: { type: Type.STRING },
            storyBeats: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { beat: { type: Type.STRING }, hook: { type: Type.STRING } },
                required: ["beat", "hook"]
              }
            },
            payoff: { type: Type.STRING },
          },
          required: ["opening", "storyBeats", "payoff"],
        },
      },
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Expander Error:", error);
    throw error;
  }
}

export function createChatSession(systemInstruction: string) {
  const ai = getAI();
  return ai.chats.create({
    model: "gemini-3.1-pro-preview",
    config: {
      systemInstruction,
    },
  });
}

export async function analyzeHookStrength(hook: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `As an expert YouTube strategist, analyze the following hook/script:
      "${hook}"
      
      Provide a detailed analysis including:
      1. Overall Score (1-100)
      2. Curiosity Level (1-10)
      3. Emotional Impact (1-10)
      4. Retention Potential (1-10)
      5. Weak Points
      6. Suggestions to Improve
      7. A Rewritten Stronger Version
      
      Format the response as JSON with keys: score, curiosity, emotional, retention, weakPoints (array), suggestions (array), rewrittenVersion.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            curiosity: { type: Type.NUMBER },
            emotional: { type: Type.NUMBER },
            retention: { type: Type.NUMBER },
            weakPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            rewrittenVersion: { type: Type.STRING },
          },
          required: ["score", "curiosity", "emotional", "retention", "weakPoints", "suggestions", "rewrittenVersion"],
        },
      },
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Analyzer Error:", error);
    throw error;
  }
}
