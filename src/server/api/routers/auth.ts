import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(z.object({ email: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { data } = await ctx.db.auth.signInWithOtp({
        email: input.email,
        options: {
          emailRedirectTo: "/boards",
        },
      });

      return data;
    }),
});
