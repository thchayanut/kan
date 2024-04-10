import { z } from "zod";
import { and, eq, asc, isNull, inArray } from "drizzle-orm";

import { boards, cards, lists, workspaces } from "~/server/db/schema";
import { generateUID } from "~/utils/generateUID";

import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";

export const boardRouter = createTRPCRouter({
  all: publicProcedure
    .input(z.object({ workspacePublicId: z.string().min(12) }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user.id;

      // @todo: validate user has access to workspace

      // if (!userId) return

      // const workspace = await ctx.db.query.workspaces.findFirst({
      //   where: eq(workspaces.publicId, input.workspacePublicId),
      // })

      // if (!workspace) return;

      const { data, error } = await ctx.supabase.from('board').select(`
        publicId,
        name
      `).is('deletedAt', null);

      return data;
    }),
  byId: publicProcedure
    .input(z.object({ id: z.string().min(12) }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase.from('board').select(`
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
      `)
      .eq('publicId', input.id)
      .is('deletedAt', null)
      .is('lists.deletedAt', null)
      .is('lists.cards.deletedAt', null)
      .order('index', { foreignTable: 'list', ascending: true })
      .order('index', { foreignTable: 'list.card', ascending: true })
      .limit(1)
      .single()

      return data;
    }),
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        workspacePublicId: z.string().min(12)
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user.id;

      if (!userId) return;

      const workspace = await ctx.db.query.workspaces.findFirst({
        where: eq(workspaces.publicId, input.workspacePublicId),
      })

      if (!workspace) return;

      return ctx.db.insert(boards).values({
        publicId: generateUID(),
        name: input.name,
        createdBy: userId,
        workspaceId: workspace.id
      });
    }),
    update: publicProcedure
      .input(
        z.object({ 
          boardId: z.string().min(12),
          name: z.string().min(1),
        }))
      .mutation(({ ctx, input }) => {
        const userId = ctx.session?.user.id;

        if (!userId) return;

        return ctx.db.update(boards).set({ name: input.name }).where(eq(boards.publicId, input.boardId));
      }),
    delete: publicProcedure
      .input(
        z.object({ 
          boardPublicId: z.string().min(12),
        }))
      .mutation(({ ctx, input }) => {
        const userId = ctx.session?.user.id;
  
        if (!userId) return;
  
        return ctx.db.transaction(async (tx) => {
          const board = await tx.query.boards.findFirst({
            where: eq(boards.publicId, input.boardPublicId),
            with: {
              lists: true,
            }
          })
  
          if (!board) return;

          const listIds = board.lists.map((list) => list.id)
  
          await tx.update(boards).set({ deletedAt: new Date(), deletedBy: userId }).where(eq(boards.id, board.id));

          if (listIds.length) {
            await tx.update(lists).set({ deletedAt: new Date(), deletedBy: userId }).where(eq(lists.boardId, board.id));
            await tx.update(cards).set({ deletedAt: new Date(), deletedBy: userId }).where(inArray(cards.listId, listIds));
          }
        })
      }),
});
