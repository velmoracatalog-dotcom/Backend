import mongoose, { Schema } from "mongoose";

const reviewSchema = new Schema(
  {
    quote: { type: String, required: true },
    author: { type: String, required: true },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Review =
  mongoose.models.Review ?? mongoose.model("Review", reviewSchema);
