import mongoose, { Schema } from "mongoose";

const productSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    image: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, default: "" },
    isBestSeller: { type: Boolean, default: true },
    inStock: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Product =
  mongoose.models.Product ?? mongoose.model("Product", productSchema);
