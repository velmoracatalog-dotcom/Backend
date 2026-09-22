import mongoose, { Schema } from "mongoose";

const categorySchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Category =
  mongoose.models.Category ?? mongoose.model("Category", categorySchema);
