import mongoose, { Schema } from "mongoose";

const orderItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    slug: String,
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [orderItemSchema], required: true },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    customer: {
      name: String,
      email: String,
      phone: String,
      address: String,
      city: String,
    },
  },
  { timestamps: true },
);

export const Order = mongoose.models.Order ?? mongoose.model("Order", orderSchema);
