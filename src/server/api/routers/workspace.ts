import { z } from "zod";
import { generateUID } from "~/utils/generateUID";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const workspaceRouter = createTRPCRouter({
  all: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;

    if (!userId) return;

    const { data } = await ctx.db
      .from("workspace_members")
      .select(
        `
          role,
          workspace (
            publicId,
            name
          )
        `,
      )
      .eq("userId", userId)
      .is("deletedAt", null);

    return data;
  }),
  byId: protectedProcedure
    .input(z.object({ publicId: z.string().min(12) }))
    .query(async ({ ctx, input }) => {
      const { data } = await ctx.db
        .from("workspace")
        .select(
          `
            publicId,
            members: workspace_members (
              publicId,
              role,
              user (
                id,
                name,
                email
              )
            )
          `,
        )
        .eq("publicId", input.publicId)
        .is("deletedAt", null)
        .limit(1)
        .single();

      return data;
    }),
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;

      if (!userId) return;

      const workspace = await ctx.db
        .from("workspace")
        .insert({
          publicId: generateUID(),
          name: input.name,
          slug: input.name.toLowerCase(),
          createdBy: userId,
        })
        .select(`id, publicId, name`)
        .limit(1)
        .single();

      const newWorkspaceId = workspace.data?.id;

      if (!newWorkspaceId) return;

      await ctx.db.from("workspace_members").insert({
        publicId: generateUID(),
        userId,
        workspaceId: newWorkspaceId,
        createdBy: userId,
        role: "admin",
      });

      const newWorkspace = { ...workspace.data };

      delete newWorkspace.id;

      return newWorkspace;
    }),
});
