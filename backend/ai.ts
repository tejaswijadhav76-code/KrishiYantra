import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure env vars are loaded
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * Handles chatbot queries by formatting history and system guidelines.
 */
export async function generateAiChatResponse(
  messages: { role: 'user' | 'model'; content: string }[],
  availableMachines: any[]
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY' || apiKey.trim() === '') {
    return "Namaste! I am Krishi Mitra, your AI crop and machinery advisor. I see that your Google Gemini API Key is not set in the .env file. Please paste your Gemini API Key in the project .env to enable my full capabilities!";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Format conversation history for Gemini SDK
    const contents = messages.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Inject list of available marketplace machinery
    const machinesSnippet = availableMachines.map(m => 
      `- Name: ${m.name} (${m.category})\n  Rental price: ₹${m.price}/day\n  Purchase price: ${m.buyPrice ? `₹${m.buyPrice}` : 'Not for sale'}\n  Tractor HP required: ${m.features.find((f: any) => f.label === 'Tractor HP')?.value || 'N/A'}\n  Units available: ${m.availableUnits} of ${m.totalUnits}\n  Location: ${m.location}\n  Owner: ${m.owner}`
    ).join('\n');

    const systemInstruction = `You are Krishi Mitra (कृषि मित्र), a warm, highly knowledgeable Indian agronomist specialist and machinery advisor for the KrishiYantra platform.
Your goal is to help Indian farmers (Kisan Bhaiyo) select the most suitable machinery, seeds, and tillage practices based on their crop type, land size, soil type, and tractor capacity.

Rules of Conversation:
1. Speak in a warm, polite, and conversational mix of Hindi and English (Hinglish). Use terms like "Namaste", "Kisan Bhai", "Fasal", "Mitti", "Ram Ram", and "Bhaiyo" to sound accessible and localized. Keep response text in the normal English alphabet (Latin characters) so it is easy to read.
2. Provide clear, highly practical advice on farming queries.
3. Recommend machinery from the available inventory listing in our marketplace if it matches their requirements. Be specific, call out the machine name, and mention the rental or purchase price.
Here is the live machinery inventory in the KrishiYantra marketplace right now:
${machinesSnippet}

4. If a requested machine type is not in stock, suggest similar categories we have or advise on general requirements. Always encourage the farmer to check the 'Search' tab in the app to view latest availability.
5. Keep your response relatively concise (2-4 paragraphs max) so it fits beautifully in a chat bubble.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text || "I apologize, Kisan Bhai, but I couldn't formulate a response right now. Please try again.";
  } catch (err: any) {
    console.error("Gemini API Chat error:", err);
    return `Namaste. I encountered an error while reaching out to my knowledge system: ${err.message || err}. Please ensure your API key is active and your network is connected.`;
  }
}

/**
 * Automatically creates description, specifications, and features for new machinery.
 */
export async function generateListingData(
  name: string,
  category: string
): Promise<{
  description: string;
  specs: { label: string; value: string }[];
  features: { label: string; value: string; icon: string }[];
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY' || apiKey.trim() === '') {
    throw new Error('Gemini API Key is not set in the .env file. Please add your key first.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Generate a detailed machinery marketplace listing description, features, and specs.
Machine Name: ${name}
Category: ${category} (Category options are Tillage, Sowing, Harvesting, Spraying)

Output standard realistic details for this type of equipment.
You MUST respond with a valid JSON object matching this schema, with no additional text or backticks around it:
{
  "description": "Provide a premium, technical yet attractive 3-4 sentence description detailing durability, efficiency, blade/drum build, and field utility for Indian farming conditions.",
  "specs": [
    { "label": "Working Width", "value": "e.g. 6 feet or 2.1 meters" },
    { "label": "Weight", "value": "e.g. 420 kg" },
    { "label": "Working Speed", "value": "e.g. 3-5 km/h" }
  ],
  "features": [
    { "label": "Tractor HP", "value": "e.g. 45-60 HP required", "icon": "agriculture" },
    { "label": "Efficiency", "value": "e.g. 1.5 - 2 acres/hour", "icon": "speed" },
    { "label": "Design", "value": "e.g. Heavy Duty Gear Drive", "icon": "settings" }
  ]
}

Ensure the "icon" field is a standard Material Icon name (e.g. 'agriculture', 'speed', 'settings', 'info', 'build', 'power', 'terrain', 'grass', 'water_drop').`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.2
    }
  });

  const text = response.text;
  if (!text) throw new Error("Empty response from Gemini listing generator.");

  try {
    return JSON.parse(text.trim());
  } catch (e) {
    // Fallback: strip markdown formatting if any was returned
    const cleaned = text.replace(/^```json/, '').replace(/```$/, '').trim();
    return JSON.parse(cleaned);
  }
}
