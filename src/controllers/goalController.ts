import { eq, and, inArray } from "drizzle-orm";
import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import {
  goals,
  goalTodos,
  goalHabits,
  goalReminders,
} from "../db/schema";
import { db } from "../db";

// Shape returned to the client: the goal row plus the ids of every linked
// todo / habit / reminder, so the frontend can compute progress from the
// items it already has loaded.
type GoalWithLinks = typeof goals.$inferSelect & {
  todoIds: number[];
  habitIds: number[];
  reminderIds: number[];
};

// Collect the linked ids for a set of goals in one round-trip each, then
// group them per goal. Returns goals enriched with their link id arrays.
async function attachLinks(
  goalRows: (typeof goals.$inferSelect)[]
): Promise<GoalWithLinks[]> {
  const ids = goalRows.map((g) => g.id);
  if (ids.length === 0) return [];

  const [todoLinks, habitLinks, reminderLinks] = await Promise.all([
    db.select().from(goalTodos).where(inArray(goalTodos.goalId, ids)),
    db.select().from(goalHabits).where(inArray(goalHabits.goalId, ids)),
    db.select().from(goalReminders).where(inArray(goalReminders.goalId, ids)),
  ]);

  return goalRows.map((g) => ({
    ...g,
    todoIds: todoLinks.filter((l) => l.goalId === g.id).map((l) => l.todoId),
    habitIds: habitLinks.filter((l) => l.goalId === g.id).map((l) => l.habitId),
    reminderIds: reminderLinks
      .filter((l) => l.goalId === g.id)
      .map((l) => l.reminderId),
  }));
}

// Replace all link rows for a goal with the provided id arrays. `undefined`
// arrays are left untouched; an empty array clears that link type.
async function setLinks(
  goalId: number,
  links: {
    todoIds?: number[];
    habitIds?: number[];
    reminderIds?: number[];
  }
) {
  if (links.todoIds !== undefined) {
    await db.delete(goalTodos).where(eq(goalTodos.goalId, goalId));
    if (links.todoIds.length) {
      await db
        .insert(goalTodos)
        .values(links.todoIds.map((todoId) => ({ goalId, todoId })));
    }
  }
  if (links.habitIds !== undefined) {
    await db.delete(goalHabits).where(eq(goalHabits.goalId, goalId));
    if (links.habitIds.length) {
      await db
        .insert(goalHabits)
        .values(links.habitIds.map((habitId) => ({ goalId, habitId })));
    }
  }
  if (links.reminderIds !== undefined) {
    await db.delete(goalReminders).where(eq(goalReminders.goalId, goalId));
    if (links.reminderIds.length) {
      await db
        .insert(goalReminders)
        .values(links.reminderIds.map((reminderId) => ({ goalId, reminderId })));
    }
  }
}

export async function createGoal(req: AuthRequest, res: Response) {
  try {
    const { title, description, targetDate, status, todoIds, habitIds, reminderIds } =
      req.body;
    const [goal] = await db
      .insert(goals)
      .values({
        userId: req.user!.userId,
        title,
        description: description ?? null,
        targetDate: targetDate ?? null,
        status: status ?? "active",
      })
      .returning();

    await setLinks(goal.id, { todoIds, habitIds, reminderIds });
    const [withLinks] = await attachLinks([goal]);
    res.json(withLinks);
  } catch (error) {
    console.error("Error creating goal:", error);
    res.status(500).json({ error: "Failed to create goal" });
  }
}

export async function getGoals(req: AuthRequest, res: Response) {
  try {
    const goalRows = await db
      .select()
      .from(goals)
      .where(eq(goals.userId, req.user!.userId));
    const withLinks = await attachLinks(goalRows);
    res.json(withLinks);
  } catch (error) {
    console.error("Error fetching goals:", error);
    res.status(500).json({ error: "Failed to fetch goals" });
  }
}

export async function updateGoal(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const goalId = parseInt(id);
    const { title, description, targetDate, status, todoIds, habitIds, reminderIds } =
      req.body;

    // Only update goal columns that were actually provided.
    const updates: Partial<typeof goals.$inferInsert> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (targetDate !== undefined) updates.targetDate = targetDate;
    if (status !== undefined) updates.status = status;

    let goal: typeof goals.$inferSelect | undefined;
    if (Object.keys(updates).length > 0) {
      [goal] = await db
        .update(goals)
        .set(updates)
        .where(
          and(eq(goals.id, goalId), eq(goals.userId, req.user!.userId))
        )
        .returning();
    } else {
      [goal] = await db
        .select()
        .from(goals)
        .where(
          and(eq(goals.id, goalId), eq(goals.userId, req.user!.userId))
        );
    }

    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    await setLinks(goalId, { todoIds, habitIds, reminderIds });
    const [withLinks] = await attachLinks([goal]);
    res.json(withLinks);
  } catch (error) {
    console.error("Error updating goal:", error);
    res.status(500).json({ error: "Failed to update goal" });
  }
}

export async function deleteGoal(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    // Link rows are removed by the ON DELETE CASCADE on the join tables.
    await db
      .delete(goals)
      .where(
        and(
          eq(goals.id, parseInt(id)),
          eq(goals.userId, req.user!.userId)
        )
      );
    res.json({ message: "Goal deleted" });
  } catch (error) {
    console.error("Error deleting goal:", error);
    res.status(500).json({ error: "Failed to delete goal" });
  }
}
