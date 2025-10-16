import { GoogleGenAI, Modality, Type } from "@google/genai";
import { GeminiStoryResponse, PlayerState, StorySegment } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    story: {
      type: Type.STRING,
      description: "The next part of the story narrative. Describe the environment and the outcome of the player's last action in a compelling, second-person perspective ('You see...')."
    },
    choices: {
      type: Type.ARRAY,
      description: "A list of 2 to 4 distinct actions the player can take next. Each choice should be a short, actionable phrase.",
      items: { type: Type.STRING }
    },
    isGameOver: {
      type: Type.BOOLEAN,
      description: "Set to true if the story has reached a definitive end (e.g., player death, major victory, or unsolvable state). Otherwise, set to false."
    },
    newItem: {
      type: Type.STRING,
      description: "The name of a single item the player acquired in this story segment. For example: 'rusty key', 'health potion'. Omit if no item is found."
    },
    healthChange: {
      type: Type.NUMBER,
      description: "An integer representing the change in the player's health. Negative for damage (e.g., -10), positive for healing (e.g., 15). Omit if no health change occurs."
    }
  },
  required: ["story", "choices", "isGameOver"],
};


// FIX: Updated function signature to accept inventory directly, as it is not part of the PlayerState type.
export async function getNextStorySegment(storyHistory: StorySegment[], playerChoice: string, player: PlayerState, inventory: string[]): Promise<GeminiStoryResponse> {
  const model = "gemini-2.5-flash";

  const historyText = storyHistory.map(segment => segment.text).join('\n');
  
  const prompt = `
    You are a Dungeon Master for a dynamic, text-based adventure game.
    Your goal is to create an engaging and coherent story based on the player's choices.
    Always respond in the required JSON format.
    
    PLAYER CHARACTER:
    - Name: ${player.name}
    - Class: ${player.characterClass}
    - Health: ${player.health}/${player.maxHealth}
    - Inventory: [${inventory.length > 0 ? inventory.join(', ') : 'nothing'}]

    STORY SO FAR:
    ---
    ${historyText}
    ---
    PLAYER'S LATEST ACTION: "${playerChoice}"

    Based on this, generate the next story segment.
    - The 'story' should describe what happens next in a narrative style, occasionally addressing the player by name, ${player.name}.
    - The 'choices' must be tailored to the character. A ${player.characterClass} might have unique options another class would not. A Mage could see a magical solution, a Rogue a sneaky path, a Warrior a direct approach.
    - If the player takes damage or heals, reflect this in the 'healthChange' field. A trap might be '-15'. A magical fountain might be '+20'. Omit if health doesn't change. Health reaching 0 MUST result in 'isGameOver: true'.
    - If the player finds an item, add its name to 'newItem'.
    - If the story reaches a conclusive end (good or bad), set 'isGameOver' to true.
    - Make the story interesting, with challenges, mysteries, and consequences.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.8,
        topP: 0.95,
      }
    });

    const jsonText = response.text;
    const parsedResponse: GeminiStoryResponse = JSON.parse(jsonText);
    
    // Basic validation
    if (!parsedResponse.story || !Array.isArray(parsedResponse.choices)) {
        throw new Error("Invalid response format from Gemini API");
    }

    return parsedResponse;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate story from Gemini API.");
  }
}

export async function generateImageForStory(storyText: string): Promise<string | null> {
    try {
        // Step 1: Generate a concise image prompt from the story text
        const promptGenPrompt = `You are an AI assistant for an artist. Read the following text from a fantasy story and summarize it into a short, descriptive prompt (max 15 words) for an image generator. Focus on the main subject, the setting, and the mood. For example, if the text is 'You enter a vast, cavernous hall...', a good prompt would be 'A vast, dark fantasy cavern hall, glowing mushrooms, mysterious atmosphere, digital painting.' Do not include the words 'A picture of' or 'An image of'. Just provide the description.

Story Text:
"${storyText}"`;

        const promptGenResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: promptGenPrompt,
        });
        
        const imagePrompt = promptGenResponse.text.trim();
        console.log(`Generated Image Prompt: ${imagePrompt}`);

        // Step 2: Generate the image using the concise prompt
        const imageResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: imagePrompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:image/png;base64,${base64ImageBytes}`;
            }
        }
        
        console.warn("No image data found in Gemini response.");
        return null;

    } catch (error) {
        console.error("Error generating image:", error);
        return null;
    }
}
