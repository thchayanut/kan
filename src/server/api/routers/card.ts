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
      .mutation(({ ctx, input }) => {
        const userId = ctx.user?.id;

        if (!userId) return;

        return ctx.db.transaction(async (tx) => {
          const card = await tx.query.cards.findFirst({
            where: and(eq(cards.publicId, input.cardPublicId), isNull(cards.deletedAt)),
          });

          const label = await tx.query.labels.findFirst({
            where: eq(labels.publicId, input.labelPublicId),
          });
          
          if (!card || !label) return;

          const labelExists = await tx.query.cardsToLabels.findFirst({
            where: and(eq(cardsToLabels.cardId, card.id), eq(cardsToLabels.labelId, label.id)),
          });

          if (labelExists) {
            return tx.delete(cardsToLabels).where(and(eq(cardsToLabels.cardId, card.id), eq(cardsToLabels.labelId, label.id)),);
          }

          return tx.insert(cardsToLabels).values({
            cardId: card.id,
            labelId: label.id,
          });
        })
      }),
    addOrRemoveMember: publicProcedure
      .input(
        z.object({
          cardPublicId: z.string().min(12),
          workspaceMemberPublicId: z.string().min(12),
        }),
      )
      .mutation(({ ctx, input }) => {
        const userId = ctx.user?.id;

        if (!userId) return;

        return ctx.db.transaction(async (tx) => {
          const card = await tx.query.cards.findFirst({
            where: and(eq(cards.publicId, input.cardPublicId), isNull(cards.deletedAt)),
          });

          const member = await tx.query.workspaceMembers.findFirst({
            where: eq(workspaceMembers.publicId, input.workspaceMemberPublicId),
          });
          
          if (!card || !member) return;

          const memberExists = await tx.query.cardToWorkspaceMembers.findFirst({
            where: and(eq(cardToWorkspaceMembers.cardId, card.id), eq(cardToWorkspaceMembers.workspaceMemberId, member.id)),
          });

          if (memberExists) {
            return tx.delete(cardToWorkspaceMembers).where(and(eq(cardToWorkspaceMembers.cardId, card.id), eq(cardToWorkspaceMembers.workspaceMemberId, member.id)),);
          }

          return tx.insert(cardToWorkspaceMembers).values({
            cardId: card.id,
            workspaceMemberId: member.id,
          });
        })
      }),
    byId: publicProcedure
      .input(z.object({ id: z.string().min(12) }))
      .query(({ ctx, input }) => 
        ctx.db.query.cards.findFirst({
          with: {
            labels: {
              columns: {
                labelId: false,
                cardId: false,
              },
              with: {
                label: {
                  columns: {
                    publicId: true,
                    name: true,
                    colourCode: true,
                  }
                },
              }
            },
            list: {
              columns: {
                publicId: true,
              },
              with: {
                board: {
                  columns: {
                    publicId: true,
                    name: true,
                  },
                  with: {
                    labels: {
                      columns: {
                        publicId: true,
                        colourCode: true,
                        name: true,
                      }
                    },
                    lists: {
                      columns: {
                        publicId: true,
                        name: true,
                      },
                      where: isNull(lists.deletedAt)
                    },
                    workspace: {
                      columns: {
                        publicId: true,
                      },
                      with: {
                        members: {
                          columns: {
                            publicId: true,
                          },
                          with: {
                            user: {
                              columns: {
                                id: true,
                                name: true,
                              }
                            }
                          }
                        }
                      }
                    }
                  },
                }
              }
            },
            members: {
              columns: {
                workspaceMemberId: false,
                cardId: false,
              },
              with: {
                member: {
                  columns: {
                    publicId: true,
                  },
                  with: {
                    user: {
                      columns: {
                        id: true,
                        name: true,
                      }
                    }
                  }
                },
              }
            },
          },
          where: and(eq(cards.publicId, input.id), isNull(cards.deletedAt)),
        })
      ),
    update: publicProcedure
      .input(
        z.object({ 
          cardId: z.string().min(12),
          title: z.string().min(1),
          description: z.string(),
        }))
      .mutation(({ ctx, input }) => {
        const userId = ctx.user?.id;

        if (!userId) return;

        return ctx.db.update(cards).set({ title: input.title, description: input.description }).where(and(eq(cards.publicId, input.cardId), isNull(cards.deletedAt)));
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