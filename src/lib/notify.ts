import { Notification } from "../models/Notification.js";

export async function notify(input: {
  type: "order" | "message" | "review" | "user";
  title: string;
  body: string;
  link: string;
  refId?: string;
}) {
  try {
    await Notification.create({
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link,
      refId: input.refId ?? "",
    });
  } catch (error) {
    console.error("Could not create notification", error);
  }
}
