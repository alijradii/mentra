import type { UserDocument } from "../models/user";
import { DAILY_FREE_AI_CREDITS } from "../config/ai";

function isNewDayUTC(last: Date, now: Date): boolean {
  return (
    last.getUTCFullYear() !== now.getUTCFullYear() ||
    last.getUTCMonth() !== now.getUTCMonth() ||
    last.getUTCDate() !== now.getUTCDate()
  );
}

export function ensureCreditsFresh(
  user: UserDocument,
  now: Date = new Date()
): { updatedDoc: UserDocument; changed: boolean } {
  if (user.isPro) {
    return { updatedDoc: user, changed: false };
  }

  const lastReset = user.aiCreditsLastReset;
  if (!lastReset || isNewDayUTC(lastReset, now)) {
    const updated: UserDocument = {
      ...user,
      aiCredits: DAILY_FREE_AI_CREDITS,
      aiCreditsLastReset: now,
    };
    return { updatedDoc: updated, changed: true };
  }

  if (typeof user.aiCredits !== "number") {
    const updated: UserDocument = {
      ...user,
      aiCredits: DAILY_FREE_AI_CREDITS,
      aiCreditsLastReset: now,
    };
    return { updatedDoc: updated, changed: true };
  }

  return { updatedDoc: user, changed: false };
}

