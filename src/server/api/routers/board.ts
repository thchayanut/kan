import { z } from "zod";
import { generateUID } from "~/utils/generateUID";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const boardRouter = createTRPCRouter({
  all: protectedProcedure
    .input(z.object({ workspacePublicId: z.string().min(12) }))
    .query(async ({ ctx, input }) => {
      const workspace = await ctx.db
        .from("workspace")
        .select(`id`)
        .eq("publicId", input.workspacePublicId)
        .limit(1)
        .single();

      if (!workspace.data) return;

      const { data } = await ctx.db
        .from("board")
        .select(`publicId, name`)
        .is("deletedAt", null)
        .eq("workspaceId", workspace.data.id);

      return data;
    }),
  byId: protectedProcedure
    .input(z.object({ id: z.string().min(12) }))
    .query(async ({ ctx, input }) => {
      const { data } = await ctx.db
        .from("board")
        .select(
          `
            publicId,
            name,
            workspace (
              publicId,
              members:workspace_members (
                publicId,
                user (
                  name
                )
              )
            ),
            labels:label (
              publicId,
              name,
              colourCode
            ),
            lists:list (
              publicId,
              name,
              boardId,
              index,
              cards:card (
                publicId,
                title,
                description,
                listId,
                index,
                labels:label (
                  publicId,
                  name,
                  colourCode
                ),
                members:workspace_members (
                  publicId,
                  user (
                    name
                  )
                )
              )
            )
          `,
        )
        .eq("publicId", input.id)
        .is("deletedAt", null)
        .is("lists.deletedAt", null)
        .is("lists.cards.deletedAt", null)
        .order("index", { foreignTable: "list", ascending: true })
        .order("index", { foreignTable: "list.card", ascending: true })
        .limit(1)
        .single();

      return data;
    }),
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        workspacePublicId: z.string().min(12),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;

      if (!userId) return;

      const workspace = await ctx.db
        .from("workspace")
        .select(`id`)
        .eq("publicId", input.workspacePublicId)
        .limit(1)
        .single();

      if (!workspace.data) return;

      const { data } = await ctx.db
        .from("board")
        .insert({
          publicId: generateUID(),
          name: input.name,
          createdBy: userId,
          workspaceId: workspace.data.id,
        })
        .select(`publicId, name`);

      return data;
    }),
  update: protectedProcedure
    .input(
      z.object({
        boardId: z.string().min(12),
        name: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { data } = await ctx.db
        .from("board")
        .update({ name: input.name })
        .eq("publicId", input.boardId);

      return data;
    }),
  delete: protectedProcedure
    .input(
      z.object({
        boardPublicId: z.string().min(12),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;

      const board = await ctx.db
        .from("board")
        .select(`id, lists:list (id)`)
        .eq("publicId", input.boardPublicId)
        .limit(1)
        .single();

      if (!board.data) return;

      const listIds = board.data.lists.map((list) => list.id);

      const deletedAt = new Date().toISOString();

      await ctx.db
        .from("board")
        .update({ deletedAt, deletedBy: userId })
        .eq("id", board.data.id)
        .is("deletedAt", null);

      if (listIds.length) {
        await ctx.db
          .from("list")
          .update({ deletedAt, deletedBy: userId })
          .eq("boardId", board.data.id)
          .is("deletedAt", null);

        await ctx.db
          .from("card")
          .update({ deletedAt, deletedBy: userId })
          .in("listId", listIds)
          .is("deletedAt", null);
      }
    }),
});
