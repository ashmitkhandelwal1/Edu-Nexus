import { z } from "zod";

export const feeStructureSchema = z.object({
  classId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid class ID"),
  academicYear: z.string().trim().min(1, "Academic year is required"),
  feeName: z.string().trim().min(2, "Fee name must be at least 2 characters"),
  amount: z.number().min(1, "Amount must be at least 1"),
  dueDate: z.string().min(1, "Due date is required"),
  description: z.string().trim().optional(),
});

export const updateFeeStructureSchema = feeStructureSchema.partial();

export const generateFeeRecordsSchema = z.object({
  feeStructureId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid fee structure ID"),
  studentId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid student ID").optional(), // If omitted, generates for all enrolled students in class
});

export const createFeePaymentSchema = z.object({
  feeRecordId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid fee record ID"),
  amount: z.number().min(1, "Payment amount must be at least 1"),
  paymentMethod: z.enum(["cash", "bank_transfer", "upi", "cheque"]),
  transactionReference: z.string().trim().optional(),
  paymentDate: z.string().optional(),
});

export type FeeStructureInput = z.infer<typeof feeStructureSchema>;
export type UpdateFeeStructureInput = z.infer<typeof updateFeeStructureSchema>;
export type GenerateFeeRecordsInput = z.infer<typeof generateFeeRecordsSchema>;
export type CreateFeePaymentInput = z.infer<typeof createFeePaymentSchema>;

