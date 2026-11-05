import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type StudentStatus = "active" | "inactive";

export interface IStudent extends Document {
  admissionNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: "male" | "female" | "other";
  address?: string;
  classId?: Types.ObjectId;
  className: string;
  section: string;
  academicYear?: string;
  rollNumber?: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  admissionDate: Date;
  status: StudentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    admissionNumber: {
      type: String,
      required: [true, "Admission number is required"],
      unique: true,
      trim: true,
      index: true,
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    address: {
      type: String,
      trim: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      index: true,
    },
    className: {
      type: String,
      required: [true, "Class is required"],
      trim: true,
      index: true,
    },
    section: {
      type: String,
      required: [true, "Section is required"],
      trim: true,
      index: true,
    },
    academicYear: {
      type: String,
      trim: true,
      index: true,
    },
    rollNumber: {
      type: String,
      trim: true,
    },
    guardianName: {
      type: String,
      required: [true, "Guardian name is required"],
      trim: true,
    },
    guardianPhone: {
      type: String,
      required: [true, "Guardian phone is required"],
      trim: true,
    },
    guardianEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    admissionDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast searching and class filtering
StudentSchema.index({ className: 1, section: 1 });
StudentSchema.index({ classId: 1, status: 1 });
StudentSchema.index({ firstName: "text", lastName: "text", admissionNumber: "text" });

const StudentModel: Model<IStudent> =
  mongoose.models.Student || mongoose.model<IStudent>("Student", StudentSchema);

export const Student = StudentModel;
export default StudentModel;
