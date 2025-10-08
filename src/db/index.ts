import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { modes } from "./schema";

export const db = drizzle(process.env.DATABASE_URL!);

// Helper function to convert minutes to milliseconds
const minToMilli = (minutes: number): number => minutes * 60 * 1000;

// Default modes that should be created for each user
const defaultModes = [
  {
    name: "Standard",
    focusTime: minToMilli(25),
    shortBreak: minToMilli(5),
    longBreak: minToMilli(15),
  },
  {
    name: "Extended",
    focusTime: minToMilli(45),
    shortBreak: minToMilli(10),
    longBreak: minToMilli(25),
  },
  {
    name: "Long run",
    focusTime: minToMilli(90),
    shortBreak: minToMilli(25),
    longBreak: minToMilli(45),
  },
];

// Function to seed default modes for a user
export async function seedDefaultModesForUser(userId: number): Promise<void> {
  try {
    const modesData = defaultModes.map((mode) => ({
      ...mode,
      userId,
    }));

    await db.insert(modes).values(modesData);
    console.log(`Seeded default modes for user ${userId}`);
  } catch (error) {
    console.error(`Error seeding default modes for user ${userId}:`, error);
    throw error;
  }
}
