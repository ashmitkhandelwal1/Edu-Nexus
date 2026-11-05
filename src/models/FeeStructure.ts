import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IFeeStructure extends Document {
  classId: Types.ObjectId;
  academicYear: string;
  feeName: string;
  amount: number;
  dueDate: Date;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FeeStructureSchema = new Schema<IFeeStructure>(
  {
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Class reference is required"],
      index: true,
    },
    academicYear: {
      type: String,
      required: [true, "Academic year is required"],
      trim: true,
      index: true,
    },
    feeName: {
      type: String,
      required: [true, "Fee name is required"],
      trim: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [1, "Amount must be at least 1"],
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to help lookup fees by class and academic year
FeeStructureSchema.index({ classId: 1, academicYear: 1, feeName: 1 });

export const FeeStructure: Model<IFeeStructure> =
  mongoose.models.FeeStructure || mongoose.model<IFeeStructure>("FeeStructure", FeeStructureSchema);

export default FeeStructure;

