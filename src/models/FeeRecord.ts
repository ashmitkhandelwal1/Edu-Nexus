import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type FeeRecordStatus = "pending" | "partially_paid" | "paid" | "overdue";

export interface IFeeRecord extends Document {
  studentId: Types.ObjectId;
  feeStructureId: Types.ObjectId;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: FeeRecordStatus;
  createdAt: Date;
  updatedAt: Date;
}

const FeeRecordSchema = new Schema<IFeeRecord>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student reference is required"],
      index: true,
    },
    feeStructureId: {
      type: Schema.Types.ObjectId,
      ref: "FeeStructure",
      required: [true, "Fee structure reference is required"],
      index: true,
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, "Paid amount cannot be negative"],
    },
    pendingAmount: {
      type: Number,
      required: [true, "Pending amount is required"],
      min: [0, "Pending amount cannot be negative"],
    },
    status: {
      type: String,
      enum: ["pending", "partially_paid", "paid", "overdue"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate fee records for the same student and fee structure
FeeRecordSchema.index({ studentId: 1, feeStructureId: 1 }, { unique: true });
FeeRecordSchema.index({ status: 1 });

export const FeeRecord: Model<IFeeRecord> =
  mongoose.models.FeeRecord || mongoose.model<IFeeRecord>("FeeRecord", FeeRecordSchema);

export default FeeRecord;
