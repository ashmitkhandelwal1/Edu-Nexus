import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type AttendanceStatus = "present" | "absent" | "late" | "half-day";

export interface IAttendance extends Document {
  classId: Types.ObjectId;
  studentId: Types.ObjectId;
  date: string; // ISO date string in YYYY-MM-DD format for consistent school-local date collation
  status: AttendanceStatus;
  remarks?: string;
  markedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Class reference is required"],
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student reference is required"],
      index: true,
    },
    date: {
      type: String,
      required: [true, "Date is required"],
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["present", "absent", "late", "half-day"],
      required: [true, "Attendance status is required"],
      default: "present",
      index: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
    markedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index on studentId + date to prevent duplicate records
AttendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

// Compound index for class daily attendance lookups
AttendanceSchema.index({ classId: 1, date: 1 });

const AttendanceModel: Model<IAttendance> =
  mongoose.models.Attendance ||
  mongoose.model<IAttendance>("Attendance", AttendanceSchema);

export const Attendance = AttendanceModel;
export default AttendanceModel;

