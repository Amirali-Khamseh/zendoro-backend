import { eq } from "drizzle-orm";
import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { db } from "../db";
import { habits } from "../db/schema";

export async function createHabit(req: AuthRequest, res: Response) {
  try {
    const { name, completions } = req.body; // completions: [true, false, ...]
    const [newHabit] = await db
      .insert(habits)
      .values({
        userId: req.user!.userId,
        name,
        completions,
      })
      .returning();
    res.json(newHabit);
  } catch {
    res.status(500).json({ error: "Failed to create habit" });
  }
}

export async function getHabits(req: AuthRequest, res: Response) {
  const userHabits = await db
    .select()
    .from(habits)
    .where(eq(habits.userId, req.user!.userId));
  res.json(userHabits);
}

export async function updateHabit(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { name, completions } = req.body;
  const [updated] = await db
    .update(habits)
    .set({ name, completions })
    .where(eq(habits.id, Number(id)))
    .returning();
  res.json(updated);
}

export async function deleteHabit(req: AuthRequest, res: Response) {
  const { id } = req.params;
  await db.delete(habits).where(eq(habits.id, Number(id)));
  res.json({ message: "Habit deleted" });
}
