import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../public')));

// Initialize Gemini lazily - wrapped in try-catch
let ai = null;
try {
    const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (apiKey) {
        ai = new GoogleGenAI({ apiKey });
        console.log("Gemini AI initialized successfully.");
    } else {
        console.warn("WARNING: GEMINI_API_KEY is not set. AI features will not work.");
    }
} catch (error) {
    console.error("Failed to initialize Gemini AI:", error);
}

const ANALYSIS_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        objectName: { type: Type.STRING },
        dangerLevel: { type: Type.STRING, enum: ["Low", "High"] },
        confidenceScore: { type: Type.INTEGER },
        reasoning: { type: Type.STRING },
        safetyWarning: { type: Type.STRING },
        professionalReferral: { type: Type.STRING },
        toolsRequired: { type: Type.ARRAY, items: { type: Type.STRING } },
        toolSubstitutions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    original: { type: Type.STRING },
                    substitute: { type: Type.STRING },
                },
            },
        },
        estimatedTime: { type: Type.STRING },
        steps: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["objectName", "dangerLevel", "confidenceScore", "reasoning", "safetyWarning", "toolsRequired", "estimatedTime", "steps"],
};

app.post('/api/analyze', async (req, res) => {
    try {
        const { mediaItems, userPrompt, skillLevel } = req.body;

        if (!mediaItems || mediaItems.length === 0) {
            return res.status(400).json({ error: "No media items provided" });
        }

        if (!ai) {
            return res.status(503).json({ error: "AI service not configured. Check API key." });
        }

        const promptText = `
      You are Resolve AI, an expert safety-first technician.
      
      CONTEXT:
      - User Skill Level: ${skillLevel ? skillLevel.toUpperCase() : 'NOVICE'}
      - User Query: "${userPrompt || 'How do I fix this?'}"
      
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

        parts.push({ text: promptText });

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts },
            config: {
                responseMimeType: "application/json",
                responseSchema: ANALYSIS_SCHEMA,
                systemInstruction: "You are an intelligent repair assistant. Your priority is user safety, then repair success.",
            },
        });

        const text = response.text;
        if (!text) throw new Error("No response from Gemini.");

        const result = JSON.parse(text);
        res.json(result);

    } catch (error) {
        console.error("Analysis Error:", error);
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
});

// Health check endpoint for Cloud Run
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// START LISTENING IMMEDIATELY - this is critical for Cloud Run
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
});
