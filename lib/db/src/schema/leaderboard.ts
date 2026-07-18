import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Classic leaderboard — one row per player, upserted on each game
export const classicLeaderboardTable = pgTable("classic_leaderboard", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  wins: integer("wins").notNull().default(0),
  games: integer("games").notNull().default(0),
  bestTime: integer("best_time"), // seconds, null if never won
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertClassicLeaderboardSchema = createInsertSchema(classicLeaderboardTable).omit({ id: true, updatedAt: true });
export type InsertClassicLeaderboard = z.infer<typeof insertClassicLeaderboardSchema>;
export type ClassicLeaderboard = typeof classicLeaderboardTable.$inferSelect;

// Infinite leaderboard — one row per run
export const infiniteLeaderboardTable = pgTable("infinite_leaderboard", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  boards: integer("boards").notNull(),
  playedAt: timestamp("played_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInfiniteLeaderboardSchema = createInsertSchema(infiniteLeaderboardTable).omit({ id: true, playedAt: true });
export type InsertInfiniteLeaderboard = z.infer<typeof insertInfiniteLeaderboardSchema>;
export type InfiniteLeaderboard = typeof infiniteLeaderboardTable.$inferSelect;
