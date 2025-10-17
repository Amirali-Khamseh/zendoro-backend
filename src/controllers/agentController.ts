import { GoogleGenAI } from "@google/genai";
export const agentController = async (req, res) => {
  const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY,
  });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "what is the capital of france?",
  });
  console.log(response);
  return res.status(200).json({ message: response });
};
