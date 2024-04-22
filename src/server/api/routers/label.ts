import { z } from "zod";
import { generateUID } from "~/utils/generateUID";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const labelRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(36),
        cardPublicId: z.string().min(12),
        colourCode: z.string().length(7),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;

      if (!userId) return;

      const card = await ctx.db
        .from("card")
        .select(`id, list (boardId)`)
        .eq("publicId", input.cardPublicId)
        .is("deletedAt", null)
        .limit(1)
        .single();

      if (!card.data?.list) return;

      const newLabel = await ctx.db
        .from("label")
        .insert({
          publicId: generateUID(),
          name: input.name,
          colourCode: input.colourCode,
          createdBy: userId,
          boardId: card.data.list.boardId,
        })
        .select(`id`)
        .limit(1)
        .single();

      if (!newLabel.data) return;

      await ctx.db.from("_card_labels").insert({
        cardId: card.data.id,
        labelId: newLabel.data.id,
      });

      return newLabel.data;
    }),
});
