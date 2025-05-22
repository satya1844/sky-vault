import { pgTable, text, uniqueIndex, integer, boolean, uuid, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const files = pgTable("files", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Basic file/folder info
  name: text("name").notNull(),
  path: text("path").notNull(),
  size: integer("size").notNull(),
  type: text("type").notNull(),

  // Storage info
  fileUrl: text("file_url").notNull(),
  thumbnailUrl: text("thumbnail_url"), 

  // Ownership info
  userId: text("user_id").notNull(),
  parentId: uuid("parent_id"),

  // File/folder flags
  isFolder: boolean("is_folder").notNull().default(false),
  isStarred: boolean("is_starred").notNull().default(false),
  isTrashed: boolean("is_trashed").notNull().default(false),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const filesRelations = relations(files, ({ one, many }) => ({
  parent: one(files, {
    fields: [files.parentId],
    references: [files.id],
  }),
  children: many(files),
}));

// Type definitions
export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;
