/**
 * Database Schema for Droply
 *
 * This file defines the database structure for our Droply application.
 * We're using Drizzle ORM with PostgreSQL (via Neon) for our database.
 */

import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { permission } from "process";

/**
 * Users Table
 * 
 * This table stores user information, synced with Clerk.
 */
export const users = pgTable("users", {
  id: text("id").primaryKey(), // User ID from Clerk
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Files Table
 *
 * This table stores all files and folders in our Droply.
 * - Both files and folders are stored in the same table
 * - Folders are identified by the isFolder flag
 * - Files/folders can be nested using the parentId (creating a tree structure)
 */
export const files = pgTable("files", {
  // Unique identifier for each file/folder
  id: uuid("id").defaultRandom().primaryKey(),

  // Basic file/folder information
  name: text("name").notNull(),
  path: text("path").notNull(), // Full path to the file/folder
  size: integer("size").notNull(), // Size in bytes (0 for folders)
  type: text("type").notNull(), // MIME type for files, "folder" for folders

  // Storage information
  fileUrl: text("file_url").notNull(), // URL to access the file
  thumbnailUrl: text("thumbnail_url"), // Optional thumbnail for images/documents

  // Ownership and hierarchy
  userId: text("user_id").notNull(), // Owner of the file/folder
  parentId: uuid("parent_id"), // Parent folder ID (null for root items)

  // File/folder flags
  isFolder: boolean("is_folder").default(false).notNull(), // Whether this is a folder
  isStarred: boolean("is_starred").default(false).notNull(), // Starred/favorite items
  isTrashed: boolean("is_trashed").default(false).notNull(), // Items in trash

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/** File Shares Table
 *
 * This table manages shared file links and their permissions.
 */

export const fileShares = pgTable(
  "file_shares",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    fileId: uuid("file_id").notNull(),

    ownerId: text("owner_id").notNull(),

    token: text("token").notNull().unique(),

    permission: text("permission").notNull().default("view"),

    expiresAt: timestamp("expires_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    fileIdx: index("file_shares_file_id_idx").on(table.fileId),
    tokenIdx: index("file_shares_token_idx").on(table.token),
  })
);

/**
 * File Relations
 *
 * This defines the relationships between records in our files table:
 * 1. parent - Each file/folder can have one parent folder
 * 2. children - Each folder can have many child files/folders
 *
 * This creates a hierarchical file structure similar to a real filesystem.
 */
export const filesRelations = relations(files, ({ one }) => ({
  owner: one(users, {
    fields: [files.userId],
    references: [users.id],
  }),

  parent: one(files, {
    fields: [files.parentId],
    references: [files.id],
    relationName: "folderTree",
  }),
}));

/**
 * User Relations
 * 
 * This defines the relationship between users and files.
 */
export const usersRelations = relations(users, ({ many }) => ({
  files: many(files),
}));



/**
 * Type Definitions
 *
 * These types help with TypeScript integration:
 * - File: Type for retrieving file data from the database
 * - NewFile: Type for inserting new file data into the database
 */




export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;