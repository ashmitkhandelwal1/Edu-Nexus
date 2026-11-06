import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type NotificationType =
  | "student_enrollment"
  | "assignment_submission"
  | "fee_payment"
  | "announcement"
  | "exam"
  | "system";

export interface INotification extends Document {
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  readBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "student_enrollment",
        "assignment_submission",
        "fee_payment",
        "announcement",
        "exam",
        "system",
      ],
      default: "system",
      index: true,
    },
    link: {
      type: String,
      trim: true,
    },
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);

