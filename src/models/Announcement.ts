import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type TargetAudience = "all" | "teachers" | "students";
export type AnnouncementStatus = "draft" | "published" | "archived";

export interface IAnnouncement extends Document {
  title: string;
  message: string;
  targetAudience: TargetAudience;
  status: AnnouncementStatus;
  publishAt: Date;
  expiresAt?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    title: {
      type: String,
      required: [true, "Announcement title is required"],
      trim: true,
      index: true,
    },
    message: {
      type: String,
      required: [true, "Announcement message is required"],
      trim: true,
    },
    targetAudience: {
      type: String,
      enum: ["all", "teachers", "students"],
      default: "all",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      required: true,
      index: true,
    },
    publishAt: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator reference is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for feed queries
AnnouncementSchema.index({ status: 1, targetAudience: 1, publishAt: -1 });

export const Announcement: Model<IAnnouncement> =
  mongoose.models.Announcement || mongoose.model<IAnnouncement>("Announcement", AnnouncementSchema);

export default Announcement;

