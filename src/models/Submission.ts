import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type SubmissionStatus = "submitted" | "late" | "graded";

export interface ISubmissionAttachment {
  name: string;
  url: string;
  type?: string;
  size?: number;
}

export interface ISubmission extends Document {
  assignmentId: Types.ObjectId;
  studentId: Types.ObjectId;
  submittedAt: Date;
  textAnswer?: string;
  attachments: ISubmissionAttachment[];
  status: SubmissionStatus;
  marksObtained?: number;
  feedback?: string;
  gradedBy?: Types.ObjectId;
  gradedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionAttachmentSchema = new Schema<ISubmissionAttachment>(
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

const SubmissionSchema = new Schema<ISubmission>(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
      required: [true, "Assignment reference is required"],
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student reference is required"],
      index: true,
    },
    submittedAt: {
      type: Date,
      required: [true, "Submission timestamp is required"],
      default: Date.now,
    },
    textAnswer: {
      type: String,
      trim: true,
    },
    attachments: {
      type: [SubmissionAttachmentSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["submitted", "late", "graded"],
      default: "submitted",
      index: true,
    },
    marksObtained: {
      type: Number,
      min: [0, "Marks obtained cannot be negative"],
    },
    feedback: {
      type: String,
      trim: true,
    },
    gradedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    gradedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate submissions by the same student for the same assignment
SubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });
SubmissionSchema.index({ assignmentId: 1, status: 1 });

export const Submission: Model<ISubmission> =
  mongoose.models.Submission || mongoose.model<ISubmission>("Submission", SubmissionSchema);

export default Submission;

