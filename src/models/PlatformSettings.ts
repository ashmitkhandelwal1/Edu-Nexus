import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPlatformSettings extends Document {
  institutionName: string;
  institutionEmail?: string;
  institutionPhone?: string;
  institutionAddress?: string;
  academicYear: string;
  currency: string;
  timezone: string;
  attendanceThreshold: number;
  allowStudentSubmissions: boolean;
  announcementAutoPublish: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlatformSettingsSchema = new Schema<IPlatformSettings>(
  {
    institutionName: {
      type: String,
      required: [true, "Institution name is required"],
      trim: true,
      default: "Nexus Global Academy",
    },
    institutionEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "admin@edunexus.edu",
    },
    institutionPhone: {
      type: String,
      trim: true,
      default: "+91 98765 43210",
    },
    institutionAddress: {
      type: String,
      trim: true,
      default: "Knowledge Campus, Sector 4, Silicon Valley",
    },
    academicYear: {
      type: String,
      required: [true, "Academic year is required"],
      trim: true,
      default: "2026-27",
    },
    currency: {
      type: String,
      trim: true,
      default: "INR (₹)",
    },
    timezone: {
      type: String,
      trim: true,
      default: "Asia/Kolkata (IST)",
    },
    attendanceThreshold: {
      type: Number,
      min: 0,
      max: 100,
      default: 75,
    },
    allowStudentSubmissions: {
      type: Boolean,
      default: true,
    },
    announcementAutoPublish: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const PlatformSettings: Model<IPlatformSettings> =
  mongoose.models.PlatformSettings ||
  mongoose.model<IPlatformSettings>("PlatformSettings", PlatformSettingsSchema);

