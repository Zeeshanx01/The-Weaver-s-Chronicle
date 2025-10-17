import { GoogleGenAI, Modality, Type } from "@google/genai";
import { GeminiStoryResponse, NpcState, PlayerState, StorySegment } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    story: {
      type: Type.STRING,
      description: "The next part of the story narrative. Describe the environment and the outcome of the player's last action in a compelling, second-person perspective ('You see...'). This should NOT contain any NPC dialogue text."
    },
    choices: {
      type: Type.ARRAY,
      description: "A list of 2 to 4 distinct actions the player can take next. Each choice should be a short, actionable phrase. Provide this field ONLY when the player is NOT in a conversation.",
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
      description: "If an NPC (Non-Player Character) is present or speaking, include their details. Omit if no NPC is involved in this segment.",
      properties: {
        name: {
          type: Type.STRING,
          description: "The name of the NPC."
        },
        dialogue: {
          type: Type.STRING,
          description: "The exact words the NPC says to the player. Omit if the NPC is present but not speaking."
        },
        relationshipChange: {
          type: Type.NUMBER,
          description: "Integer change in the player's relationship with this NPC based on their last action. E.g., a kind act might be +10, an insult -15. Omit if no change."
        },
        dialogueChoices: {
          type: Type.ARRAY,
          description: "A list of 2-3 short dialogue options for the player to respond to the NPC. Provide this field to continue a conversation. If the conversation ends, omit this and provide top-level 'choices' instead.",
          items: { type: Type.STRING }
        }
      }
    },
    objective: {
      type: Type.STRING,
      description: "A short summary (1-2 sentences) of the player's current main goal. This should be updated as the player makes progress. Omit if the objective hasn't changed."
    }
  },
  required: ["story", "isGameOver"],
};


export async function getNextStorySegment(storyHistory: StorySegment[], playerChoice: string, player: PlayerState, inventory: string[], currentObjective: string | null, currentNpc: NpcState | null): Promise<GeminiStoryResponse> {
  const model = "gemini-2.5-flash";

  const historyText = storyHistory.map(segment => segment.text).join('\n');
  
  const prompt = `
    You are a Dungeon Master for a dynamic, text-based adventure game.
    Your goal is to create a mysterious and engaging story. Always respond in the required JSON format.
    
    PLAYER CHARACTER:
    - Name: ${player.name}
    - Age: ${player.age}
    - Gender: ${player.gender}
    - Personality: ${player.personality}
    - Class: ${player.characterClass}
    - Health: ${player.health}/${player.maxHealth}
    - Inventory: [${inventory.length > 0 ? inventory.join(', ') : 'nothing'}]

    CURRENT OBJECTIVE: ${currentObjective || 'None yet. Create a starting goal for the player.'}

    ${currentNpc ? `
    CURRENT INTERACTION:
    - NPC Name: ${currentNpc.name}
    - Player Relationship: ${currentNpc.relationship} (-100 is hostile, 0 is neutral, 100 is friendly). A high relationship may unlock quests or secrets. A low one may lead to conflict.
    ` : ''}

    STORY SO FAR:
    ---
    ${historyText}
    ---
    PLAYER'S LATEST ACTION: "${playerChoice}"

    GENERATE THE NEXT STORY SEGMENT BASED ON THESE RULES:
    1.  **Story:** Write the next part of the story. Describe the outcome of the player's action. Do NOT include NPC dialogue in this 'story' field.
    2.  **NPC Interaction:**
        - If an NPC speaks, put their exact words in \`npc.dialogue\`.
        - Base the NPC's reaction and dialogue on the player's action and their relationship score. An NPC with a relationship of 50 will be much friendlier than one at -50.
        - Adjust the relationship score via \`npc.relationshipChange\` based on the player's choice.
    3.  **Choices (IMPORTANT!):**
        - **If the conversation continues:** Provide 2-3 new dialogue options for the player in \`npc.dialogueChoices\`. Do NOT provide the top-level \`choices\` field.
        - **If the conversation ends OR there is no conversation:** Provide 2-4 general action options for the player in the top-level \`choices\` field. Do NOT provide \`npc.dialogueChoices\`.
        - YOU MUST PROVIDE ONE OR THE OTHER, NEVER BOTH, and never neither (unless game is over).
    4.  **Game Systems:**
        - Manage the main quest via the 'objective' field. Update it when the player makes progress.
        - Use 'healthChange' for damage/healing. Health at 0 means 'isGameOver: true'.
        - Use 'newItem' when the player finds an item.
        - Set 'isGameOver' to true only at a conclusive end.
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
        if (!parsedResponse.story || ( !Array.isArray(parsedResponse.choices) && !parsedResponse.npc?.dialogueChoices && !parsedResponse.isGameOver)) {
            throw new Error("Invalid response format: Missing 'story' or any valid 'choices'.");
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