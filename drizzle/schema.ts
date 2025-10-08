import { pgTable, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const reminderPriority = pgEnum("reminder_priority", ['low', 'medium', 'high'])
export const todoStatus = pgEnum("todo_status", ['TODO', 'In Progress', 'Done', 'Kill'])



