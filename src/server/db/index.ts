import { sql } from '@vercel/postgres'
import { drizzle } from 'drizzle-orm/vercel-postgres'
import { createClient } from '@supabase/supabase-js'
import { type Database } from "~/types/database.types";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl!, supabaseKey!);

import * as schema from "./schema";

export const db = drizzle(sql, { schema })
