import { z } from "zod";
import { and, desc, eq, isNull, inArray, sql } from "drizzle-orm";

import { cards, cardsToLabels, cardToWorkspaceMembers, labels, lists, workspaceMembers } from "~/server/db/schema";
import { generateUID } from "~/utils/generateUID";

import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";

export const cardRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        title: z.string().min(1),
        listPublicId: z.string().min(12),
        labelsPublicIds: z.array(z.string().min(12)),
        memberPublicIds: z.array(z.string().min(12))
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;

      if (!userId) return;

      const list = await ctx.supabase
        .from('list')
        .select(`id, cards:card (index)`)
        .eq('publicId', input.listPublicId)
        .order('index', { foreignTable: 'card', ascending: false })
        .limit(1)
        .single();

      if (!list.data?.id) return;

      const latestCard = list.data.cards.length && list.data.cards[0]

      const newCard = await ctx.supabase
        .from('card')
        .insert({
          publicId: generateUID(),
          title: input.title,
          createdBy: userId,
          listId: list.data.id,
          index: latestCard ? latestCard.index + 1 : 0
        })
        .select(`id`)
        .limit(1)
        .single();

      const newCardId = newCard.data?.id;

      if (newCardId && input.labelsPublicIds.length) {
          const labels = await ctx.supabase
            .from('label')
            .select(`id`)
            .eq('publicId', input.labelsPublicIds);

        if (!labels.data?.length) return;

        const labelsInsert = labels.data.map((label) => ({ cardId: newCardId, labelId: label.id }));

        await ctx.supabase
          .from('_card_labels')
          .insert(labelsInsert);
      }

      if (newCardId && input.memberPublicIds.length) {
        const members = await ctx.supabase
          .from('workspace_members')
          .select(`id`)
          .eq('publicId', input.memberPublicIds);

        if (!members.data?.length) return;

        const membersInsert = members.data.map((member) => ({ cardId: newCardId, workspaceMemberId: member.id }));

        await ctx.supabase
          .from('_card_workspace_members')
          .insert(membersInsert);
      }

      return newCard;
    }),
    addOrRemoveLabel: publicProcedure
      .input(
        z.object({
          cardPublicId: z.string().min(12),
          labelPublicId: z.string().min(12),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id;

        if (!userId) return;

        const card = await ctx.supabase
          .from('card')
          .select(`id`)
          .eq('publicId', input.cardPublicId)
          .limit(1)
          .single();

        const label = await ctx.supabase
          .from('label')
          .select(`id`)
          .eq('publicId', input.labelPublicId)
          .limit(1)
          .single();

        if (!card.data || !label.data) return;

        const existingLabel = await ctx.supabase
          .from('_card_labels')
          .select()
          .eq('cardId', card.data.id)
          .eq('labelId', label.data.id)
          .limit(1)
          .single();

        if (existingLabel.data) {
          await ctx.supabase
            .from('_card_labels')
            .delete()
            .eq('cardId', card.data.id)
            .eq('labelId', label.data.id);

          return { newLabel: false };
        }

        await ctx.supabase
          .from('_card_labels')
          .insert({
            cardId: card.data.id,
            labelId: label.data.id,
          });

        return { newLabel: true };
      }),
    addOrRemoveMember: publicProcedure
      .input(
        z.object({
          cardPublicId: z.string().min(12),
          workspaceMemberPublicId: z.string().min(12),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id;

        if (!userId) return;

        const card = await ctx.supabase
          .from('card')
          .select(`id`)
          .eq('publicId', input.cardPublicId)
          .limit(1)
          .single();

        const member = await ctx.supabase
          .from('workspace_members')
          .select(`id`)
          .eq('publicId', input.workspaceMemberPublicId)
          .limit(1)
          .single();
        
        if (!card.data || !member.data) return;

        const existingMember = await ctx.supabase
          .from('_card_workspace_members')
          .select()
          .eq('cardId', card.data.id)
          .eq('workspaceMemberId', member.data.id)
          .limit(1)
          .single();

        if (existingMember.data) {
          await ctx.supabase
            .from('_card_workspace_members')
            .delete()
            .eq('cardId', card.data.id)
            .eq('workspaceMemberId', member.data.id);

          return { newMember: false };
        }

        await ctx.supabase
          .from('_card_workspace_members')
          .insert({
            cardId: card.data.id,
            workspaceMemberId: member.data.id,
          });

        return { newMember: true };
      }),
    byId: publicProcedure
      .input(z.object({ id: z.string().min(12) }))
      .query(async ({ ctx, input }) => {
        const { data } = await ctx.supabase
          .from('card')
          .select(`
            publicId,
            title,
            description,
            labels:label (
              publicId,
              name,
              colourCode
            ),
            list (
              publicId,
              name,
              board (
                publicId,
                name,
                labels:label (
                  publicId,
                  colourCode,
                  name
                ),
                lists:list (
                  publicId,
                  name
                ),
                workspace (
                  publicId,
                  members:workspace_members (
                    publicId,
                    user (
                      id,
                      name
                    )
                  )
                )
              )
            ),
            members:workspace_members (
              publicId,
              user (
                id,
                name
              )
            )
          `)
          .eq('publicId', input.id)
          .is('deletedAt', null)
          .is('list.board.lists.deletedAt', null)
          .limit(1)
          .single();

        return data;
      }),
    update: publicProcedure
      .input(
        z.object({ 
          cardId: z.string().min(12),
          title: z.string().min(1),
          description: z.string(),
        }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id;

        if (!userId) return;

        const { data } = await ctx.supabase
          .from('card')
          .update({ title: input.title, description: input.description })
          .eq('publicId', input.cardId)
          .is('deletedAt', null);

        return data;
      }),
    delete: publicProcedure
      .input(
        z.object({ 
          cardPublicId: z.string().min(12),
        }))
      .mutation(({ ctx, input }) => {
        const userId = ctx.user?.id;

        if (!userId) return;

        return ctx.db.transaction(async (tx) => {
          const card = await tx.query.cards.findFirst({
            where: eq(cards.publicId, input.cardPublicId),
          })

          if (!card) return;

          await tx.update(cards).set({ deletedAt: new Date(), deletedBy: userId}).where(eq(cards.publicId, input.cardPublicId));

          await tx.execute(sql`UPDATE ${cards} SET ${cards.index} = ${cards.index} - 1 WHERE ${cards.listId} = ${card.listId} AND ${cards.index} > ${card.index} AND ${cards.deletedAt} IS NULL;`);
        })
      }),
    reorder: publicProcedure
      .input(
        z.object({ 
          cardId: z.string().min(12),
          newListId: z.string().min(12),
          newIndex: z.number().optional(),
        }))
      .mutation(({ ctx, input }) => {
        const userId = ctx.user?.id;

        if (!userId) return;

        return ctx.db.transaction(async (tx) => {
          const card = await tx.query.cards.findFirst({
            with: {
              list: true,
            },
            where: and(eq(cards.publicId, input.cardId), isNull(cards.deletedAt)),
          });

          if (!card) return;

          const currentList = card.list;
          const currentIndex = card.index;
          
          let newIndex = input.newIndex;

          const newList = await tx.query.lists.findFirst({
            with: {
              cards: {
                orderBy: [desc(cards.index)],
                limit: 1,
              },
            },
            where: and(eq(lists.publicId, input.newListId), isNull(cards.deletedAt)),
          });

          if (!newList) return;

          if (newIndex === undefined) {
            const lastCardIndex = newList.cards.length ? newList.cards[0]?.index : undefined;

            newIndex = lastCardIndex !== undefined ? lastCardIndex + 1 : 0;
          }

          if (!currentList?.id || !newList?.id) return;


          if (currentList.id === newList.id) {
            await tx.execute(sql`
              UPDATE ${cards}
              SET index =
                CASE
                  WHEN ${cards.index} = ${currentIndex} THEN ${newIndex}
                  WHEN ${currentIndex} < ${newIndex} AND ${cards.index} > ${currentIndex} AND ${cards.index} <= ${newIndex} THEN ${cards.index} - 1
                  WHEN ${currentIndex} > ${newIndex} AND ${cards.index} >= ${newIndex} AND ${cards.index} < ${currentIndex} THEN ${cards.index} + 1
                  ELSE ${cards.index}
                END
              WHERE ${cards.listId} = ${currentList.id} AND ${cards.deletedAt} IS NULL;
            `);
          } else {
            await tx.execute(sql`UPDATE ${cards} SET index = index + 1 WHERE ${cards.listId} = ${newList.id} AND ${cards.index} >= ${newIndex} AND ${cards.deletedAt} IS NULL;`)

            await tx.execute(sql`UPDATE ${cards} SET index = index - 1 WHERE ${cards.listId} = ${currentList.id} AND ${cards.index} >= ${currentIndex} AND ${cards.deletedAt} IS NULL;`)

            await tx
              .update(cards)
              .set({ listId: newList.id, index: newIndex })
              .where(and(eq(cards.publicId, input.cardId), isNull(cards.deletedAt)));
          }
        })
      })
});