import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["order", "message", "review", "user"],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    link: { type: String, default: "/admin" },
    refId: { type: String, default: "" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Notification =
  mongoose.models.Notification ??
  mongoose.model("Notification", notificationSchema);
