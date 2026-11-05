import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type AssignmentStatus = "draft" | "published" | "closed";

export interface IAttachment {
  name: string;
  url: string;
  type?: string; // MIME type or extension like "application/pdf"
  size?: number; // In bytes
}

export interface IAssignment extends Document {
  title: string;
  description: string;
  instructions?: string;
  classId: Types.ObjectId;
  academicYear: string;
  subjectName: string;
  teacherId?: Types.ObjectId;
  assignedBy: Types.ObjectId;
  assignedDate: Date;
  dueDate: Date;
  maxMarks: number;
  attachments: IAttachment[];
  status: AssignmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>(
  {
    name: {
      type: String,
      required: [true, "Attachment name is required"],
      trim: true,
    },
    url: {
      type: String,
      required: [true, "Attachment URL is required"],
      trim: true,
    },
    type: {
      type: String,
      trim: true,
      default: "document",
    },
    size: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { _id: false }
);

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    instructions: {
      type: String,
      trim: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Class is required"],
      index: true,
    },
    academicYear: {
      type: String,
      required: [true, "Academic year is required"],
      trim: true,
      index: true,
    },
    subjectName: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true,
      index: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
      index: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Assigner (User) is required"],
    },
    assignedDate: {
      type: Date,
      required: [true, "Assigned date is required"],
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
      index: true,
    },
    maxMarks: {
      type: Number,
      required: [true, "Maximum marks is required"],
      min: [1, "Max marks must be at least 1"],
      default: 100,
    },
    attachments: {
      type: [AttachmentSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["draft", "published", "closed"],
      default: "draft",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient filtering
AssignmentSchema.index({ classId: 1, subjectName: 1, status: 1 });
AssignmentSchema.index({ academicYear: 1, dueDate: 1 });

export const Assignment: Model<IAssignment> =
  mongoose.models.Assignment || mongoose.model<IAssignment>("Assignment", AssignmentSchema);

export default Assignment;

