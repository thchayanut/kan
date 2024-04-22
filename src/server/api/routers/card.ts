import { z } from "zod";
import { generateUID } from "~/utils/generateUID";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const cardRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        listPublicId: z.string().min(12),
        labelsPublicIds: z.array(z.string().min(12)),
        memberPublicIds: z.array(z.string().min(12)),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;

      if (!userId) return;

      const list = await ctx.db
        .from("list")
        .select(`id, cards:card (index)`)
        .eq("publicId", input.listPublicId)
        .order("index", { foreignTable: "card", ascending: false })
        .limit(1)
        .single();

      if (!list.data?.id) return;

      const latestCard = list.data.cards.length && list.data.cards[0];

      const newCard = await ctx.db
        .from("card")
        .insert({
          publicId: generateUID(),
          title: input.title,
          createdBy: userId,
          listId: list.data.id,
          index: latestCard ? latestCard.index + 1 : 0,
        })
        .select(`id`)
        .limit(1)
        .single();

      const newCardId = newCard.data?.id;

      if (newCardId && input.labelsPublicIds.length) {
        const labels = await ctx.db
          .from("label")
          .select(`id`)
          .eq("publicId", input.labelsPublicIds);

        if (!labels.data?.length) return;

        const labelsInsert = labels.data.map((label) => ({
          cardId: newCardId,
          labelId: label.id,
        }));

        await ctx.db.from("_card_labels").insert(labelsInsert);
      }

      if (newCardId && input.memberPublicIds.length) {
        const members = await ctx.db
          .from("workspace_members")
          .select(`id`)
          .eq("publicId", input.memberPublicIds);

        if (!members.data?.length) return;

        const membersInsert = members.data.map((member) => ({
          cardId: newCardId,
          workspaceMemberId: member.id,
        }));

        await ctx.db.from("_card_workspace_members").insert(membersInsert);
      }

      return newCard;
    }),
  addOrRemoveLabel: protectedProcedure
    .input(
      z.object({
        cardPublicId: z.string().min(12),
        labelPublicId: z.string().min(12),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;

      if (!userId) return;

      const card = await ctx.db
        .from("card")
        .select(`id`)
        .eq("publicId", input.cardPublicId)
        .limit(1)
        .single();

      const label = await ctx.db
        .from("label")
        .select(`id`)
        .eq("publicId", input.labelPublicId)
        .limit(1)
        .single();

      if (!card.data || !label.data) return;

      const existingLabel = await ctx.db
        .from("_card_labels")
        .select()
        .eq("cardId", card.data.id)
        .eq("labelId", label.data.id)
        .limit(1)
        .single();

      if (existingLabel.data) {
        await ctx.db
          .from("_card_labels")
          .delete()
          .eq("cardId", card.data.id)
          .eq("labelId", label.data.id);

        return { newLabel: false };
      }

      await ctx.db.from("_card_labels").insert({
        cardId: card.data.id,
        labelId: label.data.id,
      });

      return { newLabel: true };
    }),
  addOrRemoveMember: protectedProcedure
    .input(
      z.object({
        cardPublicId: z.string().min(12),
        workspaceMemberPublicId: z.string().min(12),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;

      if (!userId) return;

      const card = await ctx.db
        .from("card")
        .select(`id`)
        .eq("publicId", input.cardPublicId)
        .limit(1)
        .single();

      const member = await ctx.db
        .from("workspace_members")
        .select(`id`)
        .eq("publicId", input.workspaceMemberPublicId)
        .limit(1)
        .single();

      if (!card.data || !member.data) return;

      const existingMember = await ctx.db
        .from("_card_workspace_members")
        .select()
        .eq("cardId", card.data.id)
        .eq("workspaceMemberId", member.data.id)
        .limit(1)
        .single();

      if (existingMember.data) {
        await ctx.db
          .from("_card_workspace_members")
          .delete()
          .eq("cardId", card.data.id)
          .eq("workspaceMemberId", member.data.id);

        return { newMember: false };
      }

      await ctx.db.from("_card_workspace_members").insert({
        cardId: card.data.id,
        workspaceMemberId: member.data.id,
      });

      return { newMember: true };
    }),
  byId: protectedProcedure
    .input(z.object({ id: z.string().min(12) }))
    .query(async ({ ctx, input }) => {
      const { data } = await ctx.db
        .from("card")
        .select(
          `
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
          `,
        )
        .eq("publicId", input.id)
        .is("deletedAt", null)
        .is("list.board.lists.deletedAt", null)
        .limit(1)
        .single();

      return data;
    }),
  update: protectedProcedure
    .input(
      z.object({
        cardId: z.string().min(12),
        title: z.string().min(1),
        description: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;

      if (!userId) return;

      const { data } = await ctx.db
        .from("card")
        .update({ title: input.title, description: input.description })
        .eq("publicId", input.cardId)
        .is("deletedAt", null);

      return data;
    }),
  delete: protectedProcedure
    .input(
      z.object({
        cardPublicId: z.string().min(12),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;

      if (!userId) return;

      const card = await ctx.db
        .from("card")
        .select(`id, index, listId`)
        .eq("publicId", input.cardPublicId)
        .limit(1)
        .single();

      if (!card.data) return;

      const deletedAt = new Date().toISOString();

      await ctx.db
        .from("card")
        .update({ deletedAt, deletedBy: userId })
        .eq("publicId", input.cardPublicId);

      await ctx.db
        .from("card")
        .update({ deletedAt, deletedBy: userId })
        .eq("publicId", input.cardPublicId);

      await ctx.db.rpc("shift_card_index", {
        list_id: card.data.listId,
        card_index: card.data.index,
      });
    }),
  reorder: protectedProcedure
    .input(
      z.object({
        cardId: z.string().min(12),
        newListId: z.string().min(12),
        newIndex: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;

      if (!userId) return;

      const card = await ctx.db
        .from("card")
        .select(`id, index, list (id)`)
        .eq("publicId", input.cardId)
        .is("deletedAt", null)
        .limit(1)
        .single();

      if (!card.data) return;

      const currentList = card.data.list;
      const currentIndex = card.data.index;

      let newIndex = input.newIndex;

      const newList = await ctx.db
        .from("list")
        .select(`id, cards:card (index)`)
        .eq("publicId", input.newListId)
        .is("deletedAt", null)
        .order("index", { foreignTable: "card", ascending: false })
        .limit(1)
        .single();

      if (!newList.data) return;

      if (newIndex === undefined) {
        const lastCardIndex = newList.data.cards.length
          ? newList.data.cards[0]?.index
          : undefined;

        newIndex = lastCardIndex !== undefined ? lastCardIndex + 1 : 0;
      }

      if (!currentList?.id || !newList?.data.id) return;

      const { error } = await ctx.db.rpc("reorder_cards", {
        current_list_id: currentList.id,
        new_list_id: newList.data.id,
        current_index: currentIndex,
        new_index: newIndex,
        card_id: card.data.id,
      });

      return { success: !!error };
    }),
});
