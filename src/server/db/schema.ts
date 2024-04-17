import { relations } from "drizzle-orm";
import {
  integer,
  bigserial,
  uuid,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar,
  bigint,
} from "drizzle-orm/pg-core";

export const importSourceEnum = pgEnum('source', ['trello']);
export const importStatusEnum = pgEnum('status', ['started', 'success', 'failed']);
export const memberRoleEnum = pgEnum('role', ['admin', 'member', 'guest']);

export const boards = pgTable(
  "board",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    publicId: varchar("publicId", { length: 12 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    createdBy: uuid("createdBy").notNull().references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt"),
    deletedAt: timestamp("deletedAt"),
    deletedBy: uuid("deletedBy").references(() => users.id),
    importId: bigint("importId", { mode: "number" }).references(() => imports.id),
    workspaceId: bigint("workspaceId", { mode: "number" }).notNull().references(() => workspaces.id),
  },
);

export const boardsRelations = relations(boards, ({ one, many }) => ({
	createdBy: one(users, {
		fields: [boards.createdBy],
		references: [users.id],
	}),
  lists: many(lists),
  labels: many(labels),
  deletedBy: one(users, {
		fields: [boards.deletedBy],
		references: [users.id],
	}),
  import: one(imports, {
		fields: [boards.importId],
		references: [imports.id],
	}),
  workspace: one(workspaces, {
		fields: [boards.workspaceId],
		references: [workspaces.id],
	}),
}));

export const imports = pgTable(
  "import",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    publicId: varchar("publicId", { length: 12 }).notNull().unique(),
    source: importSourceEnum('source').notNull(),
    status: importStatusEnum('status').notNull(),
    createdBy: uuid("createdBy").notNull().references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
);

export const importsRelations = relations(imports, ({ one, many }) => ({
	createdBy: one(users, {
		fields: [imports.createdBy],
		references: [users.id],
	}),
  boards: many(boards),
  cards: many(cards),
  lists: many(lists),
  labels: many(labels)
}));

export const labels = pgTable(
  "label",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    publicId: varchar("publicId", { length: 12 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    colourCode: varchar("colourCode", { length: 12 }),
    createdBy: uuid("createdBy").notNull().references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt"),
    boardId: bigint("boardId", { mode: "number" }).notNull().references(() => boards.id),
    importId: bigint("importId", { mode: "number" }).references(() => imports.id),
  }
);

export const labelsRelations = relations(labels, ({ one, many }) => ({
	createdBy: one(users, {
		fields: [labels.createdBy],
		references: [users.id],
	}),
  board: one(boards, {
		fields: [labels.boardId],
		references: [boards.id],
	}),
  cards: many(cardsToLabels),
  import: one(imports, {
		fields: [labels.importId],
		references: [imports.id],
	}),
}));

export const cardsToLabels = pgTable(
  "_card_labels",
  {
    cardId: bigint("cardId", { mode: "number" }).notNull().references(() => cards.id),
    labelId: bigint("labelId", { mode: "number" }).notNull().references(() => labels.id),
  }, (t) => ({
    pk: primaryKey(t.cardId, t.labelId),
  }),
);

export const cardToLabelsRelations = relations(cardsToLabels, ({ one }) => ({
	card: one(cards, {
		fields: [cardsToLabels.cardId],
		references: [cards.id],
	}),
  label: one(labels, {
		fields: [cardsToLabels.labelId],
		references: [labels.id],
	}),
}));

export const cardToWorkspaceMembers = pgTable(
  "_card_workspace_members",
  {
    cardId: bigint("cardId", { mode: "number" }).notNull().references(() => cards.id),
    workspaceMemberId: bigint("workspaceMemberId", { mode: "number" }).notNull().references(() => workspaceMembers.id),
  }, (t) => ({
    pk: primaryKey(t.cardId, t.workspaceMemberId),
  }),
);

export const cardToWorkspaceMembersRelations = relations(cardToWorkspaceMembers, ({ one }) => ({
	card: one(cards, {
		fields: [cardToWorkspaceMembers.cardId],
		references: [cards.id],
	}),
  member: one(workspaceMembers, {
		fields: [cardToWorkspaceMembers.workspaceMemberId],
		references: [workspaceMembers.id],
	}),
}));

export const lists = pgTable(
  "list",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    publicId: varchar("publicId", { length: 12 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    index: integer("index").notNull(),
    createdBy: uuid("createdBy").notNull().references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt"),
    deletedAt: timestamp("deletedAt"),
    deletedBy: uuid("deletedBy").references(() => users.id),
    boardId: bigint("boardId", { mode: "number" }).notNull().references(() => boards.id),
    importId: bigint("importId", { mode: "number" }).references(() => imports.id),
  }
);

export const listsRelations = relations(lists, ({ one, many }) => ({
	createdBy: one(users, {
		fields: [lists.createdBy],
		references: [users.id],
	}),
  board: one(boards, {
		fields: [lists.boardId],
		references: [boards.id],
	}),
  cards: many(cards),
  deletedBy: one(users, {
		fields: [lists.deletedBy],
		references: [users.id],
	}),
  import: one(imports, {
		fields: [lists.importId],
		references: [imports.id],
	}),
}));

export const cards = pgTable(
  "card",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    publicId: varchar("publicId", { length: 12 }).notNull().unique(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    index: integer("index").notNull(),
    createdBy: uuid("createdBy").notNull().references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt"),
    deletedAt: timestamp("deletedAt"),
    deletedBy: uuid("deletedBy").references(() => users.id),
    listId: bigint("listId", { mode: "number" }).notNull().references(() => lists.id),
    importId: bigint("importId", { mode: "number" }).references(() => imports.id),
  }
);

export const cardsRelations = relations(cards, ({ one, many }) => ({
	createdBy: one(users, {
		fields: [cards.createdBy],
		references: [users.id],
	}),
  list: one(lists, {
		fields: [cards.listId],
		references: [lists.id],
	}),
  deletedBy: one(users, {
		fields: [cards.deletedBy],
		references: [users.id],
	}),
  labels: many(cardsToLabels),
  members: many(cardToWorkspaceMembers),
  import: one(imports, {
		fields: [cards.importId],
		references: [imports.id],
	}),
}));

export const users = pgTable("user", {
  id: uuid("id").notNull().primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: varchar("image", { length: 255 }),
});

export const usersRelations = relations(users, ({ many }) => ({
  boards: many(boards),
  cards: many(cards),
  imports: many(imports),
  lists: many(lists),
  workspaces: many(workspaces),
}));

export const workspaces = pgTable(
  "workspace",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    publicId: varchar("publicId", { length: 12 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),  
    createdBy: uuid("createdBy").notNull().references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt"),
    deletedAt: timestamp("deletedAt"),
    deletedBy: uuid("deletedBy").references(() => users.id),
  }
);

export const workspaceRelations = relations(workspaces, ({ one, many }) => ({
  user: one(users, { fields: [workspaces.createdBy], references: [users.id] }),
  members: many(workspaceMembers)
}));

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    publicId: varchar("publicId", { length: 12 }).notNull().unique(),
    userId: uuid("userId").notNull().references(() => users.id),
    workspaceId: bigint("workspaceId", { mode: "number" }).notNull().references(() => workspaces.id),
    createdBy: uuid("createdBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt"),
    deletedAt: timestamp("deletedAt"),
    role: memberRoleEnum('role').notNull(),
  },
);

export const usersToWorkspacesRelations = relations(workspaceMembers, ({ one }) => ({
  addedBy: one(users, { fields: [workspaceMembers.createdBy], references: [users.id] }),
	user: one(users, {
		fields: [workspaceMembers.userId],
		references: [users.id],
	}),
  workspace: one(workspaces, {
		fields: [workspaceMembers.workspaceId],
		references: [workspaces.id],
	}),
}));


