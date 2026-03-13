import { getUserCollection } from "../models/user";
import { ensureCreditsFresh } from "./aiCredits";

/**
 * Simple debug helper to be run with ts-node or tsx during development:
 *
 *   npx tsx apps/backend/src/utils/aiCredits.debug.ts <userId>
 *
 * It prints the user's current aiCredits before and after applying the
 * daily reset logic so you can manually verify behavior around midnight UTC.
 */
async function main() {
  const userId = process.argv[2];
  if (!userId) {
    console.error("Usage: aiCredits.debug.ts <userId>");
    process.exit(1);
  }

  const col = getUserCollection();
  const user = await col.findOne({ _id: new (require("mongodb").ObjectId)(userId) });
  if (!user) {
    console.error("User not found");
    process.exit(1);
  }

  console.log("Before ensureCreditsFresh:", {
    isPro: user.isPro,
    aiCredits: user.aiCredits,
    aiCreditsLastReset: user.aiCreditsLastReset,
  });

  const { updatedDoc, changed } = ensureCreditsFresh(user);

  if (changed) {
    await col.updateOne(
      { _id: updatedDoc._id },
      {
        $set: {
          aiCredits: updatedDoc.aiCredits,
          aiCreditsLastReset: updatedDoc.aiCreditsLastReset,
        },
      }
    );
  }

  console.log("After ensureCreditsFresh:", {
    isPro: updatedDoc.isPro,
    aiCredits: updatedDoc.aiCredits,
    aiCreditsLastReset: updatedDoc.aiCreditsLastReset,
    changed,
  });
}

// eslint-disable-next-line unicorn/prefer-top-level-await
main().catch((err) => {
  console.error(err);
  process.exit(1);
});

