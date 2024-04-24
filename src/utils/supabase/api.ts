import {
  createServerClient,
  type CookieOptions,
  serialize,
} from "@supabase/ssr";
import { RequestCookies } from "@edge-runtime/cookies";
import { type Database } from "~/types/database.types";

import { type NextApiRequest, type NextApiResponse } from "next";

export function createNextClient(req: NextApiRequest, res: NextApiResponse) {
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

export function createTRPCClient(req: Request, resHeaders: Headers) {
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookies = new RequestCookies(req.headers);
          return cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
          resHeaders.set("Set-Cookie", serialize(name, value, options));
        },
        remove(name: string, options: CookieOptions) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
          resHeaders.set("Set-Cookie", serialize(name, "", options));
        },
      },
    },
  );

  return supabase;
}
