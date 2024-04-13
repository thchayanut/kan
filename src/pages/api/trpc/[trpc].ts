import { NextApiRequest, NextApiResponse } from 'next';
import { createNextApiHandler, CreateNextContextOptions } from "@trpc/server/adapters/next";

import { env } from "~/env.mjs";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";


const nextApiHandler = createNextApiHandler({
  router: appRouter,
  createContext: createTRPCContext,
  onError:
    env.NODE_ENV === "development"
      ? ({ path, error }) => {
          console.error(
            `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`
          );
        }
      : undefined,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {

  return nextApiHandler(req, res);
}

// export const runtime = "edge";
// export const preferredRegion = 'lhr1';
// export const dynamic = 'force-dynamic'

