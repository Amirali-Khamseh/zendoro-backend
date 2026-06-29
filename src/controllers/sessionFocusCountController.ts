import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { db } from "../db";
import { sessionFocusCounts } from "../db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export async function setSessionFocusCount(req: AuthRequest, res: Response) {
  try {
    const { sessionCount, date } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (typeof sessionCount !== "number" || !date) {
      return res
        .status(400)
        .json({ error: "Missing or invalid sessionCount/date" });
    }

    // Check if an entry already exists for this user and date
    const existingEntry = await db
      .select()
      .from(sessionFocusCounts)
      .where(
        and(
          eq(sessionFocusCounts.userId, userId),
          eq(sessionFocusCounts.date, date)
        )
      )
      .limit(1);

    let result;

    if (existingEntry.length > 0) {
      // Update the existing entry by incrementing the count
      const [updated] = await db
        .update(sessionFocusCounts)
        .set({
          sessionCount: sql`${sessionFocusCounts.sessionCount} + ${sessionCount}`,
        })
        .where(
          and(
            eq(sessionFocusCounts.userId, userId),
            eq(sessionFocusCounts.date, date)
          )
        )
        .returning();

      result = updated;
      console.log("Updated session focus count:", updated);
    } else {
      // Insert a new entry
      const [inserted] = await db
        .insert(sessionFocusCounts)
        .values({
          userId,
          sessionCount,
          date,
        })
        .returning();

      result = inserted;
      console.log("Saved new session focus count:", inserted);
    }

    res.status(200).json({ message: "Session focus saved", data: result });
  } catch (error) {
    console.error("Error saving session focus count:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
export async function getSessionFocusCount(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // With a date range (?from=YYYY-MM-DD&to=YYYY-MM-DD), return the sum of
    // sessions across the range; without it, fall back to the latest day's count.
    const { from, to } = req.query;
    if (typeof from === "string" || typeof to === "string") {
      const conditions = [eq(sessionFocusCounts.userId, userId)];
      if (typeof from === "string") {
        conditions.push(sql`${sessionFocusCounts.date} >= ${from}::date`);
      }
      if (typeof to === "string") {
        conditions.push(sql`${sessionFocusCounts.date} <= ${to}::date`);
      }
      const [row] = await db
        .select({
          total: sql<number>`COALESCE(SUM(${sessionFocusCounts.sessionCount}), 0)`,
        })
        .from(sessionFocusCounts)
        .where(and(...conditions));
      return res
        .status(200)
        .json({ data: { sessionCount: Number(row?.total ?? 0) } });
    }

    // Fetch the session count for the user
    const sessionCountResult = await db
      .select()
      .from(sessionFocusCounts)
      .where(eq(sessionFocusCounts.userId, userId))
      .orderBy(desc(sessionFocusCounts.date))
      .limit(1);

    const sessionCount = sessionCountResult[0];

    if (!sessionCount) {
      return res.status(200).json({ data: { sessionCount: 0 } });
    }

    res.status(200).json({ data: sessionCount });
  } catch (error) {
    console.error("Error fetching session focus count:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
