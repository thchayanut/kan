import { and, desc, eq, isNull } from "drizzle-orm";

import type { dbClient } from "@kan/db/client";
import { checklistItems, checklists } from "@kan/db/schema";
import { generateUID } from "@kan/shared/utils";

export const create = async (
  db: dbClient,
  checklistInput: {
    cardId: number;
    name: string;
    createdBy: string;
  },
) => {
  return db.transaction(async (tx) => {
    const card = await tx.query.checklists.findFirst({
      where: and(
        eq(checklists.cardId, checklistInput.cardId),
        isNull(checklists.deletedAt),
      ),
      orderBy: desc(checklists.index),
    });

    const [result] = await tx
      .insert(checklists)
      .values({
        publicId: generateUID(),
        name: checklistInput.name,
        createdBy: checklistInput.createdBy,
        cardId: checklistInput.cardId,
        index: card ? card.index + 1 : 0,
      })
      .returning({
        id: checklists.id,
        publicId: checklists.publicId,
        name: checklists.name,
      });

    return result;
  });
};

export const createItem = async (
  db: dbClient,
  checklistItemInput: {
    checklistId: number;
    title: string;
    createdBy: string;
  },
) => {
  return db.transaction(async (tx) => {
    const lastItem = await tx.query.checklistItems.findFirst({
      where: and(
        eq(checklistItems.checklistId, checklistItemInput.checklistId),
        isNull(checklistItems.deletedAt),
      ),
      orderBy: desc(checklistItems.index),
    });

    const [result] = await tx
      .insert(checklistItems)
      .values({
        publicId: generateUID(),
        title: checklistItemInput.title,
        createdBy: checklistItemInput.createdBy,
        checklistId: checklistItemInput.checklistId,
        index: lastItem ? lastItem.index + 1 : 0,
        completed: false,
      })
      .returning({
        id: checklistItems.id,
        publicId: checklistItems.publicId,
        title: checklistItems.title,
        completed: checklistItems.completed,
      });

    return result;
  });
};

export const getChecklistByPublicId = async (
  db: dbClient,
  checklistPublicId: string,
) => {
  const checklist = await db.query.checklists.findFirst({
    where: and(
      eq(checklists.publicId, checklistPublicId),
      isNull(checklists.deletedAt),
    ),
    with: {
      card: {
        with: {
          list: {
            with: {
              board: {
                with: {
                  workspace: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return checklist;
};
