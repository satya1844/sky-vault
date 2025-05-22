import {pgTable, text,uniqueIndex, integer, boolean} from "drizzle-orm/pg-core"
import {relations} from "drizzle-orm";
import { timestamp, uuid } from "drizzle-orm/gel-core";

export const files = pgTable("files", {
  id: uuid("id").defaultRandom().primaryKey(),
  //basic file/folder info
  name: text("name").notNull(),
  path: text("path").notNull(), //doc/prj/resume
  size: integer("size").notNull(),
  type: text("type").notNull(),//folder
  // createdAt: text("created_at").notNull(),
  // updatedAt: text("updated_at").notNull(),


  //storage info
   fileUrl : text("file_url").notNull(), //url to access file
   thumbnialUrl : text("thumbnial_url"),

   //Ownership info
   userId : text("user_id").notNull(),
   parentId : uuid("parent_id"), //parent folder (if null for root items)

   //file/folder flags
   isFolder : boolean("is_folder").notNull().default(false),
   isStarred : boolean("is_starred").notNull().default(false),
   isTrashed : boolean("is_trashed").notNull().default(false),

   //Time Stamps
   createdAt : timestamp("created_at").defaultNow().notNull(),
   updatedAt : timestamp("updated_at").defaultNow().notNull(),
   
});


/*
parent :eaech file/folder can have one parent folder 

children : each folder can have many child file/folder
*/

export const filesRelations = relations(files,({one, many})=>({
  parent: one(files, {
    fields:[files.parentId],
    references:[files.id]
  }),

 //relationship tp child files/folder
  children: many(files)
}))

//type definitions

export const  File = typeof files.$inferSelect;
export const  NewFile = typeof files.$inferInsert;