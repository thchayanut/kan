import { z } from "zod";
import { generateUID } from "~/utils/generateUID";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const listRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        boardPublicId: z.string().min(12),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;

      if (!userId) return;

      const board = await ctx.db
        .from("board")
        .select(`id, lists:list (index)`)
        .eq("publicId", input.boardPublicId)
        .order("index", { foreignTable: "list", ascending: false })
        .is("list.deletedAt", null)
        .limit(1)
        .single();

      if (!board.data) return;

      const latestListIndex = board.data.lists[0]?.index;

      const { data } = await ctx.db.from("list").insert({
        publicId: generateUID(),
        name: input.name,
        createdBy: userId,
        boardId: board.data.id,
        index: latestListIndex ? latestListIndex + 1 : 0,
      }).select(`
          publicId,
          name
        `);

      return data;
    }),
  reorder: protectedProcedure
    .input(
      z.object({
        boardId: z.string().min(12),
        listId: z.string().min(12),
        currentIndex: z.number(),
        newIndex: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const list = await ctx.db
        .from("list")
        .select(`id, boardId`)
        .eq("publicId", input.listId)
        .limit(1)
        .single();

      if (!list?.data) return;

      const { data } = await ctx.db.rpc("reorder_lists", {
        board_id: list.data.boardId,
        list_id: list.data.id,
        current_index: input.currentIndex,
        new_index: input.newIndex,
      });

      return data;
    }),
  delete: protectedProcedure
    .input(
      z.object({
        listPublicId: z.string().min(12),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;

      const list = await ctx.db
        .from("list")
        .select(`id, boardId, index`)
        .eq("publicId", input.listPublicId)
        .limit(1)
        .single();

      if (!list.data) return;

      const deletedAt = new Date().toISOString();

      await ctx.db
        .from("list")
        .update({ deletedAt, deletedBy: userId })
        .eq("id", list.data.id)
        .is("deletedAt", null);

      await ctx.db
        .from("card")
        .update({ deletedAt, deletedBy: userId })
        .eq("listId", list.data.id)
        .is("deletedAt", null);

      const { data } = await ctx.db.rpc("shift_list_index", {
        board_id: list.data.boardId,
        list_index: list.data.index,
      });

      return data;
    }),
  update: protectedProcedure
    .input(
      z.object({
        listPublicId: z.string().min(12),
        name: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { data } = await ctx.db
        .from("list")
        .update({ name: input.name })
        .eq("publicId", input.listPublicId)
        .is("deletedAt", null)
        .select(`publicId, name`);

      return data;
    }),
});
