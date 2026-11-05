import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type PaymentMethod = "cash" | "bank_transfer" | "upi" | "cheque";

export interface IFeePayment extends Document {
  feeRecordId: Types.ObjectId;
  studentId: Types.ObjectId;
  amount: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  transactionReference?: string;
  receivedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FeePaymentSchema = new Schema<IFeePayment>(
  {
    feeRecordId: {
      type: Schema.Types.ObjectId,
      ref: "FeeRecord",
      required: [true, "Fee record reference is required"],
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student reference is required"],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [1, "Payment amount must be at least 1"],
    },
    paymentDate: {
      type: Date,
      required: [true, "Payment date is required"],
      default: Date.now,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "bank_transfer", "upi", "cheque"],
      required: [true, "Payment method is required"],
    },
    transactionReference: {
      type: String,
      trim: true,
    },
    receivedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Receiver is required"],
    },
  },
  {
    timestamps: true,
  }
);

FeePaymentSchema.index({ feeRecordId: 1, paymentDate: -1 });

export const FeePayment: Model<IFeePayment> =
  mongoose.models.FeePayment || mongoose.model<IFeePayment>("FeePayment", FeePaymentSchema);

export default FeePayment;

