import { eq } from "drizzle-orm";
import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { db } from "../db";
import { modes } from "../db/schema";

// Create Mode
export async function createMode(req: AuthRequest, res: Response) {
  try {
    const { name, focusTime, shortBreak, longBreak } = req.body;
    const [newMode] = await db
      .insert(modes)
      .values({
        userId: req.user!.userId,
        name,
        focusTime,
        shortBreak,
        longBreak,
      })
      .returning();
    res.json(newMode);
  } catch (err) {
    res.status(500).json({ error: "Failed to create mode" });
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

// Delete Mode
export async function deleteMode(req: AuthRequest, res: Response) {
  const { id } = req.params;
  await db.delete(modes).where(eq(modes.id, Number(id)));
  res.json({ message: "Mode deleted" });
}
