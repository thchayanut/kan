import { TRPCError } from "@trpc/server";
import { z } from "zod";

import * as cardRepo from "@kan/db/repository/card.repo";
import * as checklistRepo from "@kan/db/repository/checklist.repo";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { assertUserInWorkspace } from "../utils/auth";

const checklistSchema = z.object({
  publicId: z.string(),
  title: z.string(),
});

export const checklistRouter = createTRPCRouter({
  create: protectedProcedure
    .meta({
      openapi: {
        summary: "Add a checklist to a card",
        method: "POST",
        path: "/cards/{cardPublicId}/checklists",
        description: "Adds a checklist to a card",
        tags: ["Cards"],
        protect: true,
      },
    })
    .input(
      z.object({
        cardPublicId: z.string().min(12),
        title: z.string().min(1),
      }),
    )
    .output(checklistSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;

      if (!userId)
        throw new TRPCError({
          message: `User not authenticated`,
          code: "UNAUTHORIZED",
        });

      const card = await cardRepo.getWorkspaceAndCardIdByCardPublicId(
        ctx.db,
        input.cardPublicId,
      );

      if (!card)
        throw new TRPCError({
          message: `Card with public ID ${input.cardPublicId} not found`,
          code: "NOT_FOUND",
        });

      await assertUserInWorkspace(ctx.db, userId, card.workspaceId);

      const newChecklist = await checklistRepo.create(ctx.db, {
        title: input.title,
        createdBy: userId,
        cardId: card.id,
      });

      if (!newChecklist?.id)
        throw new TRPCError({
          message: `Failed to create checklist`,
          code: "INTERNAL_SERVER_ERROR",
        });

      // await cardActivityRepo.create(ctx.db, {
      //   type: "card.updated.checklist.added" as const,
      //   cardId: card.id,
      //   checklistId: newChecklist.id,
      //   toChecklist: newChecklist.title,
      //   createdBy: userId,
      // });

      return newChecklist;
    }),
  // update: protectedProcedure
  //   .meta({
  //     openapi: {
  //       summary: "Update a checklist",
  //       method: "PUT",
  //       path: "/cards/{cardPublicId}/checklists/{checklistPublicId}",
  //       description: "Updates a checklist",
  //       tags: ["Cards"],
  //       protect: true,
  //     },
  //   })
  //   .input(
  //     z.object({
  //       cardPublicId: z.string().min(12),
  //       checklistPublicId: z.string().min(12),
  //       title: z.string().min(1),
  //     }),
  //   )
  //   .output(checklistSchema)
  //   .mutation(async ({ ctx, input }) => {

  //   }),
  // delete: protectedProcedure
  //   .meta({
  //     openapi: {
  //       summary: "Delete a checklist",
  //       method: "DELETE",
  //       path: "/cards/{cardPublicId}/checklists/{checklistPublicId}",
  //       description: "Deletes a checklist",
  //       tags: ["Cards"],
  //     },
  //   })
  //   .input(
  //     z.object({
  //       cardPublicId: z.string().min(12),
  //       checklistPublicId: z.string().min(12),
  //     }),
  //   )
  //   .output(checklistSchema)
  //   .mutation(async ({ ctx, input }) => {

  //   }),
});
