export const DAILY_FREE_AI_CREDITS = 50;

/** 1 credit = this many tokens (used to compute credits to deduct from usage). */
export const TOKENS_PER_CREDIT = 1000;

/**
 * Current reset mode for free AI credits.
 * For now we use a simple \"midnight UTC\" policy.
 */
export const AI_CREDITS_RESET_MODE = "midnight_utc" as const;

