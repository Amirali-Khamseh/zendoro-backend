import { eq } from "drizzle-orm";
import { Response } from "express";
import bcrypt from "bcrypt";
import { AuthRequest } from "../middlewares/authMiddleware";
import { users } from "../db/schema";
import { db } from "../db";
import { uploadAvatarToR2, deleteAvatarFromR2 } from "../lib/r2";

export async function getMe(req: AuthRequest, res: Response) {
  try {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, req.user!.userId));

    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("Error fetching current user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
}

export async function uploadAvatar(req: AuthRequest, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const [existing] = await db
      .select({ avatarKey: users.avatarKey })
      .from(users)
      .where(eq(users.id, req.user!.userId));

    const { key, url } = await uploadAvatarToR2(
      req.user!.userId,
      req.file.buffer,
      req.file.mimetype
    );

    await db
      .update(users)
      .set({ avatarUrl: url, avatarKey: key })
      .where(eq(users.id, req.user!.userId));

    if (existing?.avatarKey) {
      await deleteAvatarFromR2(existing.avatarKey).catch((err) =>
        console.error("Failed to delete previous avatar:", err)
      );
    }

    res.json({ avatarUrl: url });
  } catch (error) {
    console.error("Error uploading avatar:", error);
    res.status(500).json({ error: "Failed to upload avatar" });
  }
}

export async function removeAvatar(req: AuthRequest, res: Response) {
  try {
    const [existing] = await db
      .select({ avatarKey: users.avatarKey })
      .from(users)
      .where(eq(users.id, req.user!.userId));

    await db
      .update(users)
      .set({ avatarUrl: null, avatarKey: null })
      .where(eq(users.id, req.user!.userId));

    if (existing?.avatarKey) {
      await deleteAvatarFromR2(existing.avatarKey).catch((err) =>
        console.error("Failed to delete avatar from storage:", err)
      );
    }

    res.json({ message: "Avatar removed" });
  } catch (error) {
    console.error("Error removing avatar:", error);
    res.status(500).json({ error: "Failed to remove avatar" });
  }
}

export async function deleteAccount(req: AuthRequest, res: Response) {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user!.userId));
    if (!user) return res.status(404).json({ error: "User not found" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    // Related rows (todos, habits, reminders, goals, modes, etc.) cascade on
    // delete via their user_id foreign keys.
    await db.delete(users).where(eq(users.id, req.user!.userId));

    if (user.avatarKey) {
      await deleteAvatarFromR2(user.avatarKey).catch((err) =>
        console.error("Failed to delete avatar from storage:", err)
      );
    }

    res.json({ message: "Account deleted" });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ error: "Failed to delete account" });
  }
}
