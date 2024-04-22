import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

import { generateUID } from "~/utils/generateUID";

const TRELLO_API_URL = "https://api.trello.com/1";

interface TrelloBoard {
  id: string;
  name: string;
  lists: TrelloList[];
  cards: TrelloCard[];
}

interface TrelloList {
  id: string;
  name: string;
}

interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  idList: string;
}

interface MemberData {
  idBoards: string[];
}

export const importRouter = createTRPCRouter({
  trello: createTRPCRouter({
    getBoards: protectedProcedure
      .input(
        z.object({
          apiKey: z.string().length(32),
          token: z.string().length(76),
        }),
      )
      .query(async ({ input }) => {
        const fetchMemberRes = await fetch(
          `${TRELLO_API_URL}/tokens/${input.token}/member?key=${input.apiKey}`,
        );

        const member = (await fetchMemberRes.json()) as MemberData;

        const boardIds = member.idBoards;

        const fetchBoard = async (boardId: string) => {
          try {
            const response = await fetch(
              `${TRELLO_API_URL}/boards/${boardId}?key=${input.apiKey}&token=${input.token}`,
            );
            const data = (await response.json()) as TrelloBoard;

            return data;
          } catch (error) {
            throw error;
          }
        };

        const boards = [];

        for (const boardId of boardIds) {
          boards.push(Promise.resolve(fetchBoard(boardId)));
        }

        const boardDataArray = await Promise.all(boards);

        return boardDataArray.map((board) => ({
          id: board.id,
          name: board.name,
        }));
      }),
    importBoards: protectedProcedure
      .input(
        z.object({
          boardIds: z.array(z.string()),
          apiKey: z.string().length(32),
          token: z.string().length(76),
          workspacePublicId: z.string().min(12),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id;

        if (!userId) return;

        const newImport = await ctx.db
          .from("import")
          .insert({
            publicId: generateUID(),
            source: "trello",
            createdBy: userId,
            status: "started",
          })
          .select(`id`)
          .limit(1)
          .single();

        const newImportId = newImport.data?.id;

        let boardsCreated = 0;

        const workspace = await ctx.db
          .from("workspace")
          .select(`id`)
          .eq("publicId", input.workspacePublicId)
          .is("deletedAt", null)
          .limit(1)
          .single();

        if (!workspace.data) return;

        for (const boardId of input.boardIds) {
          const response = await fetch(
            `${TRELLO_API_URL}/boards/${boardId}?key=${input.apiKey}&token=${input.token}&lists=open&cards=open`,
          );
          const data = (await response.json()) as TrelloBoard;

          const formattedData = {
            name: data.name,
            lists: data.lists.map((list) => ({
              name: list.name,
              cards: data.cards
                .filter((card) => card.idList === list.id)
                .map((_card) => ({
                  name: _card.name,
                  description: _card.desc,
                })),
            })),
          };

          const newBoard = await ctx.db
            .from("board")
            .insert({
              publicId: generateUID(),
              name: data.name,
              createdBy: userId,
              importId: newImportId,
              workspaceId: workspace.data.id,
            })
            .select(`id`)
            .limit(1)
            .single();

          const newBoardId = newBoard.data?.id;

          if (!newBoardId) return;

          let listIndex = 0;

          for (const list of formattedData.lists) {
            const newList = await ctx.db
              .from("list")
              .insert({
                publicId: generateUID(),
                name: list.name,
                createdBy: userId,
                boardId: newBoardId,
                index: listIndex,
                importId: newImportId,
              })
              .select(`id`)
              .limit(1)
              .single();

            const newListId = newList.data?.id;

            if (list.cards.length && newListId) {
              const cardsInsert = list.cards.map((card, index) => ({
                publicId: generateUID(),
                title: card.name,
                description: card.description,
                createdBy: userId,
                listId: newListId,
                index,
                importId: newImportId,
              }));

              await ctx.db.from("card").insert(cardsInsert);
            }

            listIndex++;
          }
          boardsCreated++;
        }

        if (boardsCreated > 0 && newImportId) {
          await ctx.db
            .from("import")
            .update({ status: "success" })
            .eq("importId", newImportId);
        }

        return { boardsCreated };
      }),
  }),
});
