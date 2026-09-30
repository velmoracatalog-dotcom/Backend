import { User } from "../models/User.js";

export async function repairUserIndexes() {
  try {
    await User.updateMany(
      { $or: [{ googleId: null }, { googleId: "" }] },
      { $unset: { googleId: "" } },
    );

    const indexes = await User.collection.indexes();
    const googleIndex = indexes.find((index) => index.name === "googleId_1");
    if (googleIndex && !googleIndex.sparse) {
      await User.collection.dropIndex("googleId_1");
    }

    await User.collection.createIndex({ googleId: 1 }, { unique: true, sparse: true });
  } catch (error) {
    console.error("Could not repair user indexes", error);
  }
}
