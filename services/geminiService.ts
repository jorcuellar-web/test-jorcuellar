
import { GoogleGenAI, Chat } from "@google/genai";

const SYSTEM_INSTRUCTION = `Eres un chatbot experto en neuroanatomía llamado "NeuroBuddy". Tu función principal es educar y responder preguntas con precisión sobre los **12 Pares Craneales** (su nombre, número, tipo -sensitivo, motor, mixto-, función y foramen de salida).
Mantén un tono profesional, claro y de tutor.
Si la pregunta no está relacionada con los pares craneales, la visión, el olfato, la audición o la anatomía de la cabeza/cuello, responde amablemente que tu experiencia se limita a los nervios craneales.`;

export const createChatSession = (): Chat | null => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API_KEY environment variable not set.");
      throw new Error("API_KEY environment variable not set.");
    }
    const ai = new GoogleGenAI({ apiKey });
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      // FIX: systemInstruction and tools must be placed inside a 'config' object.
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      },
    });
    return chat;
  } catch (error) {
    console.error("Failed to initialize Gemini chat session:", error);
    return null;
  }
};
