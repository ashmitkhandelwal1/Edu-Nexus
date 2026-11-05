import { z } from "zod";

export const studentSchema = z.object({
  admissionNumber: z.string().trim().min(1, "Admission number is required"),
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  gender: z.enum(["male", "female", "other"]).optional(),
  address: z.string().trim().optional().or(z.literal("")),
  className: z.string().trim().min(1, "Class is required"),
  section: z.string().trim().min(1, "Section is required"),
  rollNumber: z.string().trim().optional().or(z.literal("")),
  guardianName: z.string().trim().min(1, "Guardian name is required"),
  guardianPhone: z.string().trim().min(1, "Guardian phone is required"),
  guardianEmail: z.string().trim().email("Invalid guardian email address").optional().or(z.literal("")),
  admissionDate: z.string().optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const studentUpdateSchema = studentSchema.partial();

