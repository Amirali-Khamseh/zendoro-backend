import { eq } from "drizzle-orm";
import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import { reminders } from "../db/schema";
import { db } from "../db";

export async function createReminder(req: AuthRequest, res: Response) {
  try {
    const { title, description, date, time, priority } = req.body;
    const [reminder] = await db
      .insert(reminders)
      .values({
        userId: req.user!.userId,
        title,
        description,
        date,
        time,
        priority,
        completed: false,
      })
      .returning();
    res.json(reminder);
  } catch {
    res.status(500).json({ error: "Failed to create reminder" });
  }
}

export async function getReminders(req: AuthRequest, res: Response) {
  const userReminders = await db
    .select()
    .from(reminders)
    .where(eq(reminders.userId, req.user!.userId));
  res.json(userReminders);
}

export async function updateReminder(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const updates = req.body;
  const [updated] = await db
    .update(reminders)
    .set(updates)
    .where(eq(reminders.id, Number(id)))
    .returning();
  res.json(updated);
}

export async function deleteReminder(req: AuthRequest, res: Response) {
  const { id } = req.params;
  await db.delete(reminders).where(eq(reminders.id, Number(id)));
  res.json({ message: "Reminder deleted" });
}
