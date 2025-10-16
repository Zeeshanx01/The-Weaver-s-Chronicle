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
    },
    npc: {
      type: Type.OBJECT,
      description: "If an NPC (Non-Player Character) is speaking in this story segment, include their details here. Omit this field entirely if no one is speaking.",
      properties: {
        name: {
          type: Type.STRING,
          description: "The name of the NPC who is speaking."
        },
        dialogue: {
          type: Type.STRING,
          description: "The exact words the NPC says to the player."
        }
      }
    },
    objective: {
      type: Type.STRING,
      description: "A short summary (1-2 sentences) of the player's current main goal. This should be updated as the player makes progress. Omit if the objective hasn't changed."
    }
  },
  required: ["story", "choices", "isGameOver"],
};


export async function getNextStorySegment(storyHistory: StorySegment[], playerChoice: string, player: PlayerState, inventory: string[], currentObjective: string | null): Promise<GeminiStoryResponse> {
  const model = "gemini-2.5-flash";

  const historyText = storyHistory.map(segment => segment.text).join('\n');
  
  const prompt = `
    You are a Dungeon Master for a dynamic, suspenseful, text-based adventure game.
    Your goal is to create a mysterious and engaging story that keeps the player on the edge of their seat. Build tension, introduce unexpected twists, and create a sense of urgency.
    Always respond in the required JSON format.
    
    PLAYER CHARACTER:
    - Name: ${player.name}
    - Age: ${player.age}
    - Gender: ${player.gender}
    - Personality: ${player.personality}
    - Class: ${player.characterClass}
    - Health: ${player.health}/${player.maxHealth}
    - Inventory: [${inventory.length > 0 ? inventory.join(', ') : 'nothing'}]

    CURRENT OBJECTIVE: ${currentObjective || 'None yet. Create a starting goal for the player.'}

    STORY SO FAR:
    ---
    ${historyText}
    ---
    PLAYER'S LATEST ACTION: "${playerChoice}"

    Based on this, generate the next story segment.
    - The 'story' must be suspenseful. Describe what happens next in a narrative style, occasionally addressing the player by name, ${player.name}.
    - An NPC might react differently based on the player's gender, age, or personality. Incorporate these details to make the world feel more alive.
    - The 'choices' must be tailored to the character. A ${player.characterClass} with a ${player.personality} personality might have unique options another class would not.
    - Create and manage a main quest for the player using the 'objective' field. The first turn should establish the main goal. Subsequent turns should update the 'objective' text as the player progresses. If the objective is completed, you can set it to something like "Find a new path." or omit it. The objective should give the player a clear goal to work towards.
    - If the player is talking to a character, populate the 'npc' field with their name and what they are saying. Omit this field if there is no direct dialogue.
    - If the player takes damage or heals, reflect this in the 'healthChange' field. A trap might be '-15'. A magical fountain might be '+20'. Omit if health doesn't change. Health reaching 0 MUST result in 'isGameOver: true'.
    - If the player finds an item, add its name to 'newItem'.
    - If the story reaches a conclusive end (good or bad), set 'isGameOver' to true.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.5,
        topP: 0.95,
      }
    });

    const jsonText = response.text;
    
    try {
        const parsedResponse: GeminiStoryResponse = JSON.parse(jsonText);
        
        // Basic validation
        if (!parsedResponse.story || !Array.isArray(parsedResponse.choices)) {
            throw new Error("Invalid response format from Gemini API: Missing 'story' or 'choices'.");
        }
    
        return parsedResponse;
    } catch (parseError) {
        console.error("Failed to parse JSON response from Gemini API.", parseError);
        console.error("Received text:", jsonText);
        throw new Error("Received an invalid story format from the AI.");
    }

  } catch (error) {
    console.error("Error calling Gemini API:", JSON.stringify(error, null, 2));
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

    } catch (error) {
        console.error("Error generating image:", error);
    }
    
    return null;
}