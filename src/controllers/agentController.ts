import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AuthRequest } from "../middlewares/authMiddleware";
import type { Response } from "express";
import {
  executeTool,
  functionDeclarations,
  type ToolCall,
} from "../services/agentTools";

// POST /agent/chat
export const agentController = async (req: AuthRequest, res: Response) => {
  try {
    const { message } = req.body as { message?: string };
    if (!message) {
      return res.status(400).json({ error: "Missing 'message' in body" });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing GOOGLE_API_KEY" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      tools: [
        {
          functionDeclarations: functionDeclarations as any,
        },
      ],
    } as any);

    // Send initial request with user message
    let result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: message }] }],
    } as any);

    let response = result.response;

    // Handle function calls in a loop
    while (response.candidates?.[0]?.content?.parts?.[0]?.functionCall) {
      const functionCall = response.candidates[0].content.parts[0].functionCall;

      // Execute the tool
      const toolResult = await executeTool(
        {
          name: functionCall.name as ToolCall["name"],
          args: functionCall.args || {},
        },
        req
      );

      // Send function response back to model
      result = await model.generateContent({
        contents: [
          { role: "user", parts: [{ text: message }] },
          response.candidates[0].content, // model's function call
          {
            role: "user",
            parts: [
              {
                functionResponse: {
                  name: functionCall.name,
                  response: toolResult,
                },
              },
            ],
          },
        ],
      } as any);

      response = result.response;
    }

    // Extract final text response
    const text = response.text?.() || "";
    return res.status(200).json({ reply: text });
  } catch (err) {
    console.error("Agent error:", err);
    return res.status(500).json({ error: "Agent failed" });
  }
};
