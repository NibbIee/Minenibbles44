import { Router } from "express";
import { db } from "@workspace/db";
import { classicLeaderboardTable, infiniteLeaderboardTable } from "@workspace/db";
import { eq, desc, asc } from "drizzle-orm";

const router = Router();

// GET /leaderboard/classic
router.get("/leaderboard/classic", async (req, res) => {
  try {
    const entries = await db
      .select()
      .from(classicLeaderboardTable)
      .orderBy(desc(classicLeaderboardTable.wins), asc(classicLeaderboardTable.bestTime))
      .limit(50);

    // Map camelCase for response
    res.json(
      entries.map((e) => ({
        id: e.id,
        name: e.name,
        wins: e.wins,
        games: e.games,
        bestTime: e.bestTime,
        updatedAt: e.updatedAt,
      }))
    );
  } catch (err) {
    req.log.error(err, "Failed to fetch classic leaderboard");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /leaderboard/classic/submit
router.post("/leaderboard/classic/submit", async (req, res) => {
  try {
    const { name, won, timeSeconds } = req.body as {
      name: string;
      won: boolean;
      timeSeconds: number;
    };

    if (!name || typeof won !== "boolean" || typeof timeSeconds !== "number") {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const trimmedName = name.trim().slice(0, 16);
    if (!trimmedName) {
      res.status(400).json({ error: "Name is required" });
      return;
    }

    // Upsert: update existing player or insert new one
    const existing = await db
      .select()
      .from(classicLeaderboardTable)
      .where(eq(classicLeaderboardTable.name, trimmedName))
      .limit(1);

    let result;
    if (existing.length > 0) {
      const current = existing[0];
      const newBest =
        won && timeSeconds > 0
          ? current.bestTime === null
            ? timeSeconds
            : Math.min(current.bestTime, timeSeconds)
          : current.bestTime;

      [result] = await db
        .update(classicLeaderboardTable)
        .set({
          wins: won ? current.wins + 1 : current.wins,
          games: current.games + 1,
          bestTime: newBest,
          updatedAt: new Date(),
        })
        .where(eq(classicLeaderboardTable.name, trimmedName))
        .returning();
    } else {
      [result] = await db
        .insert(classicLeaderboardTable)
        .values({
          name: trimmedName,
          wins: won ? 1 : 0,
          games: 1,
          bestTime: won && timeSeconds > 0 ? timeSeconds : null,
        })
        .returning();
    }

    res.json({
      id: result.id,
      name: result.name,
      wins: result.wins,
      games: result.games,
      bestTime: result.bestTime,
      updatedAt: result.updatedAt,
    });
  } catch (err) {
    req.log.error(err, "Failed to submit classic game");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /leaderboard/infinite
router.get("/leaderboard/infinite", async (req, res) => {
  try {
    const entries = await db
      .select()
      .from(infiniteLeaderboardTable)
      .orderBy(desc(infiniteLeaderboardTable.boards))
      .limit(50);

    res.json(
      entries.map((e) => ({
        id: e.id,
        name: e.name,
        boards: e.boards,
        playedAt: e.playedAt,
      }))
    );
  } catch (err) {
    req.log.error(err, "Failed to fetch infinite leaderboard");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /leaderboard/infinite/submit
router.post("/leaderboard/infinite/submit", async (req, res) => {
  try {
    const { name, boards } = req.body as { name: string; boards: number };

    if (!name || typeof boards !== "number" || boards <= 0) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const trimmedName = name.trim().slice(0, 16);
    if (!trimmedName) {
      res.status(400).json({ error: "Name is required" });
      return;
    }

    const [result] = await db
      .insert(infiniteLeaderboardTable)
      .values({ name: trimmedName, boards })
      .returning();

    res.json({
      id: result.id,
      name: result.name,
      boards: result.boards,
      playedAt: result.playedAt,
    });
  } catch (err) {
    req.log.error(err, "Failed to submit infinite run");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
