import { eq, and } from "drizzle-orm";
import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { db } from "../db";
import { modes } from "../db/schema";

// Update Mode (only updates existing modes)
export async function createMode(req: AuthRequest, res: Response) {
  try {
    const { name, focusTime, shortBreak, longBreak } = req.body;
    console.log("----request body----", req.body);

    // Check if a mode with this name already exists for the user
    const existingMode = await db
      .select()
      .from(modes)
      .where(and(eq(modes.userId, req.user!.userId), eq(modes.name, name)))
      .limit(1);

    if (existingMode.length > 0) {
      // Update existing mode
      const [updatedMode] = await db
        .update(modes)
        .set({
          focusTime,
          shortBreak,
          longBreak,
        })
        .where(and(eq(modes.userId, req.user!.userId), eq(modes.name, name)))
        .returning();

      console.log(`Updated existing mode: ${name}`);
      res.json(updatedMode);
    } else {
      // Mode doesn't exist - return error
      console.log(`Mode '${name}' not found for user ${req.user!.userId}`);
      res.status(404).json({
        error: `Mode '${name}' not found. Cannot update non-existing mode.`,
      });
    }
  } catch (err) {
    console.error("Error in updateMode:", err);
    res.status(500).json({ error: "Failed to update mode" });
  }
}

// Get User Modes
export async function getModes(req: AuthRequest, res: Response) {
  const userModes = await db
    .select()
    .from(modes)
    .where(eq(modes.userId, req.user!.userId));
  res.json(userModes);
}
