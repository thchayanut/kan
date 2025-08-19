import { relations } from "drizzle-orm";
import {
    bigint,
    bigserial,
    integer,
    pgTable,
    timestamp,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";

import { cards } from "./cards";
import { users } from "./users";

export const cardImages = pgTable("card_images", {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    publicId: varchar("publicId", { length: 12 }).notNull().unique(),
    cardId: bigint("cardId", { mode: "number" })
        .notNull()
        .references(() => cards.id, { onDelete: "cascade" }),
    filename: varchar("filename", { length: 255 }).notNull(),
    originalName: varchar("originalName", { length: 255 }).notNull(),
    mimeType: varchar("mimeType", { length: 100 }).notNull(),
    fileSize: integer("fileSize").notNull(),
    s3Key: varchar("s3Key", { length: 500 }).notNull(),
    s3Url: varchar("s3Url", { length: 1000 }).notNull(),
    thumbnailS3Key: varchar("thumbnailS3Key", { length: 500 }),
    thumbnailS3Url: varchar("thumbnailS3Url", { length: 1000 }),
    width: integer("width"),
    height: integer("height"),
    uploadedBy: uuid("uploadedBy").references(() => users.id, {
        onDelete: "set null",
    }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    deletedAt: timestamp("deletedAt"),
    deletedBy: uuid("deletedBy").references(() => users.id, {
        onDelete: "set null",
    }),
}).enableRLS();

export const cardImagesRelations = relations(cardImages, ({ one }) => ({
    card: one(cards, {
        fields: [cardImages.cardId],
        references: [cards.id],
        relationName: "cardImagesCard",
    }),
    uploadedBy: one(users, {
        fields: [cardImages.uploadedBy],
        references: [users.id],
        relationName: "cardImagesUploadedByUser",
    }),
    deletedBy: one(users, {
        fields: [cardImages.deletedBy],
        references: [users.id],
        relationName: "cardImagesDeletedByUser",
    }),
}));