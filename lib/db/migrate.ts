import { migrate } from "drizzle-orm/neon-http/migrator";
import {drizzle} from "drizzle-orm/neon-http";
import {neon} from "@neondatabase/serverless";


import * as dotenv from "dotenv";

dotenv.config({path: ".env.local"});

if(!process.env.DATABASE_URL){
  throw new Error("DATABASE_URL is not set in .Environment");
}

async function runMigration() {
  try{
    const sql = neon(process.env.DATABASE_URL!);
    const db = drizzle(sql );

    await migrate(db, {migrationsFolder: "drizzle"});
    console.log("all migrations are sucessfully done");
  }catch(error){
    console.log("all migrations are NOT  sucessfully done");
    process.exit(1);
  }
  
}