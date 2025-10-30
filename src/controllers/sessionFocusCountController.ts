import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { db } from "../db";
import { sessionFocusCounts } from "../db/schema";

export async function sessionFocusCount(req: AuthRequest, res: Response) {
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

    // Insert the session count for the user/date
    const [inserted] = await db
      .insert(sessionFocusCounts)
      .values({
        userId,
        sessionCount,
        date,
      })
      .returning();

    console.log("Saved session focus count:", inserted);

    res.status(200).json({ message: "Session focus saved", data: inserted });
  } catch (error) {
    console.error("Error saving session focus count:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
