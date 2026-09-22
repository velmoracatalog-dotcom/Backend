import mongoose, { Schema } from "mongoose";

const settingsSchema = new Schema(
  {
    key: { type: String, default: "site", unique: true },
    email: String,
    phone: String,
    phoneDisplay: String,
    tel: String,
    whatsapp: String,
    footerTagline: String,
    hero: {
      eyebrow: String,
      title: String,
      subtitle: String,
      image: String,
      cta: String,
    },
    newCollection: {
      eyebrow: String,
      title: String,
      subtitle: String,
      image: String,
    },
    instagram: {
      handle: String,
      subtitle: String,
      posts: [String],
    },
    marqueeItems: [String],
    tickerItems: [String],
    whyPoints: [
      {
        title: String,
        copy: String,
        icon: String,
      },
    ],
    policies: [
      {
        id: String,
        title: String,
        copy: String,
      },
    ],
  },
  { timestamps: true },
);

export const Settings =
  mongoose.models.Settings ?? mongoose.model("Settings", settingsSchema);
