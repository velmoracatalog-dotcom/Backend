import mongoose, { Schema } from "mongoose";

const reviewSchema = new Schema(
  {
    quote: { type: String, required: true },
    author: { type: String, required: true },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    order: { type: Number, default: 0 },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    productId: String,
    productName: String,
    visible: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Review =
  mongoose.models.Review ?? mongoose.model("Review", reviewSchema);
