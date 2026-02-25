import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '';

let ai: GoogleGenAI | null = null;

function getClient() {
    if (!ai) {
        if (!apiKey) {
            throw new Error('GOOGLE_API_KEY is not set. Get a free key at https://aistudio.google.com/apikey');
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
}

export async function generateContent(prompt: string, systemInstruction?: string) {
    const client = getClient();

    try {
        const response = await client.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
            config: systemInstruction ? {
                systemInstruction: systemInstruction,
            } : undefined,
        });

        const text = response.text || '';

        return {
            candidates: [{
                content: {
                    parts: [{ text }]
                }
            }]
        };
    } catch (error: any) {
        console.error("====== Gemini AI Error ======");
        console.error(error.message || error);
        console.error("============================");
        throw error;
    }
}
