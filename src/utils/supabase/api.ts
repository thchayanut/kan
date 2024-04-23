import {
  createServerClient,
  type CookieOptions,
  serialize,
} from "@supabase/ssr";
import { type NextApiRequest, type NextApiResponse } from "next";
import { type Database } from "~/types/database.types";

export default function createClient(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies[name];
        },
        set(name: string, value: string, options: CookieOptions) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
          res.appendHeader("Set-Cookie", serialize(name, value, options));
        },
        remove(name: string, options: CookieOptions) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
          res.appendHeader("Set-Cookie", serialize(name, "", options));
        },
      },
    },
  );

  return supabase;
}
