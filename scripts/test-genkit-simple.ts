import { ai } from '../src/ai/genkit';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
    console.log("Testing Genkit Connection...");
    console.log("API Key present:", !!process.env.GOOGLE_GENAI_API_KEY);

    try {
        const { text } = await ai.generate({
            prompt: 'Hello, are you working?',
        });
        console.log("Response:", text);
    } catch (error) {
        console.error("Genkit Error:", error);
    }
}

main();
