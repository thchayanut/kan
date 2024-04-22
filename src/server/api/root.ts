import { authRouter } from "~/server/api/routers/auth";
import { boardRouter } from "~/server/api/routers/board";
import { cardRouter } from "~/server/api/routers/card";
import { labelRouter } from "~/server/api/routers/label";
import { listRouter } from "~/server/api/routers/list";
import { importRouter } from "~/server/api/routers/import";
import { workspaceRouter } from "~/server/api/routers/workspace";
import { createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  board: boardRouter,
  card: cardRouter,
  label: labelRouter,
  list: listRouter,
  import: importRouter,
  workspace: workspaceRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
// export const createCaller = createCallerFactory(appRouter);
